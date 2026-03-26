'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { revalidateProductsCache } from '@/lib/cache-revalidation';
import type { CreateProductFormValues } from '@/modules/products/ui/schemas/product.schemas';
import { catalogs, products, businesses, catalogProducts, productAttributeValues } from '@/db/schema';

export async function createProductAction(
  catalogId: string | undefined,
  values: CreateProductFormValues,
  businessIdParam?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    let businessId: string;

    if (catalogId) {
      const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1);
      if (!catalog) return { error: 'Catálogo no encontrado' };
      businessId = catalog.businessId;
    } else if (values.catalogIds?.length) {
      const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, values.catalogIds[0])).limit(1);
      if (!catalog) return { error: 'Catálogo no encontrado' };
      businessId = catalog.businessId;
    } else if (businessIdParam) {
      businessId = businessIdParam;
    } else {
      return { error: 'Se requiere al menos un catálogo o businessId.' };
    }

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    const parsedTags = values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : null;

    const catalogIds = values.catalogIds?.length ? values.catalogIds : catalogId ? [catalogId] : [];

    const [product] = await db
      .insert(products)
      .values({
        businessId: business.id,
        catalogId: catalogId ?? null,
        categoryId: values.categoryId && values.categoryId !== 'none' ? values.categoryId : null,
        brandId: values.brandId && values.brandId !== 'none' ? values.brandId : null,
        name: values.name,
        slug: generateSlug(values.name),
        description: values.description || null,
        price: values.price,
        compareAtPrice: values.compareAtPrice || null,
        sku: values.sku || null,
        stock: values.type === 'service' ? null : (values.stock ?? 0),
        status: values.status,
        isFeatured: values.isFeatured,
        type: values.type ?? 'product',
        weight: values.type === 'service' ? null : values.weight || null,
        dimensions: values.type === 'service' ? null : (values.dimensions ?? null),
        minStock: values.type === 'service' ? null : (values.minStock ?? 0),
        trackInventory: values.type === 'service' ? false : (values.trackInventory ?? true),
        tags: parsedTags,
      })
      .returning({ id: products.id });

    // Link product to catalog(s)
    if (catalogIds.length > 0) {
      await db.insert(catalogProducts).values(
        catalogIds.map((catId) => ({
          catalogId: catId,
          productId: product.id,
        }))
      );
    }

    // Save attribute values
    if (values.attributeValues) {
      const attrEntries = Object.entries(values.attributeValues).filter(([, v]) => v.trim() !== '');
      if (attrEntries.length > 0) {
        await db.insert(productAttributeValues).values(
          attrEntries.map(([attributeId, value]) => ({
            productId: product.id,
            attributeId,
            value,
          }))
        );
      }
    }

    revalidateProductsCache(business.id);

    return { success: true, productId: product.id };
  } catch {
    return { error: 'Ocurrió un error al crear el producto.' };
  }
}
