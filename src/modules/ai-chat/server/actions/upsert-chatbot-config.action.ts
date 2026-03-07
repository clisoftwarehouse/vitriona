'use server';

import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses, chatbotConfigs } from '@/db/schema';

interface UpsertChatbotConfigValues {
  businessId: string;
  botName?: string;
  botSubtitle?: string | null;
  welcomeMessage?: string | null;
  errorMessage?: string | null;
  systemPrompt?: string | null;
  businessInfo?: Record<string, unknown> | null;
  faqs?: string[];
  isEnabled?: boolean;
  calendarEnabled?: boolean;
  googleCalendarId?: string | null;
  calendarTimezone?: string;
  slotDurationMode?: 'fixed' | 'per_service';
  slotDurationMinutes?: number;
}

export async function upsertChatbotConfigAction(values: UpsertChatbotConfigValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.id, values.businessId))
      .limit(1);

    if (!business) return { error: 'Negocio no encontrado' };

    const [existing] = await db
      .select({ id: chatbotConfigs.id })
      .from(chatbotConfigs)
      .where(eq(chatbotConfigs.businessId, values.businessId))
      .limit(1);

    if (existing) {
      await db
        .update(chatbotConfigs)
        .set({
          botName: values.botName,
          botSubtitle: values.botSubtitle,
          welcomeMessage: values.welcomeMessage,
          errorMessage: values.errorMessage,
          systemPrompt: values.systemPrompt,
          businessInfo: values.businessInfo,
          faqs: values.faqs,
          isEnabled: values.isEnabled,
          calendarEnabled: values.calendarEnabled,
          googleCalendarId: values.googleCalendarId,
          calendarTimezone: values.calendarTimezone,
          slotDurationMode: values.slotDurationMode,
          slotDurationMinutes: values.slotDurationMinutes,
          updatedAt: new Date(),
        })
        .where(eq(chatbotConfigs.id, existing.id));
    } else {
      await db.insert(chatbotConfigs).values({
        businessId: values.businessId,
        botName: values.botName ?? 'Asistente Virtual',
        botSubtitle: values.botSubtitle,
        welcomeMessage: values.welcomeMessage,
        errorMessage: values.errorMessage,
        systemPrompt: values.systemPrompt,
        businessInfo: values.businessInfo,
        faqs: values.faqs ?? [],
        isEnabled: values.isEnabled ?? false,
        calendarEnabled: values.calendarEnabled ?? false,
        googleCalendarId: values.googleCalendarId,
        calendarTimezone: values.calendarTimezone ?? 'America/Santo_Domingo',
        slotDurationMode: values.slotDurationMode ?? 'fixed',
        slotDurationMinutes: values.slotDurationMinutes ?? 60,
      });
    }

    return { success: true };
  } catch {
    return { error: 'Error al guardar la configuración del chatbot' };
  }
}
