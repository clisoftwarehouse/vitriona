'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { syncProductStockWithVariants } from '@/lib/sync-product-stock';
import { incrementCouponUsage } from '@/modules/coupons/server/actions/coupon-actions';
import { orders, products, orderItems, productVariants, inventoryMovements, orderStatusHistory } from '@/db/schema';

interface OrderItemInput {
  productId: string;
  variantId?: string;
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
  couponId?: string;
  couponCode?: string;
  discount?: number;
  paymentMethodId?: string;
  paymentMethodName?: string;
  paymentDetails?: Record<string, string>;
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
  const discount = input.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  // Verify stock availability for products with inventory tracking
  for (const item of items) {
    const [product] = await db
      .select({ id: products.id, stock: products.stock, trackInventory: products.trackInventory, name: products.name })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product?.trackInventory) continue;

    if (item.variantId) {
      const [variant] = await db
        .select({ id: productVariants.id, stock: productVariants.stock, name: productVariants.name })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      if (variant && variant.stock < item.quantity) {
        return { error: `Stock insuficiente para "${variant.name}". Disponible: ${variant.stock}` };
      }
    } else {
      const available = product.stock ?? 0;
      if (available < item.quantity) {
        return { error: `Stock insuficiente para "${product.name}". Disponible: ${available}` };
      }
    }
  }

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
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      couponId: input.couponId || null,
      couponCode: input.couponCode || null,
      paymentMethodId: input.paymentMethodId || null,
      paymentMethodName: input.paymentMethodName || null,
      paymentDetails: input.paymentDetails || null,
      status: 'pending_payment',
      checkoutType,
      inventoryDeducted: true,
    })
    .returning();

  await db.insert(orderItems).values(
    items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      variantId: item.variantId || null,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
    }))
  );

  // Deduct inventory
  for (const item of items) {
    const [product] = await db
      .select({ id: products.id, stock: products.stock, trackInventory: products.trackInventory })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product?.trackInventory) continue;

    if (item.variantId) {
      // Deduct from variant stock
      const [variant] = await db
        .select({ id: productVariants.id, stock: productVariants.stock })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      if (variant) {
        const prevStock = variant.stock;
        const newStock = Math.max(0, prevStock - item.quantity);
        await db.update(productVariants).set({ stock: newStock }).where(eq(productVariants.id, item.variantId));

        await db.insert(inventoryMovements).values({
          productId: item.productId,
          type: 'order',
          quantity: item.quantity,
          reason: `Pedido ${order.orderNumber} (variante)`,
          referenceId: order.id,
          previousStock: prevStock,
          newStock,
        });
      }
      await syncProductStockWithVariants(item.productId);
    } else {
      // Deduct from product stock
      const previousStock = product.stock ?? 0;
      const newStock = Math.max(0, previousStock - item.quantity);

      await db
        .update(products)
        .set({
          stock: newStock,
          status: newStock === 0 ? 'out_of_stock' : undefined,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));

      await db.insert(inventoryMovements).values({
        productId: item.productId,
        type: 'order',
        quantity: item.quantity,
        reason: `Pedido ${order.orderNumber}`,
        referenceId: order.id,
        previousStock,
        newStock,
      });
    }
  }

  // Record initial status in history
  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    fromStatus: null,
    toStatus: 'pending_payment',
    note: 'Pedido creado',
  });

  // Increment coupon usage
  if (input.couponId) {
    await incrementCouponUsage(input.couponId);
  }

  return { success: true, order };
}
