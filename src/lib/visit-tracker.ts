import { getRedis } from '@/lib/redis';

/**
 * Redis-based visit counter for storefronts.
 * Key format: visits:{businessId}:{YYYY-MM}
 * Uses INCR for atomic O(1) increments.
 * TTL: 35 days so keys auto-expire after the month ends.
 */

const TTL_SECONDS = 35 * 24 * 60 * 60; // 35 days

function getKey(businessId: string): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `visits:${businessId}:${yearMonth}`;
}

/**
 * Increment the visit counter for a business. Fire-and-forget safe.
 * Returns the new count after increment.
 */
export async function incrementVisit(businessId: string): Promise<number> {
  const client = getRedis();
  const key = getKey(businessId);
  const count = await client.incr(key);
  // Set TTL only on first visit of the month (count === 1)
  if (count === 1) {
    await client.expire(key, TTL_SECONDS);
  }
  return count;
}

/**
 * Get the current visit count for a business this month.
 */
export async function getVisitCount(businessId: string): Promise<number> {
  const client = getRedis();
  const key = getKey(businessId);
  const val = await client.get(key);
  return val ? parseInt(val, 10) : 0;
}
