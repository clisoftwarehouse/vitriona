import { getClientIp } from '@/lib/rate-limit';
import { trackStorefrontEventSchema } from '@/modules/storefront/lib/storefront-analytics';
import { trackStorefrontAnalyticsRedisEvent } from '@/modules/storefront/server/lib/storefront-analytics-redis';
import {
  mergeGeoLocation,
  getGeoLocationFromIp,
  getGeoLocationFromHeaders,
  getGeoLocationFromAcceptLanguage,
} from '@/lib/request-geolocation';

const BOT_USER_AGENT_REGEX = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|discordbot|slackbot/i;

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') ?? '';

    if (BOT_USER_AGENT_REGEX.test(userAgent)) {
      return Response.json({ success: true }, { status: 202 });
    }

    const body = await request.json();
    const payload = trackStorefrontEventSchema.safeParse(body);

    if (!payload.success) {
      return Response.json({ error: 'Payload inválido' }, { status: 400 });
    }

    let location = getGeoLocationFromHeaders(request);

    location = mergeGeoLocation(location, await getGeoLocationFromIp(getClientIp(request)));

    location = mergeGeoLocation(location, getGeoLocationFromAcceptLanguage(request.headers.get('accept-language')));

    await trackStorefrontAnalyticsRedisEvent({
      businessId: payload.data.businessId,
      sessionId: payload.data.sessionId ?? undefined,
      eventType: payload.data.eventType,
      path: payload.data.path,
      productId: payload.data.productId,
      productName: payload.data.productName,
      productSlug: payload.data.productSlug,
      location,
    });

    return Response.json({ success: true }, { status: 202 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'JSON inválido' }, { status: 400 });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo registrar el evento' },
      { status: 500 }
    );
  }
}
