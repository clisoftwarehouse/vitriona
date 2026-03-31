/**
 * Generate an auto-SKU when the user doesn't provide one.
 * Format: {PREFIX_3}-{RANDOM_6}  e.g. MIS-A3F9K2
 * @param businessSlug Optional — uses first 3 chars of slug as prefix. Defaults to "SKU".
 */
export function generateSku(businessSlug?: string): string {
  const prefix = businessSlug
    ? businessSlug
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase()
        .padEnd(3, 'X')
    : 'SKU';

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }

  return `${prefix}-${random}`;
}
