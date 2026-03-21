'use server';

import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { updateProfileSchema, type UpdateProfileFormValues } from '@/modules/users/ui/schemas/user.schemas';

export async function updateUserProfileAction(values: UpdateProfileFormValues) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const parsed = updateProfileSchema.safeParse(values);
  if (!parsed.success) return { error: 'Datos inválidos' };

  const { name, phone, timezone, locale, avatarUrl } = parsed.data;

  await db
    .update(users)
    .set({
      name,
      phone: phone || null,
      timezone,
      locale,
      avatarUrl: avatarUrl || null,
      image: avatarUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return { success: true };
}
