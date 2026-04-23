'use server';

import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { notDeletedBusiness } from '@/db/soft-delete';
import { businesses, userPreferences } from '@/db/schema';

const ACTIVE_BUSINESS_COOKIE = 'active_business_id';

export async function setActiveBusinessAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);

  if (!business) return { error: 'Negocio no encontrado' };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return { success: true };
}

export async function getActiveBusinessId(): Promise<string | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  if (fromCookie) return fromCookie;

  // Fallback: check user_preferences.defaultBusinessId
  const session = await auth();
  if (!session?.user?.id) return null;

  const [prefs] = await db
    .select({ defaultBusinessId: userPreferences.defaultBusinessId })
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

  return prefs?.defaultBusinessId ?? null;
}

export async function getActiveBusinessAction() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const activeId = await getActiveBusinessId();

  if (activeId) {
    const [business] = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, activeId), eq(businesses.userId, session.user.id), notDeletedBusiness))
      .limit(1);

    if (business) return business;
  }

  const [firstBusiness] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);

  if (firstBusiness) {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_BUSINESS_COOKIE, firstBusiness.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
  }

  return firstBusiness ?? null;
}
