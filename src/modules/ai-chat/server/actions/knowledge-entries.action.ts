'use server';

import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses, chatbotConfigs, chatbotKnowledgeEntries } from '@/db/schema';

interface KnowledgeEntry {
  id?: string;
  key: string;
  value: string;
  category?: 'general' | 'envios' | 'pagos' | 'productos' | 'servicios' | 'politicas' | 'otro';
  sortOrder?: number;
}

export async function getKnowledgeEntriesAction(businessId: string) {
  try {
    const [config] = await db
      .select({ id: chatbotConfigs.id })
      .from(chatbotConfigs)
      .where(eq(chatbotConfigs.businessId, businessId))
      .limit(1);

    if (!config) return { data: [] };

    const entries = await db
      .select()
      .from(chatbotKnowledgeEntries)
      .where(eq(chatbotKnowledgeEntries.chatbotConfigId, config.id))
      .orderBy(chatbotKnowledgeEntries.sortOrder);

    return { data: entries };
  } catch {
    return { error: 'Error al obtener las entradas de conocimiento' };
  }
}

export async function saveKnowledgeEntriesAction(businessId: string, entries: KnowledgeEntry[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [business] = await db
      .select({ id: businesses.id, userId: businesses.userId })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business || business.userId !== session.user.id) return { error: 'No autorizado' };

    const [config] = await db
      .select({ id: chatbotConfigs.id })
      .from(chatbotConfigs)
      .where(eq(chatbotConfigs.businessId, businessId))
      .limit(1);

    if (!config) return { error: 'Configuración de chatbot no encontrada' };

    // Delete all existing entries and re-insert
    await db.delete(chatbotKnowledgeEntries).where(eq(chatbotKnowledgeEntries.chatbotConfigId, config.id));

    if (entries.length > 0) {
      await db.insert(chatbotKnowledgeEntries).values(
        entries.map((entry, index) => ({
          chatbotConfigId: config.id,
          key: entry.key,
          value: entry.value,
          category: entry.category ?? 'general',
          sortOrder: entry.sortOrder ?? index,
        }))
      );
    }

    return { success: true };
  } catch {
    return { error: 'Error al guardar las entradas de conocimiento' };
  }
}
