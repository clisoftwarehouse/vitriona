'use server';

import { eq, and, gte, sql, desc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { products, businesses, storefrontAnalyticsEvents } from '@/db/schema';
import {
  formatStorefrontLocationLabel,
  STOREFRONT_ANALYTICS_WINDOW_DAYS,
} from '@/modules/storefront/lib/storefront-analytics';

function getWindowStart(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
}

function shiftDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
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

export async function getStorefrontAnalytics(businessId: string): Promise<StorefrontAnalyticsResult | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [business] = await db
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);

  if (!business) {
    return null;
  }

  const currentWindowStart = getWindowStart(STOREFRONT_ANALYTICS_WINDOW_DAYS);
  const previousWindowStart = shiftDays(currentWindowStart, -STOREFRONT_ANALYTICS_WINDOW_DAYS);

  const [currentSummary] = await db
    .select({
      totalVisits: sql<number>`count(*) filter (where ${storefrontAnalyticsEvents.eventType} = 'storefront_view')::int`,
      uniqueVisitors: sql<number>`count(distinct ${storefrontAnalyticsEvents.sessionId}) filter (where ${storefrontAnalyticsEvents.eventType} = 'storefront_view' and ${storefrontAnalyticsEvents.sessionId} is not null)::int`,
      productViews: sql<number>`count(*) filter (where ${storefrontAnalyticsEvents.eventType} = 'product_view')::int`,
      countryCount: sql<number>`count(distinct ${storefrontAnalyticsEvents.countryCode}) filter (where ${storefrontAnalyticsEvents.eventType} = 'storefront_view' and ${storefrontAnalyticsEvents.countryCode} is not null)::int`,
    })
    .from(storefrontAnalyticsEvents)
    .where(
      and(
        eq(storefrontAnalyticsEvents.businessId, businessId),
        gte(storefrontAnalyticsEvents.createdAt, currentWindowStart)
      )
    );

  const [previousSummary] = await db
    .select({
      totalVisits: sql<number>`count(*) filter (where ${storefrontAnalyticsEvents.eventType} = 'storefront_view')::int`,
      uniqueVisitors: sql<number>`count(distinct ${storefrontAnalyticsEvents.sessionId}) filter (where ${storefrontAnalyticsEvents.eventType} = 'storefront_view' and ${storefrontAnalyticsEvents.sessionId} is not null)::int`,
      productViews: sql<number>`count(*) filter (where ${storefrontAnalyticsEvents.eventType} = 'product_view')::int`,
    })
    .from(storefrontAnalyticsEvents)
    .where(
      and(
        eq(storefrontAnalyticsEvents.businessId, businessId),
        gte(storefrontAnalyticsEvents.createdAt, previousWindowStart),
        sql`${storefrontAnalyticsEvents.createdAt} < ${currentWindowStart}`
      )
    );

  const countryVisitsExpression = sql<number>`count(*)::int`;
  const localityVisitsExpression = sql<number>`count(*)::int`;
  const pageVisitsExpression = sql<number>`count(*)::int`;
  const productViewsExpression = sql<number>`count(*)::int`;
  const dailyKeyExpression = sql<string>`to_char(${storefrontAnalyticsEvents.createdAt}, 'YYYY-MM-DD')`;

  const countries = await db
    .select({
      code: storefrontAnalyticsEvents.countryCode,
      name: sql<string>`coalesce(max(${storefrontAnalyticsEvents.country}), max(${storefrontAnalyticsEvents.countryCode}), '')`,
      visits: countryVisitsExpression,
    })
    .from(storefrontAnalyticsEvents)
    .where(
      and(
        eq(storefrontAnalyticsEvents.businessId, businessId),
        eq(storefrontAnalyticsEvents.eventType, 'storefront_view'),
        gte(storefrontAnalyticsEvents.createdAt, currentWindowStart),
        sql`${storefrontAnalyticsEvents.countryCode} is not null`
      )
    )
    .groupBy(storefrontAnalyticsEvents.countryCode)
    .orderBy(desc(countryVisitsExpression))
    .limit(10);

  const topCountryRow = countries[0];

  const localityRows = await db
    .select({
      city: storefrontAnalyticsEvents.city,
      region: storefrontAnalyticsEvents.region,
      country: storefrontAnalyticsEvents.country,
      visits: localityVisitsExpression,
    })
    .from(storefrontAnalyticsEvents)
    .where(
      and(
        eq(storefrontAnalyticsEvents.businessId, businessId),
        eq(storefrontAnalyticsEvents.eventType, 'storefront_view'),
        gte(storefrontAnalyticsEvents.createdAt, currentWindowStart),
        sql`${storefrontAnalyticsEvents.city} is not null or ${storefrontAnalyticsEvents.region} is not null or ${storefrontAnalyticsEvents.country} is not null`
      )
    )
    .groupBy(storefrontAnalyticsEvents.city, storefrontAnalyticsEvents.region, storefrontAnalyticsEvents.country)
    .orderBy(desc(localityVisitsExpression))
    .limit(8);

  const dailyRows = await db
    .select({
      day: dailyKeyExpression,
      visits: sql<number>`count(*) filter (where ${storefrontAnalyticsEvents.eventType} = 'storefront_view')::int`,
      uniqueVisitors: sql<number>`count(distinct ${storefrontAnalyticsEvents.sessionId}) filter (where ${storefrontAnalyticsEvents.eventType} = 'storefront_view' and ${storefrontAnalyticsEvents.sessionId} is not null)::int`,
      productViews: sql<number>`count(*) filter (where ${storefrontAnalyticsEvents.eventType} = 'product_view')::int`,
    })
    .from(storefrontAnalyticsEvents)
    .where(
      and(
        eq(storefrontAnalyticsEvents.businessId, businessId),
        gte(storefrontAnalyticsEvents.createdAt, currentWindowStart)
      )
    )
    .groupBy(dailyKeyExpression)
    .orderBy(dailyKeyExpression);

  const topViewedProductsRows = await db
    .select({
      productId: storefrontAnalyticsEvents.productId,
      productName: sql<string>`coalesce(max(${storefrontAnalyticsEvents.productName}), max(${products.name}), 'Producto sin nombre')`,
      productSlug: sql<string | null>`max(${products.slug})`,
      views: productViewsExpression,
    })
    .from(storefrontAnalyticsEvents)
    .leftJoin(products, eq(storefrontAnalyticsEvents.productId, products.id))
    .where(
      and(
        eq(storefrontAnalyticsEvents.businessId, businessId),
        eq(storefrontAnalyticsEvents.eventType, 'product_view'),
        gte(storefrontAnalyticsEvents.createdAt, currentWindowStart),
        sql`${storefrontAnalyticsEvents.productId} is not null`
      )
    )
    .groupBy(storefrontAnalyticsEvents.productId)
    .orderBy(desc(productViewsExpression))
    .limit(8);

  const topPagesRows = await db
    .select({
      path: storefrontAnalyticsEvents.path,
      visits: pageVisitsExpression,
    })
    .from(storefrontAnalyticsEvents)
    .where(
      and(
        eq(storefrontAnalyticsEvents.businessId, businessId),
        eq(storefrontAnalyticsEvents.eventType, 'storefront_view'),
        gte(storefrontAnalyticsEvents.createdAt, currentWindowStart)
      )
    )
    .groupBy(storefrontAnalyticsEvents.path)
    .orderBy(desc(pageVisitsExpression))
    .limit(8);

  const dailyMap = new Map(dailyRows.map((row) => [row.day, row]));
  const dailyTraffic: StorefrontAnalyticsResult['dailyTraffic'] = [];

  for (let index = 0; index < STOREFRONT_ANALYTICS_WINDOW_DAYS; index++) {
    const currentDate = new Date(currentWindowStart);
    currentDate.setDate(currentDate.getDate() + index);

    const dayKey = currentDate.toISOString().slice(0, 10);
    const row = dailyMap.get(dayKey);

    dailyTraffic.push({
      date: dayKey,
      visits: asNumber(row?.visits),
      uniqueVisitors: asNumber(row?.uniqueVisitors),
      productViews: asNumber(row?.productViews),
    });
  }

  return {
    businessName: business.name,
    businessSlug: business.slug,
    windowDays: STOREFRONT_ANALYTICS_WINDOW_DAYS,
    summary: {
      totalVisits: asNumber(currentSummary?.totalVisits),
      previousVisits: asNumber(previousSummary?.totalVisits),
      uniqueVisitors: asNumber(currentSummary?.uniqueVisitors),
      previousUniqueVisitors: asNumber(previousSummary?.uniqueVisitors),
      productViews: asNumber(currentSummary?.productViews),
      previousProductViews: asNumber(previousSummary?.productViews),
      countryCount: asNumber(currentSummary?.countryCount),
      topCountry: topCountryRow?.code
        ? {
            code: topCountryRow.code,
            name: topCountryRow.name || topCountryRow.code,
            visits: asNumber(topCountryRow.visits),
          }
        : null,
    },
    dailyTraffic,
    countries: countries
      .filter((country) => !!country.code)
      .map((country) => ({
        code: country.code as string,
        name: country.name || (country.code as string),
        visits: asNumber(country.visits),
      })),
    localities: localityRows.map((location) => ({
      label: formatStorefrontLocationLabel(location),
      city: location.city,
      region: location.region,
      country: location.country,
      visits: asNumber(location.visits),
    })),
    topViewedProducts: topViewedProductsRows
      .filter((product) => !!product.productId)
      .map((product) => ({
        productId: product.productId as string,
        name: product.productName,
        slug: product.productSlug,
        views: asNumber(product.views),
      })),
    topPages: topPagesRows.map((page) => ({
      path: page.path,
      label: formatStorefrontPath(page.path, business.slug),
      visits: asNumber(page.visits),
    })),
  };
}
