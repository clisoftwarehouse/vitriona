'use server';

import { eq, and, count } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { getVisitCount } from '@/lib/visit-tracker';
import { getPlanLimits, type PlanType } from '@/lib/plan-limits';
import { products, businesses, paymentMethods, deliveryMethods, businessAiQuotas } from '@/db/schema';

export interface UsageItem {
  label: string;
  used: number;
  limit: number | null;
  category: 'plan' | 'addon';
}

export interface UsageStats {
  planType: string;
  aiPlanType: string | null;
  items: UsageItem[];
}

export async function getUsageStats(businessId: string): Promise<UsageStats | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [biz] = await db
    .select({ id: businesses.id, plan: businesses.plan })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!biz) return null;

  const plan = biz.plan as PlanType;
  const limits = getPlanLimits(plan);

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
      limit: limits.maxProducts,
      category: 'plan',
    },
    {
      label: 'Visitas del mes',
      used: visits,
      limit: limits.maxVisitsPerMonth,
      category: 'plan',
    },
    {
      label: 'Métodos de pago',
      used: pmCount?.total ?? 0,
      limit: limits.maxPaymentMethods === Infinity ? null : limits.maxPaymentMethods,
      category: 'plan',
    },
    {
      label: 'Métodos de envío',
      used: dmCount?.total ?? 0,
      limit: limits.maxDeliveryMethods === Infinity ? null : limits.maxDeliveryMethods,
      category: 'plan',
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
  };
}
