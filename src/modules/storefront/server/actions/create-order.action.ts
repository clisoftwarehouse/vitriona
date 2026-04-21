'use server';

import crypto from 'crypto';
import { eq, and, sql, gte } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { rateLimitAction } from '@/lib/rate-limit';
import { syncProductStockWithVariants } from '@/lib/sync-product-stock';
import { validateReservationSelection } from '@/modules/orders/lib/reservations';
import { incrementCouponUsage } from '@/modules/coupons/server/actions/coupon-actions';
import { getBundleComponents, syncBundlesForComponent } from '@/modules/products/server/lib/bundles';
import {
  deductGiftCardBalance,
  validateGiftCardAction,
  recordGiftCardRedemption,
} from '@/modules/gift-cards/server/actions/gift-card-actions';
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
  orderBundleComponents,
} from '@/db/schema';

interface BundleSelectionInput {
  slotId: string | null;
  slotName: string | null;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
}

interface OrderItemInput {
  productId: string;
  variantId?: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  bundleSelections?: BundleSelectionInput[];
}

interface CreateOrderInput {
  businessId: string;
  catalogId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerNotes?: string;
  orderType?: 'order' | 'reservation';
  reservationDate?: string;
  reservationTime?: string;
  checkoutType: 'whatsapp' | 'internal';
  items: OrderItemInput[];
  couponId?: string;
  couponCode?: string;
  couponDiscount?: number;
  giftCardId?: string;
  giftCardCode?: string;
  discount?: number;
  paymentMethodId?: string;
  paymentMethodName?: string;
  paymentDetails?: Record<string, string>;
  deliveryMethodId?: string;
  deliveryMethodName?: string;
  shippingCost?: number;
}

interface ValidatedBundleComponent {
  componentProductId: string;
  componentProductName: string;
  unitQuantity: number;
  totalQuantity: number;
  unitPrice: string;
  subtotal: string;
  tracksInventory: boolean;
}

interface ValidatedOrderItem {
  productId: string;
  variantId?: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  productType: 'product' | 'service' | 'bundle';
  bundleComponents?: ValidatedBundleComponent[];
  bundleSelections?: BundleSelectionInput[];
}

interface DeductedInventoryEntry {
  productId: string;
  variantId?: string;
  quantity: number;
  previousStock: number;
  reasonLabel?: string;
}

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${date}-${rand}`;
}

export async function createOrderAction(input: CreateOrderInput) {
  const {
    businessId,
    catalogId,
    customerName,
    customerPhone,
    customerEmail,
    customerNotes,
    orderType = 'order',
    reservationDate,
    reservationTime,
    checkoutType,
    items,
  } = input;
  const isReservation = orderType === 'reservation';

  // Rate limit: 10 orders per minute per businessId (storefront)
  const rl = await rateLimitAction(businessId, 'create-order', 10, 60);
  if (!rl.success) return { error: 'Demasiados pedidos. Intenta de nuevo en un momento.' };

  if (!customerName.trim()) {
    return { error: 'El nombre es requerido' };
  }

  if (items.length === 0) {
    return { error: 'El carrito está vacío' };
  }

  if (items.length > 100) {
    return { error: 'El carrito tiene demasiados artículos' };
  }

  const reservationValidation = validateReservationSelection({
    orderType,
    reservationDate,
    reservationTime,
  });
  if (!reservationValidation.ok) {
    return { error: reservationValidation.error };
  }

  // --- VULN-05 fix: Validate business and catalog exist and are active ---
  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.isActive, true)))
    .limit(1);
  if (!business) return { error: 'Negocio no encontrado' };

  const [catalog] = await db
    .select({ id: catalogs.id })
    .from(catalogs)
    .where(and(eq(catalogs.id, catalogId), eq(catalogs.businessId, businessId), eq(catalogs.isActive, true)))
    .limit(1);
  if (!catalog) return { error: 'Catálogo no encontrado' };

  const validatedItems: ValidatedOrderItem[] = [];

  // Get business owner for notifications
  const [businessOwner] = await db
    .select({ userId: businesses.userId, currency: businesses.currency })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  // Validate all products belong to this business
  for (const item of items) {
    if (item.quantity <= 0 || item.quantity > 9999) return { error: 'Cantidad inválida' };

    const [product] = await db
      .select({
        id: products.id,
        businessId: products.businessId,
        name: products.name,
        price: products.price,
        stock: products.stock,
        trackInventory: products.trackInventory,
        type: products.type,
      })
      .from(products)
      .where(and(eq(products.id, item.productId), eq(products.businessId, businessId), eq(products.status, 'active')))
      .limit(1);
    if (!product) return { error: `Producto no encontrado o no disponible` };

    if (product.type === 'bundle') {
      if (item.variantId) {
        return { error: `"${product.name}" es un paquete y no admite variantes.` };
      }

      // Customer-choice bundle: validate selections from cart
      if (item.bundleSelections && item.bundleSelections.length > 0) {
        const selectionComponents: ValidatedBundleComponent[] = [];

        for (const sel of item.bundleSelections) {
          const [selProduct] = await db
            .select({
              id: products.id,
              name: products.name,
              price: products.price,
              stock: products.stock,
              trackInventory: products.trackInventory,
            })
            .from(products)
            .where(
              and(eq(products.id, sel.productId), eq(products.businessId, businessId), eq(products.status, 'active'))
            )
            .limit(1);

          if (!selProduct) {
            return { error: `Producto "${sel.productName}" no disponible en el paquete "${product.name}".` };
          }

          const totalQty = sel.quantity * item.quantity;
          if (!isReservation && selProduct.trackInventory && (selProduct.stock ?? 0) < totalQty) {
            return {
              error: `Stock insuficiente para "${selProduct.name}" dentro de "${product.name}". Disponible: ${selProduct.stock ?? 0}`,
            };
          }

          selectionComponents.push({
            componentProductId: selProduct.id,
            componentProductName: selProduct.name,
            unitQuantity: sel.quantity,
            totalQuantity: totalQty,
            unitPrice: selProduct.price,
            subtotal: (parseFloat(selProduct.price) * totalQty).toFixed(2),
            tracksInventory: selProduct.trackInventory,
          });
        }

        validatedItems.push({
          productId: product.id,
          productName: product.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          productType: 'bundle',
          bundleComponents: selectionComponents,
          bundleSelections: item.bundleSelections,
        });

        continue;
      }

      // Fixed bundle: use predefined components
      const bundleComponents = await getBundleComponents(product.id);
      if (bundleComponents.length === 0) {
        return { error: `"${product.name}" no tiene componentes configurados.` };
      }

      if (!isReservation) {
        for (const component of bundleComponents) {
          const requiredQuantity = component.quantity * item.quantity;
          if (component.trackInventory && (component.stock ?? 0) < requiredQuantity) {
            return {
              error: `Stock insuficiente para "${component.name}" dentro de "${product.name}". Disponible: ${component.stock ?? 0}`,
            };
          }
        }
      }

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        productType: 'bundle',
        bundleComponents: bundleComponents.map((component) => ({
          componentProductId: component.productId,
          componentProductName: component.name,
          unitQuantity: component.quantity,
          totalQuantity: component.quantity * item.quantity,
          unitPrice: component.price,
          subtotal: (parseFloat(component.price) * component.quantity * item.quantity).toFixed(2),
          tracksInventory: component.trackInventory,
        })),
      });

      continue;
    }

    // If product has variants, require a variantId
    if (!item.variantId) {
      const [hasVariants] = await db
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.productId, item.productId))
        .limit(1);
      if (hasVariants) {
        return { error: `"${item.productName}" tiene variantes. Selecciona una variante antes de ordenar.` };
      }

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        productType: product.type as 'product' | 'service',
      });

      continue;
    }

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

    if (!variant) {
      return { error: `La variante seleccionada para "${product.name}" no existe.` };
    }

    if (!isReservation && product.trackInventory && variant.stock < item.quantity) {
      return { error: `Stock insuficiente para "${product.name} (${variant.name})". Disponible: ${variant.stock}` };
    }

    validatedItems.push({
      productId: product.id,
      variantId: variant.id,
      productName: `${product.name} (${variant.name})`,
      unitPrice: variant.price ?? product.price,
      quantity: item.quantity,
      productType: product.type as 'product' | 'service',
    });
  }

  const subtotal = validatedItems.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
  const couponDiscount = Math.max(0, input.couponDiscount ?? (input.giftCardId ? 0 : (input.discount ?? 0)));

  // Server-side revalidation of the gift card. Never trust the client-provided discount:
  // state may have changed between apply-time and order-time (expired, deactivated,
  // balance consumed by another order, tenant mismatch, etc.).
  let giftCardDiscount = 0;
  let resolvedGiftCardId: string | null = null;
  let resolvedGiftCardCode: string | null = null;

  if (input.giftCardId || input.giftCardCode) {
    const code = input.giftCardCode?.trim();
    if (!code) return { error: 'Código de gift card inválido' };

    const gcValidation = await validateGiftCardAction(
      businessId,
      code,
      subtotal,
      validatedItems.map((item) => ({
        productId: item.productId,
        price: parseFloat(item.unitPrice),
        quantity: item.quantity,
      }))
    );

    if (gcValidation.error || !gcValidation.data) {
      return { error: gcValidation.error ?? 'Gift card no válida' };
    }
    if (input.giftCardId && gcValidation.data.giftCardId !== input.giftCardId) {
      return { error: 'Gift card no válida' };
    }

    giftCardDiscount = gcValidation.data.discount;
    resolvedGiftCardId = gcValidation.data.giftCardId;
    resolvedGiftCardCode = gcValidation.data.code;
  }

  const discount = Math.min(subtotal, couponDiscount + giftCardDiscount);
  const shippingCost = input.shippingCost ?? 0;
  const total = Math.max(0, subtotal - discount + shippingCost);
  const orderNumber = generateOrderNumber();

  // --- VULN-03 fix: Atomic stock deduction with SQL WHERE stock >= quantity ---
  // First, attempt to atomically deduct all stock. If any fails, we roll back the ones that succeeded.
  const deducted: DeductedInventoryEntry[] = [];
  const affectedProductIds = new Set<string>();

  if (!isReservation) {
    for (const item of validatedItems) {
      if (item.productType === 'bundle') {
        for (const component of item.bundleComponents ?? []) {
          if (!component.tracksInventory) continue;

          const [componentProduct] = await db
            .select({ id: products.id, stock: products.stock })
            .from(products)
            .where(eq(products.id, component.componentProductId))
            .limit(1);

          const [updated] = await db
            .update(products)
            .set({
              stock: sql`${products.stock} - ${component.totalQuantity}`,
              updatedAt: new Date(),
            })
            .where(and(eq(products.id, component.componentProductId), gte(products.stock, component.totalQuantity)))
            .returning({ id: products.id, stock: products.stock });

          if (!updated) {
            await rollbackDeductions(deducted);
            return {
              error: `Stock insuficiente para "${component.componentProductName}" dentro del paquete "${item.productName}". Disponible: ${componentProduct?.stock ?? 0}`,
            };
          }

          const newStock = updated.stock ?? 0;

          if (newStock === 0) {
            await db
              .update(products)
              .set({ status: 'out_of_stock' })
              .where(eq(products.id, component.componentProductId));
          }

          if (newStock <= 5 && newStock >= 0 && businessOwner?.userId) {
            await db.insert(notifications).values({
              userId: businessOwner.userId,
              businessId,
              type: 'low_stock',
              title: newStock === 0 ? 'Producto agotado' : 'Stock bajo',
              description: `"${component.componentProductName}" tiene ${newStock} unidades disponibles`,
              href: `/dashboard/businesses/${businessId}/products`,
            });
          }

          deducted.push({
            productId: component.componentProductId,
            quantity: component.totalQuantity,
            previousStock: newStock + component.totalQuantity,
            reasonLabel: `Pedido ${orderNumber} (paquete: ${item.productName})`,
          });
          affectedProductIds.add(component.componentProductId);
        }

        continue;
      }

      const [product] = await db
        .select({
          id: products.id,
          stock: products.stock,
          trackInventory: products.trackInventory,
          name: products.name,
        })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product?.trackInventory) continue;

      if (item.variantId) {
        // Atomic variant stock deduction
        const [updated] = await db
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
          .where(and(eq(productVariants.id, item.variantId), gte(productVariants.stock, item.quantity)))
          .returning({ id: productVariants.id, stock: productVariants.stock });

        if (!updated) {
          // Rollback previously deducted items
          await rollbackDeductions(deducted);
          const [v] = await db
            .select({ name: productVariants.name, stock: productVariants.stock })
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId))
            .limit(1);
          return { error: `Stock insuficiente para "${v?.name ?? item.productName}". Disponible: ${v?.stock ?? 0}` };
        }
        deducted.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          previousStock: (updated.stock ?? 0) + item.quantity,
          reasonLabel: `Pedido ${orderNumber} (variante)`,
        });
        affectedProductIds.add(item.productId);
      } else {
        // Atomic product stock deduction
        const [updated] = await db
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
          .returning({ id: products.id, stock: products.stock });

        if (!updated) {
          await rollbackDeductions(deducted);
          return { error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock ?? 0}` };
        }

        const newStock = updated.stock ?? 0;

        // Mark out_of_stock if needed
        if (newStock === 0) {
          await db.update(products).set({ status: 'out_of_stock' }).where(eq(products.id, item.productId));
        }

        // Low stock notification
        if (newStock <= 5 && newStock >= 0 && businessOwner?.userId) {
          await db.insert(notifications).values({
            userId: businessOwner.userId,
            businessId,
            type: 'low_stock',
            title: newStock === 0 ? 'Producto agotado' : 'Stock bajo',
            description: `"${product.name}" tiene ${newStock} unidades disponibles`,
            href: `/dashboard/businesses/${businessId}/products`,
          });
        }

        deducted.push({
          productId: item.productId,
          quantity: item.quantity,
          previousStock: newStock + item.quantity,
          reasonLabel: `Pedido ${orderNumber}`,
        });
        affectedProductIds.add(item.productId);
      }
    }
  }

  // Atomic gift card redemption. Done before the order insert so that any race
  // (concurrent redemption, balance consumed meanwhile) rolls back stock cleanly.
  let giftCardBalanceBefore: number | undefined;
  let giftCardBalanceAfter: number | undefined;
  if (resolvedGiftCardId && giftCardDiscount > 0) {
    const redemption = await deductGiftCardBalance(resolvedGiftCardId, giftCardDiscount);
    if (!redemption.success) {
      await rollbackDeductions(deducted);
      return { error: redemption.error ?? 'No se pudo aplicar la gift card' };
    }
    giftCardBalanceBefore = redemption.balanceBefore;
    giftCardBalanceAfter = redemption.balanceAfter;
  }

  const [order] = await db
    .insert(orders)
    .values({
      businessId,
      catalogId,
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || null,
      customerEmail: customerEmail?.trim() || null,
      customerNotes: customerNotes?.trim() || null,
      orderType,
      reservationDate: isReservation ? reservationDate || null : null,
      reservationTime: isReservation ? reservationTime || null : null,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      couponId: input.couponId || null,
      couponCode: input.couponCode || null,
      giftCardId: resolvedGiftCardId,
      giftCardCode: resolvedGiftCardCode,
      giftCardDiscount: giftCardDiscount.toFixed(2),
      paymentMethodId: input.paymentMethodId || null,
      paymentMethodName: input.paymentMethodName || null,
      paymentDetails: input.paymentDetails || null,
      deliveryMethodId: input.deliveryMethodId || null,
      deliveryMethodName: input.deliveryMethodName || null,
      shippingCost: shippingCost.toFixed(2),
      status: 'pending_payment',
      checkoutType,
      inventoryDeducted: !isReservation,
    })
    .returning();

  const insertedOrderItems = await db
    .insert(orderItems)
    .values(
      validatedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
        bundleSelections: item.bundleSelections ?? null,
      }))
    )
    .returning({ id: orderItems.id });

  const bundleSnapshotRows = insertedOrderItems.flatMap((orderItem, index) => {
    const item = validatedItems[index];
    return (item.bundleComponents ?? []).map((component) => ({
      orderItemId: orderItem.id,
      componentProductId: component.componentProductId,
      componentProductName: component.componentProductName,
      unitQuantity: component.unitQuantity,
      totalQuantity: component.totalQuantity,
      unitPrice: component.unitPrice,
      subtotal: component.subtotal,
      tracksInventory: component.tracksInventory,
    }));
  });

  if (bundleSnapshotRows.length > 0) {
    await db.insert(orderBundleComponents).values(bundleSnapshotRows);
  }

  // Record inventory movements
  for (const d of deducted) {
    await db.insert(inventoryMovements).values({
      productId: d.productId,
      type: 'order',
      quantity: d.quantity,
      reason: d.reasonLabel ?? `Pedido ${orderNumber}${d.variantId ? ' (variante)' : ''}`,
      referenceId: order.id,
      previousStock: d.previousStock,
      newStock: d.previousStock - d.quantity,
    });
    if (d.variantId) {
      await syncProductStockWithVariants(d.productId);
    }
  }

  // Record initial status in history
  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    fromStatus: null,
    toStatus: 'pending_payment',
    note: isReservation ? 'Reserva creada' : 'Pedido creado',
  });

  // Increment coupon usage
  if (input.couponId) {
    await incrementCouponUsage(input.couponId);
  }

  // Record gift card redemption audit entry
  if (resolvedGiftCardId && giftCardDiscount > 0) {
    await recordGiftCardRedemption({
      giftCardId: resolvedGiftCardId,
      orderId: order.id,
      businessId,
      redemptionType: 'order',
      amount: giftCardDiscount,
      balanceBefore: giftCardBalanceBefore,
      balanceAfter: giftCardBalanceAfter,
    });
  }

  // Create notification for business owner
  if (businessOwner?.userId) {
    const fmtTotal = new Intl.NumberFormat('es-ES', { style: 'currency', currency: businessOwner.currency }).format(
      total
    );
    await db.insert(notifications).values({
      userId: businessOwner.userId,
      businessId,
      type: 'new_order',
      title: isReservation ? 'Nueva reserva recibida' : 'Nueva orden recibida',
      description: isReservation
        ? `${customerName.trim()} solicitó una reserva por ${fmtTotal}`
        : `${customerName.trim()} realizó un pedido por ${fmtTotal}`,
      href: `/dashboard/businesses/${businessId}/orders?orderId=${order.id}`,
    });
  }

  for (const productId of affectedProductIds) {
    await syncBundlesForComponent(productId);
  }

  return { success: true, order };
}

/** Rollback stock deductions that already succeeded if a later item fails. */
async function rollbackDeductions(deducted: DeductedInventoryEntry[]): Promise<void> {
  const affectedProductIds = new Set<string>();

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

    affectedProductIds.add(d.productId);
  }

  for (const productId of affectedProductIds) {
    await syncBundlesForComponent(productId);
  }
}
