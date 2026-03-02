'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Eye, Lock, EyeOff } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetPasswordAction } from '@/modules/auth/server/actions/reset-password.action';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/modules/auth/ui/schemas/auth.schemas';

interface ResetPasswordFormProps {
  email: string;
  resetToken: string;
}

export function ResetPasswordForm({ email, resetToken }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(values, email, resetToken);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push('/auth/login?reset=true');
    });
  };

  return (
    <div className='space-y-8'>
      <div className='flex flex-col items-center space-y-4'>
        <div className='bg-card flex size-12 items-center justify-center rounded-xl border'>
          <span className='text-foreground text-xl font-bold'>V</span>
        </div>
        <div className='space-y-1 text-center'>
          <h1 className='text-foreground text-2xl font-semibold tracking-tight'>Nueva contraseña</h1>
          <p className='text-muted-foreground text-sm'>Crea una contraseña segura para tu cuenta</p>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva contraseña</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Lock className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Mínimo 8 caracteres'
                      className='h-11 pr-10 pl-10'
                      disabled={isPending}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword((v) => !v)}
                      className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors'
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
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
                <FormLabel>Confirmar contraseña</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Lock className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder='Repite tu contraseña'
                      className='h-11 pr-10 pl-10'
                      disabled={isPending}
                    />
                    <button
                      type='button'
                      onClick={() => setShowConfirm((v) => !v)}
                      className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors'
                      aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirm ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' className='h-11 w-full' disabled={isPending}>
            {isPending ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>
        </form>
      </Form>

      <p className='text-muted-foreground text-center text-sm'>
        <Link href='/auth/login' className='text-primary hover:underline'>
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
