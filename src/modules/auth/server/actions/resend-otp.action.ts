'use server';

import { db } from '@/db/drizzle';
import { otpTokens } from '@/db/schema';
import type { OtpPurpose } from '@/modules/auth/constants';
import { sendOtpEmail } from '@/modules/auth/server/email/resend';
import { hashOtp, generateOtp, otpExpiresAt } from '@/modules/auth/server/lib/otp';

export async function resendOtpAction(email: string, purpose: OtpPurpose, name?: string) {
  try {
    const otp = generateOtp();

    await db.insert(otpTokens).values({ email, otp: hashOtp(otp), purpose, expiresAt: otpExpiresAt() });
    await sendOtpEmail({ email, otp, purpose, name });

    return { success: true };
  } catch {
    return { error: 'No se pudo reenviar el código. Inténtalo de nuevo.' };
  }
}
