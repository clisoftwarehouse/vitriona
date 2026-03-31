import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { DeliveryMethodsDashboard } from '@/modules/delivery-methods/ui/components/delivery-methods-dashboard';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DeliveryMethodsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  const business = await getBusinessByIdAction(id);
  if (!business) redirect('/dashboard/businesses');

  return <DeliveryMethodsDashboard businessId={id} currency={business.currency} />;
}
