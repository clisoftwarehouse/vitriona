import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { verifyUpgradeToken } from '@/lib/upgrade-token';
import { chatbotConfigs, businessAiQuotas, chatbotActivationRequests } from '@/db/schema';

const AI_PLAN_LABELS: Record<string, string> = {
  ia_starter: 'AI Starter',
  ia_business: 'AI Business',
  ia_enterprise: 'AI Enterprise',
};

const AI_PLAN_LIMITS: Record<string, number> = {
  ia_starter: 500,
  ia_business: 2500,
  ia_enterprise: 10000,
};

function htmlResponse(title: string, message: string, success: boolean) {
  const color = success ? '#16a34a' : '#dc2626';
  const icon = success ? '✓' : '✕';

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Vitriona</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="background:#ffffff;border-radius:16px;padding:48px;max-width:480px;width:100%;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.06);">
    <div style="width:64px;height:64px;border-radius:50%;background:${color}20;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
      <span style="font-size:28px;color:${color};">${icon}</span>
    </div>
    <h1 style="margin:0 0 12px;color:#18181b;font-size:22px;font-weight:600;">${title}</h1>
    <p style="margin:0;color:#52525b;font-size:15px;line-height:1.6;">${message}</p>
    <a href="/dashboard" style="display:inline-block;margin-top:24px;background:#18181b;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;padding:10px 24px;border-radius:8px;">
      Ir al Dashboard
    </a>
  </div>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

/**
 * Calculate the billing cycle end date.
 * For renewals, if there's remaining time on the current cycle, extend from that date.
 */
function calculateBillingCycleEnd(billingCycle: string, currentBillingCycleEnd: Date | null): Date {
  const now = new Date();
  const startFrom = currentBillingCycleEnd && currentBillingCycleEnd > now ? currentBillingCycleEnd : now;

  const end = new Date(startFrom);
  if (billingCycle === 'annual') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');
  const token = searchParams.get('token');

  // Validate params
  if (!action || !token || !['approve', 'reject'].includes(action)) {
    return htmlResponse('Enlace inválido', 'El enlace que has usado no es válido.', false);
  }

  // Verify token (reuses the same HMAC mechanism as upgrade requests)
  if (!verifyUpgradeToken(id, token)) {
    return htmlResponse(
      'Token inválido',
      'La firma de verificación no es válida. Este enlace puede haber sido alterado.',
      false
    );
  }

  // Fetch chatbot activation request
  const [activationRequest] = await db
    .select()
    .from(chatbotActivationRequests)
    .where(eq(chatbotActivationRequests.id, id))
    .limit(1);

  if (!activationRequest) {
    return htmlResponse('Solicitud no encontrada', 'No se encontró la solicitud de activación de chatbot.', false);
  }

  if (activationRequest.status !== 'pending') {
    const statusLabel = activationRequest.status === 'approved' ? 'aprobada' : 'rechazada';
    return htmlResponse('Solicitud ya procesada', `Esta solicitud ya fue ${statusLabel} anteriormente.`, false);
  }

  if (action === 'approve') {
    // Update request status
    await db
      .update(chatbotActivationRequests)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(chatbotActivationRequests.id, id));

    // Handle addon_credits: just add credits to existing quota, don't change plan/dates
    if (activationRequest.requestType === 'addon_credits') {
      const CREDITS_PRICE = 5;
      const CREDITS_AMOUNT = 1000;
      const totalCredits = Math.round((parseFloat(activationRequest.amount) / CREDITS_PRICE) * CREDITS_AMOUNT);

      const [existingQuota] = await db
        .select({
          id: businessAiQuotas.id,
          aiMessagesLimit: businessAiQuotas.aiMessagesLimit,
        })
        .from(businessAiQuotas)
        .where(eq(businessAiQuotas.businessId, activationRequest.businessId))
        .limit(1);

      if (!existingQuota) {
        return htmlResponse('Error', 'El negocio no tiene un plan de IA activo. No se pueden agregar créditos.', false);
      }

      // Add credits to existing limit
      await db
        .update(businessAiQuotas)
        .set({
          aiMessagesLimit: existingQuota.aiMessagesLimit + totalCredits,
          updatedAt: new Date(),
        })
        .where(eq(businessAiQuotas.id, existingQuota.id));

      return htmlResponse(
        'Créditos de IA agregados',
        `Se han agregado <strong>${totalCredits.toLocaleString()}</strong> créditos adicionales de IA al negocio. El nuevo límite es de <strong>${(existingQuota.aiMessagesLimit + totalCredits).toLocaleString()}</strong> mensajes.`,
        true
      );
    }

    // Create or update AI quota for the business (plan activation/upgrade/renewal)
    const messagesLimit = AI_PLAN_LIMITS[activationRequest.aiPlanType] ?? 500;

    const [existingQuota] = await db
      .select({
        id: businessAiQuotas.id,
        billingCycleEnd: businessAiQuotas.billingCycleEnd,
      })
      .from(businessAiQuotas)
      .where(eq(businessAiQuotas.businessId, activationRequest.businessId))
      .limit(1);

    const now = new Date();

    if (existingQuota) {
      const newBillingCycleEnd = calculateBillingCycleEnd(
        activationRequest.billingCycle,
        existingQuota.billingCycleEnd
      );

      // Update existing quota
      await db
        .update(businessAiQuotas)
        .set({
          aiPlanType: activationRequest.aiPlanType,
          aiMessagesLimit: messagesLimit,
          aiMessagesUsed: activationRequest.requestType === 'renewal' ? 0 : undefined,
          billingCycle: activationRequest.billingCycle,
          billingCycleStart: now,
          billingCycleEnd: newBillingCycleEnd,
          scheduledAiPlanType: null, // Clear any scheduled change
          updatedAt: now,
        })
        .where(eq(businessAiQuotas.id, existingQuota.id));
    } else {
      const newBillingCycleEnd = calculateBillingCycleEnd(activationRequest.billingCycle, null);

      // Create new quota
      await db.insert(businessAiQuotas).values({
        businessId: activationRequest.businessId,
        aiPlanType: activationRequest.aiPlanType,
        aiMessagesLimit: messagesLimit,
        aiMessagesUsed: 0,
        billingCycle: activationRequest.billingCycle,
        billingCycleStart: now,
        billingCycleEnd: newBillingCycleEnd,
      });
    }

    // Enable the chatbot config if it exists
    const [existingConfig] = await db
      .select({ id: chatbotConfigs.id })
      .from(chatbotConfigs)
      .where(eq(chatbotConfigs.businessId, activationRequest.businessId))
      .limit(1);

    if (existingConfig) {
      await db
        .update(chatbotConfigs)
        .set({ isEnabled: true, updatedAt: new Date() })
        .where(eq(chatbotConfigs.id, existingConfig.id));
    }

    const planLabel = AI_PLAN_LABELS[activationRequest.aiPlanType] ?? activationRequest.aiPlanType;
    const billingEnd = existingQuota
      ? calculateBillingCycleEnd(activationRequest.billingCycle, existingQuota.billingCycleEnd)
      : calculateBillingCycleEnd(activationRequest.billingCycle, null);

    const endFormatted = billingEnd.toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const requestTypeLabel =
      activationRequest.requestType === 'renewal'
        ? 'renovado'
        : activationRequest.requestType === 'upgrade'
          ? 'actualizado'
          : 'activado';

    return htmlResponse(
      'Chatbot IA aprobado',
      `El chatbot ha sido ${requestTypeLabel} con el plan <strong>${planLabel}</strong> (${messagesLimit.toLocaleString()} respuestas/mes). Vigente hasta <strong>${endFormatted}</strong>.`,
      true
    );
  }

  // Reject
  await db
    .update(chatbotActivationRequests)
    .set({ status: 'rejected', updatedAt: new Date() })
    .where(eq(chatbotActivationRequests.id, id));

  return htmlResponse('Solicitud rechazada', 'La solicitud de activación de chatbot ha sido rechazada.', false);
}
