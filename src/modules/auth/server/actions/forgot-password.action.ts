'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { users, otpTokens } from '@/db/schema';
import { sendOtpEmail } from '@/modules/auth/server/email/resend';
import { hashOtp, generateOtp, otpExpiresAt } from '@/modules/auth/server/lib/otp';
import type { ForgotPasswordFormValues } from '@/modules/auth/ui/schemas/auth.schemas';

export async function forgotPasswordAction(values: ForgotPasswordFormValues) {
  try {
    const { email } = values;

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
