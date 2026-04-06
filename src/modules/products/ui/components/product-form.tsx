'use client';

import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { X, Plus, Wand2, Trash2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateSku } from '@/modules/products/lib/generate-sku';
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

interface BundleComponentOption {
  id: string;
  name: string;
  type: 'product' | 'service';
  price: string;
  stock: number | null;
  trackInventory: boolean;
  status: 'active' | 'inactive' | 'out_of_stock';
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  catalogId?: string;
  businessId: string;
  categories: Category[];
  catalogs?: Catalog[];
  brands?: Brand[];
  attributes?: AttributeDefinition[];
  bundleComponentOptions?: BundleComponentOption[];
  defaultValues?: Partial<CreateProductFormValues>;
  hasVariants?: boolean;
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
  bundleComponentOptions = [],
  defaultValues,
  hasVariants = false,
  onSubmitAction,
}: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [variantsLocked, setVariantsLocked] = useState(false);
  const [bundleSearch, setBundleSearch] = useState('');

  useEffect(() => {
    setVariantsLocked(hasVariants);
  }, [hasVariants]);

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
      bundlePriceMode: 'sum_items',
      bundleSelectionMode: 'fixed',
      bundleCustomPrice: '',
      bundleMinimumAmount: '',
      bundleItems: [],
      weight: '',
      minStock: 0,
      trackInventory: true,
      tags: '',
      catalogIds: catalogId ? [catalogId] : [],
      attributeValues: {},
      ...defaultValues,
    },
  });

  const productType = useWatch({ control: form.control, name: 'type' }) ?? 'product';
  const bundlePriceMode = useWatch({ control: form.control, name: 'bundlePriceMode' }) ?? 'sum_items';
  const bundleSelectionMode = useWatch({ control: form.control, name: 'bundleSelectionMode' }) ?? 'fixed';
  const bundleMinimumAmount = useWatch({ control: form.control, name: 'bundleMinimumAmount' }) ?? '';
  const bundleCustomPrice = useWatch({ control: form.control, name: 'bundleCustomPrice' }) ?? '';
  const watchedBundleItemsValue = useWatch({ control: form.control, name: 'bundleItems' });
  const watchedBundleItems = useMemo(() => watchedBundleItemsValue ?? [], [watchedBundleItemsValue]);
  const attributeValues = useWatch({ control: form.control, name: 'attributeValues' }) ?? {};

  const bundleOptionsMap = useMemo(
    () => new Map(bundleComponentOptions.map((option) => [option.id, option])),
    [bundleComponentOptions]
  );

  const selectedBundleItems = useMemo(
    () => watchedBundleItems.map((item) => ({ ...item, product: bundleOptionsMap.get(item.productId) })),
    [bundleOptionsMap, watchedBundleItems]
  );

  const filteredBundleOptions = useMemo(() => {
    const selectedIds = new Set(watchedBundleItems.map((item) => item.productId));
    const query = bundleSearch.trim().toLowerCase();

    return bundleComponentOptions.filter((option) => {
      if (selectedIds.has(option.id)) return false;
      if (!query) return true;
      return option.name.toLowerCase().includes(query);
    });
  }, [bundleComponentOptions, bundleSearch, watchedBundleItems]);

  const bundleComponentsTotal = useMemo(
    () => selectedBundleItems.reduce((sum, item) => sum + Number(item.product?.price ?? 0) * item.quantity, 0),
    [selectedBundleItems]
  );

  const bundleCustomPriceNumber = bundleCustomPrice ? Number(bundleCustomPrice) : 0;
  const bundleEffectivePrice =
    bundlePriceMode === 'custom_price' && bundleCustomPrice ? bundleCustomPriceNumber : bundleComponentsTotal;
  const bundleSavings =
    bundlePriceMode === 'custom_price' && bundleCustomPriceNumber < bundleComponentsTotal
      ? bundleComponentsTotal - bundleCustomPriceNumber
      : 0;

  const bundleItemsError =
    typeof form.formState.errors.bundleItems?.message === 'string' ? form.formState.errors.bundleItems.message : null;
  const bundleCustomPriceError =
    typeof form.formState.errors.bundleCustomPrice?.message === 'string'
      ? form.formState.errors.bundleCustomPrice.message
      : null;

  const formatBundlePrice = (value: number) => `$${value.toFixed(2)}`;

  const updateBundleItems = (items: NonNullable<CreateProductFormValues['bundleItems']>) => {
    form.setValue('bundleItems', items, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleAddBundleItem = (productId: string) => {
    if (watchedBundleItems.some((item) => item.productId === productId)) return;
    updateBundleItems([...watchedBundleItems, { productId, quantity: 1 }]);
    setBundleSearch('');
  };

  const handleUpdateBundleQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      updateBundleItems(watchedBundleItems.filter((item) => item.productId !== productId));
      return;
    }

    updateBundleItems(watchedBundleItems.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
  };

  const generateCombinations = (groups: { name: string; values: string[] }[]) => {
    const valid = groups.filter((group) => group.name.trim() && group.values.length > 0);
    if (valid.length === 0) return [];

    const combine = (
      index: number,
      current: Record<string, string>
    ): { name: string; options: Record<string, string> }[] => {
      if (index >= valid.length) {
        const name = valid.map((group) => current[group.name]).join(' / ');
        return [{ name, options: { ...current } }];
      }

      const results: { name: string; options: Record<string, string> }[] = [];
      for (const value of valid[index].values) {
        results.push(...combine(index + 1, { ...current, [valid[index].name]: value }));
      }
      return results;
    };

    return combine(0, {});
  };

  const onSubmit = (values: CreateProductFormValues) => {
    setError(null);

    startTransition(async () => {
      const payload: CreateProductFormValues =
        values.type === 'bundle'
          ? {
              ...values,
              price:
                values.bundlePriceMode === 'custom_price' || values.bundlePriceMode === 'base_plus_items'
                  ? values.bundleCustomPrice || '0'
                  : '0',
              compareAtPrice: '',
              stock: 0,
              weight: '',
              minStock: 0,
              trackInventory: false,
            }
          : values;

      const result = await onSubmitAction(payload);
      if (result?.error) {
        setError(result.error);
        return;
      }

      if (mode === 'create' && payload.type === 'product' && result?.productId && variantGroups.length > 0) {
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
                <FormLabel>Descripcion</FormLabel>
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
                      {productTypeOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.value === 'bundle' && hasVariants && field.value !== 'bundle'}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasVariants && field.value !== 'bundle' && (
                    <FormDescription>No puedes convertir un producto con variantes en un paquete.</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Sin categoria' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>Sin categoria</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          {catalogs.length > 1 && (
            <FormField
              control={form.control}
              name='catalogIds'
              render={({ field }) => {
                const selected = field.value ?? (catalogId ? [catalogId] : []);

                const toggle = (id: string) => {
                  const next = selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
                  if (next.length > 0) field.onChange(next);
                };

                return (
                  <FormItem>
                    <FormLabel>Catalogos</FormLabel>
                    <FormDescription>Selecciona en cuales catalogos aparecera este producto.</FormDescription>
                    <div className='flex flex-wrap gap-2'>
                      {catalogs.map((catalog) => (
                        <button
                          key={catalog.id}
                          type='button'
                          disabled={isPending}
                          onClick={() => toggle(catalog.id)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            selected.includes(catalog.id)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-input bg-background hover:bg-accent'
                          }`}
                        >
                          {catalog.name}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          {productType === 'bundle' && (
            <>
              <Separator />
              <div className='space-y-4'>
                <div>
                  <h3 className='text-sm font-semibold'>Configuración del paquete</h3>
                  <p className='text-muted-foreground text-xs'>Define cómo funciona este paquete.</p>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Modo de selección</Label>
                    <Select
                      value={bundleSelectionMode}
                      onValueChange={(value) =>
                        form.setValue('bundleSelectionMode', value as 'fixed' | 'customer_choice', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='fixed'>Fijo (admin define items y cantidades)</SelectItem>
                        <SelectItem value='customer_choice'>Configurable (cliente elige)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {bundleSelectionMode === 'customer_choice' && (
                    <div className='space-y-2'>
                      <Label htmlFor='bundle-min-amount'>Monto mínimo de consumo</Label>
                      <Input
                        id='bundle-min-amount'
                        type='number'
                        step='0.01'
                        min='0'
                        value={bundleMinimumAmount}
                        onChange={(e) =>
                          form.setValue('bundleMinimumAmount', e.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        disabled={isPending}
                        placeholder='0.00 (opcional)'
                      />
                      <p className='text-muted-foreground text-xs'>
                        Si se define, el cliente debe alcanzar este monto para completar el pedido.
                      </p>
                    </div>
                  )}
                </div>

                {bundleSelectionMode === 'customer_choice' && (
                  <Alert>
                    <AlertDescription>
                      Los slots y productos elegibles se configuran desde la página de edición del producto una vez
                      creado.
                    </AlertDescription>
                  </Alert>
                )}

                {bundleSelectionMode === 'fixed' && (
                  <>
                    <div>
                      <h4 className='text-sm font-semibold'>Contenido del paquete</h4>
                      <p className='text-muted-foreground text-xs'>
                        Selecciona productos o servicios sin variantes. El precio y la disponibilidad del paquete se
                        sincronizan automaticamente con sus componentes.
                      </p>
                    </div>

                    <div className='space-y-3 rounded-lg border p-4'>
                      <div className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
                        <Input
                          value={bundleSearch}
                          onChange={(event) => setBundleSearch(event.target.value)}
                          placeholder='Buscar productos o servicios para agregar...'
                          disabled={isPending}
                        />
                        <span className='text-muted-foreground text-xs'>
                          No se permiten paquetes anidados ni componentes con variantes.
                        </span>
                      </div>

                      {filteredBundleOptions.length > 0 ? (
                        <div className='grid gap-2 sm:grid-cols-2'>
                          {filteredBundleOptions.slice(0, 8).map((option) => (
                            <button
                              key={option.id}
                              type='button'
                              onClick={() => handleAddBundleItem(option.id)}
                              disabled={isPending}
                              className='hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors'
                            >
                              <div className='min-w-0'>
                                <p className='truncate text-sm font-medium'>{option.name}</p>
                                <div className='mt-1 flex flex-wrap items-center gap-2'>
                                  <Badge variant='secondary' className='text-[10px] uppercase'>
                                    {option.type === 'service' ? 'Servicio' : 'Producto'}
                                  </Badge>
                                  {option.trackInventory && option.stock !== null && (
                                    <Badge variant='outline' className='text-[10px]'>
                                      Stock: {option.stock}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <span className='text-sm font-semibold'>{formatBundlePrice(Number(option.price))}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className='text-muted-foreground text-sm'>
                          {bundleComponentOptions.length === 0
                            ? 'No hay productos o servicios elegibles para agregar al paquete.'
                            : 'No hay resultados con esa busqueda.'}
                        </p>
                      )}
                    </div>

                    {selectedBundleItems.length > 0 ? (
                      <div className='space-y-3'>
                        {selectedBundleItems.map((item) => {
                          if (!item.product) return null;

                          return (
                            <div
                              key={item.productId}
                              className='flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center'
                            >
                              <div className='min-w-0 flex-1'>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <p className='truncate text-sm font-medium'>{item.product.name}</p>
                                  <Badge variant='secondary' className='text-[10px] uppercase'>
                                    {item.product.type === 'service' ? 'Servicio' : 'Producto'}
                                  </Badge>
                                </div>
                                <p className='text-muted-foreground mt-1 text-xs'>
                                  Precio unitario: {formatBundlePrice(Number(item.product.price))}
                                  {item.product.trackInventory && item.product.stock !== null
                                    ? ` · Stock disponible: ${item.product.stock}`
                                    : ' · Sin seguimiento de inventario'}
                                </p>
                              </div>

                              <div className='flex items-center gap-2'>
                                <Input
                                  type='number'
                                  min='1'
                                  value={item.quantity}
                                  onChange={(event) =>
                                    handleUpdateBundleQuantity(item.productId, parseInt(event.target.value) || 1)
                                  }
                                  disabled={isPending}
                                  className='w-24'
                                />
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  className='text-red-500 hover:text-red-600'
                                  onClick={() =>
                                    updateBundleItems(
                                      watchedBundleItems.filter((bundleItem) => bundleItem.productId !== item.productId)
                                    )
                                  }
                                  disabled={isPending}
                                >
                                  <Trash2 className='size-4' />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-sm'>
                        Este paquete aun no tiene componentes.
                      </div>
                    )}

                    {bundleItemsError && <p className='text-sm text-red-500'>{bundleItemsError}</p>}
                  </>
                )}

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Modo de precio</Label>
                    <Select
                      value={bundlePriceMode}
                      onValueChange={(value) =>
                        form.setValue('bundlePriceMode', value as 'sum_items' | 'custom_price' | 'base_plus_items', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='sum_items'>Suma de componentes</SelectItem>
                        <SelectItem value='custom_price'>Precio fijo personalizado</SelectItem>
                        <SelectItem value='base_plus_items'>Precio base + selección del cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(bundlePriceMode === 'custom_price' || bundlePriceMode === 'base_plus_items') && (
                    <div className='space-y-2'>
                      <Label htmlFor='bundle-custom-price'>Precio personalizado</Label>
                      <Input
                        id='bundle-custom-price'
                        type='number'
                        step='0.01'
                        min='0'
                        value={bundleCustomPrice}
                        onChange={(event) =>
                          form.setValue('bundleCustomPrice', event.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        disabled={isPending}
                        placeholder='0.00'
                      />
                      {bundleCustomPriceError && <p className='text-sm text-red-500'>{bundleCustomPriceError}</p>}
                    </div>
                  )}
                </div>

                <div className='bg-muted/40 space-y-2 rounded-lg border p-4'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>Valor de los componentes</span>
                    <span className='font-medium'>{formatBundlePrice(bundleComponentsTotal)}</span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>Precio final del paquete</span>
                    <span className='font-semibold'>{formatBundlePrice(bundleEffectivePrice)}</span>
                  </div>
                  {bundleSavings > 0 && (
                    <div className='text-sm font-medium text-emerald-600'>
                      El paquete muestra un ahorro de {formatBundlePrice(bundleSavings)} frente a comprar por separado.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {productType !== 'bundle' && (
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
          )}

          <FormField
            control={form.control}
            name='sku'
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <div className='flex gap-2'>
                  <FormControl>
                    <Input {...field} placeholder='ABC-001' disabled={isPending} />
                  </FormControl>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    className='shrink-0'
                    disabled={isPending}
                    onClick={() => form.setValue('sku', generateSku())}
                  >
                    <Wand2 className='size-4' />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {productType === 'product' && (
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
                          disabled={isPending || variantsLocked}
                          value={field.value ?? 0}
                          onChange={(event) => {
                            if (!variantsLocked) field.onChange(parseInt(event.target.value) || 0);
                          }}
                        />
                      </FormControl>
                      {variantsLocked && <FormDescription>El stock se calcula desde las variantes.</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='minStock'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock minimo</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          placeholder='0'
                          disabled={isPending}
                          value={field.value ?? 0}
                          onChange={(event) => field.onChange(parseInt(event.target.value) || 0)}
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
                      {productStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
            name='tags'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='oferta, nuevo, popular (separados por coma)' disabled={isPending} />
                </FormControl>
                <FormDescription>Etiquetas para busqueda y filtrado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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

            {productType === 'product' && (
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

          {attributes.length > 0 && (
            <>
              <Separator />
              <div className='space-y-4'>
                <div>
                  <h3 className='text-sm font-semibold'>Atributos predefinidos</h3>
                  <p className='text-muted-foreground text-xs'>Atributos definidos para este negocio.</p>
                </div>

                {attributes.map((attribute) => {
                  const attributeValue = attributeValues[attribute.id] ?? '';

                  return (
                    <div key={attribute.id} className='space-y-1.5'>
                      <Label className='text-sm'>
                        {attribute.name}
                        {attribute.isRequired && <span className='ml-1 text-red-500'>*</span>}
                      </Label>

                      {attribute.type === 'select' && attribute.options ? (
                        <Select
                          value={attributeValue}
                          onValueChange={(value) => form.setValue(`attributeValues.${attribute.id}`, value)}
                          disabled={isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Seleccionar ${attribute.name.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {attribute.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : attribute.type === 'color' && attribute.options ? (
                        <div className='flex flex-wrap gap-2'>
                          {attribute.options.map((color) => (
                            <button
                              key={color}
                              type='button'
                              onClick={() => form.setValue(`attributeValues.${attribute.id}`, color)}
                              className='size-8 rounded-full border-2 transition-transform hover:scale-110'
                              style={{
                                backgroundColor: color,
                                borderColor: attributeValue === color ? 'var(--primary)' : 'transparent',
                              }}
                            />
                          ))}
                        </div>
                      ) : attribute.type === 'boolean' ? (
                        <div className='flex items-center gap-2'>
                          <Checkbox
                            checked={attributeValue === 'true'}
                            onCheckedChange={(value) =>
                              form.setValue(`attributeValues.${attribute.id}`, value ? 'true' : 'false')
                            }
                            disabled={isPending}
                          />
                          <span className='text-sm'>Si</span>
                        </div>
                      ) : (
                        <Input
                          type={attribute.type === 'number' ? 'number' : 'text'}
                          value={attributeValue}
                          onChange={(event) => form.setValue(`attributeValues.${attribute.id}`, event.target.value)}
                          placeholder={`Valor de ${attribute.name.toLowerCase()}`}
                          disabled={isPending}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {mode === 'create' && productType === 'product' && (
            <div className='space-y-4'>
              <Separator />
              <div>
                <Label className='text-sm font-semibold'>Variantes del producto</Label>
                <p className='text-muted-foreground text-xs'>
                  Define opciones como Talla, Color, etc. Las combinaciones se generaran automaticamente al crear el
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

              {variantGroups.map((group, groupIndex) => (
                <div key={groupIndex} className='space-y-2 rounded-lg border p-3'>
                  <div className='flex items-center gap-2'>
                    <Input
                      placeholder='Nombre de la opcion (ej: Talla)'
                      value={group.name}
                      onChange={(event) =>
                        setVariantGroups((prev) =>
                          prev.map((entry, index) =>
                            index === groupIndex ? { ...entry, name: event.target.value } : entry
                          )
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
                      onClick={() => setVariantGroups((prev) => prev.filter((_, index) => index !== groupIndex))}
                      disabled={isPending}
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>

                  <div className='flex flex-wrap gap-1.5'>
                    {group.values.map((value, valueIndex) => (
                      <Badge key={valueIndex} variant='secondary' className='gap-1 pr-1 text-xs'>
                        {value}
                        <button
                          type='button'
                          onClick={() =>
                            setVariantGroups((prev) =>
                              prev.map((entry, index) =>
                                index === groupIndex
                                  ? {
                                      ...entry,
                                      values: entry.values.filter((_, innerIndex) => innerIndex !== valueIndex),
                                    }
                                  : entry
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
                      value={variantNewValue[groupIndex] ?? ''}
                      onChange={(event) =>
                        setVariantNewValue((prev) => ({ ...prev, [groupIndex]: event.target.value }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          const value = (variantNewValue[groupIndex] ?? '').trim();
                          if (!value) return;

                          setVariantGroups((prev) =>
                            prev.map((entry, index) =>
                              index === groupIndex && !entry.values.includes(value)
                                ? { ...entry, values: [...entry.values, value] }
                                : entry
                            )
                          );
                          setVariantNewValue((prev) => ({ ...prev, [groupIndex]: '' }));
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
                        const value = (variantNewValue[groupIndex] ?? '').trim();
                        if (!value) return;

                        setVariantGroups((prev) =>
                          prev.map((entry, index) =>
                            index === groupIndex && !entry.values.includes(value)
                              ? { ...entry, values: [...entry.values, value] }
                              : entry
                          )
                        );
                        setVariantNewValue((prev) => ({ ...prev, [groupIndex]: '' }));
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
                Agregar opcion
              </Button>

              {variantGroups.some((group) => group.name.trim() && group.values.length > 0) && (
                <p className='text-muted-foreground text-xs'>
                  Se generaran{' '}
                  <strong>
                    {
                      generateCombinations(
                        variantGroups.filter((group) => group.name.trim() && group.values.length > 0)
                      ).length
                    }
                  </strong>{' '}
                  variantes al crear el producto.
                </p>
              )}
            </div>
          )}

          <div className='flex justify-end gap-3'>
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
