import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductReviews } from '@/modules/reviews/ui/components/product-reviews';
import { ProductDetail } from '@/modules/storefront/ui/components/product-detail';
import { RelatedProductsSection } from '@/modules/storefront/ui/components/product-detail';
import { getProductReviews, getProductReviewStats } from '@/modules/reviews/server/actions/review-actions';
import { StorefrontAnalyticsTracker } from '@/modules/storefront/ui/components/storefront-analytics-tracker';
import {
  getProductBySlug,
  getBusinessBySlug,
  getBundleConfiguration,
  getRelatedOrBestSellerProducts,
} from '@/modules/storefront/server/queries/get-storefront-data';

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

  const [reviews, stats, relatedProducts, bundleConfig] = await Promise.all([
    getProductReviews(product.id),
    getProductReviewStats(product.id),
    getRelatedOrBestSellerProducts(business.id, product.id),
    product.type === 'bundle' ? getBundleConfiguration(product.id) : null,
  ]);

  return (
    <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8'>
      <StorefrontAnalyticsTracker
        businessId={business.id}
        eventType='product_view'
        productId={product.id}
        productName={product.name}
        productSlug={product.slug}
      />
      <ProductDetail
        slug={slug}
        product={product}
        whatsappNumber={business.whatsappNumber}
        currency={business.currency}
        reviewStats={stats}
        showWatermark={business.plan === 'free'}
        bundleConfig={bundleConfig}
      />
      {relatedProducts.length > 0 && (
        <RelatedProductsSection
          products={relatedProducts}
          slug={slug}
          currency={business.currency}
          showWatermark={business.plan === 'free'}
        />
      )}
      <ProductReviews productId={product.id} businessId={business.id} reviews={reviews} stats={stats} />
    </div>
  );
}
