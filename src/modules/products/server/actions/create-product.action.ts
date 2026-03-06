'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { catalogs, products, businesses } from '@/db/schema';
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
      })
      .returning({ id: products.id });

    return { success: true, productId: product.id };
  } catch {
    return { error: 'Ocurrió un error al crear el producto.' };
  }
}
