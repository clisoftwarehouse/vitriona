import { revalidateTag } from 'next/cache';

/**
 * Revalidate storefront cache tags when business data changes.
 * Call these after any mutation that affects public-facing data.
 *
 * Next.js 16 requires a cache-life profile as the second argument.
 * { expire: 0 } means immediate full purge of the cached entry.
 */

const PURGE = { expire: 0 };

export function revalidateBusinessCache(businessSlug: string) {
  revalidateTag(`business-${businessSlug}`, PURGE);
}

export function revalidateCatalogsCache(businessId: string) {
  revalidateTag(`catalogs-${businessId}`, PURGE);
}

export function revalidateCatalogSettingsCache(catalogId: string) {
  revalidateTag(`catalog-settings-${catalogId}`, PURGE);
}

export function revalidateProductsCache(businessId: string) {
  revalidateTag(`products-${businessId}`, PURGE);
}

export function revalidateCategoriesCache(businessId: string) {
  revalidateTag(`categories-${businessId}`, PURGE);
}

export function revalidateProductCache(productSlug: string) {
  revalidateTag(`product-${productSlug}`, PURGE);
}

/** Revalidate all storefront data for a business */
export function revalidateAllStorefrontCache(businessId: string, businessSlug?: string) {
  if (businessSlug) revalidateBusinessCache(businessSlug);
  revalidateCatalogsCache(businessId);
  revalidateProductsCache(businessId);
  revalidateCategoriesCache(businessId);
}
