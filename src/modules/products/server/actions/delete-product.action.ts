'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { products, businesses } from '@/db/schema';
import { revalidateProductsCache } from '@/lib/cache-revalidation';

export async function deleteProductAction(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) return { error: 'Producto no encontrado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, product.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    await db.delete(products).where(eq(products.id, productId));

    revalidateProductsCache(product.businessId);

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al eliminar el producto.' };
  }
}
