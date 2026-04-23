'use server';

import { eq, and, gte, sql, desc, inArray } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { resend, EMAIL_FROM } from '@/modules/auth/server/email/resend';
import { products, giftCards, businesses, giftCardRedemptions } from '@/db/schema';
import { notDeletedProduct, notDeletedGiftCard, notDeletedBusiness } from '@/db/soft-delete';
import { giftCardEmailTemplate } from '@/modules/auth/server/email/templates/gift-card.template';

/* ─── Types ─── */

export type GiftCardType = 'fixed' | 'percentage' | 'product' | 'free_product';

export interface CreateGiftCardInput {
  businessId: string;
  code: string;
  type: GiftCardType;
  initialValue: number;
  maxDiscount?: number;
  quantity?: number;
  applicableProductIds?: string[];
  recipientName?: string;
  recipientEmail?: string;
  senderName?: string;
  message?: string;
  expiresAt?: string;
}

export interface CartItemForGiftCard {
  productId: string;
  price: number;
  quantity: number;
}

/* ─── Helpers ─── */

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let s = 0; s < 4; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(seg);
  }
  return segments.join('-');
}

async function verifyOwnership(businessId: string, userId: string) {
  const [biz] = await db
    .select({ id: businesses.id, name: businesses.name })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, userId), notDeletedBusiness))
    .limit(1);
  return biz;
}

/* ─── Dashboard: list gift cards ─── */

export async function getGiftCardsAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado', data: [] };

  const biz = await verifyOwnership(businessId, session.user.id);
  if (!biz) return { error: 'No autorizado', data: [] };

  const rows = await db
    .select()
    .from(giftCards)
    .where(and(eq(giftCards.businessId, businessId), notDeletedGiftCard))
    .orderBy(desc(giftCards.createdAt));

  return { data: rows };
}

/* ─── Dashboard: create gift card ─── */

export async function createGiftCardAction(input: CreateGiftCardInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const biz = await verifyOwnership(input.businessId, session.user.id);
    if (!biz) return { error: 'No autorizado' };

    const code = input.code?.trim().toUpperCase() || generateGiftCardCode();

    if (input.type === 'free_product') {
      if (!input.applicableProductIds || input.applicableProductIds.length === 0) {
        return { error: 'Selecciona al menos un producto' };
      }
      if (input.quantity == null || input.quantity <= 0 || !Number.isInteger(input.quantity)) {
        return { error: 'La cantidad debe ser un entero mayor a 0' };
      }
    } else {
      if (input.initialValue <= 0) return { error: 'El valor debe ser mayor a 0' };
      if (input.type === 'percentage' && input.initialValue > 100) {
        return { error: 'El porcentaje no puede ser mayor a 100' };
      }
    }
    if (input.maxDiscount != null && input.maxDiscount <= 0) {
      return { error: 'El tope de descuento debe ser mayor a 0' };
    }
    // maxDiscount only makes sense for percentage cards (caps the discount amount).
    const maxDiscount = input.type === 'percentage' ? (input.maxDiscount ?? null) : null;
    const quantity = input.type === 'free_product' ? input.quantity! : null;
    // For free_product, initialValue is informational (stored as 0); quantity is the source of truth.
    const initialValue = input.type === 'free_product' ? 0 : input.initialValue;

    // Check for duplicate code within this business (ignores soft-deleted)
    const [existing] = await db
      .select({ id: giftCards.id })
      .from(giftCards)
      .where(and(eq(giftCards.businessId, input.businessId), eq(giftCards.code, code), notDeletedGiftCard))
      .limit(1);
    if (existing) return { error: 'Ya existe una gift card con ese código' };

    const recipientEmail = input.recipientEmail?.trim() || null;

    await db.insert(giftCards).values({
      businessId: input.businessId,
      code,
      type: input.type,
      initialValue: String(initialValue),
      currentBalance: String(initialValue),
      maxDiscount: maxDiscount != null ? String(maxDiscount) : null,
      quantity,
      applicableProductIds:
        input.applicableProductIds && input.applicableProductIds.length > 0 ? input.applicableProductIds : null,
      recipientName: input.recipientName?.trim() || null,
      recipientEmail,
      senderName: input.senderName?.trim() || null,
      message: input.message?.trim() || null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    });

    if (recipientEmail) {
      try {
        const html = giftCardEmailTemplate({
          recipientName: input.recipientName,
          senderName: input.senderName,
          businessName: biz.name,
          code,
          type: input.type,
          value: initialValue,
          quantity,
          message: input.message,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        });
        await resend.emails.send({
          from: EMAIL_FROM,
          to: recipientEmail,
          subject: `Recibiste una Gift Card de ${biz.name}`,
          html,
        });

        return { success: true, code, emailSent: true };
      } catch (error) {
        console.error('Error al enviar gift card por correo:', error);
        return {
          success: true,
          code,
          emailSent: false,
          emailError: 'La gift card se creo, pero no se pudo enviar el correo.',
        };
      }
    }

    return { success: true, code, emailSent: false };
  } catch {
    return { error: 'Error al crear la gift card' };
  }
}

/* ─── Dashboard: toggle gift card active state ─── */

export async function toggleGiftCardAction(giftCardId: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [card] = await db
      .select()
      .from(giftCards)
      .where(and(eq(giftCards.id, giftCardId), notDeletedGiftCard))
      .limit(1);
    if (!card) return { error: 'Gift card no encontrada' };

    const biz = await verifyOwnership(card.businessId, session.user.id);
    if (!biz) return { error: 'No autorizado' };

    await db.update(giftCards).set({ isActive }).where(eq(giftCards.id, giftCardId));

    return { success: true };
  } catch {
    return { error: 'Error al actualizar la gift card' };
  }
}

/* ─── Dashboard: delete gift card (soft-delete) ─── */

export async function deleteGiftCardAction(giftCardId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [card] = await db
      .select()
      .from(giftCards)
      .where(and(eq(giftCards.id, giftCardId), notDeletedGiftCard))
      .limit(1);
    if (!card) return { error: 'Gift card no encontrada' };

    const biz = await verifyOwnership(card.businessId, session.user.id);
    if (!biz) return { error: 'No autorizado' };

    await db
      .update(giftCards)
      .set({ deletedAt: new Date(), deletedBy: session.user.id, isActive: false })
      .where(eq(giftCards.id, giftCardId));

    return { success: true };
  } catch {
    return { error: 'Error al eliminar la gift card' };
  }
}

/* ─── Public: validate gift card at checkout ─── */

export async function validateGiftCardAction(
  businessId: string,
  code: string,
  orderSubtotal: number,
  cartItems?: CartItemForGiftCard[]
) {
  try {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return { error: 'Ingresa un código de gift card' };

    const [card] = await db
      .select()
      .from(giftCards)
      .where(
        and(
          eq(giftCards.businessId, businessId),
          eq(giftCards.code, normalizedCode),
          eq(giftCards.isActive, true),
          notDeletedGiftCard
        )
      )
      .limit(1);

    if (!card) return { error: 'Gift card no válida' };

    const now = new Date();
    if (card.expiresAt && now > card.expiresAt) return { error: 'Esta gift card ha expirado' };

    const balance = parseFloat(card.currentBalance);
    if (card.type === 'fixed' && balance <= 0) return { error: 'Esta gift card no tiene saldo disponible' };

    // Determine base amount for product-specific cards
    const applicableIds = card.applicableProductIds as string[] | null;
    let discountBase = orderSubtotal;

    if (card.type === 'product' && applicableIds && applicableIds.length > 0 && cartItems) {
      const applicableTotal = cartItems
        .filter((item) => applicableIds.includes(item.productId))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (applicableTotal === 0) {
        return { error: 'Esta gift card no aplica a los productos en tu carrito' };
      }
      discountBase = applicableTotal;
    }

    let discount = 0;
    const value = parseFloat(card.initialValue);
    const maxDiscount = card.maxDiscount != null ? parseFloat(card.maxDiscount) : null;

    switch (card.type) {
      case 'fixed':
        discount = Math.min(balance, discountBase);
        break;
      case 'percentage':
        discount = (discountBase * value) / 100;
        if (maxDiscount != null) discount = Math.min(discount, maxDiscount);
        break;
      case 'product':
        discount = Math.min(balance, discountBase);
        break;
      case 'free_product': {
        // Cover up to N full units of applicable products, picking cheapest-first to be fair to the customer.
        if (!applicableIds || applicableIds.length === 0 || !cartItems) {
          return { error: 'Esta gift card no aplica a los productos en tu carrito' };
        }
        const qty = card.quantity ?? 0;
        if (qty <= 0) return { error: 'Gift card inválida' };

        const unitPrices: number[] = [];
        for (const item of cartItems) {
          if (!applicableIds.includes(item.productId)) continue;
          for (let i = 0; i < item.quantity; i++) unitPrices.push(item.price);
        }
        if (unitPrices.length === 0) {
          return { error: 'Esta gift card no aplica a los productos en tu carrito' };
        }
        unitPrices.sort((a, b) => b - a); // most expensive first benefits customer
        discount = unitPrices.slice(0, qty).reduce((sum, p) => sum + p, 0);
        break;
      }
    }

    discount = Math.round(discount * 100) / 100;

    return {
      data: {
        giftCardId: card.id,
        code: card.code,
        type: card.type,
        discount,
        currentBalance: balance,
        maxDiscount,
        quantity: card.quantity,
        applicableProductIds: applicableIds,
      },
    };
  } catch {
    return { error: 'Error al validar la gift card' };
  }
}

/* ─── Internal: deduct gift card balance (called after successful order) ─── */

export interface DeductGiftCardResult {
  success: boolean;
  error?: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

export async function deductGiftCardBalance(giftCardId: string, amount: number): Promise<DeductGiftCardResult> {
  const [card] = await db
    .select()
    .from(giftCards)
    .where(and(eq(giftCards.id, giftCardId), notDeletedGiftCard))
    .limit(1);
  if (!card) return { success: false, error: 'Gift card no encontrada' };
  if (!card.isActive) return { success: false, error: 'Gift card inactiva' };

  const balanceBefore = parseFloat(card.currentBalance);

  // Percentage and free_product cards have no balance semantics: treat redemption as single-use.
  if (card.type === 'percentage' || card.type === 'free_product') {
    const [updated] = await db
      .update(giftCards)
      .set({ isActive: false, redeemedAt: new Date() })
      .where(and(eq(giftCards.id, giftCardId), eq(giftCards.isActive, true)))
      .returning({ id: giftCards.id });
    return updated
      ? { success: true, balanceBefore, balanceAfter: balanceBefore }
      : { success: false, error: 'Gift card ya fue redimida' };
  }

  const amountStr = amount.toFixed(2);
  const [updated] = await db
    .update(giftCards)
    .set({
      currentBalance: sql`${giftCards.currentBalance} - ${amountStr}`,
      redeemedAt: sql`CASE WHEN ${giftCards.currentBalance} - ${amountStr} <= 0 THEN NOW() ELSE ${giftCards.redeemedAt} END`,
    })
    .where(and(eq(giftCards.id, giftCardId), gte(giftCards.currentBalance, amountStr)))
    .returning({ id: giftCards.id, currentBalance: giftCards.currentBalance });

  if (!updated) return { success: false, error: 'Saldo insuficiente en gift card' };

  return {
    success: true,
    balanceBefore,
    balanceAfter: parseFloat(updated.currentBalance),
  };
}

/* ─── Internal: audit redemption record (called after order insert) ─── */

export async function recordGiftCardRedemption(params: {
  giftCardId: string;
  businessId: string;
  amount: number;
  orderId?: string | null;
  redemptionType?: 'order' | 'manual';
  redeemedBy?: string | null;
  notes?: string | null;
  balanceBefore?: number;
  balanceAfter?: number;
}) {
  try {
    await db.insert(giftCardRedemptions).values({
      giftCardId: params.giftCardId,
      orderId: params.orderId ?? null,
      businessId: params.businessId,
      redemptionType: params.redemptionType ?? 'order',
      redeemedBy: params.redeemedBy ?? null,
      notes: params.notes?.trim() || null,
      amount: params.amount.toFixed(2),
      balanceBefore: params.balanceBefore != null ? params.balanceBefore.toFixed(2) : null,
      balanceAfter: params.balanceAfter != null ? params.balanceAfter.toFixed(2) : null,
    });
  } catch (err) {
    // Best-effort audit; redemption deduction already succeeded atomically.
    console.error('[gift-card] failed to record redemption', err);
  }
}

/* ─── Dashboard: manual redemption (in-person, no order) ─── */

export interface ManualRedeemInput {
  giftCardId: string;
  amount?: number;
  notes?: string;
}

export async function redeemGiftCardManuallyAction(input: ManualRedeemInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [card] = await db
      .select()
      .from(giftCards)
      .where(and(eq(giftCards.id, input.giftCardId), notDeletedGiftCard))
      .limit(1);
    if (!card) return { error: 'Gift card no encontrada' };

    const biz = await verifyOwnership(card.businessId, session.user.id);
    if (!biz) return { error: 'No autorizado' };

    if (!card.isActive) return { error: 'Gift card inactiva' };
    if (card.expiresAt && new Date() > card.expiresAt) return { error: 'Esta gift card ha expirado' };

    const isSingleUse = card.type === 'percentage' || card.type === 'free_product';

    // Determine deduction amount
    let amountToDeduct: number;
    if (isSingleUse) {
      // Single-use: deduct 0 (the deduct fn marks inactive), audit records the value on record
      amountToDeduct = 0;
    } else {
      const balance = parseFloat(card.currentBalance);
      if (balance <= 0) return { error: 'Esta gift card no tiene saldo disponible' };
      if (input.amount == null || input.amount <= 0) return { error: 'Ingresa el monto a canjear' };
      if (input.amount > balance) return { error: `El monto supera el saldo disponible ($${balance.toFixed(2)})` };
      amountToDeduct = Math.round(input.amount * 100) / 100;
    }

    const redemption = await deductGiftCardBalance(input.giftCardId, amountToDeduct);
    if (!redemption.success) return { error: redemption.error ?? 'No se pudo canjear' };

    // Audit: percentage records initialValue, free_product records 0 (quantity lives on the card), others record deducted.
    let auditAmount: number;
    if (card.type === 'percentage') auditAmount = parseFloat(card.initialValue);
    else if (card.type === 'free_product') auditAmount = 0;
    else auditAmount = amountToDeduct;

    await recordGiftCardRedemption({
      giftCardId: card.id,
      businessId: card.businessId,
      amount: auditAmount,
      orderId: null,
      redemptionType: 'manual',
      redeemedBy: session.user.id,
      notes: input.notes,
      balanceBefore: redemption.balanceBefore,
      balanceAfter: redemption.balanceAfter,
    });

    return {
      success: true,
      balanceAfter: redemption.balanceAfter,
      deactivated: isSingleUse,
    };
  } catch (err) {
    console.error('[gift-card] manual redemption failed', err);
    return { error: 'Error al canjear la gift card' };
  }
}

/* ─── Public: lookup a gift card by code for redemption preview (auth required) ─── */

export async function getGiftCardForRedemptionAction(code: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return { error: 'Código inválido' };

    const [card] = await db
      .select()
      .from(giftCards)
      .where(and(eq(giftCards.code, normalizedCode), notDeletedGiftCard))
      .limit(1);
    if (!card) return { error: 'Gift card no encontrada' };

    const biz = await verifyOwnership(card.businessId, session.user.id);
    if (!biz) return { error: 'No autorizado' };

    const applicableIds = card.applicableProductIds as string[] | null;
    let applicableProducts: { id: string; name: string; price: string }[] = [];
    if (applicableIds && applicableIds.length > 0) {
      applicableProducts = await db
        .select({ id: products.id, name: products.name, price: products.price })
        .from(products)
        .where(and(inArray(products.id, applicableIds), notDeletedProduct));
    }

    return { data: { ...card, applicableProducts } };
  } catch {
    return { error: 'Error al buscar la gift card' };
  }
}

/* ─── Dashboard: list redemptions for a gift card ─── */

export async function getGiftCardRedemptionsAction(giftCardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado', data: [] };

  const [card] = await db
    .select()
    .from(giftCards)
    .where(and(eq(giftCards.id, giftCardId), notDeletedGiftCard))
    .limit(1);
  if (!card) return { error: 'Gift card no encontrada', data: [] };

  const biz = await verifyOwnership(card.businessId, session.user.id);
  if (!biz) return { error: 'No autorizado', data: [] };

  const rows = await db
    .select()
    .from(giftCardRedemptions)
    .where(eq(giftCardRedemptions.giftCardId, giftCardId))
    .orderBy(desc(giftCardRedemptions.redeemedAt));

  return { data: rows };
}
