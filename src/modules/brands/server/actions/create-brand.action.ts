'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { brands, businesses } from '@/db/schema';
import { notDeletedBusiness } from '@/db/soft-delete';
import { generateSlug } from '@/modules/businesses/lib/slug';
import type { CreateBrandFormValues } from '@/modules/brands/ui/schemas/brand.schemas';

export async function createBrandAction(businessId: string, values: CreateBrandFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    const existing = await db
      .select({ sortOrder: brands.sortOrder })
      .from(brands)
      .where(eq(brands.businessId, business.id))
      .orderBy(brands.sortOrder);

    const nextOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0;

    const [brand] = await db
      .insert(brands)
      .values({
        businessId: business.id,
        name: values.name,
        slug: generateSlug(values.name),
        logoUrl: values.logoUrl || null,
        sortOrder: nextOrder,
      })
      .returning({ id: brands.id });

    return { success: true, brandId: brand.id };
  } catch {
    return { error: 'Ocurrió un error al crear la marca.' };
  }
}
