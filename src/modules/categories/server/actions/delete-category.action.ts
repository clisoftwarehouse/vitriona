'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, categories, businesses } from '@/db/schema';

export async function deleteCategoryAction(categoryId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!category) return { error: 'Categoría no encontrada' };

    const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, category.catalogId)).limit(1);
    if (!catalog) return { error: 'Catálogo no encontrado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    await db.delete(categories).where(eq(categories.id, categoryId));

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al eliminar la categoría.' };
  }
}
