/**
 * Plan-based feature limits.
 * Keep in sync with pricing in src/app/_components/pricing.tsx
 */

export type PlanType = 'free' | 'pro' | 'business';

export interface PlanLimits {
  maxProducts: number;
  maxVisitsPerMonth: number;
  maxPaymentMethods: number;
  maxDeliveryMethods: number;
  watermark: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxProducts: 10,
    maxVisitsPerMonth: 500,
    maxPaymentMethods: 1,
    maxDeliveryMethods: 1,
    watermark: true,
  },
  pro: {
    maxProducts: 100,
    maxVisitsPerMonth: 5_000,
    maxPaymentMethods: 2,
    maxDeliveryMethods: 2,
    watermark: false,
  },
  business: {
    maxProducts: 1_000,
    maxVisitsPerMonth: 20_000,
    maxPaymentMethods: Infinity,
    maxDeliveryMethods: Infinity,
    watermark: false,
  },
};

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan];
}
