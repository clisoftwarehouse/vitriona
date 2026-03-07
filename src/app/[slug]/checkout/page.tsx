import { notFound } from 'next/navigation';

import { CheckoutForm } from '@/modules/storefront/ui/components/checkout-form';
import { getBusinessBySlug, getDefaultCatalog } from '@/modules/storefront/server/queries/get-storefront-data';

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const catalog = await getDefaultCatalog(business.id);
  if (!catalog) notFound();

  return (
    <CheckoutForm
      slug={slug}
      businessId={business.id}
      catalogId={catalog.id}
      businessName={business.name}
      whatsappNumber={business.whatsappNumber}
    />
  );
}
