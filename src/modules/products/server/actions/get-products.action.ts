'use server';

import { eq, and, desc, ilike } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { products, businesses, catalogProducts, productAttributeValues } from '@/db/schema';

interface GetProductsOptions {
  categoryId?: string;
  status?: string;
  search?: string;
}

export async function getProductsAction(businessId: string, options?: GetProductsOptions) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!business) return [];

  const conditions = [eq(products.businessId, businessId)];

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

  // Verify ownership via businessId
  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, product.businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!business) return null;

  return product;
}

export async function getProductCatalogIdsAction(productId: string) {
  const rows = await db
    .select({ catalogId: catalogProducts.catalogId })
    .from(catalogProducts)
    .where(eq(catalogProducts.productId, productId));
  return rows.map((r) => r.catalogId);
}

export async function getProductAttributeValuesAction(productId: string) {
  const rows = await db
    .select({ attributeId: productAttributeValues.attributeId, value: productAttributeValues.value })
    .from(productAttributeValues)
    .where(eq(productAttributeValues.productId, productId));

  const record: Record<string, string> = {};
  for (const row of rows) {
    record[row.attributeId] = row.value;
  }
  return record;
}
