'use client';

import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Mail, Globe, Phone, Store, MapPin, Trash2, Upload, Loader2, Receipt, MessageCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { BusinessHoursEditor } from './business-hours-editor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CURRENCIES, LOCALE_OPTIONS, BUSINESS_CATEGORIES } from '@/modules/businesses/constants';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { setActiveBusinessAction } from '@/modules/businesses/server/actions/set-active-business.action';
import { createBusinessSchema, type CreateBusinessFormValues } from '@/modules/businesses/ui/schemas/business.schemas';

interface BusinessFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CreateBusinessFormValues>;
  onSubmitAction: (
    values: CreateBusinessFormValues
  ) => Promise<{ error?: string; success?: boolean; businessId?: string }>;
}

export function BusinessForm({ mode, defaultValues, onSubmitAction }: BusinessFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateBusinessFormValues>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      category: undefined,
      logoUrl: '',
      phone: '',
      email: '',
      whatsappNumber: '',
      website: '',
      address: '',
      country: '',
      city: '',
      state: '',
      zipCode: '',
      currency: 'USD',
      timezone: 'America/Santo_Domingo',
      locale: 'es',
      instagramUrl: '',
      facebookUrl: '',
      tiktokUrl: '',
      twitterUrl: '',
      youtubeUrl: '',
      taxId: '',
      businessHours: undefined,
      ...defaultValues,
    },
  });

  const handleNameChange = (value: string) => {
    form.setValue('name', value);
    if (mode === 'create' && !form.getFieldState('slug').isDirty) {
      form.setValue('slug', generateSlug(value));
    }
  };

  const onSubmit = (values: CreateBusinessFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await onSubmitAction(values);
      if (result?.error) {
        setError(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      if (mode === 'create' && result.businessId) {
        await setActiveBusinessAction(result.businessId);
        router.refresh();
        router.push(`/dashboard/businesses/${result.businessId}`);
        return;
      }
      router.refresh();
      router.push('/dashboard');
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
          {/* Logo Upload */}
          <FormField
            control={form.control}
            name='logoUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo del negocio</FormLabel>
                <FormControl>
                  <LogoUpload value={field.value ?? ''} onChange={field.onChange} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid gap-6 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del negocio</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Store className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                      <Input
                        {...field}
                        placeholder='Mi Joyería Ana'
                        className='pl-10'
                        disabled={isPending}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </div>
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
                  <FormLabel>URL del catálogo</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input {...field} placeholder='mi-joyeria-ana' className='pl-30' disabled={isPending} />
                      <span className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm'>
                        vitriona.app/
                      </span>
                    </div>
                  </FormControl>
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
                    placeholder='Describe brevemente tu negocio...'
                    className='resize-none'
                    rows={3}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='category'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Selecciona una categoría' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Contacto ── */}
          <SectionTitle icon={Phone} title='Contacto' />
          <div className='grid gap-6 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Phone className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                      <Input {...field} placeholder='+1 234 567 8900' className='pl-10' disabled={isPending} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='whatsappNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <MessageCircle className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                      <Input {...field} placeholder='+1 234 567 8900' className='pl-10' disabled={isPending} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='grid gap-6 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del negocio</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Mail className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                      <Input
                        {...field}
                        type='email'
                        placeholder='contacto@minegocio.com'
                        className='pl-10'
                        disabled={isPending}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='website'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitio web</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Globe className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                      <Input {...field} placeholder='https://minegocio.com' className='pl-10' disabled={isPending} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ── Ubicación ── */}
          <SectionTitle icon={MapPin} title='Ubicación' />
          <FormField
            control={form.control}
            name='address'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <MapPin className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                    <Input {...field} placeholder='Calle Principal #123' className='pl-10' disabled={isPending} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            <FormField
              control={form.control}
              name='city'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Santo Domingo' disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='state'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado / Provincia</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Distrito Nacional' disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='country'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='República Dominicana' disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='zipCode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código postal</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='10100' disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ── Regional ── */}
          <SectionTitle icon={Globe} title='Configuración regional' />
          <div className='grid gap-6 sm:grid-cols-3'>
            <FormField
              control={form.control}
              name='currency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? 'USD'}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name='locale'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idioma</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? 'es'}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOCALE_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name='timezone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zona horaria</FormLabel>
                  <FormControl>
                    <select
                      value={field.value ?? 'America/Santo_Domingo'}
                      onChange={field.onChange}
                      disabled={isPending}
                      className='border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full appearance-none rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {Intl.supportedValuesOf('timeZone').map((tz) => (
                        <option key={tz} value={tz}>
                          {tz.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ── Redes sociales ── */}
          <SectionTitle icon={Globe} title='Redes sociales' />
          <div className='grid gap-4 sm:grid-cols-2'>
            {(
              [
                { name: 'instagramUrl' as const, label: 'Instagram', ph: 'https://instagram.com/minegocio' },
                { name: 'facebookUrl' as const, label: 'Facebook', ph: 'https://facebook.com/minegocio' },
                { name: 'tiktokUrl' as const, label: 'TikTok', ph: 'https://tiktok.com/@minegocio' },
                { name: 'twitterUrl' as const, label: 'X / Twitter', ph: 'https://x.com/minegocio' },
                { name: 'youtubeUrl' as const, label: 'YouTube', ph: 'https://youtube.com/@minegocio' },
              ] as const
            ).map(({ name, label, ph }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={ph} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          {/* ── Horarios ── */}
          <SectionTitle icon={Store} title='Horarios de atención' />
          <FormField
            control={form.control}
            name='businessHours'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <BusinessHoursEditor value={field.value} onChange={field.onChange} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Fiscal ── */}
          <SectionTitle icon={Receipt} title='Información fiscal' />
          <FormField
            control={form.control}
            name='taxId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>RNC / NIF / Tax ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='000-00000-0' disabled={isPending} />
                </FormControl>
                <FormMessage />
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
                  ? 'Crear negocio'
                  : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

/* ─── Section Title ─── */

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className='flex items-center gap-2 border-b pt-4 pb-2'>
      <Icon className='text-muted-foreground size-4' />
      <h4 className='text-sm font-semibold'>{title}</h4>
    </div>
  );
}

/* ─── Logo Upload ─── */

function LogoUpload({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) onChange(data.url);
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className='flex items-center gap-4'>
        <div className='relative size-16 overflow-hidden rounded-xl border'>
          <Image src={value} alt='Logo' fill className='object-cover' />
        </div>
        <Button type='button' variant='outline' size='sm' onClick={() => onChange('')} disabled={disabled}>
          <Trash2 className='mr-1.5 size-3.5' />
          Eliminar
        </Button>
      </div>
    );
  }

  return (
    <label className='hover:bg-accent/50 flex w-fit cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors'>
      {uploading ? <Loader2 className='size-4 animate-spin' /> : <Upload className='size-4' />}
      {uploading ? 'Subiendo...' : 'Subir logo'}
      <input type='file' accept='image/*' className='hidden' onChange={handleUpload} disabled={disabled || uploading} />
    </label>
  );
}
