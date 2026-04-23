'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, businesses } from '@/db/schema';
import { notDeletedBusiness } from '@/db/soft-delete';

export async function deleteCatalogAction(catalogId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1);

    if (!catalog) return { error: 'Catálogo no encontrado' };

    if (catalog.isDefault) return { error: 'No puedes eliminar el catálogo por defecto.' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
      .limit(1);

    if (!business) return { error: 'No autorizado' };

    await db.delete(catalogs).where(eq(catalogs.id, catalogId));

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al eliminar el catálogo.' };
  }
}
