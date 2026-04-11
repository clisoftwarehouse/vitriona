import https from 'https';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { exchangeRates } from '@/db/schema';

const CRON_SECRET = process.env.CRON_SECRET;
const BCV_URL = 'https://www.bcv.org.ve/';

// Custom fetch that ignores SSL certificate errors (BCV has invalid/expired certs)
async function fetchIgnoreSSL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        rejectUnauthorized: false, // Ignore SSL errors
        timeout: 15000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Cron endpoint to fetch the EUR/VES and USD/VES exchange rates from BCV (Banco Central de Venezuela).
 *
 * Should be called daily at 8:00 PM VET (00:00 UTC next day) via a cron service.
 * Protected by CRON_SECRET header.
 *
 * Scrapes the BCV homepage for the EUR and USD rates, rounds to 2 decimals, and stores one entry per day per currency.
 */
export async function GET(request: NextRequest) {
  console.log('[CRON] fetch-exchange-rate started');

  // Auth check
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    console.log('[CRON] Auth failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Today in Venezuela timezone (UTC-4)
    const now = new Date();
    const venezuelaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
    const today = venezuelaDate.toISOString().slice(0, 10); // YYYY-MM-DD
    console.log('[CRON] Today:', today);

    // Check which currencies we already have for today
    const existingRows = await db
      .select({ currency: exchangeRates.currency })
      .from(exchangeRates)
      .where(and(eq(exchangeRates.date, today)));

    const existingCurrencies = new Set(existingRows.map((r) => r.currency));
    const needEur = !existingCurrencies.has('EUR');
    const needUsd = !existingCurrencies.has('USD');

    if (!needEur && !needUsd) {
      return NextResponse.json({ message: 'Rates already fetched for today', date: today });
    }

    console.log('[CRON] Fetching BCV page...');
    const html = await fetchIgnoreSSL(BCV_URL);
    console.log('[CRON] HTML length:', html?.length || 0);

    if (!html || html.length < 100) {
      return NextResponse.json({ error: 'Empty or invalid response from BCV' }, { status: 502 });
    }

    const results: { currency: string; rate: number }[] = [];

    // Parse the EUR rate from the #euro div
    if (needEur) {
      const euroMatch = html.match(/id="euro"[\s\S]*?<strong>\s*([\d.,]+)\s*<\/strong>/i);
      console.log('[CRON] EUR match:', euroMatch?.[1]);
      if (euroMatch?.[1]) {
        const rawRate = euroMatch[1].replace(/\./g, '').replace(',', '.');
        const rate = parseFloat(parseFloat(rawRate).toFixed(2));
        if (!isNaN(rate) && rate > 0) {
          await db.insert(exchangeRates).values({ currency: 'EUR', rate: rate.toFixed(2), source: 'BCV', date: today });
          results.push({ currency: 'EUR', rate });
        }
      }
    }

    // Parse the USD rate from the #dolar div
    if (needUsd) {
      const dolarMatch = html.match(/id="dolar"[\s\S]*?<strong>\s*([\d.,]+)\s*<\/strong>/i);
      console.log('[CRON] USD match:', dolarMatch?.[1]);
      if (dolarMatch?.[1]) {
        const rawRate = dolarMatch[1].replace(/\./g, '').replace(',', '.');
        const rate = parseFloat(parseFloat(rawRate).toFixed(2));
        if (!isNaN(rate) && rate > 0) {
          await db.insert(exchangeRates).values({ currency: 'USD', rate: rate.toFixed(2), source: 'BCV', date: today });
          results.push({ currency: 'USD', rate });
        }
      }
    }

    console.log('[CRON] Results:', results);

    if (results.length === 0) {
      return NextResponse.json({ error: 'Could not parse any rates from BCV page' }, { status: 502 });
    }

    return NextResponse.json({ success: true, date: today, rates: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Error:', message);
    return NextResponse.json({ error: `Failed to fetch exchange rate: ${message}` }, { status: 500 });
  }
}
