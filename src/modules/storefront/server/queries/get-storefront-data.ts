'use server';

import { eq, and, asc, inArray } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import {
  catalogs,
  products,
  categories,
  businesses,
  productImages,
  catalogSettings,
  productAttributes,
  productAttributeValues,
} from '@/db/schema';

export async function getBusinessBySlug(slug: string) {
  const [business] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.slug, slug), eq(businesses.isActive, true)))
    .limit(1);

  return business ?? null;
}

export async function getDefaultCatalog(businessId: string) {
  const [catalog] = await db
    .select()
    .from(catalogs)
    .where(and(eq(catalogs.businessId, businessId), eq(catalogs.isActive, true), eq(catalogs.isDefault, true)))
    .limit(1);

  if (catalog) return catalog;

  const [firstCatalog] = await db
    .select()
    .from(catalogs)
    .where(and(eq(catalogs.businessId, businessId), eq(catalogs.isActive, true)))
    .limit(1);

  return firstCatalog ?? null;
}

export async function getCatalogSettings(catalogId: string) {
  const [settings] = await db.select().from(catalogSettings).where(eq(catalogSettings.catalogId, catalogId)).limit(1);
  return settings ?? null;
}

export async function getPublicCategories(catalogId: string) {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.catalogId, catalogId), eq(categories.isActive, true)))
    .orderBy(asc(categories.sortOrder));
}

export async function getPublicProducts(catalogId: string, categoryId?: string) {
  const conditions = [eq(products.catalogId, catalogId), eq(products.status, 'active')];

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  const productList = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.sortOrder));

  const productIds = productList.map((p) => p.id);
  if (productIds.length === 0) return [];

  const allImages = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder));

  const imageMap = new Map<string, (typeof allImages)[number][]>();
  for (const img of allImages) {
    const existing = imageMap.get(img.productId) ?? [];
    existing.push(img);
    imageMap.set(img.productId, existing);
  }

  return productList.map((p) => ({
    ...p,
    images: imageMap.get(p.id) ?? [],
  }));
}

export async function getActiveCatalogs(businessId: string) {
  return db
    .select()
    .from(catalogs)
    .where(and(eq(catalogs.businessId, businessId), eq(catalogs.isActive, true)))
    .orderBy(asc(catalogs.sortOrder));
}

export async function getCatalogBySlug(businessId: string, catalogSlug: string) {
  const [catalog] = await db
    .select()
    .from(catalogs)
    .where(and(eq(catalogs.businessId, businessId), eq(catalogs.slug, catalogSlug), eq(catalogs.isActive, true)))
    .limit(1);

  return catalog ?? null;
}

export async function getCatalogsWithPreviewProducts(businessId: string, limit = 6) {
  const catalogList = await db
    .select()
    .from(catalogs)
    .where(and(eq(catalogs.businessId, businessId), eq(catalogs.isActive, true)))
    .orderBy(asc(catalogs.sortOrder));

  if (catalogList.length === 0) return [];

  const catalogIds = catalogList.map((c) => c.id);

  const allProducts = await db
    .select()
    .from(products)
    .where(and(inArray(products.catalogId, catalogIds), eq(products.status, 'active')))
    .orderBy(asc(products.sortOrder));

  const productIds = allProducts.map((p) => p.id);
  const allImages =
    productIds.length > 0
      ? await db
          .select()
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(asc(productImages.sortOrder))
      : [];

  const imageMap = new Map<string, (typeof allImages)[number][]>();
  for (const img of allImages) {
    const existing = imageMap.get(img.productId) ?? [];
    existing.push(img);
    imageMap.set(img.productId, existing);
  }

  const productsByCatalog = new Map<string, (typeof allProducts)[number][]>();
  for (const p of allProducts) {
    const existing = productsByCatalog.get(p.catalogId) ?? [];
    existing.push(p);
    productsByCatalog.set(p.catalogId, existing);
  }

  return catalogList.map((catalog) => {
    const catalogProducts = (productsByCatalog.get(catalog.id) ?? []).slice(0, limit);
    const totalProducts = productsByCatalog.get(catalog.id)?.length ?? 0;
    return {
      ...catalog,
      products: catalogProducts.map((p) => ({ ...p, images: imageMap.get(p.id) ?? [] })),
      totalProducts,
    };
  });
}

export async function getProductBySlug(catalogId: string, productSlug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.catalogId, catalogId), eq(products.slug, productSlug), eq(products.status, 'active')))
    .limit(1);

  if (!product) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));

  const category = product.categoryId
    ? await db
        .select()
        .from(categories)
        .where(eq(categories.id, product.categoryId))
        .limit(1)
        .then((r) => r[0])
    : null;

  const attrRows = await db
    .select({
      name: productAttributes.name,
      value: productAttributeValues.value,
    })
    .from(productAttributeValues)
    .innerJoin(productAttributes, eq(productAttributeValues.attributeId, productAttributes.id))
    .where(eq(productAttributeValues.productId, product.id));

  return {
    ...product,
    images,
    category,
    attributes: attrRows,
    tags: product.tags ?? [],
  };
}
