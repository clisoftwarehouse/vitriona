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

export const linkItemSchema = z.object({
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

export type LinkPageSettingsInput = z.infer<typeof linkPageSettingsSchema>;
export type LinkItemInput = z.infer<typeof linkItemSchema>;
