'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, businesses } from '@/db/schema';

export async function getCatalogsAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);

  if (!business) return [];

  return db.select().from(catalogs).where(eq(catalogs.businessId, businessId)).orderBy(catalogs.createdAt);
}

export async function getCatalogByIdAction(catalogId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1);

  if (!catalog) return null;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
    .limit(1);

  if (!business) return null;

  return catalog;
}
