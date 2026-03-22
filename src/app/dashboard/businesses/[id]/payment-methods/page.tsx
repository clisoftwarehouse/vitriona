import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { PaymentMethodsDashboard } from '@/modules/payment-methods/ui/components/payment-methods-dashboard';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaymentMethodsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;

  return <PaymentMethodsDashboard businessId={id} />;
}
