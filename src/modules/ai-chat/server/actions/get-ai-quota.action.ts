'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { businessAiQuotas } from '@/db/schema';

export async function getAiQuotaAction(businessId: string) {
  const [quota] = await db.select().from(businessAiQuotas).where(eq(businessAiQuotas.businessId, businessId)).limit(1);

  if (!quota) return null;

  return {
    planType: quota.aiPlanType,
    messagesUsed: quota.aiMessagesUsed,
    messagesLimit: quota.aiMessagesLimit,
    billingCycleStart: quota.billingCycleStart.toISOString(),
  };
}
