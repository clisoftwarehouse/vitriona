import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { generateChatResponse } from '@/modules/ai-chat/server/lib/ai';
import { appendMessages, getConversationHistory } from '@/modules/ai-chat/server/lib/redis';
import {
  businesses,
  chatbotConfigs,
  businessAiQuotas,
  chatbotKnowledgeFiles,
  chatbotKnowledgeEntries,
} from '@/db/schema';

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const { businessId } = await params;

    const ip = getClientIp(request);
    const rl = await rateLimit(`chat:${ip}:${businessId}`, 20, 60);
    if (!rl.success) {
      return NextResponse.json({ error: 'Demasiados mensajes. Intenta de nuevo en un momento.' }, { status: 429 });
    }

    const body = await request.json();
    const { sessionId, chatInput } = body as { sessionId: string; chatInput: string };

    if (!sessionId || !chatInput?.trim()) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    if (chatInput.length > 2000) {
      return NextResponse.json({ error: 'El mensaje es demasiado largo' }, { status: 400 });
    }

    const [config] = await db.select().from(chatbotConfigs).where(eq(chatbotConfigs.businessId, businessId)).limit(1);

    if (!config) {
      return NextResponse.json({ error: 'Chatbot no encontrado' }, { status: 404 });
    }

    if (!config.isEnabled) {
      return NextResponse.json({ error: 'Chatbot deshabilitado' }, { status: 403 });
    }

    const [business] = await db
      .select({ name: businesses.name, currency: businesses.currency })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    // Load knowledge base
    const knowledgeEntries = await db
      .select({
        key: chatbotKnowledgeEntries.key,
        value: chatbotKnowledgeEntries.value,
        category: chatbotKnowledgeEntries.category,
      })
      .from(chatbotKnowledgeEntries)
      .where(eq(chatbotKnowledgeEntries.chatbotConfigId, config.id))
      .orderBy(chatbotKnowledgeEntries.sortOrder);

    const knowledgeFiles = await db
      .select({
        fileName: chatbotKnowledgeFiles.fileName,
        extractedText: chatbotKnowledgeFiles.extractedText,
      })
      .from(chatbotKnowledgeFiles)
      .where(eq(chatbotKnowledgeFiles.chatbotConfigId, config.id));

    // ── Quota validation ──
    // Check if this business has an AI quota. If so, verify they haven't exceeded their monthly limit.
    const [quota] = await db
      .select()
      .from(businessAiQuotas)
      .where(eq(businessAiQuotas.businessId, businessId))
      .limit(1);

    if (quota) {
      // Auto-reset usage if billing cycle has passed (30 days)
      const cycleEnd = new Date(quota.billingCycleStart);
      cycleEnd.setDate(cycleEnd.getDate() + 30);
      if (new Date() > cycleEnd) {
        await db
          .update(businessAiQuotas)
          .set({ aiMessagesUsed: 0, billingCycleStart: new Date(), updatedAt: new Date() })
          .where(eq(businessAiQuotas.id, quota.id));
        quota.aiMessagesUsed = 0;
      }

      if (quota.aiMessagesUsed >= quota.aiMessagesLimit) {
        return NextResponse.json(
          { error: 'Límite de respuestas de IA alcanzado. Por favor, mejora tu plan.' },
          { status: 403 }
        );
      }
    } else {
      // No AI quota record means no AI plan — block access
      return NextResponse.json({ error: 'Este negocio no tiene un plan de IA activo.' }, { status: 403 });
    }

    const history = await getConversationHistory(sessionId);

    const aiResponse = await generateChatResponse(chatInput, history, {
      systemPrompt: config.systemPrompt,
      businessInfo: config.businessInfo as Record<string, unknown> | null,
      calendarEnabled: config.calendarEnabled && !!config.googleCalendarId,
      googleCalendarId: config.googleCalendarId,
      calendarTimezone: config.calendarTimezone,
      slotDurationMode: config.slotDurationMode,
      slotDurationMinutes: config.slotDurationMinutes,
      businessName: business?.name ?? 'el negocio',
      businessId,
      currency: business?.currency ?? 'USD',
      personality: config.personality,
      tone: config.tone,
      language: config.language,
      knowledgeEntries,
      knowledgeFiles: knowledgeFiles.filter((f) => f.extractedText),
      autoAccessCatalog: config.autoAccessCatalog,
      orderEnabled: config.orderEnabled,
      maxTokens: config.maxTokens,
    });

    // ── Increment usage after successful response ──
    await db
      .update(businessAiQuotas)
      .set({
        aiMessagesUsed: sql`${businessAiQuotas.aiMessagesUsed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(businessAiQuotas.businessId, businessId));

    await appendMessages(sessionId, [
      { role: 'user', content: chatInput, timestamp: Date.now() },
      { role: 'model', content: aiResponse, timestamp: Date.now() },
    ]);

    return NextResponse.json({ output: aiResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { output: 'Lo siento, hubo un problema al procesar tu mensaje. Por favor, intenta de nuevo.' },
      { status: 200 }
    );
  }
}
