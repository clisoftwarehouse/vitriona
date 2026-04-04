import { eq, and, asc, inArray } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { revalidateProductsCache } from '@/lib/cache-revalidation';
import { products, bundleItems, productVariants } from '@/db/schema';

export interface BundleItemInput {
  productId: string;
  quantity: number;
}

export interface BundleComponentRecord {
  productId: string;
  name: string;
  slug: string;
  type: 'product' | 'service' | 'bundle';
  price: string;
  stock: number | null;
  trackInventory: boolean;
  status: 'active' | 'inactive' | 'out_of_stock';
  quantity: number;
  sortOrder: number;
}

function toMoney(value: number) {
  return value.toFixed(2);
}

function toNumber(value: string | number | null | undefined) {
  if (typeof value === 'number') return value;
  return Number(value ?? 0);
}

export function normalizeBundleItems(items: BundleItemInput[] | undefined) {
  if (!items?.length) return [];

  const byProductId = new Map<string, number>();

  for (const item of items) {
    const productId = item.productId?.trim();
    const quantity = Math.max(1, Math.trunc(item.quantity || 0));
    if (!productId) continue;
    byProductId.set(productId, (byProductId.get(productId) ?? 0) + quantity);
  }

  return Array.from(byProductId.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

export async function validateBundleItemsForBusiness(
  businessId: string,
  items: BundleItemInput[] | undefined,
  currentBundleProductId?: string
) {
  const normalized = normalizeBundleItems(items);

  if (normalized.length === 0) {
    return { error: 'Agrega al menos un producto o servicio al paquete.' as const };
  }

  if (currentBundleProductId && normalized.some((item) => item.productId === currentBundleProductId)) {
    return { error: 'Un paquete no puede incluirse a sí mismo.' as const };
  }

  const productIds = normalized.map((item) => item.productId);

  const componentProducts = await db
    .select({
      id: products.id,
      name: products.name,
      type: products.type,
      businessId: products.businessId,
    })
    .from(products)
    .where(and(eq(products.businessId, businessId), inArray(products.id, productIds)));

  if (componentProducts.length !== productIds.length) {
    return { error: 'Uno o más elementos del paquete no existen o no pertenecen a este negocio.' as const };
  }

  const invalidBundleChild = componentProducts.find((product) => product.type === 'bundle');
  if (invalidBundleChild) {
    return {
      error: `"${invalidBundleChild.name}" es un paquete. Los paquetes no pueden contener otros paquetes.` as const,
    };
  }

  const variantRows = await db
    .select({ productId: productVariants.productId })
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds));

  if (variantRows.length > 0) {
    const productIdsWithVariants = new Set(variantRows.map((row) => row.productId));
    const firstInvalid = componentProducts.find((product) => productIdsWithVariants.has(product.id));
    return {
      error:
        `"${firstInvalid?.name ?? 'Un producto seleccionado'}" tiene variantes. Los paquetes solo pueden incluir productos o servicios sin variantes.` as const,
    };
  }

  return { items: normalized };
}

export async function replaceBundleItems(bundleProductId: string, items: BundleItemInput[]) {
  await db.delete(bundleItems).where(eq(bundleItems.bundleProductId, bundleProductId));

  if (items.length === 0) return;

  await db.insert(bundleItems).values(
    items.map((item, index) => ({
      bundleProductId,
      itemProductId: item.productId,
      quantity: item.quantity,
      sortOrder: index,
    }))
  );
}

export async function getBundleComponents(bundleProductId: string): Promise<BundleComponentRecord[]> {
  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      slug: products.slug,
      type: products.type,
      price: products.price,
      stock: products.stock,
      trackInventory: products.trackInventory,
      status: products.status,
      quantity: bundleItems.quantity,
      sortOrder: bundleItems.sortOrder,
    })
    .from(bundleItems)
    .innerJoin(products, eq(bundleItems.itemProductId, products.id))
    .where(eq(bundleItems.bundleProductId, bundleProductId))
    .orderBy(asc(bundleItems.sortOrder), asc(products.name));

  return rows.map((row) => ({
    ...row,
    type: row.type as 'product' | 'service' | 'bundle',
    status: row.status as 'active' | 'inactive' | 'out_of_stock',
  }));
}

export async function syncBundleProductState(bundleProductId: string, options?: { revalidate?: boolean }) {
  const [bundleProduct] = await db
    .select({
      id: products.id,
      businessId: products.businessId,
      status: products.status,
      bundlePriceMode: products.bundlePriceMode,
      bundleCustomPrice: products.bundleCustomPrice,
      type: products.type,
    })
    .from(products)
    .where(eq(products.id, bundleProductId))
    .limit(1);

  if (!bundleProduct || bundleProduct.type !== 'bundle') return null;

  const components = await getBundleComponents(bundleProductId);
  const componentsTotal = components.reduce((sum, item) => sum + toNumber(item.price) * item.quantity, 0);
  const trackedComponents = components.filter((item) => item.trackInventory);
  const derivedStock =
    trackedComponents.length > 0
      ? Math.min(...trackedComponents.map((item) => Math.floor((item.stock ?? 0) / item.quantity)))
      : null;

  const customPrice = bundleProduct.bundleCustomPrice ? toNumber(bundleProduct.bundleCustomPrice) : null;
  const nextPrice =
    bundleProduct.bundlePriceMode === 'custom_price' && customPrice !== null ? customPrice : componentsTotal;
  const nextCompareAtPrice =
    bundleProduct.bundlePriceMode === 'custom_price' && customPrice !== null && customPrice < componentsTotal
      ? toMoney(componentsTotal)
      : null;

  let nextStatus = bundleProduct.status;
  if (bundleProduct.status !== 'inactive') {
    if (derivedStock !== null && derivedStock <= 0) {
      nextStatus = 'out_of_stock';
    } else {
      nextStatus = 'active';
    }
  }

  await db
    .update(products)
    .set({
      price: toMoney(nextPrice),
      compareAtPrice: nextCompareAtPrice,
      stock: derivedStock,
      minStock: 0,
      trackInventory: trackedComponents.length > 0,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(products.id, bundleProductId));

  if (options?.revalidate !== false) {
    revalidateProductsCache(bundleProduct.businessId);
  }

  return { businessId: bundleProduct.businessId };
}

export async function syncBundlesForComponent(componentProductId: string) {
  const rows = await db
    .select({ bundleProductId: bundleItems.bundleProductId })
    .from(bundleItems)
    .where(eq(bundleItems.itemProductId, componentProductId));

  const bundleProductIds = [...new Set(rows.map((row) => row.bundleProductId))];
  if (bundleProductIds.length === 0) return [];

  const businessIds = new Set<string>();

  for (const bundleProductId of bundleProductIds) {
    const result = await syncBundleProductState(bundleProductId, { revalidate: false });
    if (result?.businessId) {
      businessIds.add(result.businessId);
    }
  }

  for (const businessId of businessIds) {
    revalidateProductsCache(businessId);
  }

  return bundleProductIds;
}
