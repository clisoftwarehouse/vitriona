'use server';

import { eq, and, desc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, products, businesses, inventoryMovements } from '@/db/schema';

// ── Helpers ──

async function verifyProductOwnership(productId: string, userId: string) {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return null;

  const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, product.catalogId)).limit(1);
  if (!catalog) return null;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, userId)))
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

    return { success: true, newStock };
  } catch {
    return { error: 'Error al ajustar el inventario.' };
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
      catalogId: products.catalogId,
    })
    .from(products)
    .innerJoin(catalogs, eq(products.catalogId, catalogs.id))
    .where(and(eq(catalogs.businessId, businessId), eq(products.trackInventory, true)));

  return allProducts.filter((p) => (p.stock ?? 0) <= (p.minStock ?? 0));
}
