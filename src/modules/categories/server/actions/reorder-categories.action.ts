'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { categories, businesses } from '@/db/schema';
import { notDeletedBusiness } from '@/db/soft-delete';
import { revalidateCategoriesCache } from '@/lib/cache-revalidation';

export async function reorderCategoriesAction(businessId: string, orderedIds: string[]) {
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
      orderedIds.map((id, index) => db.update(categories).set({ sortOrder: index }).where(eq(categories.id, id)))
    );

    revalidateCategoriesCache(businessId);

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al reordenar las categorías.' };
  }
}
