'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { forgotPasswordAction } from '@/modules/auth/server/actions/forgot-password.action';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/modules/auth/ui/schemas/auth.schemas';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(values);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(`/auth/verify-otp?email=${encodeURIComponent(values.email)}&purpose=password_reset`);
    });
  };

  return (
    <div className='space-y-8'>
      <div className='flex flex-col items-center space-y-4'>
        <div className='bg-card flex size-12 items-center justify-center rounded-xl border'>
          <span className='text-foreground text-xl font-bold'>V</span>
        </div>
        <div className='space-y-1 text-center'>
          <h1 className='text-foreground text-2xl font-semibold tracking-tight'>Recuperar contraseña</h1>
          <p className='text-muted-foreground text-sm'>Te enviaremos un código de verificación a tu correo</p>
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
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Mail className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      type='email'
                      placeholder='tu@email.com'
                      className='h-11 pl-10'
                      disabled={isPending}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' className='h-11 w-full' disabled={isPending}>
            {isPending ? 'Enviando...' : 'Enviar código'}
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
