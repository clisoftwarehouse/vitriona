'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses, businessAiQuotas } from '@/db/schema';

/**
 * Cancel the main Vitriona plan subscription.
 * The business keeps its current plan features until `billingCycleEnd`.
 * After that + 5 days grace, the expiration cron downgrades to 'free'.
 */
export async function cancelPlanSubscriptionAction(businessId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [business] = await db
      .select({
        id: businesses.id,
        userId: businesses.userId,
        plan: businesses.plan,
        billingCycleEnd: businesses.billingCycleEnd,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business) return { error: 'Negocio no encontrado' };
    if (business.userId !== session.user.id) return { error: 'No autorizado' };
    if (business.plan === 'free') return { error: 'Tu negocio ya está en el plan gratuito.' };

    // Schedule downgrade to free at end of billing cycle (also clear any scheduled paid downgrade)
    await db
      .update(businesses)
      .set({
        scheduledPlan: 'free',
        scheduledBillingCycle: null,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));

    const endFormatted = business.billingCycleEnd
      ? business.billingCycleEnd.toLocaleDateString('es', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'el fin del ciclo actual';

    revalidatePath('/dashboard/billing');

    return {
      success: true,
      message: `Tu suscripción ha sido cancelada. Seguirás disfrutando de las funciones del plan actual hasta ${endFormatted}.`,
    };
  } catch (error) {
    console.error('Error cancelling plan subscription:', error);
    return { error: 'Error al cancelar la suscripción. Intenta de nuevo.' };
  }
}

/**
 * Reverse a scheduled plan change (cancel-cancellation, or cancel a scheduled downgrade).
 * Clears scheduledPlan and scheduledBillingCycle so the current plan continues normally.
 */
export async function clearScheduledPlanChangeAction(businessId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [business] = await db
      .select({
        id: businesses.id,
        userId: businesses.userId,
        scheduledPlan: businesses.scheduledPlan,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business) return { error: 'Negocio no encontrado' };
    if (business.userId !== session.user.id) return { error: 'No autorizado' };
    if (!business.scheduledPlan) return { error: 'No hay un cambio programado.' };

    // Only allow reverting cancellations (scheduledPlan = 'free'). Paid downgrades involve
    // a prepaid cycle and need manual support handling for refund.
    if (business.scheduledPlan !== 'free') {
      return {
        error:
          'Para revertir un cambio de plan ya pagado, contacta a soporte. Solo puedes revertir cancelaciones desde aquí.',
      };
    }

    await db
      .update(businesses)
      .set({
        scheduledPlan: null,
        scheduledBillingCycle: null,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));

    revalidatePath('/dashboard/billing');

    return { success: true, message: 'Tu cancelación ha sido revertida. Tu plan continuará renovándose.' };
  } catch (error) {
    console.error('Error clearing scheduled plan change:', error);
    return { error: 'Error al revertir el cambio programado. Intenta de nuevo.' };
  }
}

/**
 * Cancel the AI chatbot subscription.
 * The chatbot keeps working until `billingCycleEnd`.
 * After that + 5 days grace, the expiration cron removes the AI quota.
 */
export async function cancelChatbotSubscriptionAction(businessId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [business] = await db
      .select({ id: businesses.id, userId: businesses.userId })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business) return { error: 'Negocio no encontrado' };
    if (business.userId !== session.user.id) return { error: 'No autorizado' };

    const [quota] = await db
      .select({
        id: businessAiQuotas.id,
        aiPlanType: businessAiQuotas.aiPlanType,
        billingCycleEnd: businessAiQuotas.billingCycleEnd,
      })
      .from(businessAiQuotas)
      .where(eq(businessAiQuotas.businessId, businessId))
      .limit(1);

    if (!quota) return { error: 'No tienes un plan de chatbot activo.' };

    // Setting scheduledAiPlanType to null signals cancellation (no next plan)
    // We use a special marker: set the field to the current plan but mark it differently
    // Actually, null already means "no scheduled change". We need a way to say "cancel after billing ends".
    // Let's use the convention: if scheduledAiPlanType is explicitly set, it's the next plan.
    // For cancellation, we'll set it to a sentinel. But since the enum doesn't have a 'cancel' value,
    // we'll add a separate approach: set billingCycleEnd and don't renew.
    // The simplest approach: We mark scheduledAiPlanType as null (meaning: don't continue)
    // and the cron will check: if billingCycleEnd has passed + grace AND scheduledAiPlanType is null → deactivate.
    // If scheduledAiPlanType has a value → switch to that plan (for upgrades scheduled).
    // So null = cancel, which is the default. We need another field or convention.
    // Let's use: if the user explicitly cancels, we keep scheduledAiPlanType as null.
    // The cron checks billingCycleEnd: if expired + grace AND no approved renewal request → deactivate.
    // But this couples cron to checking requests. Better: use a boolean or specific field.
    // Simplest: we'll check if there's an approved request that extends beyond the current billingCycleEnd.
    // Actually, let's keep it simple: the approval route already extends billingCycleEnd.
    // If the user doesn't renew (doesn't submit a new payment), billingCycleEnd stays the same.
    // The cron just checks: billingCycleEnd + 5 days grace < now → deactivate.
    // Cancellation action just needs to confirm to the user they won't be auto-renewed.
    // Since we don't have auto-billing, the "cancellation" is informational + we clear scheduledAiPlanType.

    await db
      .update(businessAiQuotas)
      .set({
        scheduledAiPlanType: null,
        updatedAt: new Date(),
      })
      .where(eq(businessAiQuotas.id, quota.id));

    const endFormatted = quota.billingCycleEnd
      ? quota.billingCycleEnd.toLocaleDateString('es', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'el fin del ciclo actual';

    return {
      success: true,
      message: `Tu suscripción de chatbot IA ha sido cancelada. El chatbot seguirá funcionando hasta ${endFormatted}.`,
    };
  } catch (error) {
    console.error('Error cancelling chatbot subscription:', error);
    return { error: 'Error al cancelar la suscripción del chatbot. Intenta de nuevo.' };
  }
}
