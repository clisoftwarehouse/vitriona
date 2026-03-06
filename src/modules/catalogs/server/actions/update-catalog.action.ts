'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, businesses } from '@/db/schema';
import type { UpdateCatalogFormValues } from '@/modules/catalogs/ui/schemas/catalog.schemas';

export async function updateCatalogAction(catalogId: string, values: UpdateCatalogFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1);

    if (!catalog) return { error: 'Catálogo no encontrado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);

    if (!business) return { error: 'No autorizado' };

    await db
      .update(catalogs)
      .set({
        name: values.name,
        description: values.description || null,
        updatedAt: new Date(),
      })
      .where(eq(catalogs.id, catalogId));

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al actualizar el catálogo.' };
  }
}
