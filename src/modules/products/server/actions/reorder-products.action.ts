'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { products, businesses } from '@/db/schema';
import { notDeletedBusiness } from '@/db/soft-delete';
import { revalidateProductsCache } from '@/lib/cache-revalidation';

export async function reorderProductsAction(businessId: string, orderedIds: string[]) {
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
      orderedIds.map((id, index) => db.update(products).set({ sortOrder: index }).where(eq(products.id, id)))
    );

    revalidateProductsCache(businessId);

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al reordenar los productos.' };
  }
}
