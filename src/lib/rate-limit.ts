import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL environment variable is not set');
    redis = new Redis(url);
  }
  return redis;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Sliding-window rate limiter backed by Redis.
 * @param key   Unique identifier (e.g. "login:192.168.1.1" or "chat:business-id")
 * @param limit Max number of requests allowed in the window
 * @param windowSeconds Duration of the sliding window in seconds
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const client = getRedis();
  const redisKey = `rl:${key}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const pipe = client.pipeline();
  // Remove entries outside the window
  pipe.zremrangebyscore(redisKey, 0, now - windowMs);
  // Add current request
  pipe.zadd(redisKey, now, `${now}:${Math.random()}`);
  // Count entries in window
  pipe.zcard(redisKey);
  // Set expiry on the key
  pipe.expire(redisKey, windowSeconds);

  const results = await pipe.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;

  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    resetInSeconds: windowSeconds,
  };
}

/**
 * Helper to extract a client identifier from request headers.
 * Uses x-forwarded-for → x-real-ip → fallback.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Rate limit helper for Server Actions (no Request object available).
 * Falls back to a provided identifier (e.g. email, businessId).
 */
export async function rateLimitAction(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  return rateLimit(`${action}:${identifier}`, limit, windowSeconds);
}
