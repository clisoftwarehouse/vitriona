'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { businesses } from '@/db/schema';
import { notDeletedBusiness } from '@/db/soft-delete';

export async function getBusinessesAction() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db
    .select()
    .from(businesses)
    .where(and(eq(businesses.userId, session.user.id), notDeletedBusiness))
    .orderBy(businesses.createdAt);
}

export async function getBusinessByIdAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [business] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);

  return business ?? null;
}
