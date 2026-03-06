'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Phone, Store, MapPin, MessageCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BUSINESS_CATEGORIES } from '@/modules/businesses/constants';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { createBusinessSchema, type CreateBusinessFormValues } from '@/modules/businesses/ui/schemas/business.schemas';

interface BusinessFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CreateBusinessFormValues>;
  onSubmitAction: (values: CreateBusinessFormValues) => Promise<{ error?: string; success?: boolean }>;
}

export function BusinessForm({ mode, defaultValues, onSubmitAction }: BusinessFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateBusinessFormValues>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      category: undefined,
      phone: '',
      email: '',
      address: '',
      whatsappNumber: '',
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
      router.push('/dashboard/businesses');
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
                      <Input {...field} placeholder='mi-joyeria-ana' className='pr-30' disabled={isPending} />
                      <span className='text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm'>
                        .vitriona.app
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
              name='address'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <MapPin className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                      <Input {...field} placeholder='Calle, Ciudad, País' className='pl-10' disabled={isPending} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  ? 'Crear negocio'
                  : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
