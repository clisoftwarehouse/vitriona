'use server';

import { db } from '@/db/drizzle';
import { orders, orderItems } from '@/db/schema';

interface OrderItemInput {
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
}

interface CreateOrderInput {
  businessId: string;
  catalogId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerNotes?: string;
  checkoutType: 'whatsapp' | 'internal';
  items: OrderItemInput[];
}

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${rand}`;
}

export async function createOrderAction(input: CreateOrderInput) {
  const { businessId, catalogId, customerName, customerPhone, customerEmail, customerNotes, checkoutType, items } =
    input;

  if (!customerName.trim()) {
    return { error: 'El nombre es requerido' };
  }

  if (items.length === 0) {
    return { error: 'El carrito está vacío' };
  }

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
  const total = subtotal;

  const [order] = await db
    .insert(orders)
    .values({
      businessId,
      catalogId,
      orderNumber: generateOrderNumber(),
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || null,
      customerEmail: customerEmail?.trim() || null,
      customerNotes: customerNotes?.trim() || null,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      status: 'pending',
      checkoutType,
    })
    .returning();

  await db.insert(orderItems).values(
    items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
    }))
  );

  return { success: true, order };
}
