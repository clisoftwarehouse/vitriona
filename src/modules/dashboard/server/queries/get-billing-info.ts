'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { notDeletedBusiness } from '@/db/soft-delete';
import { businesses, businessAiQuotas } from '@/db/schema';

export interface BillingInfo {
  businessId: string;
  businessName: string;
  plan: string;
  billingCycle: string | null;
  billingCycleEnd: Date | null;
  scheduledPlan: string | null;
  aiPlanType: string | null;
  aiBillingCycle: string | null;
  aiBillingCycleEnd: Date | null;
  scheduledAiPlanType: string | null;
  aiMessagesUsed: number | null;
  aiMessagesLimit: number | null;
  createdAt: Date;
}

export async function getBillingInfo(businessId: string): Promise<BillingInfo | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [biz] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      plan: businesses.plan,
      billingCycle: businesses.billingCycle,
      billingCycleEnd: businesses.billingCycleEnd,
      scheduledPlan: businesses.scheduledPlan,
      createdAt: businesses.createdAt,
    })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);

  if (!biz) return null;

  const [aiQuota] = await db
    .select()
    .from(businessAiQuotas)
    .where(eq(businessAiQuotas.businessId, businessId))
    .limit(1);

  return {
    businessId: biz.id,
    businessName: biz.name,
    plan: biz.plan,
    billingCycle: biz.billingCycle,
    billingCycleEnd: biz.billingCycleEnd,
    scheduledPlan: biz.scheduledPlan,
    aiPlanType: aiQuota?.aiPlanType ?? null,
    aiBillingCycle: aiQuota?.billingCycle ?? null,
    aiBillingCycleEnd: aiQuota?.billingCycleEnd ?? null,
    scheduledAiPlanType: aiQuota?.scheduledAiPlanType ?? null,
    aiMessagesUsed: aiQuota?.aiMessagesUsed ?? null,
    aiMessagesLimit: aiQuota?.aiMessagesLimit ?? null,
    createdAt: biz.createdAt,
  };
}
