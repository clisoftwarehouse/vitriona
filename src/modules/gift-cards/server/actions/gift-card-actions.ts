'use server';

import { eq, and, desc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { giftCards, businesses } from '@/db/schema';
import { resend, EMAIL_FROM } from '@/modules/auth/server/email/resend';
import { giftCardEmailTemplate } from '@/modules/auth/server/email/templates/gift-card.template';

/* ─── Types ─── */

export interface CreateGiftCardInput {
  businessId: string;
  code: string;
  type: 'fixed' | 'percentage' | 'product';
  initialValue: number;
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
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, userId)))
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
    .where(eq(giftCards.businessId, businessId))
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
    if (input.initialValue <= 0) return { error: 'El valor debe ser mayor a 0' };
    if (input.type === 'percentage' && input.initialValue > 100) {
      return { error: 'El porcentaje no puede ser mayor a 100' };
    }

    // Check for duplicate code within this business
    const [existing] = await db
      .select({ id: giftCards.id })
      .from(giftCards)
      .where(and(eq(giftCards.businessId, input.businessId), eq(giftCards.code, code)))
      .limit(1);
    if (existing) return { error: 'Ya existe una gift card con ese código' };

    const recipientEmail = input.recipientEmail?.trim() || null;

    await db.insert(giftCards).values({
      businessId: input.businessId,
      code,
      type: input.type,
      initialValue: String(input.initialValue),
      currentBalance: String(input.initialValue),
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
        await resend.emails.send({
          from: EMAIL_FROM,
          to: recipientEmail,
          subject: `Recibiste una Gift Card de ${biz.name}`,
          html: giftCardEmailTemplate({
            recipientName: input.recipientName,
            senderName: input.senderName,
            businessName: biz.name,
            code,
            type: input.type,
            value: input.initialValue,
            message: input.message,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          }),
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

    const [card] = await db.select().from(giftCards).where(eq(giftCards.id, giftCardId)).limit(1);
    if (!card) return { error: 'Gift card no encontrada' };

    const biz = await verifyOwnership(card.businessId, session.user.id);
    if (!biz) return { error: 'No autorizado' };

    await db.update(giftCards).set({ isActive }).where(eq(giftCards.id, giftCardId));

    return { success: true };
  } catch {
    return { error: 'Error al actualizar la gift card' };
  }
}

/* ─── Dashboard: delete gift card ─── */

export async function deleteGiftCardAction(giftCardId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [card] = await db.select().from(giftCards).where(eq(giftCards.id, giftCardId)).limit(1);
    if (!card) return { error: 'Gift card no encontrada' };

    const biz = await verifyOwnership(card.businessId, session.user.id);
    if (!biz) return { error: 'No autorizado' };

    await db.delete(giftCards).where(eq(giftCards.id, giftCardId));

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
        and(eq(giftCards.businessId, businessId), eq(giftCards.code, normalizedCode), eq(giftCards.isActive, true))
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

    switch (card.type) {
      case 'fixed':
        discount = Math.min(balance, discountBase);
        break;
      case 'percentage':
        discount = (discountBase * value) / 100;
        break;
      case 'product':
        discount = Math.min(balance, discountBase);
        break;
    }

    discount = Math.round(discount * 100) / 100;

    return {
      data: {
        giftCardId: card.id,
        code: card.code,
        type: card.type,
        discount,
        currentBalance: balance,
        applicableProductIds: applicableIds,
      },
    };
  } catch {
    return { error: 'Error al validar la gift card' };
  }
}

/* ─── Internal: deduct gift card balance (called after successful order) ─── */

export async function deductGiftCardBalance(giftCardId: string, amount: number) {
  const [card] = await db.select().from(giftCards).where(eq(giftCards.id, giftCardId)).limit(1);
  if (!card) return;

  const currentBalance = parseFloat(card.currentBalance);
  const newBalance = Math.max(0, currentBalance - amount);

  await db
    .update(giftCards)
    .set({
      currentBalance: String(newBalance),
      redeemedAt: newBalance === 0 ? new Date() : card.redeemedAt,
    })
    .where(eq(giftCards.id, giftCardId));
}
