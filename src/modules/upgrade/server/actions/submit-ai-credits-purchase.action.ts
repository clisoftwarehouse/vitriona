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

const CREDITS_PRICE = 5; // $5 per 1000 messages
const CREDITS_AMOUNT = 1000;

interface SubmitAiCreditsPurchaseInput {
  businessId: string;
  quantity: number; // number of credit packs (each = 1000 messages for $5)
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

export async function submitAiCreditsPurchaseAction(input: SubmitAiCreditsPurchaseInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    // Validate business belongs to user
    const [business] = await db
      .select({ id: businesses.id, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.id, input.businessId))
      .limit(1);

    if (!business) return { error: 'Negocio no encontrado' };

    // Verify business has active AI quota
    const [aiQuota] = await db
      .select({ id: businessAiQuotas.id, aiPlanType: businessAiQuotas.aiPlanType })
      .from(businessAiQuotas)
      .where(eq(businessAiQuotas.businessId, input.businessId))
      .limit(1);

    if (!aiQuota) return { error: 'Tu negocio no tiene un plan de IA activo. Activa uno primero.' };

    // Get user info
    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) return { error: 'Usuario no encontrado' };

    const totalCredits = input.quantity * CREDITS_AMOUNT;
    const totalAmount = input.quantity * CREDITS_PRICE;

    // Insert as chatbot activation request with addon_credits type
    const requestId = crypto.randomUUID();
    const token = signUpgradeToken(requestId);

    await db.insert(chatbotActivationRequests).values({
      id: requestId,
      userId: session.user.id,
      businessId: input.businessId,
      requestType: 'addon_credits',
      aiPlanType: aiQuota.aiPlanType,
      billingCycle: 'monthly', // N/A for credits, but required field
      paymentMethod: input.paymentMethod,
      referenceId: input.referenceId.trim(),
      amount: totalAmount.toFixed(2),
      fullName: input.fullName.trim(),
      idNumber: input.idNumber.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || null,
      notes: `Compra de ${totalCredits.toLocaleString()} créditos adicionales de IA (${input.quantity}x paquete de ${CREDITS_AMOUNT.toLocaleString()})${input.notes ? `\n${input.notes.trim()}` : ''}`,
      amountVes: input.amountVes || null,
      exchangeRate: input.exchangeRate || null,
      token,
    });

    const approveUrl = `${APP_URL}/api/chatbot-activation-requests/${requestId}?action=approve&token=${token}`;
    const rejectUrl = `${APP_URL}/api/chatbot-activation-requests/${requestId}?action=reject&token=${token}`;

    // Send notification email
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `Compra de Créditos IA — ${business.name} → ${totalCredits.toLocaleString()} mensajes`,
      html: chatbotActivationRequestEmailTemplate({
        userName: user.name ?? 'Sin nombre',
        userEmail: user.email,
        businessName: business.name,
        aiPlanType: aiQuota.aiPlanType,
        billingCycle: 'monthly',
        paymentMethod: input.paymentMethod,
        referenceId: input.referenceId.trim(),
        amount: totalAmount.toFixed(2),
        fullName: input.fullName.trim(),
        idNumber: input.idNumber.trim(),
        contactEmail: input.email.trim(),
        phone: input.phone?.trim() || null,
        notes: `Compra de ${totalCredits.toLocaleString()} créditos adicionales de IA (${input.quantity}x paquete de ${CREDITS_AMOUNT.toLocaleString()})${input.notes ? `\n${input.notes.trim()}` : ''}`,
        approveUrl,
        rejectUrl,
      }),
    });

    return { success: true, requestId };
  } catch (error) {
    console.error('Error submitting AI credits purchase:', error);
    return { error: 'Error al procesar la solicitud. Intenta de nuevo.' };
  }
}
