'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, categories, businesses } from '@/db/schema';

export async function getCategoriesAction(catalogId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1);
  if (!catalog) return [];

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!business) return [];

  return db.select().from(categories).where(eq(categories.catalogId, catalogId)).orderBy(categories.sortOrder);
}

export async function getCategoryByIdAction(categoryId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!category) return null;

  const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, category.catalogId)).limit(1);
  if (!catalog) return null;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!business) return null;

  return category;
}
