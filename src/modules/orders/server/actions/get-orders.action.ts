'use server';

import { eq, and, asc, desc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { orders, businesses, orderItems, orderStatusHistory, orderBundleComponents } from '@/db/schema';

export async function getOrdersByBusinessAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);

  if (!business) return { error: 'Negocio no encontrado' };

  const orderList = await db
    .select()
    .from(orders)
    .where(eq(orders.businessId, businessId))
    .orderBy(desc(orders.createdAt));

  return { orders: orderList };
}

export async function getOrderDetailAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { error: 'Pedido no encontrado' };

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, order.businessId), eq(businesses.userId, session.user.id)))
    .limit(1);

  if (!business) return { error: 'No autorizado' };

  const [items, bundleComponents, statusHistory] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db
      .select()
      .from(orderBundleComponents)
      .innerJoin(orderItems, eq(orderBundleComponents.orderItemId, orderItems.id))
      .where(eq(orderItems.orderId, orderId)),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(asc(orderStatusHistory.createdAt)),
  ]);

  const bundleComponentsByOrderItem = new Map<string, typeof bundleComponents>();
  for (const component of bundleComponents) {
    const existing = bundleComponentsByOrderItem.get(component.order_bundle_components.orderItemId) ?? [];
    existing.push(component);
    bundleComponentsByOrderItem.set(component.order_bundle_components.orderItemId, existing);
  }

  const enrichedItems = items.map((item) => ({
    ...item,
    bundleComponents:
      bundleComponentsByOrderItem.get(item.id)?.map((component) => component.order_bundle_components) ?? [],
  }));

  return { order, items: enrichedItems, statusHistory };
}
