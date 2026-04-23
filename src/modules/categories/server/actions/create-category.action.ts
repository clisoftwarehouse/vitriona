'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { categories, businesses } from '@/db/schema';
import { notDeletedBusiness } from '@/db/soft-delete';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { revalidateCategoriesCache } from '@/lib/cache-revalidation';
import type { CreateCategoryFormValues } from '@/modules/categories/ui/schemas/category.schemas';

export async function createCategoryAction(businessId: string, values: CreateCategoryFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    const existing = await db
      .select({ sortOrder: categories.sortOrder })
      .from(categories)
      .where(eq(categories.businessId, business.id))
      .orderBy(categories.sortOrder);

    const nextOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;

    const [category] = await db
      .insert(categories)
      .values({
        businessId: business.id,
        name: values.name,
        slug: generateSlug(values.name),
        description: values.description || null,
        parentId: values.parentId || null,
        sortOrder: nextOrder,
      })
      .returning({ id: categories.id });

    revalidateCategoriesCache(business.id);

    return { success: true, categoryId: category.id };
  } catch {
    return { error: 'Ocurrió un error al crear la categoría.' };
  }
}
