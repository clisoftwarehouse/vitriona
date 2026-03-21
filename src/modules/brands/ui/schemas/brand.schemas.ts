import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  logoUrl: z.string().optional().or(z.literal('')),
});

export const updateBrandSchema = createBrandSchema;

export type CreateBrandFormValues = z.infer<typeof createBrandSchema>;
export type UpdateBrandFormValues = z.infer<typeof updateBrandSchema>;
