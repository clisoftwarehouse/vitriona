import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getEurRate } from '@/lib/get-exchange-rate';
import { getBillingInfo } from '@/modules/dashboard/server/queries/get-billing-info';
import { DowngradeCheckout } from '@/modules/upgrade/ui/components/downgrade-checkout';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getActiveBusinessId } from '@/modules/businesses/server/actions/set-active-business.action';

export const metadata = {
  title: 'Bajar de Plan — Vitriona',
};

export default async function DowngradePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const businessList = await getBusinessesAction();
  if (businessList.length === 0) redirect('/dashboard/businesses/new');

  const activeId = await getActiveBusinessId();
  const activeBusiness = businessList.find((b) => b.id === activeId) ?? businessList[0];

  const [billing, eurRate] = await Promise.all([getBillingInfo(activeBusiness.id), getEurRate()]);

  // Only `business` plan can downgrade (to pro). Free plans go up; pro can only cancel.
  if (!billing || billing.plan !== 'business') redirect('/dashboard/billing');

  // If a change is already scheduled or there's a pending request, redirect to billing page
  if (billing.scheduledPlan || billing.pendingRequest) redirect('/dashboard/billing');

  return (
    <DowngradeCheckout
      businessId={billing.businessId}
      businessName={billing.businessName}
      currentPlan={billing.plan}
      currentBillingCycle={billing.billingCycle}
      billingCycleEnd={billing.billingCycleEnd?.toISOString() ?? null}
      targetPlan='pro'
      userEmail={session.user.email ?? ''}
      eurRate={eurRate}
    />
  );
}
