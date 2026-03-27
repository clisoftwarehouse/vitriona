'use server';

import crypto from 'crypto';
import { eq, gt, and, isNull } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { users, otpTokens } from '@/db/schema';
import { type OtpPurpose, RESET_TOKEN_EXPIRY_MINUTES } from '@/modules/auth/constants';
import { verifyOtpSchema, type VerifyOtpFormValues } from '@/modules/auth/ui/schemas/auth.schemas';

const hashOtp = (otp: string) => crypto.createHash('sha256').update(otp).digest('hex');

export async function verifyOtpAction(values: VerifyOtpFormValues, email: string, purpose: OtpPurpose) {
  try {
    const parsed = verifyOtpSchema.safeParse(values);
    if (!parsed.success) return { error: 'Código inválido' };

    const [token] = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.email, email),
          eq(otpTokens.otp, hashOtp(values.otp)),
          eq(otpTokens.purpose, purpose),
          gt(otpTokens.expiresAt, new Date()),
          isNull(otpTokens.usedAt)
        )
      )
      .limit(1);

    if (!token) return { error: 'Código inválido o expirado' };

    await db.update(otpTokens).set({ usedAt: new Date() }).where(eq(otpTokens.id, token.id));

    if (purpose === 'email_verification') {
      await db.update(users).set({ emailVerified: new Date() }).where(eq(users.email, email));
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await db
      .update(users)
      .set({ resetPasswordToken: resetToken, resetPasswordTokenExpiry: expiry })
      .where(eq(users.email, email));

    return { success: true, resetToken };
  } catch {
    return { error: 'Ocurrió un error al verificar el código' };
  }
}
