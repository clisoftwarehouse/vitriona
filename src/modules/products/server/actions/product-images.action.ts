'use server';

import { del } from '@vercel/blob';
import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, products, businesses, productImages } from '@/db/schema';

async function verifyProductOwnership(productId: string, userId: string) {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return null;

  const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, product.catalogId)).limit(1);
  if (!catalog) return null;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, userId)))
    .limit(1);
  if (!business) return null;

  return product;
}

export async function addProductImageAction(productId: string, url: string, alt?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const product = await verifyProductOwnership(productId, session.user.id);
    if (!product) return { error: 'Producto no encontrado' };

    const existing = await db
      .select({ sortOrder: productImages.sortOrder })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(productImages.sortOrder);

    const nextOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;

    const [image] = await db
      .insert(productImages)
      .values({
        productId,
        url,
        alt: alt || null,
        sortOrder: nextOrder,
      })
      .returning();

    return { success: true, image };
  } catch {
    return { error: 'Error al guardar la imagen.' };
  }
}

export async function deleteProductImageAction(imageId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [image] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
    if (!image) return { error: 'Imagen no encontrada' };

    const product = await verifyProductOwnership(image.productId, session.user.id);
    if (!product) return { error: 'No autorizado' };

    try {
      await del(image.url);
    } catch {
      // Blob may already be deleted, continue with DB cleanup
    }

    await db.delete(productImages).where(eq(productImages.id, imageId));

    return { success: true };
  } catch {
    return { error: 'Error al eliminar la imagen.' };
  }
}

export async function getProductImagesAction(productId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const product = await verifyProductOwnership(productId, session.user.id);
  if (!product) return [];

  return db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(productImages.sortOrder);
}

export async function reorderProductImagesAction(imageIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    if (imageIds.length === 0) return { success: true };

    const [first] = await db.select().from(productImages).where(eq(productImages.id, imageIds[0])).limit(1);
    if (!first) return { error: 'Imagen no encontrada' };

    const product = await verifyProductOwnership(first.productId, session.user.id);
    if (!product) return { error: 'No autorizado' };

    await Promise.all(
      imageIds.map((id, index) => db.update(productImages).set({ sortOrder: index }).where(eq(productImages.id, id)))
    );

    return { success: true };
  } catch {
    return { error: 'Error al reordenar las imágenes.' };
  }
}
