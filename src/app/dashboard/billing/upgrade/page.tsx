import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businessAiQuotas } from '@/db/schema';
import { getEurRate } from '@/lib/get-exchange-rate';
import { UpgradeTabs } from '@/modules/upgrade/ui/components/upgrade-tabs';
import { getBillingInfo } from '@/modules/dashboard/server/queries/get-billing-info';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getActiveBusinessId } from '@/modules/businesses/server/actions/set-active-business.action';

export const metadata = {
  title: 'Mejorar Plan — Vitriona',
};

interface UpgradePageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { tab } = await searchParams;

  const [businesses, activeBusinessId, eurRate] = await Promise.all([
    getBusinessesAction(),
    getActiveBusinessId(),
    getEurRate(),
  ]);

  // Get businesses that already have AI quotas
  const aiQuotas = await db.select({ businessId: businessAiQuotas.businessId }).from(businessAiQuotas);
  const aiQuotaBusinessIds = new Set(aiQuotas.map((q) => q.businessId));

  // Get AI plan types for each business
  const aiQuotaDetails = await db
    .select({ businessId: businessAiQuotas.businessId, aiPlanType: businessAiQuotas.aiPlanType })
    .from(businessAiQuotas);
  const aiQuotaMap = new Map(aiQuotaDetails.map((q) => [q.businessId, q.aiPlanType]));

  const businessesWithAiStatus = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    plan: b.plan,
    hasAiQuota: aiQuotaBusinessIds.has(b.id),
    aiPlanType: aiQuotaMap.get(b.id) ?? null,
  }));

  // Get billing info for proration calculation
  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) ?? businesses[0];
  const billing = activeBusiness ? await getBillingInfo(activeBusiness.id) : null;

  const PLAN_PRICES: Record<string, number> = { pro: 15, business: 30 };

  const billingInfoForProration =
    billing && billing.plan !== 'free'
      ? {
          billingCycle: billing.billingCycle,
          billingCycleEnd: billing.billingCycleEnd?.toISOString() ?? null,
          currentPlanPrice:
            billing.billingCycle === 'annual'
              ? (PLAN_PRICES[billing.plan] ?? 0) * 12 * 0.85
              : (PLAN_PRICES[billing.plan] ?? 0),
        }
      : null;

  return (
    <UpgradeTabs
      businesses={businessesWithAiStatus}
      userEmail={session.user.email ?? ''}
      defaultTab={tab === 'chatbot' ? 'chatbot' : 'plan'}
      activeBusinessId={activeBusinessId}
      billingInfo={billingInfoForProration}
      eurRate={eurRate}
    />
  );
}
