'use server';

import { eq, and, inArray } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { getRedis } from '@/lib/redis';
import { products, businesses } from '@/db/schema';
import { notDeletedBusiness } from '@/db/soft-delete';
import { type DashboardTimeframe, getDashboardTimeframeMeta } from '@/modules/dashboard/lib/dashboard-timeframe';
import { getCountryNameFromCode, formatStorefrontLocationLabel } from '@/modules/storefront/lib/storefront-analytics';
import {
  parseLocalityMember,
  readStorefrontProductMeta,
  getStorefrontAnalyticsPageKey,
  getStorefrontAnalyticsUniqueKey,
  getStorefrontAnalyticsCountryKey,
  getStorefrontAnalyticsProductKey,
  getStorefrontAnalyticsSummaryKey,
  getStorefrontAnalyticsLocalityKey,
  getStorefrontAnalyticsHourlyUniqueKey,
  getStorefrontAnalyticsHourlySummaryKey,
} from '@/modules/storefront/server/lib/storefront-analytics-redis';

interface DailySummary {
  visits: number;
  productViews: number;
}

export interface StorefrontAnalyticsResult {
  businessName: string;
  businessSlug: string;
  windowDays: number;
  summary: {
    totalVisits: number;
    previousVisits: number;
    uniqueVisitors: number;
    previousUniqueVisitors: number;
    productViews: number;
    previousProductViews: number;
    countryCount: number;
    topCountry: { code: string; name: string; visits: number } | null;
  };
  dailyTraffic: { date: string; visits: number; uniqueVisitors: number; productViews: number }[];
  countries: { code: string; name: string; visits: number }[];
  localities: { label: string; city: string | null; region: string | null; country: string | null; visits: number }[];
  topViewedProducts: { productId: string; name: string; slug: string | null; views: number }[];
  topPages: { path: string; label: string; visits: number }[];
}

function safeDecodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment).replace(/-/g, ' ');
  } catch {
    return segment;
  }
}

function formatStorefrontPath(path: string, businessSlug: string) {
  const businessPrefix = `/${businessSlug}`;
  let normalizedPath = path.startsWith(businessPrefix) ? path.slice(businessPrefix.length) : path;

  if (!normalizedPath) {
    normalizedPath = '/';
  }

  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }

  if (normalizedPath === '/') {
    return 'Portada del storefront';
  }

  const segments = normalizedPath.split('/').filter(Boolean);

  if (segments[0] === 'producto' && segments[1]) {
    return `Producto · ${safeDecodeSegment(segments[1])}`;
  }

  if (segments[0] === 'checkout') {
    return 'Checkout';
  }

  if (segments[0] === 'pedido-confirmado') {
    return 'Pedido confirmado';
  }

  if (segments.length === 1) {
    return `Catálogo · ${safeDecodeSegment(segments[0])}`;
  }

  return normalizedPath;
}

function asNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function parseDailySummary(value: unknown): DailySummary {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { visits: 0, productViews: 0 };
  }

  const summary = value as Record<string, string>;

  return {
    visits: asNumber(summary.visits),
    productViews: asNumber(summary.productViews),
  };
}

function parseSortedSet(value: unknown) {
  const counts = new Map<string, number>();

  if (!Array.isArray(value)) {
    return counts;
  }

  for (let index = 0; index < value.length; index += 2) {
    const member = value[index];
    const score = value[index + 1];

    if (typeof member === 'string') {
      counts.set(member, asNumber(score));
    }
  }

  return counts;
}

function mergeCounts(target: Map<string, number>, source: Map<string, number>) {
  source.forEach((value, key) => {
    target.set(key, (target.get(key) ?? 0) + value);
  });
}

function sortCounts<T>(counts: Map<string, number>, mapEntry: (key: string, value: number) => T, limit: number) {
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([key, value]) => mapEntry(key, value));
}

function createEmptyAnalyticsResult(
  businessName: string,
  businessSlug: string,
  currentDateKeys: string[],
  chartKeys: string[]
): StorefrontAnalyticsResult {
  return {
    businessName,
    businessSlug,
    windowDays: currentDateKeys.length,
    summary: {
      totalVisits: 0,
      previousVisits: 0,
      uniqueVisitors: 0,
      previousUniqueVisitors: 0,
      productViews: 0,
      previousProductViews: 0,
      countryCount: 0,
      topCountry: null,
    },
    dailyTraffic: chartKeys.map((date) => ({
      date,
      visits: 0,
      uniqueVisitors: 0,
      productViews: 0,
    })),
    countries: [],
    localities: [],
    topViewedProducts: [],
    topPages: [],
  };
}

export async function getStorefrontAnalytics(
  businessId: string,
  timeframe: DashboardTimeframe
): Promise<StorefrontAnalyticsResult | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [business] = await db
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);

  if (!business) {
    return null;
  }

  const timeframeMeta = getDashboardTimeframeMeta(timeframe);
  const currentDateKeys = timeframeMeta.currentDateKeys;
  const previousDateKeys = timeframeMeta.previousDateKeys;
  const chartKeys = timeframeMeta.chartBuckets;
  const currentDateKey = currentDateKeys[0] ?? timeframeMeta.currentStart.toISOString().slice(0, 10);

  try {
    const client = getRedis();
    const pipeline = client.pipeline();
    const parsers: Array<(value: unknown) => unknown> = [];

    function queue<T>(command: () => void, parse: (value: unknown) => T) {
      const index = parsers.length;
      command();
      parsers.push(parse as (value: unknown) => unknown);
      return index;
    }

    const currentSummaryIndexes = currentDateKeys.map((dateKey) =>
      queue(() => pipeline.hgetall(getStorefrontAnalyticsSummaryKey(businessId, dateKey)), parseDailySummary)
    );
    const previousSummaryIndexes = previousDateKeys.map((dateKey) =>
      queue(() => pipeline.hgetall(getStorefrontAnalyticsSummaryKey(businessId, dateKey)), parseDailySummary)
    );
    const currentDailyUniqueIndexes =
      timeframeMeta.chartGranularity === 'hour'
        ? chartKeys.map((hourKey) =>
            queue(
              () => pipeline.pfcount(getStorefrontAnalyticsHourlyUniqueKey(businessId, currentDateKey, hourKey)),
              asNumber
            )
          )
        : currentDateKeys.map((dateKey) =>
            queue(() => pipeline.pfcount(getStorefrontAnalyticsUniqueKey(businessId, dateKey)), asNumber)
          );
    const currentTrafficSummaryIndexes =
      timeframeMeta.chartGranularity === 'hour'
        ? chartKeys.map((hourKey) =>
            queue(
              () => pipeline.hgetall(getStorefrontAnalyticsHourlySummaryKey(businessId, currentDateKey, hourKey)),
              parseDailySummary
            )
          )
        : currentSummaryIndexes;
    const currentCountryIndexes = currentDateKeys.map((dateKey) =>
      queue(
        () => pipeline.zrevrange(getStorefrontAnalyticsCountryKey(businessId, dateKey), 0, -1, 'WITHSCORES'),
        parseSortedSet
      )
    );
    const currentLocalityIndexes = currentDateKeys.map((dateKey) =>
      queue(
        () => pipeline.zrevrange(getStorefrontAnalyticsLocalityKey(businessId, dateKey), 0, -1, 'WITHSCORES'),
        parseSortedSet
      )
    );
    const currentPageIndexes = currentDateKeys.map((dateKey) =>
      queue(
        () => pipeline.zrevrange(getStorefrontAnalyticsPageKey(businessId, dateKey), 0, -1, 'WITHSCORES'),
        parseSortedSet
      )
    );
    const currentProductIndexes = currentDateKeys.map((dateKey) =>
      queue(
        () => pipeline.zrevrange(getStorefrontAnalyticsProductKey(businessId, dateKey), 0, -1, 'WITHSCORES'),
        parseSortedSet
      )
    );
    const currentUniqueVisitorsIndex = queue(
      () => pipeline.pfcount(...currentDateKeys.map((dateKey) => getStorefrontAnalyticsUniqueKey(businessId, dateKey))),
      asNumber
    );
    const previousUniqueVisitorsIndex = queue(
      () =>
        pipeline.pfcount(...previousDateKeys.map((dateKey) => getStorefrontAnalyticsUniqueKey(businessId, dateKey))),
      asNumber
    );

    const results = await pipeline.exec();

    if (!results) {
      return createEmptyAnalyticsResult(business.name, business.slug, currentDateKeys, chartKeys);
    }

    const parsedResults = results.map(([error, value], index) => {
      if (error) {
        throw error;
      }

      return parsers[index](value);
    });

    const currentSummaries = currentSummaryIndexes.map((index) => parsedResults[index] as DailySummary);
    const previousSummaries = previousSummaryIndexes.map((index) => parsedResults[index] as DailySummary);
    const currentTrafficSummaries = currentTrafficSummaryIndexes.map((index) => parsedResults[index] as DailySummary);
    const currentDailyUniqueVisitors = currentDailyUniqueIndexes.map((index) => asNumber(parsedResults[index]));

    const countryCounts = new Map<string, number>();
    currentCountryIndexes.forEach((index) => mergeCounts(countryCounts, parsedResults[index] as Map<string, number>));

    const localityCounts = new Map<string, number>();
    currentLocalityIndexes.forEach((index) => mergeCounts(localityCounts, parsedResults[index] as Map<string, number>));

    const pageCounts = new Map<string, number>();
    currentPageIndexes.forEach((index) => mergeCounts(pageCounts, parsedResults[index] as Map<string, number>));

    const productCounts = new Map<string, number>();
    currentProductIndexes.forEach((index) => mergeCounts(productCounts, parsedResults[index] as Map<string, number>));

    const dailyTraffic = chartKeys.map((date, index) => ({
      date,
      visits: currentTrafficSummaries[index]?.visits ?? 0,
      uniqueVisitors: currentDailyUniqueVisitors[index] ?? 0,
      productViews: currentTrafficSummaries[index]?.productViews ?? 0,
    }));

    const totalVisits = currentSummaries.reduce((sum, summary) => sum + summary.visits, 0);
    const previousVisits = previousSummaries.reduce((sum, summary) => sum + summary.visits, 0);
    const productViews = currentSummaries.reduce((sum, summary) => sum + summary.productViews, 0);
    const previousProductViews = previousSummaries.reduce((sum, summary) => sum + summary.productViews, 0);

    const countries = sortCounts(
      countryCounts,
      (code, visits) => ({
        code,
        name: getCountryNameFromCode(code) ?? code,
        visits,
      }),
      10
    );

    const topCountry = countries[0] ?? null;

    const localities = sortCounts(
      localityCounts,
      (member, visits) => {
        const location = parseLocalityMember(member);
        const country = getCountryNameFromCode(location.countryCode);

        return {
          label: formatStorefrontLocationLabel({
            city: location.city,
            region: location.region,
            country,
            countryCode: location.countryCode,
          }),
          city: location.city,
          region: location.region,
          country,
          visits,
        };
      },
      8
    );

    const topPages = sortCounts(
      pageCounts,
      (path, visits) => ({
        path,
        label: formatStorefrontPath(path, business.slug),
        visits,
      }),
      8
    );

    const topProductEntries = sortCounts(
      productCounts,
      (productId, views) => ({
        productId,
        views,
      }),
      8
    );

    const topProductIds = topProductEntries.map((product) => product.productId);
    const redisProductMeta = await readStorefrontProductMeta(businessId, topProductIds);

    const missingProductIds = topProductIds.filter((productId) => {
      const meta = redisProductMeta.get(productId);
      return !meta?.name || !meta.slug;
    });

    const fallbackProducts = missingProductIds.length
      ? await db
          .select({ id: products.id, name: products.name, slug: products.slug })
          .from(products)
          .where(and(eq(products.businessId, businessId), inArray(products.id, missingProductIds)))
      : [];

    const fallbackProductMap = new Map(fallbackProducts.map((product) => [product.id, product]));

    const topViewedProducts = topProductEntries.map(({ productId, views }) => {
      const redisMeta = redisProductMeta.get(productId);
      const fallbackMeta = fallbackProductMap.get(productId);

      return {
        productId,
        name: redisMeta?.name ?? fallbackMeta?.name ?? 'Producto sin nombre',
        slug: redisMeta?.slug ?? fallbackMeta?.slug ?? null,
        views,
      };
    });

    return {
      businessName: business.name,
      businessSlug: business.slug,
      windowDays: currentDateKeys.length,
      summary: {
        totalVisits,
        previousVisits,
        uniqueVisitors: asNumber(parsedResults[currentUniqueVisitorsIndex]),
        previousUniqueVisitors: asNumber(parsedResults[previousUniqueVisitorsIndex]),
        productViews,
        previousProductViews,
        countryCount: countryCounts.size,
        topCountry,
      },
      dailyTraffic,
      countries,
      localities,
      topViewedProducts,
      topPages,
    };
  } catch {
    return createEmptyAnalyticsResult(business.name, business.slug, currentDateKeys, chartKeys);
  }
}
