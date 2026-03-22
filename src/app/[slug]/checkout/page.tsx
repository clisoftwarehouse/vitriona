import { notFound } from 'next/navigation';

import { CheckoutForm } from '@/modules/storefront/ui/components/checkout-form';
import { getBusinessBySlug, getDefaultCatalog } from '@/modules/storefront/server/queries/get-storefront-data';
import { getActivePaymentMethodsAction } from '@/modules/payment-methods/server/actions/payment-method-actions';

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const catalog = await getDefaultCatalog(business.id);
  if (!catalog) notFound();

  const rawMethods = await getActivePaymentMethodsAction(business.id);
  const paymentMethods = rawMethods.map((m) => ({
    id: m.id,
    name: m.name,
    instructions: m.instructions,
    fields: m.fields,
  }));

  return (
    <CheckoutForm
      slug={slug}
      businessId={business.id}
      catalogId={catalog.id}
      businessName={business.name}
      whatsappNumber={business.whatsappNumber}
      currency={business.currency}
      paymentMethods={paymentMethods}
    />
  );
}
