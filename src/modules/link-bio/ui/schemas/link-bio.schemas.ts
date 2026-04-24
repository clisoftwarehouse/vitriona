import { z } from 'zod';

export const LINK_TYPES = [
  'custom',
  'instagram',
  'facebook',
  'whatsapp',
  'tiktok',
  'youtube',
  'twitter',
  'website',
  'menu',
  'location',
  'phone',
  'email',
] as const;

export type LinkType = (typeof LINK_TYPES)[number];

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  custom: 'Personalizado',
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'Twitter / X',
  website: 'Sitio web',
  menu: 'Menú / Tienda',
  location: 'Ubicación',
  phone: 'Teléfono',
  email: 'Correo',
};

export const LINK_TYPE_DEFAULT_ICONS: Record<LinkType, string> = {
  custom: '🔗',
  instagram: '📸',
  facebook: '📘',
  whatsapp: '💬',
  tiktok: '🎵',
  youtube: '▶️',
  twitter: '🐦',
  website: '🌐',
  menu: '📋',
  location: '📍',
  phone: '📞',
  email: '✉️',
};

export const BUTTON_STYLES = [
  'pill-filled',
  'pill-outlined',
  'filled',
  'outlined',
  'soft',
  'glass',
  'gradient',
  'link',
] as const;

export const BUTTON_STYLE_LABELS: Record<string, string> = {
  'pill-filled': 'Píldora sólida',
  'pill-outlined': 'Píldora borde',
  filled: 'Rectángulo sólido',
  outlined: 'Rectángulo borde',
  soft: 'Suave',
  glass: 'Vidrio (glass)',
  gradient: 'Degradado',
  link: 'Solo texto',
};

export const BACKGROUND_TYPES = ['color', 'gradient', 'image'] as const;

export const FONTS = ['inter', 'playfair', 'dm-sans', 'poppins', 'roboto', 'space-grotesk', 'outfit'] as const;

export const FONT_LABELS: Record<string, string> = {
  inter: 'Inter',
  playfair: 'Playfair Display',
  'dm-sans': 'DM Sans',
  poppins: 'Poppins',
  roboto: 'Roboto',
  'space-grotesk': 'Space Grotesk',
  outfit: 'Outfit',
};

export const linkPageSettingsSchema = z.object({
  title: z.string().max(80).optional(),
  bio: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  useStorefrontTheme: z.boolean().default(false),
  backgroundType: z.enum(BACKGROUND_TYPES).default('color'),
  backgroundColor: z.string().default('#0f0f0f'),
  backgroundGradient: z.string().default('linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)'),
  backgroundImageUrl: z.string().url().optional().or(z.literal('')),
  backgroundOverlay: z.boolean().default(false),
  backgroundOverlayColor: z.string().default('#000000'),
  backgroundOverlayOpacity: z.number().min(0).max(100).default(50),
  textColor: z.string().default('#ffffff'),
  buttonStyle: z.enum(BUTTON_STYLES).default('pill-filled'),
  buttonColor: z.string().default('#8b1a1a'),
  buttonTextColor: z.string().default('#ffffff'),
  buttonRadius: z.number().min(0).max(999).default(999),
  buttonGradientFrom: z.string().default('#6366f1'),
  buttonGradientTo: z.string().default('#a855f7'),
  buttonGradientAngle: z.number().min(0).max(360).default(135),
  font: z.enum(FONTS).default('inter'),
  storefrontLinkTitle: z.string().max(60).default('Ver nuestra tienda'),
  storefrontLinkEnabled: z.boolean().default(true),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  isActive: z.boolean().default(true),
});

const HTTP_URL_RE = /^https?:\/\/.+\..+/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{6,}$/;

function validateUrlForType(url: string, type: LinkType): string | null {
  switch (type) {
    case 'email': {
      const value = url.startsWith('mailto:') ? url.slice(7) : url;
      return EMAIL_RE.test(value) ? null : 'Debe ser un correo válido (ej: hola@negocio.com)';
    }
    case 'phone':
    case 'whatsapp': {
      const value = url.startsWith('tel:') ? url.slice(4) : url.startsWith('https://wa.me/') ? url.slice(14) : url;
      return PHONE_RE.test(value) ? null : 'Debe ser un número de teléfono válido';
    }
    case 'location':
    case 'instagram':
    case 'facebook':
    case 'tiktok':
    case 'youtube':
    case 'twitter':
    case 'website':
    case 'menu':
    case 'custom':
      return HTTP_URL_RE.test(url) ? null : 'Debe ser una URL válida que empiece por http:// o https://';
    default:
      return null;
  }
}

/**
 * Takes user-friendly input (e.g. "hola@negocio.com", "+1 555...") and produces the canonical
 * stored value (e.g. "mailto:hola@negocio.com", "tel:+1555..."). No-op if the input already
 * has the expected prefix. Safe to call multiple times.
 */
export function normalizeUrlForType(url: string, type: LinkType): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  switch (type) {
    case 'email':
      return trimmed.startsWith('mailto:') ? trimmed : `mailto:${trimmed}`;
    case 'phone':
      return trimmed.startsWith('tel:') ? trimmed : `tel:${trimmed}`;
    case 'whatsapp': {
      if (/^https?:\/\/wa\.me\//i.test(trimmed)) return trimmed;
      const digits = trimmed.replace(/\D/g, '');
      return digits ? `https://wa.me/${digits}` : trimmed;
    }
    default:
      return trimmed;
  }
}

/**
 * Inverse of normalizeUrlForType — strips the canonical prefix so the user can edit the raw
 * email / phone / WhatsApp number in the input without seeing the scheme.
 */
export function displayUrlForType(url: string, type: LinkType): string {
  switch (type) {
    case 'email':
      return url.startsWith('mailto:') ? url.slice(7) : url;
    case 'phone':
      return url.startsWith('tel:') ? url.slice(4) : url;
    case 'whatsapp': {
      const match = url.match(/^https?:\/\/wa\.me\/(.*)$/i);
      return match?.[1] ?? url;
    }
    default:
      return url;
  }
}

/**
 * UI metadata for the URL input based on the selected link type.
 */
export function getUrlInputPropsForType(type: LinkType): {
  label: string;
  placeholder: string;
  inputType: 'email' | 'tel' | 'url';
} {
  switch (type) {
    case 'email':
      return { label: 'Correo', placeholder: 'hola@negocio.com', inputType: 'email' };
    case 'phone':
      return { label: 'Teléfono', placeholder: '+1 555 123 4567', inputType: 'tel' };
    case 'whatsapp':
      return { label: 'Número de WhatsApp', placeholder: '+1 555 123 4567', inputType: 'tel' };
    default:
      return { label: 'URL', placeholder: 'https://', inputType: 'url' };
  }
}

const linkItemShape = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'El título es requerido').max(60),
  url: z.string().min(1, 'La URL es requerida'),
  linkType: z.enum(LINK_TYPES).default('custom'),
  iconEmoji: z.string().max(10).optional(),
  iconImageUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export const linkItemSchema = linkItemShape.superRefine((val, ctx) => {
  const error = validateUrlForType(val.url.trim(), val.linkType);
  if (error) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: error });
  }
});

export const linkItemUpdateSchema = linkItemShape.partial().superRefine((val, ctx) => {
  // Only validate URL format when both url and linkType are present in the patch.
  if (val.url && val.linkType) {
    const error = validateUrlForType(val.url.trim(), val.linkType);
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: error });
    }
  }
});

export type LinkPageSettingsInput = z.infer<typeof linkPageSettingsSchema>;
export type LinkItemInput = z.infer<typeof linkItemSchema>;
export type LinkItemUpdateInput = z.infer<typeof linkItemUpdateSchema>;
