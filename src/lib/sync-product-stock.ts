import { eq, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { products, productVariants } from '@/db/schema';

/**
 * Recalculates product.stock as the SUM of all its variant stocks.
 * Only applies when the product has variants.
 * Should be called after any variant stock change.
 */
export async function syncProductStockWithVariants(productId: string) {
  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)` })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  const totalVariantStock = Number(result?.total ?? 0);

  // Check if this product actually has variants
  const [variantCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  if (Number(variantCount?.count ?? 0) === 0) return;

  const [product] = await db
    .select({ trackInventory: products.trackInventory, status: products.status })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) return;

  const nextStatus = product.trackInventory
    ? totalVariantStock === 0
      ? 'out_of_stock'
      : product.status === 'inactive'
        ? 'inactive'
        : 'active'
    : product.status === 'inactive'
      ? 'inactive'
      : 'active';

  await db
    .update(products)
    .set({
      stock: totalVariantStock,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
}
