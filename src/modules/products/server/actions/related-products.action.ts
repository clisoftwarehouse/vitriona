'use server';

import { eq, and, asc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { revalidateProductsCache } from '@/lib/cache-revalidation';
import { products, businesses, relatedProducts } from '@/db/schema';
import { notDeletedProduct, notDeletedBusiness } from '@/db/soft-delete';

export async function getRelatedProductIds(productId: string) {
  const rows = await db
    .select({ relatedProductId: relatedProducts.relatedProductId })
    .from(relatedProducts)
    .where(eq(relatedProducts.productId, productId))
    .orderBy(asc(relatedProducts.sortOrder));

  return rows.map((r) => r.relatedProductId);
}

export async function syncRelatedProductsAction(productId: string, relatedProductIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const [product] = await db
    .select({ id: products.id, businessId: products.businessId })
    .from(products)
    .where(and(eq(products.id, productId), notDeletedProduct))
    .limit(1);
  if (!product) return { error: 'Producto no encontrado' };

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, product.businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!business) return { error: 'No autorizado' };

  // Delete existing related products
  await db.delete(relatedProducts).where(eq(relatedProducts.productId, productId));

  // Insert new related products
  if (relatedProductIds.length > 0) {
    await db.insert(relatedProducts).values(
      relatedProductIds.map((relatedId, idx) => ({
        productId,
        relatedProductId: relatedId,
        sortOrder: idx,
      }))
    );
  }

  revalidateProductsCache(product.businessId);

  return { success: true };
}

export async function getBusinessProductsForRelatedPicker(businessId: string, excludeProductId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!business) return { error: 'No autorizado' };

  const conditions = [eq(products.businessId, businessId), eq(products.status, 'active')];

  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      sku: products.sku,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.name));

  const filtered = excludeProductId ? allProducts.filter((p) => p.id !== excludeProductId) : allProducts;

  return { products: filtered };
}
