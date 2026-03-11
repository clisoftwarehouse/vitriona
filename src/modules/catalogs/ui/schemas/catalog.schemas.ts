import { z } from 'zod';

export const createCatalogSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  slug: z
    .string()
    .max(120, 'Máximo 120 caracteres')
    .regex(/^[a-z0-9-]*$/, 'Solo letras minúsculas, números y guiones')
    .optional()
    .or(z.literal('')),
  description: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  imageUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  type: z.enum(['general', 'seasonal', 'premium', 'services']).optional(),
});

export const updateCatalogSchema = createCatalogSchema;

export type CreateCatalogFormValues = z.infer<typeof createCatalogSchema>;
export type UpdateCatalogFormValues = z.infer<typeof updateCatalogSchema>;
