import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getEurRate } from '@/lib/get-exchange-rate';
import { RenewalCheckout } from '@/modules/upgrade/ui/components/renewal-checkout';
import { getBillingInfo } from '@/modules/dashboard/server/queries/get-billing-info';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getActiveBusinessId } from '@/modules/businesses/server/actions/set-active-business.action';

export const metadata = {
  title: 'Renovar Suscripción — Vitriona',
};

export default async function RenewalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const businessList = await getBusinessesAction();
  if (businessList.length === 0) redirect('/dashboard/businesses/new');

  const activeId = await getActiveBusinessId();
  const activeBusiness = businessList.find((b) => b.id === activeId) ?? businessList[0];

  const [billing, eurRate] = await Promise.all([getBillingInfo(activeBusiness.id), getEurRate()]);

  // Only paid plans can renew
  if (!billing || billing.plan === 'free') redirect('/dashboard/billing');

  return (
    <RenewalCheckout
      businessId={billing.businessId}
      businessName={billing.businessName}
      currentPlan={billing.plan}
      currentBillingCycle={billing.billingCycle}
      billingCycleEnd={billing.billingCycleEnd?.toISOString() ?? null}
      userEmail={session.user.email ?? ''}
      eurRate={eurRate}
    />
  );
}
