'use server';

import { eq, and, asc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses, productAttributes } from '@/db/schema';
import { generateSlug } from '@/modules/businesses/lib/slug';

// ── Types ──

interface CreateAttributeInput {
  name: string;
  type: 'text' | 'number' | 'select' | 'color' | 'boolean';
  options?: string[];
  isRequired?: boolean;
}

interface UpdateAttributeInput extends CreateAttributeInput {
  sortOrder?: number;
}

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

export async function getAttributesAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const business = await verifyBusinessOwnership(businessId, session.user.id);
  if (!business) return [];

  return db
    .select()
    .from(productAttributes)
    .where(eq(productAttributes.businessId, businessId))
    .orderBy(asc(productAttributes.sortOrder));
}

export async function createAttributeAction(businessId: string, values: CreateAttributeInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const business = await verifyBusinessOwnership(businessId, session.user.id);
    if (!business) return { error: 'No autorizado' };

    const [attribute] = await db
      .insert(productAttributes)
      .values({
        businessId,
        name: values.name,
        slug: generateSlug(values.name),
        type: values.type,
        options: values.type === 'select' || values.type === 'color' ? (values.options ?? []) : null,
        isRequired: values.isRequired ?? false,
      })
      .returning();

    return { success: true, attribute };
  } catch {
    return { error: 'Error al crear el atributo.' };
  }
}

export async function updateAttributeAction(attributeId: string, values: UpdateAttributeInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [attribute] = await db.select().from(productAttributes).where(eq(productAttributes.id, attributeId)).limit(1);
    if (!attribute) return { error: 'Atributo no encontrado' };

    const business = await verifyBusinessOwnership(attribute.businessId, session.user.id);
    if (!business) return { error: 'No autorizado' };

    await db
      .update(productAttributes)
      .set({
        name: values.name,
        slug: generateSlug(values.name),
        type: values.type,
        options: values.type === 'select' || values.type === 'color' ? (values.options ?? []) : null,
        isRequired: values.isRequired ?? false,
        sortOrder: values.sortOrder ?? attribute.sortOrder,
      })
      .where(eq(productAttributes.id, attributeId));

    return { success: true };
  } catch {
    return { error: 'Error al actualizar el atributo.' };
  }
}

export async function deleteAttributeAction(attributeId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [attribute] = await db.select().from(productAttributes).where(eq(productAttributes.id, attributeId)).limit(1);
    if (!attribute) return { error: 'Atributo no encontrado' };

    const business = await verifyBusinessOwnership(attribute.businessId, session.user.id);
    if (!business) return { error: 'No autorizado' };

    await db.delete(productAttributes).where(eq(productAttributes.id, attributeId));

    return { success: true };
  } catch {
    return { error: 'Error al eliminar el atributo.' };
  }
}
