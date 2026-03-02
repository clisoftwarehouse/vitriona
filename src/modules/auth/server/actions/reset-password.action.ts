'use server';

import { eq, gt, and } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { hashPassword } from '@/modules/auth/server/lib/password';
import type { ResetPasswordFormValues } from '@/modules/auth/ui/schemas/auth.schemas';

export async function resetPasswordAction(values: ResetPasswordFormValues, email: string, resetToken: string) {
  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.resetPasswordToken, resetToken),
          gt(users.resetPasswordTokenExpiry, new Date())
        )
      )
      .limit(1);

    if (!user) return { error: 'El enlace de restablecimiento es inválido o ha expirado' };

    const hashedPassword = await hashPassword(values.password);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al restablecer la contraseña' };
  }
}
