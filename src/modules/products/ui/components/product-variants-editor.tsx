'use client';

import { useState, useTransition } from 'react';
import { X, Plus, Trash2, Upload, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  addProductImageAction,
  deleteProductImageAction,
} from '@/modules/products/server/actions/product-images.action';
import {
  addProductVariantAction,
  updateProductVariantAction,
  deleteProductVariantAction,
} from '@/modules/products/server/actions/product-variants.action';

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: string | null;
  stock: number;
  imageUrl: string | null;
  options: Record<string, string>;
  isActive: boolean;
  sortOrder: number;
}

interface VariantImage {
  id: string;
  url: string;
  alt: string | null;
  variantId: string | null;
}

interface ProductVariantsEditorProps {
  productId: string;
  initialVariants: ProductVariant[];
  initialVariantImages?: VariantImage[];
}

interface OptionGroup {
  name: string;
  values: string[];
}

const OPTION_PRESETS = ['Talla', 'Color', 'Material', 'Estilo'];

function generateCombinations(groups: OptionGroup[]): { name: string; options: Record<string, string> }[] {
  const validGroups = groups.filter((g) => g.name.trim() && g.values.length > 0);
  if (validGroups.length === 0) return [];

  const combine = (
    idx: number,
    current: Record<string, string>
  ): { name: string; options: Record<string, string> }[] => {
    if (idx >= validGroups.length) {
      const name = validGroups.map((g) => current[g.name]).join(' / ');
      return [{ name, options: { ...current } }];
    }
    const group = validGroups[idx];
    const results: { name: string; options: Record<string, string> }[] = [];
    for (const val of group.values) {
      results.push(...combine(idx + 1, { ...current, [group.name]: val }));
    }
    return results;
  };

  return combine(0, {});
}

export function ProductVariantsEditor({
  productId,
  initialVariants,
  initialVariantImages = [],
}: ProductVariantsEditorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>(() => {
    if (initialVariants.length === 0) return [];
    const keys = new Set<string>();
    const groupMap: Record<string, Set<string>> = {};
    for (const v of initialVariants) {
      for (const [k, val] of Object.entries(v.options)) {
        keys.add(k);
        if (!groupMap[k]) groupMap[k] = new Set();
        groupMap[k].add(val);
      }
    }
    return Array.from(keys).map((k) => ({ name: k, values: Array.from(groupMap[k]) }));
  });
  const [newValue, setNewValue] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);
  const [variantImages, setVariantImages] = useState<Record<string, VariantImage[]>>(() => {
    const map: Record<string, VariantImage[]> = {};
    for (const img of initialVariantImages) {
      if (img.variantId) {
        if (!map[img.variantId]) map[img.variantId] = [];
        map[img.variantId].push(img);
      }
    }
    return map;
  });

  const handleVariantImageUpload = async (variantId: string, files: FileList) => {
    setUploadingVariantId(variantId);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`"${file.name}" excede el límite de 5MB.`);
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Error al subir imagen');
          continue;
        }
        const blob = await response.json();
        const result = await addProductImageAction(productId, blob.url, file.name, variantId);
        if (result.error) {
          setError(result.error);
        } else if (result.image) {
          setVariantImages((prev) => ({
            ...prev,
            [variantId]: [...(prev[variantId] ?? []), result.image!],
          }));
        }
      }
    } catch {
      setError('Error al subir la imagen.');
    } finally {
      setUploadingVariantId(null);
    }
  };

  const handleDeleteVariantImage = (variantId: string, imageId: string) => {
    startTransition(async () => {
      const result = await deleteProductImageAction(imageId);
      if (result.error) {
        setError(result.error);
      } else {
        setVariantImages((prev) => ({
          ...prev,
          [variantId]: (prev[variantId] ?? []).filter((img) => img.id !== imageId),
        }));
      }
    });
  };

  const addOptionGroup = (preset?: string) => {
    setOptionGroups((prev) => [...prev, { name: preset ?? '', values: [] }]);
  };

  const removeOptionGroup = (idx: number) => {
    setOptionGroups((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateGroupName = (idx: number, name: string) => {
    setOptionGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, name } : g)));
  };

  const addValueToGroup = (idx: number) => {
    const val = (newValue[idx] ?? '').trim();
    if (!val) return;
    setOptionGroups((prev) =>
      prev.map((g, i) => (i === idx && !g.values.includes(val) ? { ...g, values: [...g.values, val] } : g))
    );
    setNewValue((prev) => ({ ...prev, [idx]: '' }));
  };

  const removeValueFromGroup = (groupIdx: number, valIdx: number) => {
    setOptionGroups((prev) =>
      prev.map((g, i) => (i === groupIdx ? { ...g, values: g.values.filter((_, vi) => vi !== valIdx) } : g))
    );
  };

  const handleGenerate = () => {
    const validGroups = optionGroups.filter((g) => g.name.trim() && g.values.length > 0);
    if (validGroups.length === 0) {
      setError('Agrega al menos un grupo de opciones con valores.');
      return;
    }
    setError(null);
    const combos = generateCombinations(validGroups);

    startTransition(async () => {
      const existingKeys = new Set(variants.map((v) => JSON.stringify(v.options)));
      const newCombos = combos.filter((c) => !existingKeys.has(JSON.stringify(c.options)));

      if (newCombos.length === 0) {
        setError('Todas las combinaciones ya existen.');
        return;
      }

      const created: ProductVariant[] = [];
      for (const combo of newCombos) {
        const result = await addProductVariantAction(productId, {
          name: combo.name,
          stock: 0,
          options: combo.options,
        });
        if (result.variant) {
          created.push(result.variant);
        }
      }
      setVariants((prev) => [...prev, ...created]);
    });
  };

  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateLocalVariant = (variantId: string, field: string, value: string | number | null) => {
    setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, [field]: value } : v)));
    setDirtyIds((prev) => new Set(prev).add(variantId));
    setSaveSuccess(false);
  };

  const handleToggleActive = (variant: ProductVariant, value: boolean) => {
    startTransition(async () => {
      const result = await updateProductVariantAction(variant.id, {
        name: variant.name,
        sku: variant.sku ?? '',
        price: variant.price ?? '',
        stock: variant.stock,
        options: variant.options,
        isActive: value,
        imageUrl: variant.imageUrl ?? '',
      });
      if (!result.error) {
        setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, isActive: value } : v)));
      }
    });
  };

  const handleSaveAll = () => {
    if (dirtyIds.size === 0) return;
    startTransition(async () => {
      const toSave = variants.filter((v) => dirtyIds.has(v.id));
      let hasError = false;
      for (const v of toSave) {
        const result = await updateProductVariantAction(v.id, {
          name: v.name,
          sku: v.sku ?? '',
          price: v.price ?? '',
          stock: v.stock,
          options: v.options,
          isActive: v.isActive,
          imageUrl: v.imageUrl ?? '',
        });
        if (result.error) {
          setError(result.error);
          hasError = true;
        }
      }
      if (!hasError) {
        setDirtyIds(new Set());
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    });
  };

  const handleDelete = (variantId: string) => {
    startTransition(async () => {
      const result = await deleteProductVariantAction(variantId);
      if (!result.error) {
        setVariants((prev) => prev.filter((v) => v.id !== variantId));
      }
    });
  };

  const unusedPresets = OPTION_PRESETS.filter((p) => !optionGroups.some((g) => g.name === p));

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div>
        <label className='text-sm font-medium'>Variantes del producto</label>
        <p className='text-muted-foreground text-xs'>
          Define opciones como Talla, Color, etc. y genera todas las combinaciones automáticamente.
        </p>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Option Groups */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-semibold'>1. Define las opciones</span>
          <Button type='button' variant='outline' size='sm' onClick={() => addOptionGroup()} disabled={isPending}>
            <Plus className='mr-1 size-3.5' />
            Agregar opción
          </Button>
        </div>

        {unusedPresets.length > 0 && optionGroups.length === 0 && (
          <div className='flex flex-wrap gap-1.5'>
            <span className='text-muted-foreground text-xs'>Opciones comunes:</span>
            {unusedPresets.map((preset) => (
              <button
                key={preset}
                type='button'
                onClick={() => addOptionGroup(preset)}
                className='bg-muted hover:bg-muted/80 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors'
                disabled={isPending}
              >
                + {preset}
              </button>
            ))}
          </div>
        )}

        {optionGroups.map((group, gIdx) => (
          <div key={gIdx} className='space-y-2 rounded-lg border p-3'>
            <div className='flex items-center gap-2'>
              <Input
                placeholder='Nombre de la opción (ej: Talla)'
                value={group.name}
                onChange={(e) => updateGroupName(gIdx, e.target.value)}
                disabled={isPending}
                className='flex-1 text-sm font-medium'
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-8 shrink-0 text-red-500 hover:text-red-600'
                onClick={() => removeOptionGroup(gIdx)}
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
                    onClick={() => removeValueFromGroup(gIdx, vIdx)}
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
                value={newValue[gIdx] ?? ''}
                onChange={(e) => setNewValue((prev) => ({ ...prev, [gIdx]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addValueToGroup(gIdx);
                  }
                }}
                disabled={isPending}
                className='flex-1 text-sm'
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => addValueToGroup(gIdx)}
                disabled={isPending}
              >
                Agregar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Step 2: Generate */}
      {optionGroups.some((g) => g.name.trim() && g.values.length > 0) && (
        <div className='flex items-center gap-3'>
          <Separator className='flex-1' />
          <Button type='button' size='sm' onClick={handleGenerate} disabled={isPending}>
            {isPending ? <Loader2 className='mr-1 size-3.5 animate-spin' /> : <Plus className='mr-1 size-3.5' />}
            Generar variantes (
            {generateCombinations(optionGroups.filter((g) => g.name.trim() && g.values.length > 0)).length}{' '}
            combinaciones)
          </Button>
          <Separator className='flex-1' />
        </div>
      )}

      {/* Step 3: Variant List */}
      {variants.length > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-semibold'>2. Configura cada variante</span>
            <div className='flex items-center gap-2'>
              {saveSuccess && <span className='text-xs font-medium text-green-600'>✓ Guardado</span>}
              {dirtyIds.size > 0 && (
                <Badge variant='outline' className='text-[10px]'>
                  {dirtyIds.size} sin guardar
                </Badge>
              )}
              <Button type='button' size='sm' onClick={handleSaveAll} disabled={isPending || dirtyIds.size === 0}>
                {isPending ? <Loader2 className='mr-1 size-3.5 animate-spin' /> : null}
                Guardar cambios
              </Button>
            </div>
          </div>
          <div className='divide-y rounded-lg border'>
            {variants.map((variant) => (
              <div key={variant.id} className='space-y-2 p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-sm font-medium'>{variant.name}</span>
                        {dirtyIds.has(variant.id) && (
                          <span className='size-1.5 rounded-full bg-orange-400' title='Sin guardar' />
                        )}
                      </div>
                      <div className='flex flex-wrap gap-1'>
                        {Object.entries(variant.options).map(([key, val]) => (
                          <Badge key={key} variant='outline' className='text-[10px]'>
                            {key}: {val}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {!variant.isActive && (
                      <Badge variant='secondary' className='text-[10px]'>
                        Inactiva
                      </Badge>
                    )}
                    <Switch
                      checked={variant.isActive}
                      onCheckedChange={(v) => handleToggleActive(variant, v)}
                      disabled={isPending}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='size-8 text-red-500 hover:text-red-600'
                      onClick={() => handleDelete(variant.id)}
                      disabled={isPending}
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </div>

                <div className='grid gap-2 sm:grid-cols-3'>
                  <div>
                    <span className='text-muted-foreground text-[10px]'>Stock</span>
                    <Input
                      type='number'
                      min='0'
                      value={variant.stock}
                      onChange={(e) => updateLocalVariant(variant.id, 'stock', parseInt(e.target.value) || 0)}
                      disabled={isPending}
                      className='h-8 text-sm'
                    />
                  </div>
                  <div>
                    <span className='text-muted-foreground text-[10px]'>Precio (vacío = precio base)</span>
                    <Input
                      type='number'
                      step='0.01'
                      min='0'
                      placeholder='—'
                      value={variant.price ?? ''}
                      onChange={(e) => updateLocalVariant(variant.id, 'price', e.target.value || null)}
                      disabled={isPending}
                      className='h-8 text-sm'
                    />
                  </div>
                  <div>
                    <span className='text-muted-foreground text-[10px]'>SKU</span>
                    <Input
                      placeholder='—'
                      value={variant.sku ?? ''}
                      onChange={(e) => updateLocalVariant(variant.id, 'sku', e.target.value || null)}
                      disabled={isPending}
                      className='h-8 text-sm'
                    />
                  </div>
                </div>

                {/* Variant image gallery */}
                <div>
                  <span className='text-muted-foreground text-[10px]'>Imágenes de variante</span>
                  <div className='mt-1 flex flex-wrap items-center gap-1.5'>
                    {(variantImages[variant.id] ?? []).map((img) => (
                      <div key={img.id} className='group/img relative size-12 overflow-hidden rounded-md border'>
                        <img src={img.url} alt={img.alt ?? ''} className='size-full object-cover' />
                        <button
                          type='button'
                          onClick={() => handleDeleteVariantImage(variant.id, img.id)}
                          disabled={isPending}
                          className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover/img:opacity-100'
                        >
                          <X className='size-4 text-white' />
                        </button>
                      </div>
                    ))}
                    <label
                      className={`flex size-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border-2 border-dashed transition-colors ${
                        uploadingVariantId === variant.id
                          ? 'pointer-events-none opacity-50'
                          : 'hover:border-primary hover:bg-primary/5'
                      }`}
                    >
                      {uploadingVariantId === variant.id ? (
                        <Loader2 className='text-muted-foreground size-4 animate-spin' />
                      ) : (
                        <Upload className='text-muted-foreground size-4' />
                      )}
                      <span className='text-muted-foreground text-[8px]'>
                        {uploadingVariantId === variant.id ? '...' : 'Subir'}
                      </span>
                      <input
                        type='file'
                        accept='image/jpeg,image/png,image/webp,image/gif,image/avif'
                        multiple
                        className='hidden'
                        disabled={isPending || uploadingVariantId === variant.id}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleVariantImageUpload(variant.id, e.target.files);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
