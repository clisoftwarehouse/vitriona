'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { X, Loader2, ImagePlus } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState, useTransition } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { createCatalogSchema, type CreateCatalogFormValues } from '@/modules/catalogs/ui/schemas/catalog.schemas';

const CATALOG_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'seasonal', label: 'Temporada' },
  { value: 'premium', label: 'Premium' },
  { value: 'services', label: 'Servicios' },
] as const;

interface CatalogFormProps {
  mode: 'create' | 'edit';
  businessId: string;
  defaultValues?: Partial<CreateCatalogFormValues>;
  onSubmitAction: (values: CreateCatalogFormValues) => Promise<{ error?: string; success?: boolean }>;
}

export function CatalogForm({ mode, businessId, defaultValues, onSubmitAction }: CatalogFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateCatalogFormValues>({
    resolver: zodResolver(createCatalogSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      type: 'general',
      ...defaultValues,
    },
  });

  const imageUrl = form.watch('imageUrl');
  const nameValue = form.watch('name');

  const generateSlug = () => {
    const slug = nameValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    form.setValue('slug', slug);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Error al subir imagen');

      const data = await res.json();
      form.setValue('imageUrl', data.url);
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = (values: CreateCatalogFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await onSubmitAction(values);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/businesses/${businessId}/catalogs`);
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
          <div className='grid gap-6 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del catálogo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Catálogo de verano' disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='slug'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL)</FormLabel>
                  <div className='flex gap-2'>
                    <FormControl>
                      <Input {...field} placeholder='catalogo-de-verano' disabled={isPending} />
                    </FormControl>
                    <Button type='button' variant='outline' size='sm' onClick={generateSlug} disabled={isPending}>
                      Auto
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder='Describe brevemente este catálogo...'
                    className='resize-none'
                    rows={3}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid gap-6 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de catálogo</FormLabel>
                  <Select value={field.value ?? 'general'} onValueChange={field.onChange} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATALOG_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='space-y-2'>
              <Label>Imagen de portada</Label>
              {imageUrl ? (
                <div className='relative h-32 overflow-hidden rounded-lg border'>
                  <Image src={imageUrl} alt='Portada' fill className='object-cover' />
                  <Button
                    type='button'
                    variant='destructive'
                    size='icon-sm'
                    className='absolute top-2 right-2'
                    onClick={() => form.setValue('imageUrl', '')}
                  >
                    <X className='size-3' />
                  </Button>
                </div>
              ) : (
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className='bg-muted/30 hover:bg-muted/60 flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors'
                >
                  {isUploading ? (
                    <Loader2 className='text-muted-foreground size-6 animate-spin' />
                  ) : (
                    <ImagePlus className='text-muted-foreground size-6' />
                  )}
                  <span className='text-muted-foreground text-xs'>
                    {isUploading ? 'Subiendo...' : 'Subir imagen de portada'}
                  </span>
                </button>
              )}
              <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleImageUpload} />
            </div>
          </div>

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
                  ? 'Crear catálogo'
                  : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
