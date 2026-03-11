'use client';

import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Lock, EyeOff, Shield, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { changePasswordAction } from '@/modules/users/server/actions/change-password.action';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/modules/users/ui/schemas/user.schemas';

interface SecurityFormProps {
  hasPassword: boolean;
  providers: string[];
}

export function SecurityForm({ hasPassword, providers }: SecurityFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values: ChangePasswordFormValues) => {
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Contraseña actualizada correctamente');
      form.reset();
    });
  };

  const toggleVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className='space-y-6'>
      {/* Auth providers info */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
              <Shield className='text-primary size-5' />
            </div>
            <div>
              <h3 className='text-lg font-semibold'>Métodos de autenticación</h3>
              <p className='text-muted-foreground text-sm'>Cómo inicias sesión en tu cuenta.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {providers.map((provider) => (
              <Badge key={provider} variant='secondary' className='gap-1.5 px-3 py-1.5 text-sm capitalize'>
                {provider === 'google' ? '🔵 Google' : provider === 'credentials' ? '🔑 Contraseña' : provider}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      {hasPassword ? (
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                <Lock className='text-primary size-5' />
              </div>
              <div>
                <h3 className='text-lg font-semibold'>Cambiar contraseña</h3>
                <p className='text-muted-foreground text-sm'>Actualiza tu contraseña de acceso.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='currentPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña actual</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            {...field}
                            type={showPasswords.current ? 'text' : 'password'}
                            placeholder='••••••••'
                            disabled={isPending}
                          />
                          <button
                            type='button'
                            onClick={() => toggleVisibility('current')}
                            className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2'
                          >
                            {showPasswords.current ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='newPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            {...field}
                            type={showPasswords.new ? 'text' : 'password'}
                            placeholder='••••••••'
                            disabled={isPending}
                          />
                          <button
                            type='button'
                            onClick={() => toggleVisibility('new')}
                            className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2'
                          >
                            {showPasswords.new ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar nueva contraseña</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            {...field}
                            type={showPasswords.confirm ? 'text' : 'password'}
                            placeholder='••••••••'
                            disabled={isPending}
                          />
                          <button
                            type='button'
                            onClick={() => toggleVisibility('confirm')}
                            className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2'
                          >
                            {showPasswords.confirm ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end pt-2'>
                  <Button type='submit' disabled={isPending}>
                    {isPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
                    Actualizar contraseña
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='p-5'>
            <p className='text-muted-foreground text-sm'>
              Tu cuenta usa inicio de sesión con Google. No necesitas gestionar una contraseña.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
