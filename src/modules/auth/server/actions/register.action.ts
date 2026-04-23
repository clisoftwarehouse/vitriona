'use server';

import { eq, and } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { users, otpTokens } from '@/db/schema';
import { notDeletedUser } from '@/db/soft-delete';
import { rateLimitAction } from '@/lib/rate-limit';
import { sendOtpEmail } from '@/modules/auth/server/email/resend';
import { hashPassword } from '@/modules/auth/server/lib/password';
import { hashOtp, generateOtp, otpExpiresAt } from '@/modules/auth/server/lib/otp';
import { registerSchema, type RegisterFormValues } from '@/modules/auth/ui/schemas/auth.schemas';

export async function registerAction(values: RegisterFormValues) {
  try {
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) return { error: 'Datos inválidos' };

    const rl = await rateLimitAction(parsed.data.email, 'register', 5, 60);
    if (!rl.success) return { error: 'Demasiados intentos. Espera un momento.' };

    const { email, name, password } = parsed.data;

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), notDeletedUser))
      .limit(1);

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
