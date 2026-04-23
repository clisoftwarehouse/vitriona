'use server';

import { eq, and, count } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { getVisitCount } from '@/lib/visit-tracker';
import { notDeletedBusiness } from '@/db/soft-delete';
import { getPlanLimits, type PlanType, hasCustomLimits } from '@/lib/plan-limits';
import { products, businesses, paymentMethods, deliveryMethods, businessAiQuotas } from '@/db/schema';

export interface UsageItem {
  label: string;
  used: number;
  limit: number | null;
  category: 'plan' | 'addon';
  customized?: boolean;
}

export interface UsageStats {
  planType: string;
  aiPlanType: string | null;
  items: UsageItem[];
  hasCustomLimits: boolean;
  customLimitsNote: string | null;
}

export async function getUsageStats(businessId: string): Promise<UsageStats | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [biz] = await db
    .select({
      id: businesses.id,
      plan: businesses.plan,
      customMaxProducts: businesses.customMaxProducts,
      customMaxVisitsPerMonth: businesses.customMaxVisitsPerMonth,
      customMaxPaymentMethods: businesses.customMaxPaymentMethods,
      customMaxDeliveryMethods: businesses.customMaxDeliveryMethods,
      customLimitsNote: businesses.customLimitsNote,
    })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!biz) return null;

  const plan = biz.plan as PlanType;
  const limits = getPlanLimits(plan, biz);

  // Count products
  const [productCount] = await db.select({ total: count() }).from(products).where(eq(products.businessId, businessId));

  // Count payment methods
  const [pmCount] = await db
    .select({ total: count() })
    .from(paymentMethods)
    .where(eq(paymentMethods.businessId, businessId));

  // Count delivery methods
  const [dmCount] = await db
    .select({ total: count() })
    .from(deliveryMethods)
    .where(eq(deliveryMethods.businessId, businessId));

  // Visits this month (from Redis)
  const visits = await getVisitCount(businessId);

  // AI quota
  const [aiQuota] = await db
    .select()
    .from(businessAiQuotas)
    .where(eq(businessAiQuotas.businessId, businessId))
    .limit(1);

  const items: UsageItem[] = [
    {
      label: 'Productos',
      used: productCount?.total ?? 0,
      limit: limits.maxProducts === Infinity ? null : limits.maxProducts,
      category: 'plan',
      customized: biz.customMaxProducts != null,
    },
    {
      label: 'Visitas del mes',
      used: visits,
      limit: limits.maxVisitsPerMonth === Infinity ? null : limits.maxVisitsPerMonth,
      category: 'plan',
      customized: biz.customMaxVisitsPerMonth != null,
    },
    {
      label: 'Métodos de pago',
      used: pmCount?.total ?? 0,
      limit: limits.maxPaymentMethods === Infinity ? null : limits.maxPaymentMethods,
      category: 'plan',
      customized: biz.customMaxPaymentMethods != null,
    },
    {
      label: 'Métodos de envío',
      used: dmCount?.total ?? 0,
      limit: limits.maxDeliveryMethods === Infinity ? null : limits.maxDeliveryMethods,
      category: 'plan',
      customized: biz.customMaxDeliveryMethods != null,
    },
  ];

  if (aiQuota) {
    items.push({
      label: 'Mensajes de IA',
      used: aiQuota.aiMessagesUsed,
      limit: aiQuota.aiMessagesLimit,
      category: 'addon',
    });
  }

  return {
    planType: plan,
    aiPlanType: aiQuota?.aiPlanType ?? null,
    items,
    hasCustomLimits: hasCustomLimits(biz),
    customLimitsNote: biz.customLimitsNote,
  };
}
