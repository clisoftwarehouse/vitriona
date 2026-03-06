import { z } from 'zod';

export const createCatalogSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
});

export const updateCatalogSchema = createCatalogSchema;

export type CreateCatalogFormValues = z.infer<typeof createCatalogSchema>;
export type UpdateCatalogFormValues = z.infer<typeof updateCatalogSchema>;
