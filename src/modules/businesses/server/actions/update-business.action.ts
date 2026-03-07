'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses } from '@/db/schema';
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
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        whatsappNumber: values.whatsappNumber || null,
        logoUrl: values.logoUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al actualizar el negocio.' };
  }
}
