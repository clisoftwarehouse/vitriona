import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { ReportsContainer } from '@/modules/reports/ui/components/reports-container';
import { getBusinessByIdAction } from '@/modules/businesses/server/actions/get-businesses.action';

interface ReportsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id: businessId } = await params;
  const business = await getBusinessByIdAction(businessId);
  if (!business) notFound();

  return <ReportsContainer businessId={businessId} businessName={business.name} />;
}
