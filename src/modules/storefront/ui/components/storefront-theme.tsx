export interface StorefrontTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  borderColor: string;
  font: string;
  roundedCorners: boolean;
  borderRadius: number;
}

const FONT_MAP: Record<string, string> = {
  inter: '"Inter", sans-serif',
  playfair: '"Playfair Display", serif',
  'dm-sans': '"DM Sans", sans-serif',
  poppins: '"Poppins", sans-serif',
  roboto: '"Roboto", sans-serif',
  'space-grotesk': '"Space Grotesk", sans-serif',
  outfit: '"Outfit", sans-serif',
};

const GOOGLE_FONTS_URL: Record<string, string> = {
  inter: 'Inter:wght@400;500;600;700',
  playfair: 'Playfair+Display:wght@400;500;600;700',
  'dm-sans': 'DM+Sans:wght@400;500;600;700',
  poppins: 'Poppins:wght@400;500;600;700',
  roboto: 'Roboto:wght@400;500;700',
  'space-grotesk': 'Space+Grotesk:wght@400;500;600;700',
  outfit: 'Outfit:wght@400;500;600;700',
};

function contrastColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Generates a <style> tag with CSS custom properties.
 * This is a SERVER component — no useEffect, no hydration mismatch.
 */
export function StorefrontThemeStyle({ theme }: { theme: StorefrontTheme }) {
  const fontFamily = FONT_MAP[theme.font] || FONT_MAP.inter;
  const br = theme.borderRadius ?? (theme.roundedCorners ? 12 : 0);
  const radius = br > 0 ? `${br * 0.0625}rem` : '0';
  const radiusLg = br > 0 ? `${(br + 4) * 0.0625}rem` : '0';
  const radiusFull = br >= 20 ? '9999px' : br > 0 ? `${br * 0.125}rem` : '0';

  const css = `:root {
  --sf-primary: ${theme.primaryColor};
  --sf-primary-contrast: ${contrastColor(theme.primaryColor)};
  --sf-primary-hsl: ${hexToHsl(theme.primaryColor)};
  --sf-accent: ${theme.accentColor};
  --sf-accent-hsl: ${hexToHsl(theme.accentColor)};
  --sf-bg: ${theme.backgroundColor};
  --sf-surface: ${theme.surfaceColor};
  --sf-text: ${theme.textColor};
  --sf-border: ${theme.borderColor};
  --sf-font: ${fontFamily};
  --sf-radius: ${radius};
  --sf-radius-lg: ${radiusLg};
  --sf-radius-full: ${radiusFull};
}`;

  const fontKey = theme.font || 'inter';
  const googleFont = GOOGLE_FONTS_URL[fontKey];
  const fontLink =
    googleFont && fontKey !== 'inter'
      ? `@import url('https://fonts.googleapis.com/css2?family=${googleFont}&display=swap');`
      : '';

  return <style dangerouslySetInnerHTML={{ __html: `${fontLink}\n${css}` }} />;
}
