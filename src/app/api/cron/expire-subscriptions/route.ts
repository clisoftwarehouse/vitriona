import { eq, lt, and, isNotNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { businesses, chatbotConfigs, businessAiQuotas } from '@/db/schema';

const GRACE_PERIOD_DAYS = 5;
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cron endpoint to expire subscriptions that have passed their billing cycle end + grace period.
 *
 * Should be called periodically (e.g., daily) via a cron service like Vercel Cron, Railway Cron, etc.
 * Protected by CRON_SECRET header.
 *
 * Logic:
 * - For businesses: if billingCycleEnd + 5 days < now AND scheduledPlan is set → apply scheduledPlan
 *   If billingCycleEnd + 5 days < now AND no scheduledPlan but has a paid plan → downgrade to free
 * - For AI quotas: if billingCycleEnd + 5 days < now → disable chatbot and remove quota
 */
export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const graceDate = new Date(now);
  graceDate.setDate(graceDate.getDate() - GRACE_PERIOD_DAYS);

  const results = {
    plansExpired: 0,
    chatbotsExpired: 0,
    errors: [] as string[],
  };

  try {
    // ── Expire business plans ──
    // Find businesses with billingCycleEnd that has passed + grace period
    const expiredBusinesses = await db
      .select({
        id: businesses.id,
        plan: businesses.plan,
        scheduledPlan: businesses.scheduledPlan,
        billingCycleEnd: businesses.billingCycleEnd,
      })
      .from(businesses)
      .where(
        and(
          isNotNull(businesses.billingCycleEnd),
          lt(businesses.billingCycleEnd, graceDate) // billingCycleEnd + grace < now
        )
      );

    for (const biz of expiredBusinesses) {
      // Skip if already free
      if (biz.plan === 'free') continue;

      try {
        const newPlan = biz.scheduledPlan ?? 'free';

        await db
          .update(businesses)
          .set({
            plan: newPlan,
            billingCycle: newPlan === 'free' ? null : undefined,
            billingCycleEnd: newPlan === 'free' ? null : undefined,
            scheduledPlan: null,
            updatedAt: now,
          })
          .where(eq(businesses.id, biz.id));

        results.plansExpired++;
      } catch (err) {
        results.errors.push(`Plan expiry failed for business ${biz.id}: ${String(err)}`);
      }
    }

    // ── Expire AI chatbot subscriptions ──
    const expiredQuotas = await db
      .select({
        id: businessAiQuotas.id,
        businessId: businessAiQuotas.businessId,
        billingCycleEnd: businessAiQuotas.billingCycleEnd,
        scheduledAiPlanType: businessAiQuotas.scheduledAiPlanType,
      })
      .from(businessAiQuotas)
      .where(and(isNotNull(businessAiQuotas.billingCycleEnd), lt(businessAiQuotas.billingCycleEnd, graceDate)));

    for (const quota of expiredQuotas) {
      try {
        if (quota.scheduledAiPlanType) {
          // There's a scheduled plan change (upgrade was pre-approved) — skip deactivation
          // This shouldn't normally happen since upgrades are immediate, but just in case
          continue;
        }

        // Disable chatbot
        const [config] = await db
          .select({ id: chatbotConfigs.id })
          .from(chatbotConfigs)
          .where(eq(chatbotConfigs.businessId, quota.businessId))
          .limit(1);

        if (config) {
          await db
            .update(chatbotConfigs)
            .set({ isEnabled: false, updatedAt: now })
            .where(eq(chatbotConfigs.id, config.id));
        }

        // Delete the AI quota (clean state for re-activation)
        await db.delete(businessAiQuotas).where(eq(businessAiQuotas.id, quota.id));

        results.chatbotsExpired++;
      } catch (err) {
        results.errors.push(`AI quota expiry failed for business ${quota.businessId}: ${String(err)}`);
      }
    }
  } catch (err) {
    results.errors.push(`Global error: ${String(err)}`);
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    ...results,
  });
}
