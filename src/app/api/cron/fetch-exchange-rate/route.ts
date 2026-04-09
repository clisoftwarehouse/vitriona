import { promisify } from 'util';
import { exec } from 'child_process';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { exchangeRates } from '@/db/schema';

const execAsync = promisify(exec);

const CRON_SECRET = process.env.CRON_SECRET;
const BCV_URL = 'https://www.bcv.org.ve/';

/**
 * Cron endpoint to fetch the EUR/VES exchange rate from BCV (Banco Central de Venezuela).
 *
 * Should be called daily at 8:00 PM VET (00:00 UTC next day) via a cron service.
 * Protected by CRON_SECRET header.
 *
 * Scrapes the BCV homepage for the EUR rate, rounds to 2 decimals, and stores one entry per day.
 * Uses curl instead of fetch because BCV has SSL certificate issues that Node.js rejects.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Today in Venezuela timezone (UTC-4)
    const now = new Date();
    const venezuelaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
    const today = venezuelaDate.toISOString().slice(0, 10); // YYYY-MM-DD

    // Check if we already have a rate for today
    const [existing] = await db
      .select({ id: exchangeRates.id })
      .from(exchangeRates)
      .where(and(eq(exchangeRates.currency, 'EUR'), eq(exchangeRates.date, today)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ message: 'Rate already fetched for today', date: today });
    }

    // Fetch BCV page via curl (Node.js fetch fails due to BCV's SSL certificate issues)
    const { stdout: html } = await execAsync(`curl -s --max-time 15 -A "Mozilla/5.0" "${BCV_URL}"`, {
      maxBuffer: 1024 * 1024,
    });

    if (!html || html.length < 100) {
      return NextResponse.json({ error: 'Empty or invalid response from BCV' }, { status: 502 });
    }

    // Parse the EUR rate from the #euro div
    // Pattern: <div id="euro" ...> ... <strong> 556,66095493 </strong> ...
    const euroMatch = html.match(/id="euro"[\s\S]*?<strong>\s*([\d.,]+)\s*<\/strong>/i);
    if (!euroMatch?.[1]) {
      return NextResponse.json({ error: 'Could not parse EUR rate from BCV page' }, { status: 502 });
    }

    // BCV uses comma as decimal separator: "556,66095493" → 556.66
    const rawRate = euroMatch[1].replace(/\./g, '').replace(',', '.');
    const rate = parseFloat(parseFloat(rawRate).toFixed(2));

    if (isNaN(rate) || rate <= 0) {
      return NextResponse.json({ error: `Invalid rate parsed: ${euroMatch[1]}` }, { status: 502 });
    }

    // Store in database
    await db.insert(exchangeRates).values({
      currency: 'EUR',
      rate: rate.toFixed(2),
      source: 'BCV',
      date: today,
    });

    return NextResponse.json({ success: true, date: today, currency: 'EUR', rate });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch exchange rate: ${message}` }, { status: 500 });
  }
}
