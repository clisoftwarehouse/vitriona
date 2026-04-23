'use server';

import crypto from 'crypto';
import { eq, and, sql, gte } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { syncProductStockWithVariants } from '@/lib/sync-product-stock';
import { notDeletedProduct, notDeletedBusiness } from '@/db/soft-delete';
import { syncBundlesForComponent } from '@/modules/products/server/lib/bundles';
import {
  orders,
  catalogs,
  products,
  businesses,
  orderItems,
  notifications,
  productVariants,
  inventoryMovements,
  orderStatusHistory,
} from '@/db/schema';

interface PosOrderItemInput {
  productId: string;
  variantId?: string;
  productName: string;
  unitPrice: string;
  quantity: number;
}

interface CreatePosOrderInput {
  businessId: string;
  customerName?: string;
  customerPhone?: string;
  customerNotes?: string;
  items: PosOrderItemInput[];
  paymentMethodId?: string;
  paymentMethodName?: string;
  deliveryMethodId?: string;
  deliveryMethodName?: string;
  shippingCost?: number;
  discount?: number;
}

interface ValidatedItem {
  productId: string;
  variantId?: string;
  productName: string;
  unitPrice: string;
  quantity: number;
}

interface DeductedEntry {
  productId: string;
  variantId?: string;
  quantity: number;
  previousStock: number;
}

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `POS-${date}-${rand}`;
}

export async function createPosOrderAction(input: CreatePosOrderInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const { businessId, items } = input;

  // Verify business ownership
  const [business] = await db
    .select({ id: businesses.id, userId: businesses.userId, currency: businesses.currency })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!business) return { error: 'Negocio no encontrado' };

  if (items.length === 0) return { error: 'No hay productos en la venta' };

  // Get first catalog for the business (required by orders schema)
  const [catalog] = await db
    .select({ id: catalogs.id })
    .from(catalogs)
    .where(and(eq(catalogs.businessId, businessId), eq(catalogs.isActive, true)))
    .limit(1);
  if (!catalog) return { error: 'No hay catálogo activo. Crea uno primero.' };

  // Validate products
  const validatedItems: ValidatedItem[] = [];

  for (const item of items) {
    if (item.quantity <= 0 || item.quantity > 9999) return { error: 'Cantidad inválida' };

    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        stock: products.stock,
        trackInventory: products.trackInventory,
        type: products.type,
      })
      .from(products)
      .where(and(eq(products.id, item.productId), eq(products.businessId, businessId), notDeletedProduct))
      .limit(1);
    if (!product) return { error: `Producto "${item.productName}" no encontrado` };

    if (item.variantId) {
      const [variant] = await db
        .select({
          id: productVariants.id,
          name: productVariants.name,
          price: productVariants.price,
          stock: productVariants.stock,
        })
        .from(productVariants)
        .where(and(eq(productVariants.id, item.variantId), eq(productVariants.productId, item.productId)))
        .limit(1);

      if (!variant) return { error: `Variante no encontrada para "${product.name}"` };

      if (product.trackInventory && variant.stock < item.quantity) {
        return { error: `Stock insuficiente para "${product.name} (${variant.name})". Disponible: ${variant.stock}` };
      }

      validatedItems.push({
        productId: product.id,
        variantId: variant.id,
        productName: `${product.name} (${variant.name})`,
        unitPrice: variant.price ?? product.price,
        quantity: item.quantity,
      });
    } else {
      if (product.trackInventory && (product.stock ?? 0) < item.quantity) {
        return { error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock ?? 0}` };
      }

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
      });
    }
  }

  const subtotal = validatedItems.reduce((sum, i) => sum + parseFloat(i.unitPrice) * i.quantity, 0);
  const discount = input.discount ?? 0;
  const shippingCost = input.shippingCost ?? 0;
  const total = Math.max(0, subtotal - discount + shippingCost);
  const orderNumber = generateOrderNumber();

  // Atomic stock deduction
  const deducted: DeductedEntry[] = [];
  const affectedProductIds = new Set<string>();

  for (const item of validatedItems) {
    const [product] = await db
      .select({ id: products.id, stock: products.stock, trackInventory: products.trackInventory, name: products.name })
      .from(products)
      .where(and(eq(products.id, item.productId), notDeletedProduct))
      .limit(1);

    if (!product?.trackInventory) continue;

    if (item.variantId) {
      const [updated] = await db
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
        .where(and(eq(productVariants.id, item.variantId), gte(productVariants.stock, item.quantity)))
        .returning({ id: productVariants.id, stock: productVariants.stock });

      if (!updated) {
        await rollbackDeductions(deducted);
        return { error: `Stock insuficiente para "${item.productName}"` };
      }
      deducted.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        previousStock: (updated.stock ?? 0) + item.quantity,
      });
      affectedProductIds.add(item.productId);
    } else {
      const [updated] = await db
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
        .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
        .returning({ id: products.id, stock: products.stock });

      if (!updated) {
        await rollbackDeductions(deducted);
        return { error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock ?? 0}` };
      }

      const newStock = updated.stock ?? 0;
      if (newStock === 0) {
        await db.update(products).set({ status: 'out_of_stock' }).where(eq(products.id, item.productId));
      }

      if (newStock <= 5 && newStock >= 0) {
        await db.insert(notifications).values({
          userId: session.user.id,
          businessId,
          type: 'low_stock',
          title: newStock === 0 ? 'Producto agotado' : 'Stock bajo',
          description: `"${product.name}" tiene ${newStock} unidades disponibles`,
          href: `/dashboard/businesses/${businessId}/products`,
        });
      }

      deducted.push({ productId: item.productId, quantity: item.quantity, previousStock: newStock + item.quantity });
      affectedProductIds.add(item.productId);
    }
  }

  // Create order
  const [order] = await db
    .insert(orders)
    .values({
      businessId,
      catalogId: catalog.id,
      orderNumber,
      customerName: input.customerName?.trim() || 'Venta en mostrador',
      customerPhone: input.customerPhone?.trim() || null,
      customerNotes: input.customerNotes?.trim() || null,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      paymentMethodId: input.paymentMethodId || null,
      paymentMethodName: input.paymentMethodName || null,
      deliveryMethodId: input.deliveryMethodId || null,
      deliveryMethodName: input.deliveryMethodName || null,
      shippingCost: shippingCost.toFixed(2),
      status: 'payment_verified',
      checkoutType: 'pos',
      inventoryDeducted: true,
    })
    .returning();

  // Insert order items
  await db.insert(orderItems).values(
    validatedItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      variantId: item.variantId || null,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
    }))
  );

  // Record inventory movements
  for (const d of deducted) {
    await db.insert(inventoryMovements).values({
      productId: d.productId,
      type: 'order',
      quantity: d.quantity,
      reason: `Venta POS ${orderNumber}${d.variantId ? ' (variante)' : ''}`,
      referenceId: order.id,
      previousStock: d.previousStock,
      newStock: d.previousStock - d.quantity,
    });
    if (d.variantId) {
      await syncProductStockWithVariants(d.productId);
    }
  }

  // Record status history
  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    fromStatus: null,
    toStatus: 'payment_verified',
    note: 'Venta POS registrada',
  });

  // Sync bundles
  for (const productId of affectedProductIds) {
    await syncBundlesForComponent(productId);
  }

  return { success: true, order };
}

async function rollbackDeductions(deducted: DeductedEntry[]): Promise<void> {
  for (const d of deducted) {
    if (d.variantId) {
      await db
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${d.quantity}` })
        .where(eq(productVariants.id, d.variantId));
    } else {
      await db
        .update(products)
        .set({ stock: sql`${products.stock} + ${d.quantity}`, status: 'active', updatedAt: new Date() })
        .where(eq(products.id, d.productId));
    }
  }
}
