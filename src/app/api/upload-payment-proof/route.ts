import { put } from '@vercel/blob';

import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeFileName, validateImageFile } from '@/lib/file-validation';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`upload-payment:${ip}`, 10, 60);
    if (!rl.success) {
      return Response.json({ error: 'Demasiados intentos. Intenta de nuevo en un momento.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // 3MB limit for payment proofs
    if (file.size > 3 * 1024 * 1024) {
      return Response.json({ error: 'El archivo excede 3MB' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Solo se permiten imágenes JPG, PNG o WebP' }, { status: 400 });
    }

    const isValid = await validateImageFile(file);
    if (!isValid) {
      return Response.json({ error: 'El contenido del archivo no coincide con el tipo declarado' }, { status: 400 });
    }

    const blob = await put(`payment-proofs/${sanitizeFileName(file.name)}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return Response.json(blob);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Error al subir archivo' }, { status: 500 });
  }
}
