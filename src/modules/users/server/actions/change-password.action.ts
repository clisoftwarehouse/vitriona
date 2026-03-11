'use server';

import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { hashPassword, verifyPassword } from '@/modules/auth/server/lib/password';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/modules/users/ui/schemas/user.schemas';

export async function changePasswordAction(values: ChangePasswordFormValues) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) return { error: 'Datos inválidos' };

  const { currentPassword, newPassword } = parsed.data;

  const [user] = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.password) {
    return { error: 'Tu cuenta usa inicio de sesión con Google. No puedes cambiar la contraseña aquí.' };
  }

  const valid = await verifyPassword(user.password, currentPassword);
  if (!valid) return { error: 'La contraseña actual es incorrecta' };

  const hashed = await hashPassword(newPassword);

  await db.update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, session.user.id));

  return { success: true };
}
