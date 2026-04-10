import { eq, desc, inArray } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { exchangeRates } from '@/db/schema';

/**
 * Get the latest EUR/VES exchange rate from BCV.
 * Returns the rate as a number or null if no rate is available.
 */
export async function getEurRate(): Promise<number | null> {
  const [latest] = await db
    .select({ rate: exchangeRates.rate, date: exchangeRates.date })
    .from(exchangeRates)
    .where(eq(exchangeRates.currency, 'EUR'))
    .orderBy(desc(exchangeRates.date))
    .limit(1);

  return latest ? parseFloat(latest.rate) : null;
}

/**
 * Get the latest USD/VES exchange rate from BCV.
 * Returns the rate as a number or null if no rate is available.
 */
export async function getUsdRate(): Promise<number | null> {
  const [latest] = await db
    .select({ rate: exchangeRates.rate, date: exchangeRates.date })
    .from(exchangeRates)
    .where(eq(exchangeRates.currency, 'USD'))
    .orderBy(desc(exchangeRates.date))
    .limit(1);

  return latest ? parseFloat(latest.rate) : null;
}

/**
 * Get the latest EUR and USD exchange rates from BCV.
 */
export async function getExchangeRates(): Promise<{ eur: number | null; usd: number | null }> {
  const rows = await db
    .select({ currency: exchangeRates.currency, rate: exchangeRates.rate, date: exchangeRates.date })
    .from(exchangeRates)
    .where(inArray(exchangeRates.currency, ['EUR', 'USD']))
    .orderBy(desc(exchangeRates.date))
    .limit(10);

  let eur: number | null = null;
  let usd: number | null = null;

  for (const row of rows) {
    if (row.currency === 'EUR' && eur === null) eur = parseFloat(row.rate);
    if (row.currency === 'USD' && usd === null) usd = parseFloat(row.rate);
    if (eur !== null && usd !== null) break;
  }

  return { eur, usd };
}
