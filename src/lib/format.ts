/**
 * Format a numeric price using the business's configured currency.
 * Uses Spanish locale so thousands use `.` and decimals use `,`.
 *
 * @example formatPrice(1234.5, 'EUR') → "1.234,50 €"
 * @example formatPrice('60.00', 'USD') → "60,00 US$"
 */
export function formatPrice(amount: string | number, currency: string = 'USD'): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return String(amount);
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency, useGrouping: true }).format(n);
}
