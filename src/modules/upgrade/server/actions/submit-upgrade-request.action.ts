'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { signUpgradeToken } from '@/lib/upgrade-token';
import { users, businesses, upgradeRequests } from '@/db/schema';
import { resend, EMAIL_FROM } from '@/modules/auth/server/email/resend';
import { upgradeRequestEmailTemplate } from '@/modules/auth/server/email/templates/upgrade-request.template';
import { upgradeConfirmationEmailTemplate } from '@/modules/auth/server/email/templates/upgrade-confirmation.template';

const ADMIN_EMAIL = 'info@clisoftwarehouse.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitriona.app';

const PLAN_HIERARCHY: Record<string, number> = { free: 0, pro: 1, business: 2 };

interface SubmitUpgradeRequestInput {
  businessId: string;
  plan: 'pro' | 'business';
  billingCycle: 'monthly' | 'annual';
  paymentMethod: 'bank_transfer' | 'pago_movil' | 'zelle' | 'binance';
  referenceId: string;
  amount: string;
  fullName: string;
  idNumber: string;
  email: string;
  phone?: string;
  notes?: string;
  amountVes?: string;
  exchangeRate?: string;
}

export async function submitUpgradeRequestAction(input: SubmitUpgradeRequestInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    // Validate business belongs to user
    const [business] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        plan: businesses.plan,
        billingCycle: businesses.billingCycle,
        billingCycleEnd: businesses.billingCycleEnd,
      })
      .from(businesses)
      .where(eq(businesses.id, input.businessId))
      .limit(1);

    if (!business) return { error: 'Negocio no encontrado' };

    // Block duplicate pending request for the same business
    const [pending] = await db
      .select({ id: upgradeRequests.id })
      .from(upgradeRequests)
      .where(and(eq(upgradeRequests.businessId, input.businessId), eq(upgradeRequests.status, 'pending')))
      .limit(1);

    if (pending) {
      return {
        error: 'Ya tienes una solicitud pendiente para este negocio. Espera a que sea procesada antes de enviar otra.',
      };
    }

    // Determine request type
    const currentLevel = PLAN_HIERARCHY[business.plan] ?? 0;
    const targetLevel = PLAN_HIERARCHY[input.plan] ?? 0;

    let requestType: 'new' | 'renewal' | 'upgrade' | 'downgrade';

    if (business.plan === 'free') {
      // Coming from free → new subscription
      requestType = 'new';
    } else if (input.plan === business.plan) {
      // Same plan → must keep the same billing cycle
      if (business.billingCycle && input.billingCycle !== business.billingCycle) {
        return {
          error:
            'No puedes cambiar el ciclo de facturación al renovar. Si quieres cambiarlo, espera a que termine tu ciclo actual.',
        };
      }
      requestType = 'renewal';
    } else if (targetLevel > currentLevel) {
      // Higher tier → immediate upgrade
      requestType = 'upgrade';
    } else {
      // Lower paid tier → scheduled downgrade
      requestType = 'downgrade';
    }

    // Get user info
    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) return { error: 'Usuario no encontrado' };

    // Insert upgrade request (generate ID first so we can sign it)
    const requestId = crypto.randomUUID();
    const token = signUpgradeToken(requestId);

    await db.insert(upgradeRequests).values({
      id: requestId,
      userId: session.user.id,
      businessId: input.businessId,
      requestType,
      plan: input.plan,
      billingCycle: input.billingCycle,
      paymentMethod: input.paymentMethod,
      referenceId: input.referenceId.trim(),
      amount: input.amount,
      fullName: input.fullName.trim(),
      idNumber: input.idNumber.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      amountVes: input.amountVes || null,
      exchangeRate: input.exchangeRate || null,
      token,
    });

    const approveUrl = `${APP_URL}/api/upgrade-requests/${requestId}?action=approve&token=${token}`;
    const rejectUrl = `${APP_URL}/api/upgrade-requests/${requestId}?action=reject&token=${token}`;

    const REQUEST_TYPE_LABELS: Record<string, string> = {
      new: 'Nueva suscripción',
      renewal: 'Renovación',
      upgrade: 'Upgrade',
      downgrade: 'Downgrade',
    };

    // Send notification email to admin
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `${REQUEST_TYPE_LABELS[requestType]} de Plan — ${business.name} → Plan ${input.plan === 'pro' ? 'Emprendedor' : 'Negocio'}`,
      html: upgradeRequestEmailTemplate({
        userName: user.name ?? 'Sin nombre',
        userEmail: user.email,
        businessName: business.name,
        plan: input.plan,
        billingCycle: input.billingCycle,
        paymentMethod: input.paymentMethod,
        referenceId: input.referenceId.trim(),
        amount: input.amount,
        fullName: input.fullName.trim(),
        idNumber: input.idNumber.trim(),
        contactEmail: input.email.trim(),
        phone: input.phone?.trim() || null,
        notes: input.notes?.trim() || null,
        amountVes: input.amountVes || null,
        exchangeRate: input.exchangeRate || null,
        approveUrl,
        rejectUrl,
      }),
    });

    // Send confirmation email to user (don't fail the request if this errors)
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: `Recibimos tu solicitud — ${REQUEST_TYPE_LABELS[requestType]} para ${business.name}`,
        html: upgradeConfirmationEmailTemplate({
          userName: user.name ?? 'Hola',
          businessName: business.name,
          requestType,
          plan: input.plan,
          billingCycle: input.billingCycle,
          paymentMethod: input.paymentMethod,
          referenceId: input.referenceId.trim(),
          amount: input.amount,
          amountVes: input.amountVes || null,
        }),
      });
    } catch (mailError) {
      console.error('Error sending user confirmation email:', mailError);
    }

    return { success: true, requestId, requestType };
  } catch (error) {
    console.error('Error submitting upgrade request:', error);
    return { error: 'Error al procesar la solicitud. Intenta de nuevo.' };
  }
}
