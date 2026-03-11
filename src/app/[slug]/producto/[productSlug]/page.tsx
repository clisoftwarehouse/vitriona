import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductDetail } from '@/modules/storefront/ui/components/product-detail';
import {
  getProductBySlug,
  getBusinessBySlug,
  getDefaultCatalog,
} from '@/modules/storefront/server/queries/get-storefront-data';

interface ProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return {};

  const catalog = await getDefaultCatalog(business.id);
  if (!catalog) return {};

  const product = await getProductBySlug(catalog.id, productSlug);
  if (!product) return {};

  const ogImage = product.images[0]?.url;

  return {
    title: `${product.name} — ${business.name}`,
    description: product.description || `${product.name} en ${business.name}`,
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} en ${business.name}`,
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = await params;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const catalog = await getDefaultCatalog(business.id);
  if (!catalog) notFound();

  const product = await getProductBySlug(catalog.id, productSlug);
  if (!product) notFound();

  return (
    <ProductDetail
      slug={slug}
      product={product}
      whatsappNumber={business.whatsappNumber}
      currency={business.currency}
    />
  );
}
