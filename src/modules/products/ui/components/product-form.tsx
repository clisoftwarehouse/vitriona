'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import {
  createProductSchema,
  productStatusOptions,
  type CreateProductFormValues,
} from '@/modules/products/ui/schemas/product.schemas';

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  catalogId: string;
  businessId: string;
  categories: Category[];
  defaultValues?: Partial<CreateProductFormValues>;
  onSubmitAction: (values: CreateProductFormValues) => Promise<{ error?: string; success?: boolean }>;
}

export function ProductForm({
  mode,
  catalogId,
  businessId,
  categories,
  defaultValues,
  onSubmitAction,
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '0',
      compareAtPrice: '',
      sku: '',
      stock: 0,
      categoryId: '',
      status: 'active',
      isFeatured: false,
      ...defaultValues,
    },
  });

  const onSubmit = (values: CreateProductFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await onSubmitAction(values);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/businesses/${businessId}/catalogs/${catalogId}/products`);
      router.refresh();
    });
  };

  return (
    <div className='space-y-6'>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del producto</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='Ej: Collar de perlas' disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder='Describe tu producto...'
                    className='resize-none'
                    rows={3}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='price'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input {...field} type='number' step='0.01' min='0' placeholder='0.00' disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='compareAtPrice'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio anterior</FormLabel>
                  <FormControl>
                    <Input {...field} type='number' step='0.01' min='0' placeholder='0.00' disabled={isPending} />
                  </FormControl>
                  <FormDescription>Opcional. Muestra tachado si es mayor al precio.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='sku'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='ABC-001' disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='stock'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input {...field} type='number' min='0' placeholder='0' disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Sin categoría' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>Sin categoría</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productStatusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='isFeatured'
            render={({ field }) => (
              <FormItem className='flex items-center gap-2 space-y-0'>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                </FormControl>
                <FormLabel className='cursor-pointer'>Producto destacado</FormLabel>
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-3 pt-2'>
            <Button type='button' variant='outline' onClick={() => router.back()} disabled={isPending}>
              Cancelar
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending
                ? mode === 'create'
                  ? 'Creando...'
                  : 'Guardando...'
                : mode === 'create'
                  ? 'Crear producto'
                  : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
