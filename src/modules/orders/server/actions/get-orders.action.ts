'use server';

import { eq, and, desc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { orders, businesses, orderItems } from '@/db/schema';

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

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  return { order, items };
}
