'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { notDeletedUser, notDeletedBusiness } from '@/db/soft-delete';
import { users, accounts, businesses, userPreferences } from '@/db/schema';

export async function getUserProfileAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado' };

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      phone: users.phone,
      timezone: users.timezone,
      locale: users.locale,
      avatarUrl: users.avatarUrl,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, session.user.id), notDeletedUser))
    .limit(1);

  if (!user) return { error: 'Usuario no encontrado' };

  const accountList = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(eq(accounts.userId, session.user.id));

  const hasPassword = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
    .then(([u]) => !!u?.password);

  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

  const businessList = await db
    .select({ id: businesses.id, name: businesses.name, logoUrl: businesses.logoUrl })
    .from(businesses)
    .where(and(eq(businesses.userId, session.user.id), notDeletedBusiness));

  return {
    user,
    providers: accountList.map((a) => a.provider),
    hasPassword,
    preferences: preferences ?? null,
    businesses: businessList,
  };
}
