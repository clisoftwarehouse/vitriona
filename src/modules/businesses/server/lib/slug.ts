import { eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { businesses } from '@/db/schema';

export { generateSlug } from '@/modules/businesses/lib/slug';

export async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const [existing] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    if (!existing || existing.id === excludeId) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
}
