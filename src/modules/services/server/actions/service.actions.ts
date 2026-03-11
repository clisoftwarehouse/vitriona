'use server';

import { eq, and, asc, desc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, services, businesses } from '@/db/schema';
import { generateSlug } from '@/modules/businesses/lib/slug';
import type { CreateServiceFormValues } from '@/modules/services/ui/schemas/service.schemas';

// ── Helpers ──

async function verifyCatalogOwnership(catalogId: string, userId: string) {
  const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1);
  if (!catalog) return null;

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, userId)))
    .limit(1);

  return business ? catalog : null;
}

// ── Actions ──

export async function getServicesAction(catalogId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const catalog = await verifyCatalogOwnership(catalogId, session.user.id);
  if (!catalog) return [];

  return db
    .select()
    .from(services)
    .where(eq(services.catalogId, catalogId))
    .orderBy(asc(services.sortOrder), desc(services.createdAt));
}

export async function getServiceByIdAction(serviceId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service) return null;

  const catalog = await verifyCatalogOwnership(service.catalogId, session.user.id);
  if (!catalog) return null;

  return service;
}

export async function createServiceAction(catalogId: string, values: CreateServiceFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const catalog = await verifyCatalogOwnership(catalogId, session.user.id);
    if (!catalog) return { error: 'No autorizado' };

    const [service] = await db
      .insert(services)
      .values({
        catalogId,
        categoryId: values.categoryId || null,
        name: values.name,
        slug: generateSlug(values.name),
        description: values.description || null,
        price: values.price,
        durationMinutes: values.durationMinutes ?? null,
        isActive: values.isActive,
      })
      .returning({ id: services.id });

    return { success: true, serviceId: service.id };
  } catch {
    return { error: 'Error al crear el servicio.' };
  }
}

export async function updateServiceAction(serviceId: string, values: CreateServiceFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service) return { error: 'Servicio no encontrado' };

    const catalog = await verifyCatalogOwnership(service.catalogId, session.user.id);
    if (!catalog) return { error: 'No autorizado' };

    await db
      .update(services)
      .set({
        categoryId: values.categoryId || null,
        name: values.name,
        slug: generateSlug(values.name),
        description: values.description || null,
        price: values.price,
        durationMinutes: values.durationMinutes ?? null,
        isActive: values.isActive,
        updatedAt: new Date(),
      })
      .where(eq(services.id, serviceId));

    return { success: true };
  } catch {
    return { error: 'Error al actualizar el servicio.' };
  }
}

export async function deleteServiceAction(serviceId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service) return { error: 'Servicio no encontrado' };

    const catalog = await verifyCatalogOwnership(service.catalogId, session.user.id);
    if (!catalog) return { error: 'No autorizado' };

    await db.delete(services).where(eq(services.id, serviceId));

    return { success: true };
  } catch {
    return { error: 'Error al eliminar el servicio.' };
  }
}
