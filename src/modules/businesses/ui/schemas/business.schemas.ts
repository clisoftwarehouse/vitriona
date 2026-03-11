import { z } from 'zod';

const optionalString = z.string().optional().or(z.literal(''));
const optionalUrl = z.string().url('URL inválida').optional().or(z.literal(''));

const businessHoursEntrySchema = z.object({
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
});

export const createBusinessSchema = z.object({
  // ── Básico ──
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  slug: z
    .string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  category: z
    .enum([
      'food',
      'jewelry',
      'clothing',
      'electronics',
      'beauty',
      'home',
      'sports',
      'toys',
      'books',
      'services',
      'other',
    ])
    .optional(),
  logoUrl: optionalUrl,

  // ── Contacto ──
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  whatsappNumber: z.string().max(20).optional().or(z.literal('')),
  website: optionalUrl,

  // ── Ubicación ──
  address: z.string().max(200).optional().or(z.literal('')),
  country: optionalString,
  city: optionalString,
  state: optionalString,
  zipCode: z.string().max(20).optional().or(z.literal('')),

  // ── Regional ──
  currency: z.string().min(3).max(3).optional(),
  timezone: z.string().optional(),
  locale: z.enum(['es', 'en', 'pt']).optional(),

  // ── Redes sociales ──
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  twitterUrl: optionalUrl,
  youtubeUrl: optionalUrl,

  // ── Fiscal ──
  taxId: z.string().max(30).optional().or(z.literal('')),

  // ── Horarios ──
  businessHours: z.record(z.string(), businessHoursEntrySchema).optional(),
});

export const updateBusinessSchema = createBusinessSchema;

export type CreateBusinessFormValues = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessFormValues = z.infer<typeof updateBusinessSchema>;
