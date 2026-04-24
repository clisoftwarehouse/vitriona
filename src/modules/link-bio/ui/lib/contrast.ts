const BLACK = '#000000';
const WHITE = '#ffffff';
const WCAG_AA_NORMAL = 4.5;

function normalizeHex(hex: string): string {
  const h = hex.trim().replace('#', '');
  if (h.length === 3)
    return h
      .split('')
      .map((c) => c + c)
      .join('');
  if (h.length === 6) return h;
  if (h.length === 8) return h.slice(0, 6);
  return '000000';
}

function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const [lo, hi] = l1 < l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function isLightColor(hex: string): boolean {
  return relativeLuminance(hex) > 0.5;
}

/**
 * Returns preferredFg if it meets WCAG AA contrast against bg; otherwise falls back to black or white.
 */
export function pickReadableColor(bg: string, preferredFg: string): string {
  if (contrastRatio(bg, preferredFg) >= WCAG_AA_NORMAL) return preferredFg;
  return isLightColor(bg) ? BLACK : WHITE;
}

/**
 * Returns a subtle ring/border color that will be visible on the given background.
 * Used to guarantee button outlines stay visible regardless of user color choices.
 */
export function safeRingColor(bg: string, alpha = 0.18): string {
  return isLightColor(bg) ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
}

/**
 * Resolves the "effective" background color of the link bio page, used for contrast checks.
 * Collapses gradients to their first stop and images to their overlay (or a neutral guess).
 */
export function getEffectivePageBg(input: {
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundColor: string | null | undefined;
  backgroundGradient: string | null | undefined;
  backgroundOverlay: boolean;
  backgroundOverlayColor: string | null | undefined;
}): string {
  if (input.backgroundType === 'image') {
    return input.backgroundOverlay ? (input.backgroundOverlayColor ?? '#000000') : '#808080';
  }
  if (input.backgroundType === 'gradient') {
    const match = input.backgroundGradient?.match(/#[0-9a-fA-F]{3,8}/);
    return match?.[0] ?? input.backgroundColor ?? '#0f0f0f';
  }
  return input.backgroundColor ?? '#0f0f0f';
}
