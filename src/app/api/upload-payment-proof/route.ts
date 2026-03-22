import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
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

    const blob = await put(`payment-proofs/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return Response.json(blob);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Error al subir archivo' }, { status: 500 });
  }
}
