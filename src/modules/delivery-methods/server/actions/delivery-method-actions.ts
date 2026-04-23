'use server';

import { eq, and, asc, count } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { getPlanLimits } from '@/lib/plan-limits';
import { businesses, deliveryMethods } from '@/db/schema';

// ── Helpers ──

async function verifyBusinessOwnership(businessId: string, userId: string) {
  const [business] = await db
    .select({
      id: businesses.id,
      plan: businesses.plan,
      customMaxProducts: businesses.customMaxProducts,
      customMaxVisitsPerMonth: businesses.customMaxVisitsPerMonth,
      customMaxPaymentMethods: businesses.customMaxPaymentMethods,
      customMaxDeliveryMethods: businesses.customMaxDeliveryMethods,
    })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, userId)))
    .limit(1);
  return business ?? null;
}

// ── Actions ──

export async function getDeliveryMethodsAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const business = await verifyBusinessOwnership(businessId, session.user.id);
  if (!business) return [];

  return db
    .select()
    .from(deliveryMethods)
    .where(eq(deliveryMethods.businessId, businessId))
    .orderBy(asc(deliveryMethods.sortOrder));
}

export async function getActiveDeliveryMethodsAction(businessId: string) {
  return db
    .select()
    .from(deliveryMethods)
    .where(and(eq(deliveryMethods.businessId, businessId), eq(deliveryMethods.isActive, true)))
    .orderBy(asc(deliveryMethods.sortOrder));
}

interface CreateDeliveryMethodInput {
  businessId: string;
  name: string;
  description?: string;
  price: number;
  estimatedTime?: string;
}

export async function createDeliveryMethodAction(input: CreateDeliveryMethodInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const business = await verifyBusinessOwnership(input.businessId, session.user.id);
    if (!business) return { error: 'Negocio no encontrado' };

    if (!input.name.trim()) return { error: 'El nombre es requerido' };

    // ── Plan-based limit ──
    const limits = getPlanLimits(business.plan, business);
    const [{ total }] = await db
      .select({ total: count() })
      .from(deliveryMethods)
      .where(eq(deliveryMethods.businessId, input.businessId));

    if (total >= limits.maxDeliveryMethods) {
      return {
        error: `Has alcanzado el límite de ${limits.maxDeliveryMethods} método(s) de entrega de tu plan. Mejora tu plan para agregar más.`,
      };
    }

    const existing = await db.select().from(deliveryMethods).where(eq(deliveryMethods.businessId, input.businessId));

    const [method] = await db
      .insert(deliveryMethods)
      .values({
        businessId: input.businessId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        price: input.price.toFixed(2),
        estimatedTime: input.estimatedTime?.trim() || null,
        sortOrder: existing.length,
      })
      .returning();

    return { success: true, method };
  } catch {
    return { error: 'Error al crear el método de entrega.' };
  }
}

interface UpdateDeliveryMethodInput {
  id: string;
  name: string;
  description?: string;
  price: number;
  estimatedTime?: string;
}

export async function updateDeliveryMethodAction(input: UpdateDeliveryMethodInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [method] = await db.select().from(deliveryMethods).where(eq(deliveryMethods.id, input.id)).limit(1);
    if (!method) return { error: 'Método no encontrado' };

    const business = await verifyBusinessOwnership(method.businessId, session.user.id);
    if (!business) return { error: 'No autorizado' };

    await db
      .update(deliveryMethods)
      .set({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        price: input.price.toFixed(2),
        estimatedTime: input.estimatedTime?.trim() || null,
      })
      .where(eq(deliveryMethods.id, input.id));

    return { success: true };
  } catch {
    return { error: 'Error al actualizar el método de entrega.' };
  }
}

export async function toggleDeliveryMethodAction(id: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [method] = await db.select().from(deliveryMethods).where(eq(deliveryMethods.id, id)).limit(1);
    if (!method) return { error: 'Método no encontrado' };

    const business = await verifyBusinessOwnership(method.businessId, session.user.id);
    if (!business) return { error: 'No autorizado' };

    await db.update(deliveryMethods).set({ isActive }).where(eq(deliveryMethods.id, id));

    return { success: true };
  } catch {
    return { error: 'Error al actualizar el método de entrega.' };
  }
}

export async function deleteDeliveryMethodAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [method] = await db.select().from(deliveryMethods).where(eq(deliveryMethods.id, id)).limit(1);
    if (!method) return { error: 'Método no encontrado' };

    const business = await verifyBusinessOwnership(method.businessId, session.user.id);
    if (!business) return { error: 'No autorizado' };

    await db.delete(deliveryMethods).where(eq(deliveryMethods.id, id));

    return { success: true };
  } catch {
    return { error: 'Error al eliminar el método de entrega.' };
  }
}
