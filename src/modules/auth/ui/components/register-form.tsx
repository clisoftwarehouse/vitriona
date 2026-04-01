'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Lock, Mail, User, EyeOff } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { registerAction } from '@/modules/auth/server/actions/register.action';
import { registerSchema, type RegisterFormValues } from '@/modules/auth/ui/schemas/auth.schemas';
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (values: RegisterFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await registerAction(values);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(`/auth/verify-otp?email=${encodeURIComponent(values.email)}&purpose=email_verification`);
    });
  };

  return (
    <div className='space-y-8'>
      <div className='flex flex-col items-center space-y-4'>
        <Link href='/' className='flex size-12 items-center justify-center'>
          <Image src='/icon.png' alt='Vitriona' width={48} height={48} />
        </Link>
        <div className='space-y-1 text-center'>
          <h1 className='text-foreground text-2xl font-semibold tracking-tight'>Crear cuenta</h1>
          <p className='text-muted-foreground text-sm'>Empieza a crear tu catálogo digital</p>
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
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <User className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                    <Input {...field} placeholder='Juan Pérez' className='h-11 pl-10' disabled={isPending} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormLabel>Contraseña</FormLabel>
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
            {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>
      </Form>

      <p className='text-muted-foreground text-center text-sm'>
        ¿Ya tienes cuenta?{' '}
        <Link href='/auth/login' className='text-primary hover:underline'>
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
