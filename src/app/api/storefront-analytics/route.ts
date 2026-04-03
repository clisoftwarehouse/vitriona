import { eq, and } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { getClientIp } from '@/lib/rate-limit';
import { products, businesses, storefrontAnalyticsEvents } from '@/db/schema';
import { trackStorefrontEventSchema } from '@/modules/storefront/lib/storefront-analytics';
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

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, payload.data.businessId), eq(businesses.isActive, true)))
      .limit(1);

    if (!business) {
      return Response.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    let productId: string | null = null;
    let productName: string | null = null;

    if (payload.data.productId) {
      const [product] = await db
        .select({ id: products.id, name: products.name })
        .from(products)
        .where(and(eq(products.id, payload.data.productId), eq(products.businessId, payload.data.businessId)))
        .limit(1);

      if (!product) {
        return Response.json({ error: 'Producto no encontrado para este negocio' }, { status: 400 });
      }

      productId = product.id;
      productName = payload.data.productName ?? product.name;
    }

    let location = getGeoLocationFromHeaders(request);

    if (payload.data.eventType === 'storefront_view') {
      location = mergeGeoLocation(location, await getGeoLocationFromIp(getClientIp(request)));
    }

    location = mergeGeoLocation(location, getGeoLocationFromAcceptLanguage(request.headers.get('accept-language')));

    await db.insert(storefrontAnalyticsEvents).values({
      businessId: payload.data.businessId,
      sessionId: payload.data.sessionId ?? null,
      eventType: payload.data.eventType,
      path: payload.data.path,
      productId,
      productName,
      countryCode: location.countryCode,
      country: location.country,
      region: location.region,
      city: location.city,
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
