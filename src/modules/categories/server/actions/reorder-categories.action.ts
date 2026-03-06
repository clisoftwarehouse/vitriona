'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, categories, businesses } from '@/db/schema';

export async function reorderCategoriesAction(catalogId: string, orderedIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1);
    if (!catalog) return { error: 'Catálogo no encontrado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    await Promise.all(
      orderedIds.map((id, index) => db.update(categories).set({ sortOrder: index }).where(eq(categories.id, id)))
    );

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al reordenar las categorías.' };
  }
}
