import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getBillingInfo } from '@/modules/dashboard/server/queries/get-billing-info';
import { AiCreditsCheckout } from '@/modules/upgrade/ui/components/ai-credits-checkout';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getActiveBusinessId } from '@/modules/businesses/server/actions/set-active-business.action';

export const metadata = {
  title: 'Comprar Créditos de IA — Vitriona',
};

export default async function AiCreditsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const businessList = await getBusinessesAction();
  if (businessList.length === 0) redirect('/dashboard/businesses/new');

  const activeId = await getActiveBusinessId();
  const activeBusiness = businessList.find((b) => b.id === activeId) ?? businessList[0];

  const billing = await getBillingInfo(activeBusiness.id);

  // Only businesses with active AI can buy credits
  if (!billing || !billing.aiPlanType) redirect('/dashboard/billing');

  return (
    <AiCreditsCheckout
      businessId={billing.businessId}
      businessName={billing.businessName}
      currentAiPlan={billing.aiPlanType}
      messagesUsed={billing.aiMessagesUsed ?? 0}
      messagesLimit={billing.aiMessagesLimit ?? 0}
      userEmail={session.user.email ?? ''}
    />
  );
}
