import { z } from 'zod';

export const STOREFRONT_ANALYTICS_WINDOW_DAYS = 30;
export const STOREFRONT_ANALYTICS_RETENTION_DAYS = 90;
export const STOREFRONT_ANALYTICS_SESSION_KEY = 'vitriona-storefront-session-id';
export const STOREFRONT_ANALYTICS_DEDUPE_TTL_MS = 5_000;

export const storefrontAnalyticsEventTypeSchema = z.enum(['storefront_view', 'product_view']);

export type StorefrontAnalyticsEventType = z.infer<typeof storefrontAnalyticsEventTypeSchema>;

export const trackStorefrontEventSchema = z
  .object({
    businessId: z.string().trim().min(1),
    eventType: storefrontAnalyticsEventTypeSchema,
    path: z.string().trim().min(1).max(512).startsWith('/'),
    productId: z.string().trim().min(1).max(128).optional(),
    productName: z.string().trim().min(1).max(180).optional(),
    productSlug: z.string().trim().min(1).max(180).optional(),
    sessionId: z.string().trim().min(1).max(120).optional(),
  })
  .superRefine((value, context) => {
    if (value.eventType === 'product_view' && !value.productId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'productId es requerido para product_view',
        path: ['productId'],
      });
    }
  });

export type TrackStorefrontEventInput = z.infer<typeof trackStorefrontEventSchema>;

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getCountryNameFromCode(countryCode?: string | null, locale = 'es') {
  const normalizedCode = normalizeText(countryCode)?.toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    return displayNames.of(normalizedCode) ?? normalizedCode;
  } catch {
    return normalizedCode;
  }
}

export function formatStorefrontLocationLabel(location: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  countryCode?: string | null;
}) {
  const city = normalizeText(location.city);
  const region = normalizeText(location.region);
  const country = normalizeText(location.country) ?? getCountryNameFromCode(location.countryCode);

  const parts = [city, region, country].filter((part, index, allParts) => {
    if (!part) {
      return false;
    }

    return allParts.indexOf(part) === index;
  });

  return parts.length > 0 ? parts.join(', ') : 'Ubicación no disponible';
}
