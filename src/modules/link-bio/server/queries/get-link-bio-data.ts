import { cache } from 'react';
import { eq, asc, and } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

import { db } from '@/db/drizzle';
import { linkPages, businesses, linkPageLinks } from '@/db/schema';

const CACHE_LONG = 300;
const CACHE_SHORT = 30;

// ── Link page by business slug (public) ──────────────────────────────────────
export const getLinkPageBySlug = cache((slug: string) =>
  unstable_cache(
    async () => {
      const [business] = await db
        .select()
        .from(businesses)
        .where(and(eq(businesses.slug, slug), eq(businesses.isActive, true)))
        .limit(1);

      if (!business) return null;

      const [page] = await db
        .select()
        .from(linkPages)
        .where(and(eq(linkPages.businessId, business.id), eq(linkPages.isActive, true)))
        .limit(1);

      if (!page) return null;

      const links = await db
        .select()
        .from(linkPageLinks)
        .where(and(eq(linkPageLinks.linkPageId, page.id), eq(linkPageLinks.isActive, true)))
        .orderBy(asc(linkPageLinks.sortOrder));

      return { business, page, links };
    },
    [`link-page-slug-${slug}`],
    { revalidate: CACHE_LONG, tags: [`link-page-${slug}`] }
  )()
);

// ── Link page by business ID (dashboard) ─────────────────────────────────────
export const getLinkPageByBusinessId = cache((businessId: string) =>
  unstable_cache(
    async () => {
      const [page] = await db.select().from(linkPages).where(eq(linkPages.businessId, businessId)).limit(1);

      if (!page) return null;

      const links = await db
        .select()
        .from(linkPageLinks)
        .where(eq(linkPageLinks.linkPageId, page.id))
        .orderBy(asc(linkPageLinks.sortOrder));

      return { page, links };
    },
    [`link-page-business-${businessId}`],
    { revalidate: CACHE_SHORT, tags: [`link-page-business-${businessId}`] }
  )()
);
