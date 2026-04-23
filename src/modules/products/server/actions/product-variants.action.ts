'use server';

import { eq, and, asc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { syncProductStockWithVariants } from '@/lib/sync-product-stock';
import { notDeletedProduct, notDeletedBusiness } from '@/db/soft-delete';
import { syncBundlesForComponent } from '@/modules/products/server/lib/bundles';
import { products, businesses, bundleItems, productVariants } from '@/db/schema';

async function verifyProductOwnership(productId: string, userId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), notDeletedProduct))
    .limit(1);
  if (!product) return null;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, product.businessId), eq(businesses.userId, userId), notDeletedBusiness))
    .limit(1);
  if (!business) return null;

  return product;
}

export async function getProductVariantsAction(productId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const product = await verifyProductOwnership(productId, session.user.id);
  if (!product) return [];

  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(asc(productVariants.sortOrder));
}

export async function addProductVariantAction(
  productId: string,
  values: { name: string; sku?: string; price?: string; stock: number; options: Record<string, string> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const product = await verifyProductOwnership(productId, session.user.id);
    if (!product) return { error: 'Producto no encontrado' };
    if (product.type !== 'product') return { error: 'Solo los productos físicos pueden tener variantes.' };

    const [bundleReference] = await db
      .select({ id: bundleItems.id })
      .from(bundleItems)
      .where(eq(bundleItems.itemProductId, product.id))
      .limit(1);
    if (bundleReference) {
      return { error: 'No puedes agregar variantes a un producto que forma parte de un paquete.' };
    }

    const existing = await db
      .select({ sortOrder: productVariants.sortOrder })
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.sortOrder));

    const nextOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        name: values.name,
        sku: values.sku || null,
        price: values.price || null,
        stock: values.stock,
        options: values.options,
        sortOrder: nextOrder,
      })
      .returning();

    await syncProductStockWithVariants(productId);
    await syncBundlesForComponent(productId);
    return { success: true, variant };
  } catch {
    return { error: 'Error al crear la variante.' };
  }
}

export async function updateProductVariantAction(
  variantId: string,
  values: {
    name: string;
    sku?: string;
    price?: string;
    stock: number;
    options: Record<string, string>;
    isActive: boolean;
    imageUrl?: string;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
    if (!variant) return { error: 'Variante no encontrada' };

    const product = await verifyProductOwnership(variant.productId, session.user.id);
    if (!product) return { error: 'No autorizado' };
    if (product.type !== 'product') return { error: 'Solo los productos físicos pueden tener variantes.' };

    await db
      .update(productVariants)
      .set({
        name: values.name,
        sku: values.sku || null,
        price: values.price || null,
        stock: values.stock,
        imageUrl: values.imageUrl || null,
        options: values.options,
        isActive: values.isActive,
      })
      .where(eq(productVariants.id, variantId));

    await syncProductStockWithVariants(variant.productId);
    await syncBundlesForComponent(variant.productId);
    return { success: true };
  } catch {
    return { error: 'Error al actualizar la variante.' };
  }
}

export async function deleteProductVariantAction(variantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
    if (!variant) return { error: 'Variante no encontrada' };

    const product = await verifyProductOwnership(variant.productId, session.user.id);
    if (!product) return { error: 'No autorizado' };

    await db.delete(productVariants).where(eq(productVariants.id, variantId));

    await syncProductStockWithVariants(variant.productId);
    await syncBundlesForComponent(variant.productId);
    return { success: true };
  } catch {
    return { error: 'Error al eliminar la variante.' };
  }
}
