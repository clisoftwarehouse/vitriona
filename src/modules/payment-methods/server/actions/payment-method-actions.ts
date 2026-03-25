'use server';

import { eq, and, asc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses, paymentMethods } from '@/db/schema';

// ── Helpers ──

async function verifyBusinessOwnership(businessId: string, userId: string) {
  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, userId)))
    .limit(1);
  return business ?? null;
}

// ── Actions ──

export async function getPaymentMethodsAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const business = await verifyBusinessOwnership(businessId, session.user.id);
  if (!business) return [];

  return db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.businessId, businessId))
    .orderBy(asc(paymentMethods.sortOrder));
}

export async function getActivePaymentMethodsAction(businessId: string) {
  return db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.businessId, businessId), eq(paymentMethods.isActive, true)))
    .orderBy(asc(paymentMethods.sortOrder));
}

interface CreatePaymentMethodInput {
  businessId: string;
  name: string;
  instructions?: string;
  fields: { label: string; value: string }[];
  verificationMethod?: 'phone' | 'email' | 'document_id' | 'custom';
  verificationLabel?: string;
}

export async function createPaymentMethodAction(input: CreatePaymentMethodInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const business = await verifyBusinessOwnership(input.businessId, session.user.id);
    if (!business) return { error: 'Negocio no encontrado' };

    if (!input.name.trim()) return { error: 'El nombre es requerido' };

    const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.businessId, input.businessId));

    const [method] = await db
      .insert(paymentMethods)
      .values({
        businessId: input.businessId,
        name: input.name.trim(),
        instructions: input.instructions?.trim() || null,
        fields: input.fields,
        verificationMethod: input.verificationMethod ?? 'phone',
        verificationLabel: input.verificationLabel?.trim() || null,
        sortOrder: existing.length,
      })
      .returning();

    return { success: true, method };
  } catch {
    return { error: 'Error al crear el método de pago.' };
  }
}

interface UpdatePaymentMethodInput {
  id: string;
  name: string;
  instructions?: string;
  fields: { label: string; value: string }[];
  verificationMethod?: 'phone' | 'email' | 'document_id' | 'custom';
  verificationLabel?: string;
}

export async function updatePaymentMethodAction(input: UpdatePaymentMethodInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [method] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, input.id)).limit(1);
    if (!method) return { error: 'Método no encontrado' };

    const business = await verifyBusinessOwnership(method.businessId, session.user.id);
    if (!business) return { error: 'No autorizado' };

    await db
      .update(paymentMethods)
      .set({
        name: input.name.trim(),
        instructions: input.instructions?.trim() || null,
        fields: input.fields,
        verificationMethod: input.verificationMethod ?? 'phone',
        verificationLabel: input.verificationLabel?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethods.id, input.id));

    return { success: true };
  } catch {
    return { error: 'Error al actualizar el método de pago.' };
  }
}

export async function togglePaymentMethodAction(id: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [method] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
    if (!method) return { error: 'Método no encontrado' };

    const business = await verifyBusinessOwnership(method.businessId, session.user.id);
    if (!business) return { error: 'No autorizado' };

    await db.update(paymentMethods).set({ isActive, updatedAt: new Date() }).where(eq(paymentMethods.id, id));

    return { success: true };
  } catch {
    return { error: 'Error al actualizar el método de pago.' };
  }
}

export async function deletePaymentMethodAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [method] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
    if (!method) return { error: 'Método no encontrado' };

    const business = await verifyBusinessOwnership(method.businessId, session.user.id);
    if (!business) return { error: 'No autorizado' };

    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));

    return { success: true };
  } catch {
    return { error: 'Error al eliminar el método de pago.' };
  }
}
