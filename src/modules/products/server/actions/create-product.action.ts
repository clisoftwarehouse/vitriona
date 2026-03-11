'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { catalogs, products, businesses, productAttributeValues } from '@/db/schema';
import type { CreateProductFormValues } from '@/modules/products/ui/schemas/product.schemas';

export async function createProductAction(catalogId: string, values: CreateProductFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1);
    if (!catalog) return { error: 'Catálogo no encontrado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    const parsedTags = values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : null;

    const [product] = await db
      .insert(products)
      .values({
        catalogId,
        categoryId: values.categoryId || null,
        name: values.name,
        slug: generateSlug(values.name),
        description: values.description || null,
        price: values.price,
        compareAtPrice: values.compareAtPrice || null,
        sku: values.sku || null,
        stock: values.stock ?? 0,
        status: values.status,
        isFeatured: values.isFeatured,
        type: values.type ?? 'product',
        weight: values.weight || null,
        dimensions: values.dimensions ?? null,
        minStock: values.minStock ?? 0,
        trackInventory: values.trackInventory ?? true,
        tags: parsedTags,
        characteristics: values.characteristics?.filter((c) => c.name.trim() && c.value.trim()) ?? null,
      })
      .returning({ id: products.id });

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

    return { success: true, productId: product.id };
  } catch {
    return { error: 'Ocurrió un error al crear el producto.' };
  }
}
