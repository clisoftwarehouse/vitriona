import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { generateChatResponse } from '@/modules/ai-chat/server/lib/ai';
import { appendMessages, getConversationHistory } from '@/modules/ai-chat/server/lib/redis';
import { businesses, chatbotConfigs, chatbotKnowledgeFiles, chatbotKnowledgeEntries } from '@/db/schema';

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const { businessId } = await params;
    const body = await request.json();
    const { sessionId, chatInput } = body as { sessionId: string; chatInput: string };

    if (!sessionId || !chatInput?.trim()) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
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

    await appendMessages(sessionId, [
      { role: 'user', content: chatInput, timestamp: Date.now() },
      { role: 'model', content: aiResponse, timestamp: Date.now() },
    ]);

    return NextResponse.json({ output: aiResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ output: '' }, { status: 200 });
  }
}
