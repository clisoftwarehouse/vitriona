'use client';

import { useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import {
  productTypeOptions,
  createProductSchema,
  productStatusOptions,
  type CreateProductFormValues,
} from '@/modules/products/ui/schemas/product.schemas';

interface Category {
  id: string;
  name: string;
}

interface AttributeDefinition {
  id: string;
  name: string;
  type: string;
  options: string[] | null;
  isRequired: boolean;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  catalogId: string;
  businessId: string;
  categories: Category[];
  attributes?: AttributeDefinition[];
  defaultValues?: Partial<CreateProductFormValues>;
  onSubmitAction: (values: CreateProductFormValues) => Promise<{ error?: string; success?: boolean }>;
}

export function ProductForm({
  mode,
  catalogId,
  businessId,
  categories,
  attributes = [],
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
      type: 'product',
      weight: '',
      minStock: 0,
      trackInventory: true,
      tags: '',
      attributeValues: {},
      characteristics: [],
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
          {/* ── Basic Info ── */}
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

          {/* ── Type & Category ── */}
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productTypeOptions.map((opt) => (
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
          </div>

          {/* ── Pricing ── */}
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

          {/* ── Inventory ── */}
          <div className='grid gap-4 sm:grid-cols-3'>
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

            <FormField
              control={form.control}
              name='minStock'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock mínimo</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min='0'
                      placeholder='0'
                      disabled={isPending}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>Alerta de stock bajo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='weight'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso (kg)</FormLabel>
                  <FormControl>
                    <Input {...field} type='number' step='0.01' min='0' placeholder='0.00' disabled={isPending} />
                  </FormControl>
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

          {/* ── Tags ── */}
          <FormField
            control={form.control}
            name='tags'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='oferta, nuevo, popular (separados por coma)' disabled={isPending} />
                </FormControl>
                <FormDescription>Etiquetas para búsqueda y filtrado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Flags ── */}
          <div className='flex flex-wrap gap-6'>
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

            <FormField
              control={form.control}
              name='trackInventory'
              render={({ field }) => (
                <FormItem className='flex items-center gap-2 space-y-0'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                  </FormControl>
                  <FormLabel className='cursor-pointer'>Rastrear inventario</FormLabel>
                </FormItem>
              )}
            />
          </div>

          {/* ── Characteristics (ad-hoc key-value) ── */}
          <Separator />
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-sm font-semibold'>Características</h3>
                <p className='text-muted-foreground text-xs'>
                  Agrega características como Color, Material, Talla, etc.
                </p>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  const current = form.getValues('characteristics') ?? [];
                  form.setValue('characteristics', [...current, { name: '', value: '' }]);
                }}
                disabled={isPending}
              >
                <Plus className='mr-1 size-3.5' />
                Agregar
              </Button>
            </div>
            {(form.watch('characteristics') ?? []).map((char, idx) => (
              <div key={idx} className='flex items-center gap-2'>
                <Input
                  placeholder='Nombre (ej: Color)'
                  value={char.name}
                  onChange={(e) => {
                    const chars = [...(form.getValues('characteristics') ?? [])];
                    chars[idx] = { ...chars[idx], name: e.target.value };
                    form.setValue('characteristics', chars);
                  }}
                  disabled={isPending}
                  className='flex-1'
                />
                <Input
                  placeholder='Valor (ej: Rojo)'
                  value={char.value}
                  onChange={(e) => {
                    const chars = [...(form.getValues('characteristics') ?? [])];
                    chars[idx] = { ...chars[idx], value: e.target.value };
                    form.setValue('characteristics', chars);
                  }}
                  disabled={isPending}
                  className='flex-1'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-8 shrink-0 text-red-500 hover:text-red-600'
                  onClick={() => {
                    const chars = (form.getValues('characteristics') ?? []).filter((_, i) => i !== idx);
                    form.setValue('characteristics', chars);
                  }}
                  disabled={isPending}
                >
                  <Trash2 className='size-3.5' />
                </Button>
              </div>
            ))}
          </div>

          {/* ── Predefined Attributes ── */}
          {attributes.length > 0 && (
            <>
              <Separator />
              <div className='space-y-4'>
                <div>
                  <h3 className='text-sm font-semibold'>Atributos predefinidos</h3>
                  <p className='text-muted-foreground text-xs'>Atributos definidos para este negocio.</p>
                </div>
                {attributes.map((attr) => (
                  <div key={attr.id} className='space-y-1.5'>
                    <Label className='text-sm'>
                      {attr.name}
                      {attr.isRequired && <span className='ml-1 text-red-500'>*</span>}
                    </Label>
                    {attr.type === 'select' && attr.options ? (
                      <Select
                        value={form.watch(`attributeValues.${attr.id}`) ?? ''}
                        onValueChange={(v) => form.setValue(`attributeValues.${attr.id}`, v)}
                        disabled={isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Seleccionar ${attr.name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {attr.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : attr.type === 'color' && attr.options ? (
                      <div className='flex flex-wrap gap-2'>
                        {attr.options.map((color) => (
                          <button
                            key={color}
                            type='button'
                            onClick={() => form.setValue(`attributeValues.${attr.id}`, color)}
                            className='size-8 rounded-full border-2 transition-transform hover:scale-110'
                            style={{
                              backgroundColor: color,
                              borderColor:
                                form.watch(`attributeValues.${attr.id}`) === color ? 'var(--primary)' : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                    ) : attr.type === 'boolean' ? (
                      <div className='flex items-center gap-2'>
                        <Checkbox
                          checked={form.watch(`attributeValues.${attr.id}`) === 'true'}
                          onCheckedChange={(v) => form.setValue(`attributeValues.${attr.id}`, v ? 'true' : 'false')}
                          disabled={isPending}
                        />
                        <span className='text-sm'>Sí</span>
                      </div>
                    ) : (
                      <Input
                        type={attr.type === 'number' ? 'number' : 'text'}
                        value={form.watch(`attributeValues.${attr.id}`) ?? ''}
                        onChange={(e) => form.setValue(`attributeValues.${attr.id}`, e.target.value)}
                        placeholder={`Valor de ${attr.name.toLowerCase()}`}
                        disabled={isPending}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

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
