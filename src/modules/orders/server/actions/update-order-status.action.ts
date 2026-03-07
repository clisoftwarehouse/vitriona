'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { orders, businesses } from '@/db/schema';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
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

  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));

  return { success: true };
}
