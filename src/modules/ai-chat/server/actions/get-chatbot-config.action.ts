'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { chatbotConfigs } from '@/db/schema';

export async function getChatbotConfigAction(businessId: string) {
  try {
    const [config] = await db
      .select({
        botName: chatbotConfigs.botName,
        botSubtitle: chatbotConfigs.botSubtitle,
        welcomeMessage: chatbotConfigs.welcomeMessage,
        errorMessage: chatbotConfigs.errorMessage,
        faqs: chatbotConfigs.faqs,
        isEnabled: chatbotConfigs.isEnabled,
      })
      .from(chatbotConfigs)
      .where(eq(chatbotConfigs.businessId, businessId))
      .limit(1);

    if (!config) return { error: 'Configuración de chatbot no encontrada' };

    return { data: config };
  } catch {
    return { error: 'Error al obtener la configuración del chatbot' };
  }
}
