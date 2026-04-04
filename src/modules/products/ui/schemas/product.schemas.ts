import { z } from 'zod';

export const productStatusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'out_of_stock', label: 'Sin stock' },
] as const;

export const productTypeOptions = [
  { value: 'product', label: 'Producto' },
  { value: 'service', label: 'Servicio' },
  { value: 'bundle', label: 'Paquete' },
] as const;

const bundleItemSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto o servicio'),
  quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
});

export const createProductSchema = z
  .object({
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
    brandId: z.string().optional().or(z.literal('')),
    status: z.enum(['active', 'inactive', 'out_of_stock']),
    isFeatured: z.boolean(),
    type: z.enum(['product', 'service', 'bundle']),
    bundlePriceMode: z.enum(['sum_items', 'custom_price']).optional(),
    bundleCustomPrice: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Precio inválido'),
    bundleItems: z.array(bundleItemSchema).optional(),
    weight: z.string().optional().or(z.literal('')),
    dimensions: z
      .object({
        length: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        unit: z.string().optional(),
      })
      .optional(),
    minStock: z.number().int().min(0).optional(),
    trackInventory: z.boolean(),
    tags: z.string().optional().or(z.literal('')),
    catalogIds: z.array(z.string()).optional(),
    attributeValues: z.record(z.string(), z.string()).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type !== 'bundle') return;

    if (!values.bundleItems?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Agrega al menos un producto o servicio al paquete.',
        path: ['bundleItems'],
      });
    }

    if (values.bundlePriceMode === 'custom_price') {
      const customPrice = values.bundleCustomPrice?.trim();
      if (!customPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingresa el precio personalizado del paquete.',
          path: ['bundleCustomPrice'],
        });
      }
    }
  });

export const updateProductSchema = createProductSchema;

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
