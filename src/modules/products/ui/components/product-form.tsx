'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { X, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addProductVariantAction } from '@/modules/products/server/actions/product-variants.action';
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

interface Catalog {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  catalogId?: string;
  businessId: string;
  categories: Category[];
  catalogs?: Catalog[];
  brands?: Brand[];
  attributes?: AttributeDefinition[];
  defaultValues?: Partial<CreateProductFormValues>;
  onSubmitAction: (
    values: CreateProductFormValues
  ) => Promise<{ error?: string; success?: boolean; productId?: string }>;
}

export function ProductForm({
  mode,
  catalogId,
  businessId,
  categories,
  catalogs = [],
  brands = [],
  attributes = [],
  defaultValues,
  onSubmitAction,
}: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Local variant option groups (used during create mode)
  const [variantGroups, setVariantGroups] = useState<{ name: string; values: string[] }[]>([]);
  const [variantNewValue, setVariantNewValue] = useState<Record<number, string>>({});

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
      brandId: '',
      status: 'active',
      isFeatured: false,
      type: 'product',
      weight: '',
      minStock: 0,
      trackInventory: true,
      tags: '',
      catalogIds: catalogId ? [catalogId] : [],
      attributeValues: {},
      ...defaultValues,
    },
  });

  // Generate all variant combinations from option groups
  const generateCombinations = (groups: { name: string; values: string[] }[]) => {
    const valid = groups.filter((g) => g.name.trim() && g.values.length > 0);
    if (valid.length === 0) return [];
    const combine = (
      idx: number,
      current: Record<string, string>
    ): { name: string; options: Record<string, string> }[] => {
      if (idx >= valid.length) {
        const name = valid.map((g) => current[g.name]).join(' / ');
        return [{ name, options: { ...current } }];
      }
      const results: { name: string; options: Record<string, string> }[] = [];
      for (const val of valid[idx].values) {
        results.push(...combine(idx + 1, { ...current, [valid[idx].name]: val }));
      }
      return results;
    };
    return combine(0, {});
  };

  const onSubmit = (values: CreateProductFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await onSubmitAction(values);
      if (result?.error) {
        setError(result.error);
        return;
      }

      // Auto-create variants if option groups were defined during creation
      if (mode === 'create' && result?.productId && variantGroups.length > 0) {
        const combos = generateCombinations(variantGroups);
        for (const combo of combos) {
          await addProductVariantAction(result.productId, {
            name: combo.name,
            stock: 0,
            options: combo.options,
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['products'] });
      if (mode === 'create' && result?.productId) {
        router.push(
          catalogId
            ? `/dashboard/businesses/${businessId}/catalogs/${catalogId}/products/${result.productId}`
            : `/dashboard/businesses/${businessId}/products/${result.productId}`
        );
      } else {
        router.push(
          catalogId
            ? `/dashboard/businesses/${businessId}/catalogs/${catalogId}/products`
            : `/dashboard/businesses/${businessId}/products`
        );
      }
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
          <div className='grid items-start gap-4 sm:grid-cols-2'>
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

          {/* ── Brand ── */}
          {brands.length > 0 && (
            <FormField
              control={form.control}
              name='brandId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Sin marca' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>Sin marca</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* ── Catalogs (multi-select) ── */}
          {catalogs.length > 1 && (
            <FormField
              control={form.control}
              name='catalogIds'
              render={({ field }) => {
                const selected = field.value ?? (catalogId ? [catalogId] : []);
                const toggle = (id: string) => {
                  const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
                  if (next.length > 0) field.onChange(next);
                };
                return (
                  <FormItem>
                    <FormLabel>Catálogos</FormLabel>
                    <FormDescription>Selecciona en cuáles catálogos aparecerá este producto.</FormDescription>
                    <div className='flex flex-wrap gap-2'>
                      {catalogs.map((cat) => (
                        <button
                          key={cat.id}
                          type='button'
                          disabled={isPending}
                          onClick={() => toggle(cat.id)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            selected.includes(cat.id)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-input bg-background hover:bg-accent'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          {/* ── Pricing ── */}
          <div className='grid items-start gap-4 sm:grid-cols-2'>
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

          {/* ── Inventory (products only) ── */}
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

          {form.watch('type') === 'product' && (
            <>
              <div className='grid items-start gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='stock'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
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
            </>
          )}

          <div className='grid items-start gap-4 sm:grid-cols-2'>
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

            {form.watch('type') === 'product' && (
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
            )}
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

          {/* ── Variant Option Groups (create mode only) ── */}
          {mode === 'create' && (
            <div className='space-y-4'>
              <Separator />
              <div>
                <Label className='text-sm font-semibold'>Variantes del producto</Label>
                <p className='text-muted-foreground text-xs'>
                  Define opciones como Talla, Color, etc. Las combinaciones se generarán automáticamente al crear el
                  producto.
                </p>
              </div>

              {variantGroups.length === 0 && (
                <div className='flex flex-wrap gap-1.5'>
                  <span className='text-muted-foreground text-xs'>Opciones comunes:</span>
                  {['Talla', 'Color', 'Material', 'Estilo'].map((preset) => (
                    <button
                      key={preset}
                      type='button'
                      onClick={() => setVariantGroups((prev) => [...prev, { name: preset, values: [] }])}
                      className='bg-muted hover:bg-muted/80 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors'
                      disabled={isPending}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              )}

              {variantGroups.map((group, gIdx) => (
                <div key={gIdx} className='space-y-2 rounded-lg border p-3'>
                  <div className='flex items-center gap-2'>
                    <Input
                      placeholder='Nombre de la opción (ej: Talla)'
                      value={group.name}
                      onChange={(e) =>
                        setVariantGroups((prev) =>
                          prev.map((g, i) => (i === gIdx ? { ...g, name: e.target.value } : g))
                        )
                      }
                      disabled={isPending}
                      className='flex-1 text-sm font-medium'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='size-8 shrink-0 text-red-500 hover:text-red-600'
                      onClick={() => setVariantGroups((prev) => prev.filter((_, i) => i !== gIdx))}
                      disabled={isPending}
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>

                  <div className='flex flex-wrap gap-1.5'>
                    {group.values.map((val, vIdx) => (
                      <Badge key={vIdx} variant='secondary' className='gap-1 pr-1 text-xs'>
                        {val}
                        <button
                          type='button'
                          onClick={() =>
                            setVariantGroups((prev) =>
                              prev.map((g, i) =>
                                i === gIdx ? { ...g, values: g.values.filter((_, vi) => vi !== vIdx) } : g
                              )
                            )
                          }
                          className='hover:bg-muted ml-0.5 rounded-full p-0.5'
                          disabled={isPending}
                        >
                          <X className='size-3' />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className='flex items-center gap-2'>
                    <Input
                      placeholder={`Agregar valor (ej: ${group.name === 'Talla' ? 'M, L, XL' : group.name === 'Color' ? 'Rojo, Azul' : 'valor'})`}
                      value={variantNewValue[gIdx] ?? ''}
                      onChange={(e) => setVariantNewValue((prev) => ({ ...prev, [gIdx]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (variantNewValue[gIdx] ?? '').trim();
                          if (!val) return;
                          setVariantGroups((prev) =>
                            prev.map((g, i) =>
                              i === gIdx && !g.values.includes(val) ? { ...g, values: [...g.values, val] } : g
                            )
                          );
                          setVariantNewValue((prev) => ({ ...prev, [gIdx]: '' }));
                        }
                      }}
                      disabled={isPending}
                      className='flex-1 text-sm'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const val = (variantNewValue[gIdx] ?? '').trim();
                        if (!val) return;
                        setVariantGroups((prev) =>
                          prev.map((g, i) =>
                            i === gIdx && !g.values.includes(val) ? { ...g, values: [...g.values, val] } : g
                          )
                        );
                        setVariantNewValue((prev) => ({ ...prev, [gIdx]: '' }));
                      }}
                      disabled={isPending}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setVariantGroups((prev) => [...prev, { name: '', values: [] }])}
                disabled={isPending}
              >
                <Plus className='mr-1 size-3.5' />
                Agregar opción
              </Button>

              {variantGroups.some((g) => g.name.trim() && g.values.length > 0) && (
                <p className='text-muted-foreground text-xs'>
                  Se generarán{' '}
                  <strong>
                    {generateCombinations(variantGroups.filter((g) => g.name.trim() && g.values.length > 0)).length}
                  </strong>{' '}
                  variantes al crear el producto.
                </p>
              )}
            </div>
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
