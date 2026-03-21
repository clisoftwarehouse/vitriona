'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { brands, businesses } from '@/db/schema';

export async function getBrandsAction(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!business) return [];

  return db.select().from(brands).where(eq(brands.businessId, business.id)).orderBy(brands.sortOrder);
}
