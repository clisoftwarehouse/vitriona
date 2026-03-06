'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses } from '@/db/schema';

export async function deleteBusinessAction(businessId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [existing] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
      .limit(1);

    if (!existing) return { error: 'Negocio no encontrado' };

    await db.delete(businesses).where(eq(businesses.id, businessId));

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al eliminar el negocio.' };
  }
}
