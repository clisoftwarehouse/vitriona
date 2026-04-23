'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { notDeletedBusiness } from '@/db/soft-delete';
import { businesses, catalogProducts } from '@/db/schema';
import { revalidateProductsCache } from '@/lib/cache-revalidation';

export async function reorderCatalogProductsAction(businessId: string, catalogId: string, orderedProductIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    await Promise.all(
      orderedProductIds.map((productId, index) =>
        db
          .update(catalogProducts)
          .set({ sortOrder: index })
          .where(and(eq(catalogProducts.catalogId, catalogId), eq(catalogProducts.productId, productId)))
      )
    );

    revalidateProductsCache(businessId);

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al reordenar los productos del catálogo.' };
  }
}
