'use server';

import { eq, and, count } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { getPlanLimits } from '@/lib/plan-limits';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { generateSku } from '@/modules/products/lib/generate-sku';
import { revalidateProductsCache } from '@/lib/cache-revalidation';
import type { CreateProductFormValues } from '@/modules/products/ui/schemas/product.schemas';
import { catalogs, products, businesses, catalogProducts, productAttributeValues } from '@/db/schema';
import {
  replaceBundleItems,
  syncBundleProductState,
  validateBundleItemsForBusiness,
} from '@/modules/products/server/lib/bundles';

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
      .select({
        id: businesses.id,
        slug: businesses.slug,
        plan: businesses.plan,
        customMaxProducts: businesses.customMaxProducts,
        customMaxVisitsPerMonth: businesses.customMaxVisitsPerMonth,
        customMaxPaymentMethods: businesses.customMaxPaymentMethods,
        customMaxDeliveryMethods: businesses.customMaxDeliveryMethods,
      })
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    // ── Plan-based product limit ──
    const limits = getPlanLimits(business.plan, business);
    const [{ total }] = await db.select({ total: count() }).from(products).where(eq(products.businessId, business.id));

    if (total >= limits.maxProducts) {
      return {
        error: `Has alcanzado el límite de ${limits.maxProducts} productos de tu plan. Mejora tu plan para agregar más.`,
      };
    }

    const isBundle = values.type === 'bundle';
    const normalizedStatus =
      values.type !== 'product' || !(values.trackInventory ?? true)
        ? values.status === 'inactive'
          ? 'inactive'
          : 'active'
        : values.status;

    const isCustomerChoice = isBundle && values.bundleSelectionMode === 'customer_choice';

    let normalizedBundleItems: { productId: string; quantity: number }[] = [];
    if (isBundle && !isCustomerChoice) {
      const validatedBundleItems = await validateBundleItemsForBusiness(business.id, values.bundleItems);
      if (validatedBundleItems.error) {
        return { error: validatedBundleItems.error };
      }
      normalizedBundleItems = validatedBundleItems.items;
    }

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
        price: isBundle
          ? values.bundlePriceMode === 'custom_price' || values.bundlePriceMode === 'base_plus_items'
            ? values.bundleCustomPrice || '0'
            : '0'
          : values.price,
        compareAtPrice: isBundle ? null : values.compareAtPrice || null,
        sku: values.sku || generateSku(business.slug),
        stock: values.type === 'service' ? null : isBundle ? 0 : (values.stock ?? 0),
        status: normalizedStatus,
        isFeatured: values.isFeatured,
        type: values.type ?? 'product',
        bundlePriceMode: isBundle ? (values.bundlePriceMode ?? 'sum_items') : null,
        bundleSelectionMode: isBundle ? (values.bundleSelectionMode ?? 'fixed') : null,
        bundleCustomPrice:
          isBundle && (values.bundlePriceMode === 'custom_price' || values.bundlePriceMode === 'base_plus_items')
            ? values.bundleCustomPrice || null
            : null,
        bundleMinimumAmount: isCustomerChoice && values.bundleMinimumAmount ? values.bundleMinimumAmount : null,
        weight: values.type === 'service' || isBundle ? null : values.weight || null,
        dimensions: values.type === 'service' || isBundle ? null : (values.dimensions ?? null),
        minStock: values.type === 'service' || isBundle ? null : (values.minStock ?? 0),
        trackInventory: values.type === 'service' || isBundle ? false : (values.trackInventory ?? true),
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

    if (isBundle && !isCustomerChoice) {
      await replaceBundleItems(product.id, normalizedBundleItems);
      await syncBundleProductState(product.id, { revalidate: false });
    }

    revalidateProductsCache(business.id);

    return { success: true, productId: product.id };
  } catch {
    return { error: 'Ocurrió un error al crear el producto.' };
  }
}
