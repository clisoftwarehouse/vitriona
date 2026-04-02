export const AI_PLAN_LIMITS = {
  ia_starter: 500,
  ia_business: 2500,
  ia_enterprise: 10000,
} as const;

export type AiPlanType = keyof typeof AI_PLAN_LIMITS;
