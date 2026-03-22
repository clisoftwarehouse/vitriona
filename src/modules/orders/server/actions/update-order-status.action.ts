'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { syncProductStockWithVariants } from '@/lib/sync-product-stock';
import {
  orders,
  products,
  businesses,
  orderItems,
  productVariants,
  inventoryMovements,
  orderStatusHistory,
} from '@/db/schema';

type OrderStatus = 'pending_payment' | 'payment_verified' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

// ── Helpers ──

async function verifyOrderOwnership(orderId: string, userId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, order.businessId), eq(businesses.userId, userId)))
    .limit(1);

  return business ? order : null;
}

async function restoreInventory(orderId: string, orderNumber: string) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  for (const item of items) {
    if (!item.productId) continue;

    const [product] = await db
      .select({
        id: products.id,
        stock: products.stock,
        trackInventory: products.trackInventory,
        status: products.status,
      })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product?.trackInventory) continue;

    if (item.variantId) {
      // Restore variant stock
      const [variant] = await db
        .select({ id: productVariants.id, stock: productVariants.stock })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      if (variant) {
        const prevStock = variant.stock;
        const newStock = prevStock + item.quantity;
        await db.update(productVariants).set({ stock: newStock }).where(eq(productVariants.id, item.variantId));

        await db.insert(inventoryMovements).values({
          productId: item.productId,
          type: 'adjustment',
          quantity: item.quantity,
          reason: `Cancelación pedido ${orderNumber} (variante)`,
          referenceId: orderId,
          previousStock: prevStock,
          newStock,
        });
      }
      await syncProductStockWithVariants(item.productId);
    } else {
      // Restore product stock
      const previousStock = product.stock ?? 0;
      const newStock = previousStock + item.quantity;

      await db
        .update(products)
        .set({
          stock: newStock,
          status: product.status === 'out_of_stock' && newStock > 0 ? 'active' : undefined,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));

      await db.insert(inventoryMovements).values({
        productId: item.productId,
        type: 'adjustment',
        quantity: item.quantity,
        reason: `Cancelación pedido ${orderNumber}`,
        referenceId: orderId,
        previousStock,
        newStock,
      });
    }
  }
}

// ── Actions ──

export async function updateOrderStatusAction(orderId: string, status: OrderStatus, note?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const order = await verifyOrderOwnership(orderId, session.user.id);
    if (!order) return { error: 'Pedido no encontrado o no autorizado' };

    const fromStatus = order.status;

    // Handle cancellation
    if (status === 'cancelled') {
      if (order.inventoryDeducted) {
        await restoreInventory(order.id, order.orderNumber);
      }

      await db
        .update(orders)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          inventoryDeducted: false,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    } else {
      await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
    }

    // Record status change in history
    await db.insert(orderStatusHistory).values({
      orderId,
      fromStatus,
      toStatus: status,
      changedBy: session.user.id,
      note: note || null,
    });

    return { success: true };
  } catch {
    return { error: 'Error al actualizar el estado del pedido.' };
  }
}

export async function cancelOrderAction(orderId: string, reason?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const order = await verifyOrderOwnership(orderId, session.user.id);
    if (!order) return { error: 'Pedido no encontrado o no autorizado' };

    if (order.status === 'cancelled') return { error: 'El pedido ya está cancelado' };

    if (order.inventoryDeducted) {
      await restoreInventory(order.id, order.orderNumber);
    }

    await db
      .update(orders)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason || null,
        inventoryDeducted: false,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await db.insert(orderStatusHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus: 'cancelled',
      changedBy: session.user.id,
      note: reason ? `Cancelado: ${reason}` : 'Pedido cancelado',
    });

    return { success: true };
  } catch {
    return { error: 'Error al cancelar el pedido.' };
  }
}
