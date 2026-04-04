import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { eq, and, asc, avg, sql, count, inArray } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import {
  brands,
  catalogs,
  products,
  categories,
  businesses,
  bundleItems,
  productImages,
  productReviews,
  catalogProducts,
  catalogSettings,
  productVariants,
  productAttributes,
  productAttributeValues,
} from '@/db/schema';

// ── Cache durations (seconds) ────────────────────────────────────────────────
const CACHE_SHORT = 30; // 30s – for data that changes often (products, stock)
const CACHE_MEDIUM = 120; // 2min – for semi-static data (categories, catalogs)
const CACHE_LONG = 300; // 5min – for rarely changing data (business info, settings)

// ── Business by slug ─────────────────────────────────────────────────────────
export const getBusinessBySlug = cache((slug: string) =>
  unstable_cache(
    async () => {
      const [business] = await db
        .select()
        .from(businesses)
        .where(and(eq(businesses.slug, slug), eq(businesses.isActive, true)))
        .limit(1);
      return business ?? null;
    },
    [`business-by-slug-${slug}`],
    { revalidate: CACHE_LONG, tags: [`business-${slug}`] }
  )()
);

// ── Default catalog ──────────────────────────────────────────────────────────
export const getDefaultCatalog = cache((businessId: string) =>
  unstable_cache(
    async () => {
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
    },
    [`default-catalog-${businessId}`],
    { revalidate: CACHE_MEDIUM, tags: [`catalogs-${businessId}`] }
  )()
);

// ── Catalog settings ─────────────────────────────────────────────────────────
export const getCatalogSettings = cache((catalogId: string) =>
  unstable_cache(
    async () => {
      const [settings] = await db
        .select()
        .from(catalogSettings)
        .where(eq(catalogSettings.catalogId, catalogId))
        .limit(1);
      return settings ?? null;
    },
    [`catalog-settings-${catalogId}`],
    { revalidate: CACHE_LONG, tags: [`catalog-settings-${catalogId}`] }
  )()
);

// ── Public categories ────────────────────────────────────────────────────────
export const getPublicCategories = cache((catalogId: string, businessId: string) =>
  unstable_cache(
    async () => {
      return db
        .select()
        .from(categories)
        .where(and(eq(categories.businessId, businessId), eq(categories.isActive, true)))
        .orderBy(asc(categories.sortOrder));
    },
    [`public-categories-${businessId}`],
    { revalidate: CACHE_MEDIUM, tags: [`categories-${businessId}`] }
  )()
);

export const getPublicProducts = cache((businessId: string, categoryId?: string, catalogId?: string) =>
  unstable_cache(
    async () => _getPublicProducts(businessId, categoryId, catalogId),
    [`public-products-${businessId}-${categoryId ?? 'all'}-${catalogId ?? 'all'}`],
    { revalidate: CACHE_SHORT, tags: [`products-${businessId}`] }
  )()
);

async function _getPublicProducts(businessId: string, categoryId?: string, catalogId?: string) {
  const conditions = [eq(products.businessId, businessId), eq(products.status, 'active')];

  // If a specific catalog is requested, filter through the join table
  if (catalogId) {
    const linked = await db
      .select({ productId: catalogProducts.productId })
      .from(catalogProducts)
      .where(eq(catalogProducts.catalogId, catalogId));

    const linkedIds = linked.map((l) => l.productId);
    if (linkedIds.length === 0) return [];
    conditions.push(inArray(products.id, linkedIds));
  }

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

  // Fetch brand names for products that have brandId
  const brandIds = [...new Set(productList.map((p) => p.brandId).filter(Boolean))] as string[];
  const brandMap = new Map<string, string>();
  if (brandIds.length > 0) {
    const brandRows = await db
      .select({ id: brands.id, name: brands.name })
      .from(brands)
      .where(inArray(brands.id, brandIds));
    for (const b of brandRows) brandMap.set(b.id, b.name);
  }

  // Fetch review stats (approved only)
  const reviewRows = await db
    .select({
      productId: productReviews.productId,
      avgRating: avg(productReviews.rating),
      reviewCount: count(),
    })
    .from(productReviews)
    .where(and(inArray(productReviews.productId, productIds), eq(productReviews.isApproved, true)))
    .groupBy(productReviews.productId);

  const reviewMap = new Map<string, { avgRating: number; reviewCount: number }>();
  for (const r of reviewRows) {
    reviewMap.set(r.productId, {
      avgRating: r.avgRating ? parseFloat(r.avgRating) : 0,
      reviewCount: r.reviewCount,
    });
  }

  // Fetch variant counts to know which products have variants
  const variantCountRows = await db
    .select({
      productId: productVariants.productId,
      variantCount: sql<number>`COUNT(*)`,
    })
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds))
    .groupBy(productVariants.productId);

  const variantCountMap = new Map<string, number>();
  for (const r of variantCountRows) {
    variantCountMap.set(r.productId, Number(r.variantCount));
  }

  return productList.map((p) => ({
    ...p,
    images: imageMap.get(p.id) ?? [],
    brandName: p.brandId ? (brandMap.get(p.brandId) ?? null) : null,
    avgRating: reviewMap.get(p.id)?.avgRating ?? 0,
    reviewCount: reviewMap.get(p.id)?.reviewCount ?? 0,
    hasVariants: (variantCountMap.get(p.id) ?? 0) > 0,
  }));
}

export const getActiveCatalogs = cache((businessId: string) =>
  unstable_cache(
    async () => {
      return db
        .select()
        .from(catalogs)
        .where(and(eq(catalogs.businessId, businessId), eq(catalogs.isActive, true)))
        .orderBy(asc(catalogs.sortOrder));
    },
    [`active-catalogs-${businessId}`],
    { revalidate: CACHE_MEDIUM, tags: [`catalogs-${businessId}`] }
  )()
);

// ── Catalog by slug ──────────────────────────────────────────────────────────
export const getCatalogBySlug = cache((businessId: string, catalogSlug: string) =>
  unstable_cache(
    async () => {
      const [catalog] = await db
        .select()
        .from(catalogs)
        .where(and(eq(catalogs.businessId, businessId), eq(catalogs.slug, catalogSlug), eq(catalogs.isActive, true)))
        .limit(1);
      return catalog ?? null;
    },
    [`catalog-by-slug-${businessId}-${catalogSlug}`],
    { revalidate: CACHE_MEDIUM, tags: [`catalogs-${businessId}`] }
  )()
);

// ── Catalogs with preview products ───────────────────────────────────────────
export const getCatalogsWithPreviewProducts = cache((businessId: string, limit = 6) =>
  unstable_cache(
    async () => _getCatalogsWithPreviewProducts(businessId, limit),
    [`catalogs-preview-${businessId}-${limit}`],
    { revalidate: CACHE_SHORT, tags: [`products-${businessId}`, `catalogs-${businessId}`] }
  )()
);

async function _getCatalogsWithPreviewProducts(businessId: string, limit = 6) {
  const catalogList = await db
    .select()
    .from(catalogs)
    .where(and(eq(catalogs.businessId, businessId), eq(catalogs.isActive, true)))
    .orderBy(asc(catalogs.sortOrder));

  if (catalogList.length === 0) return [];

  const catalogIds = catalogList.map((c) => c.id);

  // Get all catalog-product links
  const allLinks = await db.select().from(catalogProducts).where(inArray(catalogProducts.catalogId, catalogIds));

  const allProductIds = [...new Set(allLinks.map((l) => l.productId))];
  if (allProductIds.length === 0) return catalogList.map((c) => ({ ...c, products: [], totalProducts: 0 }));

  const allProducts = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, allProductIds), eq(products.status, 'active')))
    .orderBy(asc(products.sortOrder));

  const productMap = new Map(allProducts.map((p) => [p.id, p]));

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

  // Fetch brand names
  const brandIds = [...new Set(allProducts.map((p) => p.brandId).filter(Boolean))] as string[];
  const brandMap = new Map<string, string>();
  if (brandIds.length > 0) {
    const brandRows = await db
      .select({ id: brands.id, name: brands.name })
      .from(brands)
      .where(inArray(brands.id, brandIds));
    for (const b of brandRows) brandMap.set(b.id, b.name);
  }

  // Fetch variant counts
  const variantCountRows =
    productIds.length > 0
      ? await db
          .select({
            productId: productVariants.productId,
            variantCount: sql<number>`COUNT(*)`,
          })
          .from(productVariants)
          .where(inArray(productVariants.productId, productIds))
          .groupBy(productVariants.productId)
      : [];

  const variantCountMap = new Map<string, number>();
  for (const r of variantCountRows) {
    variantCountMap.set(r.productId, Number(r.variantCount));
  }

  // Group products by catalog via join table links
  const productsByCatalog = new Map<string, (typeof allProducts)[number][]>();
  for (const link of allLinks) {
    const product = productMap.get(link.productId);
    if (!product) continue;
    const existing = productsByCatalog.get(link.catalogId) ?? [];
    existing.push(product);
    productsByCatalog.set(link.catalogId, existing);
  }

  return catalogList.map((cat) => {
    const catProducts = (productsByCatalog.get(cat.id) ?? []).slice(0, limit);
    const totalProducts = productsByCatalog.get(cat.id)?.length ?? 0;
    return {
      ...cat,
      products: catProducts.map((p) => ({
        ...p,
        images: imageMap.get(p.id) ?? [],
        brandName: p.brandId ? (brandMap.get(p.brandId) ?? null) : null,
        hasVariants: (variantCountMap.get(p.id) ?? 0) > 0,
      })),
      totalProducts,
    };
  });
}

// ── Product by slug ──────────────────────────────────────────────────────────
export const getProductBySlug = cache((businessId: string, productSlug: string) =>
  unstable_cache(
    async () => _getProductBySlug(businessId, productSlug),
    [`product-by-slug-${businessId}-${productSlug}`],
    { revalidate: CACHE_SHORT, tags: [`products-${businessId}`, `product-${productSlug}`] }
  )()
);

async function _getProductBySlug(businessId: string, productSlug: string) {
  // Find the product by slug within this business
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.businessId, businessId), eq(products.slug, productSlug), eq(products.status, 'active')))
    .limit(1);

  if (!product) return null;

  const allImages = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));

  const images = allImages.filter((img) => !img.variantId);
  const variantImagesMap: Record<string, typeof allImages> = {};
  for (const img of allImages) {
    if (img.variantId) {
      if (!variantImagesMap[img.variantId]) variantImagesMap[img.variantId] = [];
      variantImagesMap[img.variantId].push(img);
    }
  }

  const [category, brand] = await Promise.all([
    product.categoryId
      ? db
          .select()
          .from(categories)
          .where(eq(categories.id, product.categoryId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null,
    product.brandId
      ? db
          .select()
          .from(brands)
          .where(eq(brands.id, product.brandId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null,
  ]);

  const attrRows = await db
    .select({
      name: productAttributes.name,
      value: productAttributeValues.value,
    })
    .from(productAttributeValues)
    .innerJoin(productAttributes, eq(productAttributeValues.attributeId, productAttributes.id))
    .where(eq(productAttributeValues.productId, product.id));

  const variants = await db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)))
    .orderBy(asc(productVariants.sortOrder));

  const bundleComponentRows =
    product.type === 'bundle'
      ? await db
          .select({
            productId: products.id,
            name: products.name,
            slug: products.slug,
            type: products.type,
            price: products.price,
            stock: products.stock,
            trackInventory: products.trackInventory,
            quantity: bundleItems.quantity,
          })
          .from(bundleItems)
          .innerJoin(products, eq(bundleItems.itemProductId, products.id))
          .where(eq(bundleItems.bundleProductId, product.id))
          .orderBy(asc(bundleItems.sortOrder), asc(products.name))
      : [];

  return {
    ...product,
    images,
    variantImagesMap,
    category,
    brand,
    attributes: attrRows,
    tags: product.tags ?? [],
    variants,
    bundleItems: bundleComponentRows,
  };
}
