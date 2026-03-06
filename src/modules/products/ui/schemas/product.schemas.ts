import { z } from 'zod';

export const productStatusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'out_of_stock', label: 'Sin stock' },
] as const;

export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede tener más de 200 caracteres'),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'El precio debe ser un número válido'),
  compareAtPrice: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Precio inválido'),
  sku: z.string().max(100).optional().or(z.literal('')),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').optional(),
  categoryId: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'out_of_stock']),
  isFeatured: z.boolean(),
});

export const updateProductSchema = createProductSchema;

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
