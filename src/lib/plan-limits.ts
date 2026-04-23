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

/**
 * Per-business overrides stored on the businesses table. Each field is nullable:
 * - null/undefined → fall back to the base plan limit
 * - finite integer → hard limit
 * - -1 → unlimited (rendered as Infinity at runtime)
 */
export interface PlanLimitOverrides {
  customMaxProducts?: number | null;
  customMaxVisitsPerMonth?: number | null;
  customMaxPaymentMethods?: number | null;
  customMaxDeliveryMethods?: number | null;
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

function resolveOverride(base: number, override: number | null | undefined): number {
  if (override === null || override === undefined) return base;
  if (override < 0) return Infinity;
  return override;
}

export function getPlanLimits(plan: PlanType, overrides?: PlanLimitOverrides | null): PlanLimits {
  const base = PLAN_LIMITS[plan];
  if (!overrides) return base;
  return {
    maxProducts: resolveOverride(base.maxProducts, overrides.customMaxProducts),
    maxVisitsPerMonth: resolveOverride(base.maxVisitsPerMonth, overrides.customMaxVisitsPerMonth),
    maxPaymentMethods: resolveOverride(base.maxPaymentMethods, overrides.customMaxPaymentMethods),
    maxDeliveryMethods: resolveOverride(base.maxDeliveryMethods, overrides.customMaxDeliveryMethods),
    watermark: base.watermark,
  };
}

export function hasCustomLimits(overrides?: PlanLimitOverrides | null): boolean {
  if (!overrides) return false;
  return (
    overrides.customMaxProducts != null ||
    overrides.customMaxVisitsPerMonth != null ||
    overrides.customMaxPaymentMethods != null ||
    overrides.customMaxDeliveryMethods != null
  );
}
