import { z } from 'zod';

export const storefrontQrPresetSchema = z.enum(['classic', 'rounded', 'classy', 'orbit']);
export const storefrontQrLogoModeSchema = z.enum(['business', 'custom']);

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-F]{6}$/i, 'Color inválido');
const optionalUrlSchema = z.union([z.string().trim().url(), z.literal('')]);

export const storefrontQrSettingsSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  preset: storefrontQrPresetSchema,
  bodyColor: hexColorSchema,
  cornerColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  includeLogo: z.boolean(),
  logoMode: storefrontQrLogoModeSchema,
  customLogoUrl: optionalUrlSchema,
  logoScale: z.number().min(0.16).max(0.32),
});

export type StorefrontQrSettings = z.infer<typeof storefrontQrSettingsSchema>;
export type StorefrontQrPreset = z.infer<typeof storefrontQrPresetSchema>;
export type StorefrontQrLogoMode = z.infer<typeof storefrontQrLogoModeSchema>;

export function getDefaultStorefrontQrSettings({
  businessLogoUrl,
  businessSlug,
  origin,
}: {
  businessSlug: string;
  businessLogoUrl: string | null;
  origin?: string;
}): StorefrontQrSettings {
  const baseOrigin = origin?.trim().replace(/\/$/, '') || 'https://vitriona.app';

  return {
    url: `${baseOrigin}/${businessSlug}`,
    preset: businessLogoUrl ? 'rounded' : 'classic',
    bodyColor: '#111827',
    cornerColor: '#111827',
    backgroundColor: '#FFFFFF',
    includeLogo: Boolean(businessLogoUrl),
    logoMode: businessLogoUrl ? 'business' : 'custom',
    customLogoUrl: '',
    logoScale: 0.22,
  };
}

export function normalizeStorefrontQrSettings({
  businessLogoUrl,
  businessSlug,
  origin,
  value,
}: {
  value: unknown;
  businessSlug: string;
  businessLogoUrl: string | null;
  origin?: string;
}): StorefrontQrSettings {
  const defaults = getDefaultStorefrontQrSettings({ businessSlug, businessLogoUrl, origin });
  const parsed = storefrontQrSettingsSchema.safeParse(value);

  if (!parsed.success) return defaults;

  return {
    ...defaults,
    ...parsed.data,
  };
}
