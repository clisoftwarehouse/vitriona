'use server';

import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { signUpgradeToken } from '@/lib/upgrade-token';
import { resend, EMAIL_FROM } from '@/modules/auth/server/email/resend';
import { users, businesses, businessAiQuotas, chatbotActivationRequests } from '@/db/schema';
import { chatbotActivationRequestEmailTemplate } from '@/modules/auth/server/email/templates/chatbot-activation-request.template';

const ADMIN_EMAIL = 'info@clisoftwarehouse.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitriona.app';

const AI_PLAN_HIERARCHY: Record<string, number> = {
  ia_starter: 0,
  ia_business: 1,
  ia_enterprise: 2,
};

interface SubmitChatbotActivationRequestInput {
  businessId: string;
  aiPlanType: 'ia_starter' | 'ia_business' | 'ia_enterprise';
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

export async function submitChatbotActivationRequestAction(input: SubmitChatbotActivationRequestInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    // Validate business belongs to user
    const [business] = await db
      .select({ id: businesses.id, name: businesses.name, plan: businesses.plan })
      .from(businesses)
      .where(eq(businesses.id, input.businessId))
      .limit(1);

    if (!business) return { error: 'Negocio no encontrado' };

    // Check existing AI quota to determine request type
    const [existingQuota] = await db
      .select({
        id: businessAiQuotas.id,
        aiPlanType: businessAiQuotas.aiPlanType,
        billingCycleEnd: businessAiQuotas.billingCycleEnd,
      })
      .from(businessAiQuotas)
      .where(eq(businessAiQuotas.businessId, input.businessId))
      .limit(1);

    let requestType: 'new' | 'renewal' | 'upgrade';

    if (!existingQuota) {
      // No existing AI quota → new activation
      requestType = 'new';
    } else if (input.aiPlanType === existingQuota.aiPlanType) {
      // Same plan → renewal
      requestType = 'renewal';
    } else {
      const currentLevel = AI_PLAN_HIERARCHY[existingQuota.aiPlanType] ?? 0;
      const targetLevel = AI_PLAN_HIERARCHY[input.aiPlanType] ?? 0;

      if (targetLevel > currentLevel) {
        // Higher tier → upgrade
        requestType = 'upgrade';
      } else {
        return { error: 'No puedes cambiar a un plan inferior desde aquí. Usa la opción de cancelar.' };
      }
    }

    // Get user info
    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) return { error: 'Usuario no encontrado' };

    // Insert chatbot activation request
    const requestId = crypto.randomUUID();
    const token = signUpgradeToken(requestId);

    await db.insert(chatbotActivationRequests).values({
      id: requestId,
      userId: session.user.id,
      businessId: input.businessId,
      requestType,
      aiPlanType: input.aiPlanType,
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

    const approveUrl = `${APP_URL}/api/chatbot-activation-requests/${requestId}?action=approve&token=${token}`;
    const rejectUrl = `${APP_URL}/api/chatbot-activation-requests/${requestId}?action=reject&token=${token}`;

    const AI_PLAN_LABELS: Record<string, string> = {
      ia_starter: 'AI Starter',
      ia_business: 'AI Business',
      ia_enterprise: 'AI Enterprise',
    };

    const REQUEST_TYPE_LABELS: Record<string, string> = {
      new: 'Nueva activación',
      renewal: 'Renovación',
      upgrade: 'Upgrade',
    };

    // Send notification email
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `${REQUEST_TYPE_LABELS[requestType]} de Chatbot IA — ${business.name} → ${AI_PLAN_LABELS[input.aiPlanType] ?? input.aiPlanType}`,
      html: chatbotActivationRequestEmailTemplate({
        userName: user.name ?? 'Sin nombre',
        userEmail: user.email,
        businessName: business.name,
        aiPlanType: input.aiPlanType,
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

    return { success: true, requestId, requestType };
  } catch (error) {
    console.error('Error submitting chatbot activation request:', error);
    return { error: 'Error al procesar la solicitud. Intenta de nuevo.' };
  }
}
