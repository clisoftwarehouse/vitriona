import { z } from 'zod';

export const createBusinessSchema = z.object({
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
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  whatsappNumber: z.string().max(20).optional().or(z.literal('')),
});

export const updateBusinessSchema = createBusinessSchema;

export type CreateBusinessFormValues = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessFormValues = z.infer<typeof updateBusinessSchema>;
