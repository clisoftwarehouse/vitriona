'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses } from '@/db/schema';
import { notDeletedBusiness } from '@/db/soft-delete';

export async function deleteBusinessAction(businessId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [existing] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
      .limit(1);

    if (!existing) return { error: 'Negocio no encontrado' };

    const now = new Date();
    await db
      .update(businesses)
      .set({ deletedAt: now, deletedBy: session.user.id, updatedAt: now, isActive: false })
      .where(eq(businesses.id, businessId));

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al eliminar el negocio.' };
  }
}
