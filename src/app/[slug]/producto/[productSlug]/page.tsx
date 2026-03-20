import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductDetail } from '@/modules/storefront/ui/components/product-detail';
import { getProductBySlug, getBusinessBySlug } from '@/modules/storefront/server/queries/get-storefront-data';

interface ProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return {};

  const product = await getProductBySlug(business.id, productSlug);
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

  const product = await getProductBySlug(business.id, productSlug);
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
