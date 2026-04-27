import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { verifyUpgradeToken } from '@/lib/upgrade-token';
import { users, businesses, upgradeRequests } from '@/db/schema';
import { resend, EMAIL_FROM } from '@/modules/auth/server/email/resend';
import { upgradeDecisionEmailTemplate } from '@/modules/auth/server/email/templates/upgrade-decision.template';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitriona.app';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  new: 'Nueva suscripcion',
  renewal: 'Renovacion',
  upgrade: 'Upgrade',
  downgrade: 'Downgrade',
};

const PLAN_LABELS: Record<string, string> = {
  pro: 'Emprendedor',
  business: 'Negocio',
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
 * Otherwise, start from now.
 */
function calculateBillingCycleEnd(billingCycle: string, currentBillingCycleEnd: Date | null): Date {
  const now = new Date();
  // If renewing and the current cycle hasn't ended yet, extend from the current end date
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

  // Verify token
  if (!verifyUpgradeToken(id, token)) {
    return htmlResponse(
      'Token inválido',
      'La firma de verificación no es válida. Este enlace puede haber sido alterado.',
      false
    );
  }

  // Fetch upgrade request
  const [upgradeRequest] = await db.select().from(upgradeRequests).where(eq(upgradeRequests.id, id)).limit(1);

  if (!upgradeRequest) {
    return htmlResponse('Solicitud no encontrada', 'No se encontró la solicitud de upgrade.', false);
  }

  if (upgradeRequest.status !== 'pending') {
    const statusLabel = upgradeRequest.status === 'approved' ? 'aprobada' : 'rechazada';
    return htmlResponse('Solicitud ya procesada', `Esta solicitud ya fue ${statusLabel} anteriormente.`, false);
  }

  // Fetch user + business name for the user-facing email
  const [requester] = await db
    .select({
      userName: users.name,
      userEmail: users.email,
      businessName: businesses.name,
    })
    .from(upgradeRequests)
    .innerJoin(users, eq(users.id, upgradeRequests.userId))
    .innerJoin(businesses, eq(businesses.id, upgradeRequests.businessId))
    .where(eq(upgradeRequests.id, id))
    .limit(1);

  if (action === 'approve') {
    // Fetch current business billing info
    const [business] = await db
      .select({
        id: businesses.id,
        billingCycle: businesses.billingCycle,
        billingCycleEnd: businesses.billingCycleEnd,
      })
      .from(businesses)
      .where(eq(businesses.id, upgradeRequest.businessId))
      .limit(1);

    const planLabel = PLAN_LABELS[upgradeRequest.plan] ?? upgradeRequest.plan;
    const now = new Date();

    // ── Downgrade: schedule for end of current cycle, do not touch active plan ──
    if (upgradeRequest.requestType === 'downgrade') {
      await db.update(upgradeRequests).set({ status: 'approved', updatedAt: now }).where(eq(upgradeRequests.id, id));

      await db
        .update(businesses)
        .set({
          scheduledPlan: upgradeRequest.plan,
          scheduledBillingCycle: upgradeRequest.billingCycle,
          updatedAt: now,
        })
        .where(eq(businesses.id, upgradeRequest.businessId));

      const endFormatted = business?.billingCycleEnd
        ? business.billingCycleEnd.toLocaleDateString('es', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'la fecha de tu próximo ciclo';

      if (requester) {
        try {
          await resend.emails.send({
            from: EMAIL_FROM,
            to: requester.userEmail,
            subject: `Cambio de plan programado — ${requester.businessName}`,
            html: upgradeDecisionEmailTemplate({
              userName: requester.userName ?? 'Hola',
              businessName: requester.businessName,
              requestType: 'downgrade',
              plan: upgradeRequest.plan,
              billingCycle: upgradeRequest.billingCycle,
              amount: upgradeRequest.amount,
              referenceId: upgradeRequest.referenceId,
              decision: 'approved',
              billingCycleEnd: endFormatted,
              dashboardUrl: `${APP_URL}/dashboard/billing`,
            }),
          });
        } catch (mailError) {
          console.error('Error sending user downgrade approval email:', mailError);
        }
      }

      return htmlResponse(
        'Cambio de plan programado',
        `El cambio al plan <strong>${planLabel}</strong> se aplicará automáticamente al final del ciclo actual (<strong>${endFormatted}</strong>).`,
        true
      );
    }

    // ── New / renewal / upgrade: apply immediately ──

    // Determine billing cycle end date based on upgrade type
    const isUpgradeMidCycle =
      upgradeRequest.requestType === 'upgrade' && business?.billingCycleEnd && business.billingCycleEnd > now;
    const isCycleChange = isUpgradeMidCycle && business.billingCycle !== upgradeRequest.billingCycle;

    let newBillingCycleEnd: Date;
    if (isUpgradeMidCycle && !isCycleChange) {
      // Same cycle upgrade: keep existing end date (user pays prorated difference)
      newBillingCycleEnd = business.billingCycleEnd!;
    } else if (isCycleChange) {
      // Cycle change during upgrade: start a fresh cycle from now
      const end = new Date(now);
      if (upgradeRequest.billingCycle === 'annual') {
        end.setFullYear(end.getFullYear() + 1);
      } else {
        end.setMonth(end.getMonth() + 1);
      }
      newBillingCycleEnd = end;
    } else {
      // New subscription or renewal
      newBillingCycleEnd = calculateBillingCycleEnd(upgradeRequest.billingCycle, business?.billingCycleEnd ?? null);
    }

    // Update request status
    await db.update(upgradeRequests).set({ status: 'approved', updatedAt: now }).where(eq(upgradeRequests.id, id));

    // Update business plan + billing info
    await db
      .update(businesses)
      .set({
        plan: upgradeRequest.plan,
        billingCycle: upgradeRequest.billingCycle,
        billingCycleEnd: newBillingCycleEnd,
        scheduledPlan: null,
        scheduledBillingCycle: null,
        updatedAt: now,
      })
      .where(eq(businesses.id, upgradeRequest.businessId));

    const endFormatted = newBillingCycleEnd.toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const requestTypeLabel =
      upgradeRequest.requestType === 'renewal'
        ? 'renovado'
        : upgradeRequest.requestType === 'upgrade'
          ? 'actualizado'
          : 'activado';

    // Notify user (don't fail the response if mail fails)
    if (requester) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: requester.userEmail,
          subject: `Tu plan ${planLabel} esta activo — ${requester.businessName}`,
          html: upgradeDecisionEmailTemplate({
            userName: requester.userName ?? 'Hola',
            businessName: requester.businessName,
            requestType: upgradeRequest.requestType as 'new' | 'renewal' | 'upgrade' | 'downgrade',
            plan: upgradeRequest.plan,
            billingCycle: upgradeRequest.billingCycle,
            amount: upgradeRequest.amount,
            referenceId: upgradeRequest.referenceId,
            decision: 'approved',
            billingCycleEnd: endFormatted,
            dashboardUrl: `${APP_URL}/dashboard/billing`,
          }),
        });
      } catch (mailError) {
        console.error('Error sending user approval email:', mailError);
      }
    }

    return htmlResponse(
      'Plan aprobado',
      `El plan del negocio ha sido ${requestTypeLabel} a <strong>${planLabel}</strong>. Vigente hasta <strong>${endFormatted}</strong>.`,
      true
    );
  }

  // Reject
  await db.update(upgradeRequests).set({ status: 'rejected', updatedAt: new Date() }).where(eq(upgradeRequests.id, id));

  // Notify user
  if (requester) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: requester.userEmail,
        subject: `${REQUEST_TYPE_LABELS[upgradeRequest.requestType] ?? 'Solicitud'} rechazada — ${requester.businessName}`,
        html: upgradeDecisionEmailTemplate({
          userName: requester.userName ?? 'Hola',
          businessName: requester.businessName,
          requestType: upgradeRequest.requestType as 'new' | 'renewal' | 'upgrade' | 'downgrade',
          plan: upgradeRequest.plan,
          billingCycle: upgradeRequest.billingCycle,
          amount: upgradeRequest.amount,
          referenceId: upgradeRequest.referenceId,
          decision: 'rejected',
          dashboardUrl: `${APP_URL}/dashboard/billing`,
        }),
      });
    } catch (mailError) {
      console.error('Error sending user rejection email:', mailError);
    }
  }

  return htmlResponse('Solicitud rechazada', 'La solicitud de upgrade ha sido rechazada.', false);
}
