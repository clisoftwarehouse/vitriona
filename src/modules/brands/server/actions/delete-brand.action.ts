'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { brands, businesses } from '@/db/schema';

export async function deleteBrandAction(brandId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
    if (!brand) return { error: 'Marca no encontrada' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, brand.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    await db.delete(brands).where(eq(brands.id, brandId));

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al eliminar la marca.' };
  }
}
