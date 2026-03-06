'use server';

import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, businesses, catalogSettings } from '@/db/schema';
import type { CreateCatalogFormValues } from '@/modules/catalogs/ui/schemas/catalog.schemas';

export async function createCatalogAction(businessId: string, values: CreateCatalogFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business) return { error: 'Negocio no encontrado' };

    const [catalog] = await db
      .insert(catalogs)
      .values({
        businessId,
        name: values.name,
        description: values.description || null,
      })
      .returning({ id: catalogs.id });

    await db.insert(catalogSettings).values({ catalogId: catalog.id });

    return { success: true, catalogId: catalog.id };
  } catch {
    return { error: 'Ocurrió un error al crear el catálogo.' };
  }
}

export async function createDefaultCatalog(businessId: string) {
  const [catalog] = await db
    .insert(catalogs)
    .values({
      businessId,
      name: 'Catálogo principal',
      isDefault: true,
    })
    .returning({ id: catalogs.id });

  await db.insert(catalogSettings).values({ catalogId: catalog.id });

  return catalog;
}
