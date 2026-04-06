'use server';

import { eq, and, asc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { revalidateProductsCache } from '@/lib/cache-revalidation';
import { products, businesses, bundleItems, bundleSlots } from '@/db/schema';

// ── Helpers ──

async function verifyBundleOwnership(productId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [product] = await db
    .select({ id: products.id, businessId: products.businessId, type: products.type })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product || product.type !== 'bundle') return null;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, product.businessId), eq(businesses.userId, session.user.id)))
    .limit(1);

  if (!business) return null;
  return product;
}

// ── Get slots with their items ──

export interface SlotWithItems {
  id: string;
  name: string;
  description: string | null;
  minItems: number;
  maxItems: number | null;
  minAmount: string | null;
  isRequired: boolean;
  sortOrder: number;
  items: {
    id: string;
    itemProductId: string;
    itemProductName: string;
    itemProductPrice: string;
    quantity: number;
    maxQuantity: number | null;
    sortOrder: number;
  }[];
}

export async function getBundleSlotsWithItems(bundleProductId: string): Promise<SlotWithItems[]> {
  const slots = await db
    .select()
    .from(bundleSlots)
    .where(eq(bundleSlots.bundleProductId, bundleProductId))
    .orderBy(asc(bundleSlots.sortOrder));

  if (slots.length === 0) return [];

  const allItems = await db
    .select({
      id: bundleItems.id,
      slotId: bundleItems.slotId,
      itemProductId: bundleItems.itemProductId,
      itemProductName: products.name,
      itemProductPrice: products.price,
      quantity: bundleItems.quantity,
      maxQuantity: bundleItems.maxQuantity,
      sortOrder: bundleItems.sortOrder,
    })
    .from(bundleItems)
    .innerJoin(products, eq(bundleItems.itemProductId, products.id))
    .where(eq(bundleItems.bundleProductId, bundleProductId))
    .orderBy(asc(bundleItems.sortOrder));

  return slots.map((slot) => ({
    id: slot.id,
    name: slot.name,
    description: slot.description,
    minItems: slot.minItems,
    maxItems: slot.maxItems,
    minAmount: slot.minAmount,
    isRequired: slot.isRequired,
    sortOrder: slot.sortOrder,
    items: allItems
      .filter((item) => item.slotId === slot.id)
      .map((item) => ({
        id: item.id,
        itemProductId: item.itemProductId,
        itemProductName: item.itemProductName,
        itemProductPrice: item.itemProductPrice,
        quantity: item.quantity,
        maxQuantity: item.maxQuantity,
        sortOrder: item.sortOrder,
      })),
  }));
}

// ── Create slot ──

interface CreateSlotInput {
  bundleProductId: string;
  name: string;
  description?: string;
  minItems?: number;
  maxItems?: number | null;
  minAmount?: string;
  isRequired?: boolean;
}

export async function createBundleSlotAction(input: CreateSlotInput) {
  try {
    const product = await verifyBundleOwnership(input.bundleProductId);
    if (!product) return { error: 'No autorizado' };

    const existingSlots = await db
      .select({ sortOrder: bundleSlots.sortOrder })
      .from(bundleSlots)
      .where(eq(bundleSlots.bundleProductId, input.bundleProductId))
      .orderBy(asc(bundleSlots.sortOrder));

    const nextOrder = existingSlots.length > 0 ? existingSlots[existingSlots.length - 1].sortOrder + 1 : 0;

    const [slot] = await db
      .insert(bundleSlots)
      .values({
        bundleProductId: input.bundleProductId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        minItems: input.minItems ?? 0,
        maxItems: input.maxItems ?? null,
        minAmount: input.minAmount || null,
        isRequired: input.isRequired ?? false,
        sortOrder: nextOrder,
      })
      .returning();

    revalidateProductsCache(product.businessId);
    return { slot };
  } catch {
    return { error: 'Error al crear el slot.' };
  }
}

// ── Update slot ──

interface UpdateSlotInput {
  slotId: string;
  name: string;
  description?: string;
  minItems?: number;
  maxItems?: number | null;
  minAmount?: string;
  isRequired?: boolean;
}

export async function updateBundleSlotAction(input: UpdateSlotInput) {
  try {
    const [slot] = await db
      .select({ bundleProductId: bundleSlots.bundleProductId })
      .from(bundleSlots)
      .where(eq(bundleSlots.id, input.slotId))
      .limit(1);

    if (!slot) return { error: 'Slot no encontrado' };

    const product = await verifyBundleOwnership(slot.bundleProductId);
    if (!product) return { error: 'No autorizado' };

    await db
      .update(bundleSlots)
      .set({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        minItems: input.minItems ?? 0,
        maxItems: input.maxItems ?? null,
        minAmount: input.minAmount || null,
        isRequired: input.isRequired ?? false,
      })
      .where(eq(bundleSlots.id, input.slotId));

    revalidateProductsCache(product.businessId);
    return { success: true };
  } catch {
    return { error: 'Error al actualizar el slot.' };
  }
}

// ── Delete slot ──

export async function deleteBundleSlotAction(slotId: string) {
  try {
    const [slot] = await db
      .select({ bundleProductId: bundleSlots.bundleProductId })
      .from(bundleSlots)
      .where(eq(bundleSlots.id, slotId))
      .limit(1);

    if (!slot) return { error: 'Slot no encontrado' };

    const product = await verifyBundleOwnership(slot.bundleProductId);
    if (!product) return { error: 'No autorizado' };

    await db.delete(bundleSlots).where(eq(bundleSlots.id, slotId));

    revalidateProductsCache(product.businessId);
    return { success: true };
  } catch {
    return { error: 'Error al eliminar el slot.' };
  }
}

// ── Reorder slots ──

export async function reorderBundleSlotsAction(bundleProductId: string, orderedIds: string[]) {
  try {
    const product = await verifyBundleOwnership(bundleProductId);
    if (!product) return { error: 'No autorizado' };

    await Promise.all(
      orderedIds.map((id, index) => db.update(bundleSlots).set({ sortOrder: index }).where(eq(bundleSlots.id, id)))
    );

    revalidateProductsCache(product.businessId);
    return { success: true };
  } catch {
    return { error: 'Error al reordenar los slots.' };
  }
}

// ── Sync items for a slot ──

interface SlotItemInput {
  itemProductId: string;
  quantity?: number;
  maxQuantity?: number | null;
}

export async function syncSlotItemsAction(bundleProductId: string, slotId: string, items: SlotItemInput[]) {
  try {
    const product = await verifyBundleOwnership(bundleProductId);
    if (!product) return { error: 'No autorizado' };

    // Delete existing items for this slot
    await db
      .delete(bundleItems)
      .where(and(eq(bundleItems.bundleProductId, bundleProductId), eq(bundleItems.slotId, slotId)));

    if (items.length > 0) {
      await db.insert(bundleItems).values(
        items.map((item, index) => ({
          bundleProductId,
          slotId,
          itemProductId: item.itemProductId,
          quantity: item.quantity ?? 1,
          maxQuantity: item.maxQuantity ?? null,
          sortOrder: index,
        }))
      );
    }

    revalidateProductsCache(product.businessId);
    return { success: true };
  } catch {
    return { error: 'Error al sincronizar los items del slot.' };
  }
}
