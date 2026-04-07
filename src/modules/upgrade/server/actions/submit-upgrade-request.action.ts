'use server';

import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { signUpgradeToken } from '@/lib/upgrade-token';
import { users, businesses, upgradeRequests } from '@/db/schema';
import { resend, EMAIL_FROM } from '@/modules/auth/server/email/resend';
import { upgradeRequestEmailTemplate } from '@/modules/auth/server/email/templates/upgrade-request.template';

const ADMIN_EMAIL = 'info@clisoftwarehouse.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitriona.app';

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
}

export async function submitUpgradeRequestAction(input: SubmitUpgradeRequestInput) {
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

    // Validate not already on the target plan
    if (business.plan === input.plan) {
      return { error: `Tu negocio ya está en el plan ${input.plan}` };
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
      token,
    });

    const approveUrl = `${APP_URL}/api/upgrade-requests/${requestId}?action=approve&token=${token}`;
    const rejectUrl = `${APP_URL}/api/upgrade-requests/${requestId}?action=reject&token=${token}`;

    // Send notification email
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `Solicitud de Upgrade — ${business.name} → Plan ${input.plan === 'pro' ? 'Emprendedor' : 'Negocio'}`,
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
        approveUrl,
        rejectUrl,
      }),
    });

    return { success: true, requestId };
  } catch (error) {
    console.error('Error submitting upgrade request:', error);
    return { error: 'Error al procesar la solicitud. Intenta de nuevo.' };
  }
}
