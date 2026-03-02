'use server';

import { eq } from 'drizzle-orm';
import { AuthError } from 'next-auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { signIn } from '@/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { AUTH_ROUTES } from '@/modules/auth/constants';
import type { LoginFormValues } from '@/modules/auth/ui/schemas/auth.schemas';
import { resendOtpAction } from '@/modules/auth/server/actions/resend-otp.action';

export async function loginAction(values: LoginFormValues) {
  const [user] = await db
    .select({ emailVerified: users.emailVerified, name: users.name })
    .from(users)
    .where(eq(users.email, values.email))
    .limit(1);

  if (user && !user.emailVerified) {
    await resendOtpAction(values.email, 'email_verification', user.name ?? undefined);
    return {
      redirect: `${AUTH_ROUTES.VERIFY_OTP}?email=${encodeURIComponent(values.email)}&purpose=email_verification`,
    };
  }

  try {
    await signIn('credentials', { ...values, redirectTo: '/dashboard' });
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
