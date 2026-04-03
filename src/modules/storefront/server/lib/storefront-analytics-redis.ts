import type Redis from 'ioredis';

import { getRedis } from '@/lib/redis';
import {
  type StorefrontAnalyticsEventType,
  STOREFRONT_ANALYTICS_RETENTION_DAYS,
} from '@/modules/storefront/lib/storefront-analytics';

interface GeoLocationInput {
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
}

interface TrackStorefrontAnalyticsRedisEventInput {
  businessId: string;
  eventType: StorefrontAnalyticsEventType;
  path: string;
  sessionId?: string;
  productId?: string;
  productName?: string;
  productSlug?: string;
  location?: GeoLocationInput;
}

interface ProductMeta {
  name: string | null;
  slug: string | null;
}

const RETENTION_TTL_SECONDS = STOREFRONT_ANALYTICS_RETENTION_DAYS * 24 * 60 * 60;

type RedisPipeline = ReturnType<Redis['pipeline']>;

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getHourKey(date: Date) {
  return String(date.getUTCHours()).padStart(2, '0');
}

function withExpiry(pipeline: RedisPipeline, key: string) {
  pipeline.expire(key, RETENTION_TTL_SECONDS);
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function serializeLocalityMember(location?: GeoLocationInput) {
  const countryCode = normalizeText(location?.countryCode)?.toUpperCase() ?? null;
  const region = normalizeText(location?.region);
  const city = normalizeText(location?.city);

  if (!countryCode && !region && !city) {
    return null;
  }

  return JSON.stringify({
    countryCode,
    region,
    city,
  });
}

export function parseLocalityMember(member: string) {
  try {
    const parsed = JSON.parse(member) as GeoLocationInput;

    return {
      countryCode: normalizeText(parsed.countryCode)?.toUpperCase() ?? null,
      region: normalizeText(parsed.region),
      city: normalizeText(parsed.city),
    };
  } catch {
    return {
      countryCode: null,
      region: null,
      city: null,
    };
  }
}

export function getAnalyticsDateKeys(days: number, startOffsetDays = 0) {
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1) + startOffsetDays);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);
    return getDateKey(date);
  });
}

export function getStorefrontAnalyticsSummaryKey(businessId: string, dateKey: string) {
  return `sf:analytics:${businessId}:summary:${dateKey}`;
}

export function getStorefrontAnalyticsUniqueKey(businessId: string, dateKey: string) {
  return `sf:analytics:${businessId}:unique:${dateKey}`;
}

export function getStorefrontAnalyticsHourlySummaryKey(businessId: string, dateKey: string, hourKey: string) {
  return `sf:analytics:${businessId}:hourly-summary:${dateKey}:${hourKey}`;
}

export function getStorefrontAnalyticsHourlyUniqueKey(businessId: string, dateKey: string, hourKey: string) {
  return `sf:analytics:${businessId}:hourly-unique:${dateKey}:${hourKey}`;
}

export function getStorefrontAnalyticsCountryKey(businessId: string, dateKey: string) {
  return `sf:analytics:${businessId}:country:${dateKey}`;
}

export function getStorefrontAnalyticsLocalityKey(businessId: string, dateKey: string) {
  return `sf:analytics:${businessId}:locality:${dateKey}`;
}

export function getStorefrontAnalyticsPageKey(businessId: string, dateKey: string) {
  return `sf:analytics:${businessId}:page:${dateKey}`;
}

export function getStorefrontAnalyticsProductKey(businessId: string, dateKey: string) {
  return `sf:analytics:${businessId}:product:${dateKey}`;
}

export function getStorefrontAnalyticsProductMetaKey(businessId: string, productId: string) {
  return `sf:analytics:${businessId}:product-meta:${productId}`;
}

export async function readStorefrontProductMeta(businessId: string, productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, ProductMeta>();
  }

  const client = getRedis();
  const pipeline = client.pipeline();

  productIds.forEach((productId) => {
    pipeline.hgetall(getStorefrontAnalyticsProductMetaKey(businessId, productId));
  });

  const results = await pipeline.exec();
  const metaMap = new Map<string, ProductMeta>();

  productIds.forEach((productId, index) => {
    const payload = results?.[index]?.[1];

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const productMeta = payload as Record<string, string>;
      metaMap.set(productId, {
        name: normalizeText(productMeta.name),
        slug: normalizeText(productMeta.slug),
      });
    }
  });

  return metaMap;
}

export async function trackStorefrontAnalyticsRedisEvent({
  businessId,
  eventType,
  path,
  sessionId,
  productId,
  productName,
  productSlug,
  location,
}: TrackStorefrontAnalyticsRedisEventInput) {
  const client = getRedis();
  const pipeline = client.pipeline();
  const now = new Date();
  const dateKey = getDateKey(now);
  const hourKey = getHourKey(now);
  const summaryKey = getStorefrontAnalyticsSummaryKey(businessId, dateKey);
  const hourlySummaryKey = getStorefrontAnalyticsHourlySummaryKey(businessId, dateKey, hourKey);
  const countsAsVisit = eventType === 'storefront_view' || eventType === 'product_view';

  if (countsAsVisit) {
    pipeline.hincrby(summaryKey, 'visits', 1);
    withExpiry(pipeline, summaryKey);

    pipeline.hincrby(hourlySummaryKey, 'visits', 1);
    withExpiry(pipeline, hourlySummaryKey);

    if (sessionId) {
      const uniqueKey = getStorefrontAnalyticsUniqueKey(businessId, dateKey);
      pipeline.pfadd(uniqueKey, sessionId);
      withExpiry(pipeline, uniqueKey);

      const hourlyUniqueKey = getStorefrontAnalyticsHourlyUniqueKey(businessId, dateKey, hourKey);
      pipeline.pfadd(hourlyUniqueKey, sessionId);
      withExpiry(pipeline, hourlyUniqueKey);
    }

    const pageKey = getStorefrontAnalyticsPageKey(businessId, dateKey);
    pipeline.zincrby(pageKey, 1, path);
    withExpiry(pipeline, pageKey);

    const normalizedCountryCode = normalizeText(location?.countryCode)?.toUpperCase();

    if (normalizedCountryCode) {
      const countryKey = getStorefrontAnalyticsCountryKey(businessId, dateKey);
      pipeline.zincrby(countryKey, 1, normalizedCountryCode);
      withExpiry(pipeline, countryKey);
    }

    const localityMember = serializeLocalityMember(location);

    if (localityMember) {
      const localityKey = getStorefrontAnalyticsLocalityKey(businessId, dateKey);
      pipeline.zincrby(localityKey, 1, localityMember);
      withExpiry(pipeline, localityKey);
    }
  }

  if (eventType === 'product_view' && productId) {
    pipeline.hincrby(summaryKey, 'productViews', 1);
    withExpiry(pipeline, summaryKey);

    pipeline.hincrby(hourlySummaryKey, 'productViews', 1);
    withExpiry(pipeline, hourlySummaryKey);

    const productKey = getStorefrontAnalyticsProductKey(businessId, dateKey);
    pipeline.zincrby(productKey, 1, productId);
    withExpiry(pipeline, productKey);

    if (productName || productSlug) {
      const productMetaKey = getStorefrontAnalyticsProductMetaKey(businessId, productId);
      pipeline.hset(productMetaKey, {
        ...(productName ? { name: productName } : {}),
        ...(productSlug ? { slug: productSlug } : {}),
      });
      withExpiry(pipeline, productMetaKey);
    }
  }

  await pipeline.exec();
}
