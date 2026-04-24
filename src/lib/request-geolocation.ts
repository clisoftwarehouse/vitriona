import { getRedis } from '@/lib/redis';

interface GeoLocation {
  countryCode: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
}

interface FreeIpApiResponse {
  countryName?: string | null;
  countryCode?: string | null;
  regionName?: string | null;
  cityName?: string | null;
}

const GEOLOCATION_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const GEOLOCATION_REQUEST_TIMEOUT_MS = 1500;

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function decodeHeaderText(value: string | null | undefined) {
  if (value == null) return null;
  try {
    return normalizeText(decodeURIComponent(value));
  } catch {
    return normalizeText(value);
  }
}

export function normalizeCountryCode(countryCode: string | null | undefined) {
  const normalizedCode = countryCode?.trim().toUpperCase();

  if (!normalizedCode || !/^[A-Z]{2}$/.test(normalizedCode) || normalizedCode === 'T1' || normalizedCode === 'XX') {
    return null;
  }

  return normalizedCode;
}

function getCountryNameFromCode(countryCode: string | null | undefined, locale = 'es') {
  const normalizedCode = normalizeCountryCode(countryCode);

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

function getEmptyLocation(): GeoLocation {
  return {
    countryCode: null,
    country: null,
    region: null,
    city: null,
  };
}

export function mergeGeoLocation(primary: GeoLocation, fallback?: Partial<GeoLocation> | null): GeoLocation {
  return {
    countryCode: primary.countryCode ?? fallback?.countryCode ?? null,
    country: primary.country ?? fallback?.country ?? null,
    region: primary.region ?? fallback?.region ?? null,
    city: primary.city ?? fallback?.city ?? null,
  };
}

export function getGeoLocationFromHeaders(request: Request): GeoLocation {
  const countryCode = normalizeCountryCode(
    request.headers.get('x-vercel-ip-country') ??
      request.headers.get('cf-ipcountry') ??
      request.headers.get('x-country-code')
  );

  return {
    countryCode,
    country:
      decodeHeaderText(request.headers.get('x-vercel-ip-country-name')) ??
      decodeHeaderText(request.headers.get('x-country-name')) ??
      getCountryNameFromCode(countryCode),
    region:
      decodeHeaderText(request.headers.get('x-vercel-ip-country-region')) ??
      decodeHeaderText(request.headers.get('x-region-name')),
    city:
      decodeHeaderText(request.headers.get('x-vercel-ip-city')) ?? decodeHeaderText(request.headers.get('x-city-name')),
  };
}

export function getGeoLocationFromAcceptLanguage(acceptLanguageHeader: string | null): GeoLocation {
  if (!acceptLanguageHeader) {
    return getEmptyLocation();
  }

  const locales = acceptLanguageHeader
    .split(',')
    .map((locale) => locale.split(';')[0]?.trim())
    .filter(Boolean);

  for (const locale of locales) {
    const regionCandidate = locale
      ?.split('-')
      .map((segment) => segment.trim())
      .find((segment, index) => index > 0 && segment.length === 2);

    const countryCode = normalizeCountryCode(regionCandidate ?? null);

    if (countryCode) {
      return {
        countryCode,
        country: getCountryNameFromCode(countryCode),
        region: null,
        city: null,
      };
    }
  }

  return getEmptyLocation();
}

export function isPrivateOrLocalIp(ip: string | null | undefined) {
  const normalizedIp = ip?.trim().toLowerCase();

  if (!normalizedIp || normalizedIp === 'unknown' || normalizedIp === 'localhost' || normalizedIp === '::1') {
    return true;
  }

  if (normalizedIp.startsWith('::ffff:')) {
    return isPrivateOrLocalIp(normalizedIp.slice(7));
  }

  if (normalizedIp.includes(':')) {
    return normalizedIp.startsWith('fc') || normalizedIp.startsWith('fd') || normalizedIp.startsWith('fe80');
  }

  const octets = normalizedIp.split('.').map(Number);

  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
    return true;
  }

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 169 && octets[1] === 254)
  );
}

async function readCachedLocation(ip: string) {
  try {
    const cachedValue = await getRedis().get(`geo:ip:${ip}`);

    if (!cachedValue) {
      return null;
    }

    const parsed = JSON.parse(cachedValue) as GeoLocation;
    return mergeGeoLocation(getEmptyLocation(), parsed);
  } catch {
    return null;
  }
}

async function writeCachedLocation(ip: string, location: GeoLocation) {
  try {
    await getRedis().set(`geo:ip:${ip}`, JSON.stringify(location), 'EX', GEOLOCATION_CACHE_TTL_SECONDS);
  } catch {
    // Cache is opportunistic; analytics collection should not fail if Redis is unavailable.
  }
}

export async function getGeoLocationFromIp(ip: string | null | undefined): Promise<GeoLocation> {
  if (isPrivateOrLocalIp(ip)) {
    return getEmptyLocation();
  }

  const normalizedIp = ip!.trim();
  const cachedLocation = await readCachedLocation(normalizedIp);

  if (cachedLocation) {
    return cachedLocation;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOLOCATION_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`https://freeipapi.com/api/json/${encodeURIComponent(normalizedIp)}`, {
      headers: {
        accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return getEmptyLocation();
    }

    const payload = (await response.json()) as FreeIpApiResponse;
    const location = mergeGeoLocation(getEmptyLocation(), {
      countryCode: normalizeCountryCode(payload.countryCode),
      country: normalizeText(payload.countryName),
      region: normalizeText(payload.regionName),
      city: normalizeText(payload.cityName),
    });

    const normalizedLocation = mergeGeoLocation(location, {
      country: location.country ?? getCountryNameFromCode(location.countryCode),
    });

    if (
      normalizedLocation.countryCode ||
      normalizedLocation.country ||
      normalizedLocation.region ||
      normalizedLocation.city
    ) {
      await writeCachedLocation(normalizedIp, normalizedLocation);
    }

    return normalizedLocation;
  } catch {
    return getEmptyLocation();
  } finally {
    clearTimeout(timeout);
  }
}
