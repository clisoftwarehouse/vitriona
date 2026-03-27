'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { revalidateProductsCache } from '@/lib/cache-revalidation';
import { syncProductStockWithVariants } from '@/lib/sync-product-stock';
import type { UpdateProductFormValues } from '@/modules/products/ui/schemas/product.schemas';
import { products, businesses, catalogProducts, productVariants, productAttributeValues } from '@/db/schema';

export async function updateProductAction(productId: string, values: UpdateProductFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) return { error: 'Producto no encontrado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, product.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    const parsedTags = values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : null;

    // Check if product has variants — if so, stock is managed by variant sync
    const [variantCheck] = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .limit(1);
    const hasVariants = !!variantCheck;

    await db
      .update(products)
      .set({
        categoryId: values.categoryId && values.categoryId !== 'none' ? values.categoryId : null,
        brandId: values.brandId && values.brandId !== 'none' ? values.brandId : null,
        name: values.name,
        slug: generateSlug(values.name),
        description: values.description || null,
        price: values.price,
        compareAtPrice: values.compareAtPrice || null,
        sku: values.sku || null,
        // Don't overwrite stock when product has variants — it's managed by syncProductStockWithVariants
        ...(hasVariants ? {} : { stock: values.type === 'service' ? null : (values.stock ?? 0) }),
        status: values.status,
        isFeatured: values.isFeatured,
        type: values.type ?? 'product',
        weight: values.type === 'service' ? null : values.weight || null,
        dimensions: values.type === 'service' ? null : (values.dimensions ?? null),
        minStock: values.type === 'service' ? null : (values.minStock ?? 0),
        trackInventory: values.type === 'service' ? false : (values.trackInventory ?? true),
        tags: parsedTags,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    // Re-sync stock from variants if they exist
    if (hasVariants) {
      await syncProductStockWithVariants(productId);
    }

    // Sync catalog assignments if provided
    if (values.catalogIds && values.catalogIds.length > 0) {
      await db.delete(catalogProducts).where(eq(catalogProducts.productId, productId));
      await db.insert(catalogProducts).values(
        values.catalogIds.map((catId) => ({
          catalogId: catId,
          productId,
        }))
      );
    }

    // Sync attribute values: delete old, insert new
    if (values.attributeValues) {
      await db.delete(productAttributeValues).where(eq(productAttributeValues.productId, productId));
      const attrEntries = Object.entries(values.attributeValues).filter(([, v]) => v.trim() !== '');
      if (attrEntries.length > 0) {
        await db.insert(productAttributeValues).values(
          attrEntries.map(([attributeId, value]) => ({
            productId,
            attributeId,
            value,
          }))
        );
      }
    }

    revalidateProductsCache(product.businessId);

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al actualizar el producto.' };
  }
}
