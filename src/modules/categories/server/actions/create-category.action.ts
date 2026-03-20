'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { catalogs, categories, businesses } from '@/db/schema';
import type { CreateCategoryFormValues } from '@/modules/categories/ui/schemas/category.schemas';

export async function createCategoryAction(catalogId: string, values: CreateCategoryFormValues) {
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
        catalogId,
        name: values.name,
        slug: generateSlug(values.name),
        description: values.description || null,
        sortOrder: nextOrder,
      })
      .returning({ id: categories.id });

    return { success: true, categoryId: category.id };
  } catch {
    return { error: 'Ocurrió un error al crear la categoría.' };
  }
}
