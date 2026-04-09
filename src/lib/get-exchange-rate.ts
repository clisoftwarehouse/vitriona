import { eq, desc } from 'drizzle-orm';

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
