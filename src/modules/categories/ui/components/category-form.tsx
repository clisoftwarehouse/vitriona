'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { createCategorySchema, type CreateCategoryFormValues } from '@/modules/categories/ui/schemas/category.schemas';

interface ParentOption {
  id: string;
  name: string;
}

interface CategoryFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CreateCategoryFormValues>;
  parentOptions?: ParentOption[];
  currentCategoryId?: string;
  onSubmitAction: (values: CreateCategoryFormValues) => Promise<{ error?: string; success?: boolean }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({
  mode,
  defaultValues,
  parentOptions = [],
  currentCategoryId,
  onSubmitAction,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      parentId: '',
      ...defaultValues,
    },
  });

  const onSubmit = (values: CreateCategoryFormValues) => {
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
                  <Input {...field} placeholder='Ej: Collares, Anillos, Pulseras...' disabled={isPending} />
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
                    placeholder='Descripción opcional...'
                    className='resize-none'
                    rows={2}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {parentOptions.length > 0 && (
            <FormField
              control={form.control}
              name='parentId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría padre</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Ninguna (raíz)' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>Ninguna (raíz)</SelectItem>
                      {parentOptions
                        .filter((p) => p.id !== currentCategoryId)
                        .map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
                  ? 'Crear categoría'
                  : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
