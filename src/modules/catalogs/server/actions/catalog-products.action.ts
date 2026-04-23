'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { notDeletedBusiness } from '@/db/soft-delete';
import { revalidateProductsCache } from '@/lib/cache-revalidation';
import { products, businesses, catalogProducts } from '@/db/schema';

export async function getBusinessProductsWithCatalogStatus(businessId: string, catalogId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!business) return { error: 'Negocio no encontrado' };

  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      sku: products.sku,
      status: products.status,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(eq(products.businessId, businessId));

  const assigned = await db
    .select({ productId: catalogProducts.productId })
    .from(catalogProducts)
    .where(eq(catalogProducts.catalogId, catalogId));

  const assignedIds = new Set(assigned.map((a) => a.productId));

  return {
    products: allProducts.map((p) => ({
      ...p,
      assigned: assignedIds.has(p.id),
    })),
  };
}

export async function syncCatalogProductsAction(catalogId: string, businessId: string, productIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!business) return { error: 'No autorizado' };

  // Get current assignments
  const current = await db
    .select({ productId: catalogProducts.productId })
    .from(catalogProducts)
    .where(eq(catalogProducts.catalogId, catalogId));

  const currentIds = new Set(current.map((c) => c.productId));
  const targetIds = new Set(productIds);

  // Products to add
  const toAdd = productIds.filter((id) => !currentIds.has(id));
  // Products to remove
  const toRemove = current.filter((c) => !targetIds.has(c.productId)).map((c) => c.productId);

  if (toAdd.length > 0) {
    await db
      .insert(catalogProducts)
      .values(toAdd.map((productId) => ({ catalogId, productId })))
      .onConflictDoNothing();
  }

  for (const productId of toRemove) {
    await db
      .delete(catalogProducts)
      .where(and(eq(catalogProducts.catalogId, catalogId), eq(catalogProducts.productId, productId)));
  }

  revalidateProductsCache(businessId);

  return { success: true };
}
