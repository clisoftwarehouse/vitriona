'use server';

import { eq, and, sql, desc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { coupons, businesses } from '@/db/schema';
import { notDeletedCoupon, notDeletedBusiness } from '@/db/soft-delete';

/* ─── Types ─── */

export interface CreateCouponInput {
  businessId: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicableProductIds?: string[];
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startsAt?: string;
  expiresAt?: string;
}

export interface CartItemForCoupon {
  productId: string;
  price: number;
  quantity: number;
}

/* ─── Helpers ─── */

async function verifyOwnership(businessId: string, userId: string) {
  const [biz] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, userId), notDeletedBusiness))
    .limit(1);
  return biz;
}

/* ─── Dashboard: list coupons ─── */

export async function getCouponsAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado', data: [] };

  const biz = await verifyOwnership(businessId, session.user.id);
  if (!biz) return { error: 'No autorizado', data: [] };

  const rows = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.businessId, businessId), notDeletedCoupon))
    .orderBy(desc(coupons.createdAt));

  return { data: rows };
}

/* ─── Dashboard: create coupon ─── */

export async function createCouponAction(input: CreateCouponInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const biz = await verifyOwnership(input.businessId, session.user.id);
    if (!biz) return { error: 'No autorizado' };

    const code = input.code.trim().toUpperCase();
    if (!code) return { error: 'El código es requerido' };
    if (input.discountValue <= 0) return { error: 'El valor del descuento debe ser mayor a 0' };
    if (input.discountType === 'percentage' && input.discountValue > 100) {
      return { error: 'El porcentaje no puede ser mayor a 100' };
    }

    // Check for duplicate code within this business (ignores soft-deleted)
    const [existing] = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(and(eq(coupons.businessId, input.businessId), eq(coupons.code, code), notDeletedCoupon))
      .limit(1);
    if (existing) return { error: 'Ya existe un cupón con ese código' };

    await db.insert(coupons).values({
      businessId: input.businessId,
      code,
      description: input.description?.trim() || null,
      discountType: input.discountType,
      discountValue: String(input.discountValue),
      applicableProductIds:
        input.applicableProductIds && input.applicableProductIds.length > 0 ? input.applicableProductIds : null,
      minOrderAmount: input.minOrderAmount ? String(input.minOrderAmount) : null,
      maxDiscount: input.maxDiscount ? String(input.maxDiscount) : null,
      usageLimit: input.usageLimit || null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    });

    return { success: true };
  } catch {
    return { error: 'Error al crear el cupón' };
  }
}

/* ─── Dashboard: toggle coupon active state ─── */

export async function toggleCouponAction(couponId: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.id, couponId), notDeletedCoupon))
      .limit(1);
    if (!coupon) return { error: 'Cupón no encontrado' };

    const biz = await verifyOwnership(coupon.businessId, session.user.id);
    if (!biz) return { error: 'No autorizado' };

    await db.update(coupons).set({ isActive }).where(eq(coupons.id, couponId));

    return { success: true };
  } catch {
    return { error: 'Error al actualizar el cupón' };
  }
}

/* ─── Dashboard: delete coupon (soft-delete) ─── */

export async function deleteCouponAction(couponId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.id, couponId), notDeletedCoupon))
      .limit(1);
    if (!coupon) return { error: 'Cupón no encontrado' };

    const biz = await verifyOwnership(coupon.businessId, session.user.id);
    if (!biz) return { error: 'No autorizado' };

    await db
      .update(coupons)
      .set({ deletedAt: new Date(), deletedBy: session.user.id, isActive: false })
      .where(eq(coupons.id, couponId));

    return { success: true };
  } catch {
    return { error: 'Error al eliminar el cupón' };
  }
}

/* ─── Public: validate coupon at checkout ─── */

export async function validateCouponAction(
  businessId: string,
  code: string,
  orderSubtotal: number,
  cartItems?: CartItemForCoupon[]
) {
  try {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return { error: 'Ingresa un código de cupón' };

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.businessId, businessId),
          eq(coupons.code, normalizedCode),
          eq(coupons.isActive, true),
          notDeletedCoupon
        )
      )
      .limit(1);

    if (!coupon) return { error: 'Cupón no válido' };

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) return { error: 'Este cupón aún no está activo' };
    if (coupon.expiresAt && now > coupon.expiresAt) return { error: 'Este cupón ha expirado' };
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { error: 'Este cupón ha alcanzado su límite de uso' };
    }

    const minOrder = coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount) : 0;
    if (orderSubtotal < minOrder) {
      return { error: `El pedido mínimo para este cupón es ${minOrder.toFixed(2)}` };
    }

    // Determine the base amount for discount calculation
    const applicableIds = coupon.applicableProductIds as string[] | null;
    let discountBase = orderSubtotal;

    if (applicableIds && applicableIds.length > 0 && cartItems) {
      // Only apply discount to matching products
      const applicableTotal = cartItems
        .filter((item) => applicableIds.includes(item.productId))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (applicableTotal === 0) {
        return { error: 'Este cupón no aplica a los productos en tu carrito' };
      }
      discountBase = applicableTotal;
    }

    let discount = 0;
    const value = parseFloat(coupon.discountValue);

    if (coupon.discountType === 'percentage') {
      discount = (discountBase * value) / 100;
      const maxDisc = coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : Infinity;
      discount = Math.min(discount, maxDisc);
    } else {
      discount = Math.min(value, discountBase);
    }

    discount = Math.round(discount * 100) / 100;

    return {
      data: {
        couponId: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: value,
        discount,
        description: coupon.description,
        applicableProductIds: applicableIds,
      },
    };
  } catch {
    return { error: 'Error al validar el cupón' };
  }
}

/* ─── Internal: increment coupon usage (called after successful order) ─── */

export async function incrementCouponUsage(couponId: string) {
  await db
    .update(coupons)
    .set({ usageCount: sql`${coupons.usageCount} + 1` })
    .where(eq(coupons.id, couponId));
}
