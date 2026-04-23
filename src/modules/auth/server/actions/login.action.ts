'use server';

import { eq, and } from 'drizzle-orm';
import { AuthError } from 'next-auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { signIn } from '@/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { notDeletedUser } from '@/db/soft-delete';
import { rateLimitAction } from '@/lib/rate-limit';
import { AUTH_ROUTES } from '@/modules/auth/constants';
import { resendOtpAction } from '@/modules/auth/server/actions/resend-otp.action';
import { loginSchema, type LoginFormValues } from '@/modules/auth/ui/schemas/auth.schemas';

export async function loginAction(values: LoginFormValues) {
  try {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) return { error: 'Datos inválidos' };

    const rl = await rateLimitAction(parsed.data.email, 'login', 10, 60);
    if (!rl.success) return { error: 'Demasiados intentos. Espera un momento antes de intentar de nuevo.' };

    const [user] = await db
      .select({ emailVerified: users.emailVerified, name: users.name })
      .from(users)
      .where(and(eq(users.email, parsed.data.email), notDeletedUser))
      .limit(1);

    if (user && !user.emailVerified) {
      await resendOtpAction(parsed.data.email, 'email_verification', user.name ?? undefined);
      return {
        redirect: `${AUTH_ROUTES.VERIFY_OTP}?email=${encodeURIComponent(parsed.data.email)}&purpose=email_verification`,
      };
    }

    await signIn('credentials', { ...parsed.data, redirectTo: '/dashboard' });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Email o contraseña incorrectos' };
        default:
          return { error: 'Ocurrió un error al iniciar sesión' };
      }
    }
    return { error: 'Ocurrió un error inesperado' };
  }
}

export async function googleSignInAction() {
  try {
    await signIn('google', { redirectTo: '/dashboard' });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: 'Ocurrió un error al iniciar sesión con Google' };
  }
}

export async function appleSignInAction() {
  try {
    await signIn('apple', { redirectTo: '/dashboard' });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: 'Ocurrió un error al iniciar sesión con Apple' };
  }
}
