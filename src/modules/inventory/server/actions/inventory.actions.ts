'use server';

import { eq, and, desc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { syncProductStockWithVariants } from '@/lib/sync-product-stock';
import { syncBundlesForComponent } from '@/modules/products/server/lib/bundles';
import { products, businesses, productVariants, inventoryMovements } from '@/db/schema';

// ── Helpers ──

async function verifyProductOwnership(productId: string, userId: string) {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return null;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, product.businessId), eq(businesses.userId, userId)))
    .limit(1);

  return business ? product : null;
}

// ── Actions ──

export async function getInventoryMovementsAction(productId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const product = await verifyProductOwnership(productId, session.user.id);
  if (!product) return [];

  return db
    .select()
    .from(inventoryMovements)
    .where(eq(inventoryMovements.productId, productId))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(50);
}

export async function adjustStockAction(
  productId: string,
  adjustment: { type: 'in' | 'out' | 'adjustment'; quantity: number; reason?: string }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const product = await verifyProductOwnership(productId, session.user.id);
    if (!product) return { error: 'No autorizado' };

    const previousStock = product.stock ?? 0;
    let newStock: number;

    switch (adjustment.type) {
      case 'in':
        newStock = previousStock + adjustment.quantity;
        break;
      case 'out':
        newStock = Math.max(0, previousStock - adjustment.quantity);
        break;
      case 'adjustment':
        newStock = adjustment.quantity;
        break;
    }

    await db.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, productId));

    await db.insert(inventoryMovements).values({
      productId,
      type: adjustment.type,
      quantity: adjustment.type === 'adjustment' ? newStock - previousStock : adjustment.quantity,
      reason: adjustment.reason || null,
      previousStock,
      newStock,
      createdBy: session.user.id,
    });

    await syncBundlesForComponent(productId);

    return { success: true, newStock };
  } catch {
    return { error: 'Error al ajustar el inventario.' };
  }
}

export async function getInventoryOverviewAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!business) return { error: 'No autorizado' };

  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      stock: products.stock,
      minStock: products.minStock,
      trackInventory: products.trackInventory,
      type: products.type,
      status: products.status,
      price: products.price,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(and(eq(products.businessId, businessId), eq(products.type, 'product')));

  const allVariants = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      name: productVariants.name,
      sku: productVariants.sku,
      stock: productVariants.stock,
      options: productVariants.options,
      isActive: productVariants.isActive,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(products.businessId, businessId));

  const recentMovements = await db
    .select({
      id: inventoryMovements.id,
      productId: inventoryMovements.productId,
      type: inventoryMovements.type,
      quantity: inventoryMovements.quantity,
      reason: inventoryMovements.reason,
      previousStock: inventoryMovements.previousStock,
      newStock: inventoryMovements.newStock,
      createdAt: inventoryMovements.createdAt,
    })
    .from(inventoryMovements)
    .innerJoin(products, eq(products.id, inventoryMovements.productId))
    .where(eq(products.businessId, businessId))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(50);

  // Enrich movements with product names
  const productMap = new Map(allProducts.map((p) => [p.id, p.name]));
  const enrichedMovements = recentMovements.map((m) => ({
    ...m,
    productName: productMap.get(m.productId) ?? 'Producto eliminado',
  }));

  return { products: allProducts, variants: allVariants, movements: enrichedMovements };
}

export async function adjustVariantStockAction(
  variantId: string,
  adjustment: { type: 'in' | 'out' | 'adjustment'; quantity: number; reason?: string }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
    if (!variant) return { error: 'Variante no encontrada' };

    const product = await verifyProductOwnership(variant.productId, session.user.id);
    if (!product) return { error: 'No autorizado' };

    const previousStock = variant.stock;
    let newStock: number;

    switch (adjustment.type) {
      case 'in':
        newStock = previousStock + adjustment.quantity;
        break;
      case 'out':
        newStock = Math.max(0, previousStock - adjustment.quantity);
        break;
      case 'adjustment':
        newStock = adjustment.quantity;
        break;
    }

    await db.update(productVariants).set({ stock: newStock }).where(eq(productVariants.id, variantId));

    await db.insert(inventoryMovements).values({
      productId: variant.productId,
      type: adjustment.type,
      quantity: adjustment.type === 'adjustment' ? newStock - previousStock : adjustment.quantity,
      reason: `${adjustment.reason || ''} (variante: ${variant.name})`.trim(),
      previousStock,
      newStock,
      createdBy: session.user.id,
    });

    await syncProductStockWithVariants(variant.productId);
    await syncBundlesForComponent(variant.productId);

    return { success: true, newStock };
  } catch {
    return { error: 'Error al ajustar el inventario de la variante.' };
  }
}

export async function getLowStockProductsAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!business) return [];

  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      stock: products.stock,
      minStock: products.minStock,
      trackInventory: products.trackInventory,
    })
    .from(products)
    .where(and(eq(products.businessId, businessId), eq(products.trackInventory, true)));

  return allProducts.filter((p) => (p.stock ?? 0) <= (p.minStock ?? 0));
}
