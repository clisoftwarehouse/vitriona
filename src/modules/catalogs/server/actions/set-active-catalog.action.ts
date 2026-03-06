'use server';

import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, businesses } from '@/db/schema';

const ACTIVE_CATALOG_COOKIE = 'active_catalog_id';

export async function setActiveCatalogAction(catalogId: string) {
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

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CATALOG_COOKIE, catalogId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return { success: true, businessId: catalog.businessId };
}

export async function getActiveCatalogId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_CATALOG_COOKIE)?.value ?? null;
}

export async function getActiveCatalogAction() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const activeId = await getActiveCatalogId();

  if (activeId) {
    const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, activeId)).limit(1);

    if (catalog) {
      const [business] = await db
        .select({ id: businesses.id, name: businesses.name })
        .from(businesses)
        .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
        .limit(1);

      if (business) return { ...catalog, businessName: business.name };
    }
  }

  // Fallback: first catalog of the first business
  const [firstBusiness] = await db.select().from(businesses).where(eq(businesses.userId, session.user.id)).limit(1);

  if (!firstBusiness) return null;

  const [firstCatalog] = await db.select().from(catalogs).where(eq(catalogs.businessId, firstBusiness.id)).limit(1);

  if (firstCatalog) {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_CATALOG_COOKIE, firstCatalog.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
    return { ...firstCatalog, businessName: firstBusiness.name };
  }

  return null;
}

export async function getAllCatalogsForSidebar() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userBusinesses = await db
    .select({ id: businesses.id, name: businesses.name })
    .from(businesses)
    .where(eq(businesses.userId, session.user.id));

  if (userBusinesses.length === 0) return [];

  const allCatalogs = [];
  for (const business of userBusinesses) {
    const businessCatalogs = await db
      .select()
      .from(catalogs)
      .where(eq(catalogs.businessId, business.id))
      .orderBy(catalogs.createdAt);

    for (const catalog of businessCatalogs) {
      allCatalogs.push({
        id: catalog.id,
        name: catalog.name,
        businessId: business.id,
        businessName: business.name,
      });
    }
  }

  return allCatalogs;
}
