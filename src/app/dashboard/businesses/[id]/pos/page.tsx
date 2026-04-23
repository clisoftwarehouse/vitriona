import { notFound } from 'next/navigation';
import { eq, and, asc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { notDeletedBusiness } from '@/db/soft-delete';
import { PosDashboard } from '@/modules/pos/ui/components/pos-dashboard';
import {
  products,
  businesses,
  categories,
  productImages,
  paymentMethods,
  deliveryMethods,
  productVariants,
} from '@/db/schema';

interface PosPageProps {
  params: Promise<{ id: string }>;
}

export default async function PosPage({ params }: PosPageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id: businessId } = await params;

  const [business] = await db
    .select({ id: businesses.id, currency: businesses.currency })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!business) notFound();

  // Fetch active products with first image and category name
  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      trackInventory: products.trackInventory,
      status: products.status,
      type: products.type,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(and(eq(products.businessId, businessId)))
    .orderBy(asc(products.name));

  // Get images for all products (first image only)
  const productIds = allProducts.map((p) => p.id);
  const imageMap: Record<string, { id: string; url: string; alt: string | null }[]> = {};
  if (productIds.length > 0) {
    const images = await db
      .select({
        productId: productImages.productId,
        id: productImages.id,
        url: productImages.url,
        alt: productImages.alt,
        sortOrder: productImages.sortOrder,
      })
      .from(productImages)
      .orderBy(asc(productImages.sortOrder));

    for (const img of images) {
      if (!imageMap[img.productId]) imageMap[img.productId] = [];
      imageMap[img.productId].push({ id: img.id, url: img.url, alt: img.alt });
    }
  }

  // Get category names
  const allCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.businessId, businessId));
  const categoryMap = Object.fromEntries(allCategories.map((c) => [c.id, c.name]));

  // Fetch variants for all products
  const allVariants = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      name: productVariants.name,
      price: productVariants.price,
      stock: productVariants.stock,
      options: productVariants.options,
      isActive: productVariants.isActive,
    })
    .from(productVariants)
    .orderBy(asc(productVariants.sortOrder));

  const variantMap: Record<string, typeof allVariants> = {};
  for (const v of allVariants) {
    if (!v.isActive) continue;
    if (!variantMap[v.productId]) variantMap[v.productId] = [];
    variantMap[v.productId].push(v);
  }

  const posProducts = allProducts.map((p) => ({
    ...p,
    images: imageMap[p.id]?.slice(0, 1) ?? [],
    categoryName: p.categoryId ? (categoryMap[p.categoryId] ?? null) : null,
    variants: (variantMap[p.id] ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      stock: v.stock,
      options: v.options,
    })),
  }));

  // Fetch payment methods
  const allPaymentMethods = await db
    .select({ id: paymentMethods.id, name: paymentMethods.name, isActive: paymentMethods.isActive })
    .from(paymentMethods)
    .where(eq(paymentMethods.businessId, businessId))
    .orderBy(asc(paymentMethods.sortOrder));

  // Fetch delivery methods
  const allDeliveryMethods = await db
    .select({
      id: deliveryMethods.id,
      name: deliveryMethods.name,
      price: deliveryMethods.price,
      isActive: deliveryMethods.isActive,
    })
    .from(deliveryMethods)
    .where(eq(deliveryMethods.businessId, businessId))
    .orderBy(asc(deliveryMethods.sortOrder));

  return (
    <PosDashboard
      businessId={businessId}
      currency={business.currency}
      products={posProducts}
      paymentMethods={allPaymentMethods}
      deliveryMethods={allDeliveryMethods}
    />
  );
}
