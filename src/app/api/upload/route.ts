import { put } from '@vercel/blob';

import { auth } from '@/auth';
import { sanitizeFileName, validateImageFile } from '@/lib/file-validation';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'El archivo excede 5MB' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    const isValid = await validateImageFile(file);
    if (!isValid) {
      return Response.json({ error: 'El contenido del archivo no coincide con el tipo declarado' }, { status: 400 });
    }

    const blob = await put(sanitizeFileName(file.name), file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return Response.json(blob);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Error al subir archivo' }, { status: 500 });
  }
}
