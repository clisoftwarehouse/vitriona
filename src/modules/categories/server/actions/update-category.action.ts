'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { categories, businesses } from '@/db/schema';
import { notDeletedBusiness } from '@/db/soft-delete';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { revalidateCategoriesCache } from '@/lib/cache-revalidation';
import type { UpdateCategoryFormValues } from '@/modules/categories/ui/schemas/category.schemas';

export async function updateCategoryAction(categoryId: string, values: UpdateCategoryFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!category) return { error: 'Categoría no encontrada' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, category.businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    await db
      .update(categories)
      .set({
        name: values.name,
        slug: generateSlug(values.name),
        description: values.description || null,
        parentId: values.parentId || null,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId));

    revalidateCategoriesCache(category.businessId);

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al actualizar la categoría.' };
  }
}
