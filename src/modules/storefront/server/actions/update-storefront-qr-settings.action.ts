'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses } from '@/db/schema';
import { type StorefrontQrSettings, storefrontQrSettingsSchema } from '@/modules/storefront/lib/storefront-qr';

export async function updateStorefrontQrSettingsAction(businessId: string, values: StorefrontQrSettings) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const parsed = storefrontQrSettingsSchema.safeParse(values);
    if (!parsed.success) return { error: 'Configuración de QR inválida' };

    const [existing] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
      .limit(1);

    if (!existing) return { error: 'Negocio no encontrado' };

    await db
      .update(businesses)
      .set({
        qrSettings: parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));

    return { success: true };
  } catch {
    return { error: 'No se pudo guardar la configuración del QR.' };
  }
}
