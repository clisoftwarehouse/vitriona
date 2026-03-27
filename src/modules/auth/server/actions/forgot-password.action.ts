'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { users, otpTokens } from '@/db/schema';
import { rateLimitAction } from '@/lib/rate-limit';
import { sendOtpEmail } from '@/modules/auth/server/email/resend';
import { hashOtp, generateOtp, otpExpiresAt } from '@/modules/auth/server/lib/otp';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/modules/auth/ui/schemas/auth.schemas';

export async function forgotPasswordAction(values: ForgotPasswordFormValues) {
  try {
    const parsed = forgotPasswordSchema.safeParse(values);
    if (!parsed.success) return { error: 'Datos inválidos' };

    const rl = await rateLimitAction(parsed.data.email, 'forgot-password', 3, 60);
    if (!rl.success) return { error: 'Demasiados intentos. Espera un momento.' };

    const { email } = parsed.data;

    const [user] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return { success: true };

    const otp = generateOtp();

    await db
      .insert(otpTokens)
      .values({ email, otp: hashOtp(otp), purpose: 'password_reset', expiresAt: otpExpiresAt() });

    await sendOtpEmail({ email, otp, purpose: 'password_reset', name: user.name ?? undefined });

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error. Inténtalo de nuevo.' };
  }
}
