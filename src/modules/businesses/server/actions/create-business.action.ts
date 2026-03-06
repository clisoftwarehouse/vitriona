'use server';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses } from '@/db/schema';
import { ensureUniqueSlug } from '@/modules/businesses/server/lib/slug';
import { createDefaultCatalog } from '@/modules/catalogs/server/actions/create-catalog.action';
import type { CreateBusinessFormValues } from '@/modules/businesses/ui/schemas/business.schemas';

export async function createBusinessAction(values: CreateBusinessFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const slug = await ensureUniqueSlug(values.slug);

    const [business] = await db
      .insert(businesses)
      .values({
        userId: session.user.id,
        name: values.name,
        slug,
        description: values.description || null,
        category: values.category || null,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        whatsappNumber: values.whatsappNumber || null,
      })
      .returning({ id: businesses.id });

    await createDefaultCatalog(business.id);

    return { success: true, businessId: business.id };
  } catch {
    return { error: 'Ocurrió un error al crear el negocio. Inténtalo de nuevo.' };
  }
}
