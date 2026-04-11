import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { exchangeRates } from '@/db/schema';

const CRON_SECRET = process.env.CRON_SECRET;

// Using pydolarve API as a reliable source for BCV rates (since BCV has SSL issues)
const PYDOLAR_API_URL = 'https://pydolarve.org/api/v2/dollar?page=bcv';

/**
 * Cron endpoint to fetch the USD/VES exchange rate from BCV (Banco Central de Venezuela).
 *
 * Should be called daily at 8:00 PM VET (00:00 UTC next day) via a cron service.
 * Protected by CRON_SECRET header.
 *
 * Uses pydolarve.org API which provides BCV rates (direct BCV scraping fails due to SSL issues in serverless).
 */
export async function GET(request: NextRequest) {
  // Auth check - Vercel Cron sends the secret in 'authorization' header as Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Today in Venezuela timezone (UTC-4)
    const now = new Date();
    const venezuelaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
    const today = venezuelaDate.toISOString().slice(0, 10); // YYYY-MM-DD

    // Check if we already have USD for today
    const existingRows = await db
      .select({ currency: exchangeRates.currency })
      .from(exchangeRates)
      .where(and(eq(exchangeRates.date, today), eq(exchangeRates.currency, 'USD')));

    if (existingRows.length > 0) {
      return NextResponse.json({ message: 'USD rate already fetched for today', date: today });
    }

    // Fetch from pydolarve API (provides BCV rates)
    const response = await fetch(PYDOLAR_API_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `API returned ${response.status}` }, { status: 502 });
    }

    const data = await response.json();

    // pydolarve response structure: { monitors: { usd: { price: 51.28, ... } } }
    const usdRate = data?.monitors?.usd?.price;

    if (typeof usdRate !== 'number' || usdRate <= 0) {
      return NextResponse.json({ error: 'Could not parse USD rate from API', data }, { status: 502 });
    }

    const rate = parseFloat(usdRate.toFixed(2));

    await db.insert(exchangeRates).values({
      currency: 'USD',
      rate: rate.toFixed(2),
      source: 'BCV',
      date: today,
    });

    return NextResponse.json({ success: true, date: today, rate });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch exchange rate: ${message}` }, { status: 500 });
  }
}
