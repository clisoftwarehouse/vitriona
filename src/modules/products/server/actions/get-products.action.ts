'use server';

import { eq, and, desc, ilike } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, products, businesses } from '@/db/schema';

interface GetProductsOptions {
  categoryId?: string;
  status?: string;
  search?: string;
}

export async function getProductsAction(catalogId: string, options?: GetProductsOptions) {
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

  const conditions = [eq(products.catalogId, catalogId)];

  if (options?.categoryId) {
    conditions.push(eq(products.categoryId, options.categoryId));
  }
  if (options?.status) {
    conditions.push(eq(products.status, options.status as 'active' | 'inactive' | 'out_of_stock'));
  }
  if (options?.search) {
    conditions.push(ilike(products.name, `%${options.search}%`));
  }

  return db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt));
}

export async function getProductByIdAction(productId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return null;

  const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, product.catalogId)).limit(1);
  if (!catalog) return null;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!business) return null;

  return product;
}
