'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses } from '@/db/schema';

export async function getBusinessesAction() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.select().from(businesses).where(eq(businesses.userId, session.user.id)).orderBy(businesses.createdAt);
}

export async function getBusinessByIdAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [business] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);

  return business ?? null;
}
