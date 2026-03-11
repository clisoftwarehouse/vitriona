'use server';

import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { userPreferences } from '@/db/schema';
import { updatePreferencesSchema, type UpdatePreferencesFormValues } from '@/modules/users/ui/schemas/user.schemas';

export async function updateUserPreferencesAction(values: UpdatePreferencesFormValues) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const parsed = updatePreferencesSchema.safeParse(values);
  if (!parsed.success) return { error: 'Datos inválidos' };

  const { theme, sidebarCollapsed, defaultBusinessId } = parsed.data;

  const [existing] = await db
    .select({ id: userPreferences.id })
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

  if (existing) {
    await db
      .update(userPreferences)
      .set({ theme, sidebarCollapsed, defaultBusinessId })
      .where(eq(userPreferences.id, existing.id));
  } else {
    await db.insert(userPreferences).values({
      userId: session.user.id,
      theme,
      sidebarCollapsed,
      defaultBusinessId,
    });
  }

  return { success: true };
}
