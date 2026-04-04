'use server';

import { eq, ne, and, asc, desc, ilike, inArray } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import {
  products,
  businesses,
  bundleItems,
  catalogProducts,
  productVariants,
  productAttributeValues,
} from '@/db/schema';

interface GetProductsOptions {
  categoryId?: string;
  status?: string;
  search?: string;
}

interface BundleComponentOptionRecord {
  id: string;
  name: string;
  type: 'product' | 'service';
  price: string;
  stock: number | null;
  trackInventory: boolean;
  status: 'active' | 'inactive' | 'out_of_stock';
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

export async function getBundleComponentOptionsAction(
  businessId: string,
  excludeProductId?: string
): Promise<BundleComponentOptionRecord[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!business) return [];

  const conditions = [eq(products.businessId, businessId), ne(products.type, 'bundle')];

  if (excludeProductId) {
    conditions.push(ne(products.id, excludeProductId));
  }

  const candidates = await db
    .select({
      id: products.id,
      name: products.name,
      type: products.type,
      price: products.price,
      stock: products.stock,
      trackInventory: products.trackInventory,
      status: products.status,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.name));

  if (candidates.length === 0) return [];

  const candidateIds = candidates.map((candidate) => candidate.id);
  const variantRows = await db
    .select({ productId: productVariants.productId })
    .from(productVariants)
    .where(inArray(productVariants.productId, candidateIds));

  const blockedIds = new Set(variantRows.map((row) => row.productId));

  return candidates
    .filter((candidate) => !blockedIds.has(candidate.id))
    .map((candidate) => ({
      ...candidate,
      type: candidate.type as 'product' | 'service',
    }));
}

export async function getBundleItemsAction(productId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return [];

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, product.businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!business) return [];

  return db
    .select({
      productId: bundleItems.itemProductId,
      quantity: bundleItems.quantity,
      name: products.name,
      type: products.type,
      price: products.price,
      stock: products.stock,
      trackInventory: products.trackInventory,
      status: products.status,
    })
    .from(bundleItems)
    .innerJoin(products, eq(bundleItems.itemProductId, products.id))
    .where(eq(bundleItems.bundleProductId, productId))
    .orderBy(asc(bundleItems.sortOrder), asc(products.name));
}
