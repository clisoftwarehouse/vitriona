'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses } from '@/db/schema';
import { revalidateAllStorefrontCache } from '@/lib/cache-revalidation';
import { ensureUniqueSlug } from '@/modules/businesses/server/lib/slug';
import type { UpdateBusinessFormValues } from '@/modules/businesses/ui/schemas/business.schemas';

export async function updateBusinessAction(businessId: string, values: UpdateBusinessFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [existing] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
      .limit(1);

    if (!existing) return { error: 'Negocio no encontrado' };

    const slug = await ensureUniqueSlug(values.slug, businessId);

    await db
      .update(businesses)
      .set({
        name: values.name,
        slug,
        description: values.description || null,
        category: values.category || null,
        logoUrl: values.logoUrl || null,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        whatsappNumber: values.whatsappNumber || null,
        currency: values.currency || 'USD',
        timezone: values.timezone || null,
        locale: values.locale || 'es',
        website: values.website || null,
        instagramUrl: values.instagramUrl || null,
        facebookUrl: values.facebookUrl || null,
        tiktokUrl: values.tiktokUrl || null,
        twitterUrl: values.twitterUrl || null,
        youtubeUrl: values.youtubeUrl || null,
        country: values.country || null,
        city: values.city || null,
        state: values.state || null,
        zipCode: values.zipCode || null,
        taxId: values.taxId || null,
        businessHours: values.businessHours || null,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));

    revalidateAllStorefrontCache(businessId, slug);

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al actualizar el negocio.' };
  }
}
