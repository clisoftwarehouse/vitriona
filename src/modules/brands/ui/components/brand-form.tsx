'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { createBrandSchema, type CreateBrandFormValues } from '@/modules/brands/ui/schemas/brand.schemas';

interface BrandFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CreateBrandFormValues>;
  onSubmitAction: (values: CreateBrandFormValues) => Promise<{ error?: string; success?: boolean }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BrandForm({ mode, defaultValues, onSubmitAction, onSuccess, onCancel }: BrandFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateBrandFormValues>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
      ...defaultValues,
    },
  });

  const onSubmit = (values: CreateBrandFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await onSubmitAction(values);
      if (result?.error) {
        setError(result.error);
        return;
      }
      form.reset();
      onSuccess?.();
    });
  };

  return (
    <div className='space-y-4'>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='Ej: Nike, Samsung, Apple...' disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-3'>
            {onCancel && (
              <Button type='button' variant='outline' onClick={onCancel} disabled={isPending}>
                Cancelar
              </Button>
            )}
            <Button type='submit' disabled={isPending}>
              {isPending
                ? mode === 'create'
                  ? 'Creando...'
                  : 'Guardando...'
                : mode === 'create'
                  ? 'Crear marca'
                  : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
