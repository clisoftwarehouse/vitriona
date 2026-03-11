import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { extractTextFromPdf } from '@/modules/ai-chat/server/lib/pdf-extract';
import { businesses, chatbotConfigs, chatbotKnowledgeFiles } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const businessId = formData.get('businessId') as string;

    if (!file || !businessId) {
      return Response.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'El archivo excede 10MB' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return Response.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 });
    }

    // Verify ownership
    const [business] = await db
      .select({ id: businesses.id, userId: businesses.userId })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business || business.userId !== session.user.id) {
      return Response.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [config] = await db
      .select({ id: chatbotConfigs.id })
      .from(chatbotConfigs)
      .where(eq(chatbotConfigs.businessId, businessId))
      .limit(1);

    if (!config) {
      return Response.json({ error: 'Configuración de chatbot no encontrada' }, { status: 404 });
    }

    // Upload to blob storage
    const blob = await put(`knowledge/${businessId}/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Insert file record as processing
    const [fileRecord] = await db
      .insert(chatbotKnowledgeFiles)
      .values({
        chatbotConfigId: config.id,
        fileName: file.name,
        fileUrl: blob.url,
        fileSize: file.size,
        mimeType: file.type,
        status: 'processing',
      })
      .returning();

    // Extract text in background (non-blocking for the response)
    const buffer = Buffer.from(await file.arrayBuffer());

    extractTextFromPdf(buffer)
      .then(async (text) => {
        await db
          .update(chatbotKnowledgeFiles)
          .set({ extractedText: text, status: 'ready' })
          .where(eq(chatbotKnowledgeFiles.id, fileRecord.id));
      })
      .catch(async (error) => {
        console.error('PDF extraction error:', error);
        await db
          .update(chatbotKnowledgeFiles)
          .set({ status: 'error' })
          .where(eq(chatbotKnowledgeFiles.id, fileRecord.id));
      });

    return Response.json({
      id: fileRecord.id,
      fileName: fileRecord.fileName,
      fileUrl: fileRecord.fileUrl,
      status: 'processing',
    });
  } catch (error) {
    console.error('Upload knowledge error:', error);
    return Response.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}
