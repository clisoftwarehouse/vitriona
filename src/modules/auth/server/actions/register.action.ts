'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { users, otpTokens } from '@/db/schema';
import { sendOtpEmail } from '@/modules/auth/server/email/resend';
import { hashPassword } from '@/modules/auth/server/lib/password';
import type { RegisterFormValues } from '@/modules/auth/ui/schemas/auth.schemas';
import { hashOtp, generateOtp, otpExpiresAt } from '@/modules/auth/server/lib/otp';

export async function registerAction(values: RegisterFormValues) {
  try {
    const { email, name, password } = values;

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

    if (existing) return { error: 'Este email ya está registrado' };

    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({ email, name, password: hashedPassword });

    const otp = generateOtp();

    await db
      .insert(otpTokens)
      .values({ email, otp: hashOtp(otp), purpose: 'email_verification', expiresAt: otpExpiresAt() });

    await sendOtpEmail({ email, name, otp, purpose: 'email_verification' });

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al registrar. Inténtalo de nuevo.' };
  }
}
