'use server';

import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses, chatbotConfigs, chatbotKnowledgeFiles } from '@/db/schema';

export async function getKnowledgeFilesAction(businessId: string) {
  try {
    const [config] = await db
      .select({ id: chatbotConfigs.id })
      .from(chatbotConfigs)
      .where(eq(chatbotConfigs.businessId, businessId))
      .limit(1);

    if (!config) return { data: [] };

    const files = await db
      .select()
      .from(chatbotKnowledgeFiles)
      .where(eq(chatbotKnowledgeFiles.chatbotConfigId, config.id))
      .orderBy(chatbotKnowledgeFiles.createdAt);

    return { data: files };
  } catch {
    return { error: 'Error al obtener los archivos de conocimiento' };
  }
}

export async function deleteKnowledgeFileAction(businessId: string, fileId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [business] = await db
      .select({ id: businesses.id, userId: businesses.userId })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business || business.userId !== session.user.id) return { error: 'No autorizado' };

    await db.delete(chatbotKnowledgeFiles).where(eq(chatbotKnowledgeFiles.id, fileId));

    return { success: true };
  } catch {
    return { error: 'Error al eliminar el archivo' };
  }
}
