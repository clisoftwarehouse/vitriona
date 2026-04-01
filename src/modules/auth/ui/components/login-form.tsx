'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Lock, Mail, EyeOff } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loginSchema, type LoginFormValues } from '@/modules/auth/ui/schemas/auth.schemas';
import { loginAction, googleSignInAction } from '@/modules/auth/server/actions/login.action';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

function GoogleIcon() {
  return (
    <svg className='size-4' viewBox='0 0 24 24' aria-hidden='true'>
      <path
        fill='#EA4335'
        d='M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z'
      />
      <path
        fill='#34A853'
        d='M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078-3.134 0-5.78-2.014-6.723-4.823l-4.04 3.067C3.193 21.294 7.265 24 12 24c2.933 0 5.735-1.043 7.834-3.001l-3.793-2.986Z'
      />
      <path
        fill='#4A90E2'
        d='M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z'
      />
      <path
        fill='#FBBC05'
        d='M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z'
      />
    </svg>
  );
}

interface LoginFormProps {
  successMessage?: string;
}

export function LoginForm({ successMessage }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result && 'redirect' in result && result.redirect) {
        router.push(result.redirect);
        return;
      }
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className='space-y-8'>
      <div className='flex flex-col items-center space-y-4'>
        <Link href='/' className='flex size-12 items-center justify-center'>
          <Image src='/icon.png' alt='Vitriona' width={48} height={48} />
        </Link>
        <div className='space-y-1 text-center'>
          <h1 className='text-foreground text-2xl font-semibold tracking-tight'>Bienvenido de vuelta</h1>
          <p className='text-muted-foreground text-sm'>Inicia sesión para continuar</p>
        </div>
      </div>

      {successMessage && (
        <Alert className='border-green-500/50 bg-green-500/10'>
          <AlertDescription className='text-green-700 dark:text-green-400'>{successMessage}</AlertDescription>
        </Alert>
      )}

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

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <div className='flex items-center justify-between'>
                  <FormLabel>Contraseña</FormLabel>
                  <Link href='/auth/forgot-password' className='text-primary text-xs hover:underline'>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <FormControl>
                  <div className='relative'>
                    <Lock className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder='••••••••'
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

          <Button type='submit' className='h-11 w-full' disabled={isPending}>
            {isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>
      </Form>

      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <Separator />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background text-muted-foreground px-2'>o continúa con</span>
        </div>
      </div>

      <Button
        type='button'
        variant='outline'
        className='h-11 w-full gap-2'
        onClick={() =>
          startTransition(async () => {
            await googleSignInAction();
          })
        }
        disabled={isPending}
      >
        <GoogleIcon />
        Continuar con Google
      </Button>

      <p className='text-muted-foreground text-center text-sm'>
        ¿No tienes cuenta?{' '}
        <Link href='/auth/register' className='text-primary hover:underline'>
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
