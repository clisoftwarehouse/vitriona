'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import type { OtpPurpose } from '@/modules/auth/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { verifyOtpAction } from '@/modules/auth/server/actions/verify-otp.action';
import { resendOtpAction } from '@/modules/auth/server/actions/resend-otp.action';
import { Form, FormItem, FormField, FormControl, FormMessage } from '@/components/ui/form';
import { verifyOtpSchema, type VerifyOtpFormValues } from '@/modules/auth/ui/schemas/auth.schemas';
import { InputOTP, InputOTPSlot, InputOTPGroup, InputOTPSeparator } from '@/components/ui/input-otp';

interface VerifyOtpFormProps {
  email: string;
  purpose: OtpPurpose;
}

export function VerifyOtpForm({ email, purpose }: VerifyOtpFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');

  const form = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: '' },
  });

  const title = purpose === 'email_verification' ? 'Verifica tu email' : 'Código de verificación';
  const description =
    purpose === 'email_verification'
      ? `Ingresa el código de 6 dígitos enviado a ${email}`
      : `Ingresa el código de 6 dígitos enviado a ${email} para restablecer tu contraseña`;

  const handleResend = () => {
    setError(null);
    setResendMessage(null);
    startTransition(async () => {
      const result = await resendOtpAction(email, purpose);
      if (result?.error) {
        setError(result.error);
      } else {
        setResendMessage('Código reenviado. Revisa tu bandeja de entrada.');
      }
    });
  };

  const onSubmit = (values: VerifyOtpFormValues) => {
    setError(null);
    setResendMessage(null);
    startTransition(async () => {
      const result = await verifyOtpAction(values, email, purpose);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (purpose === 'email_verification') {
        router.push('/auth/login?verified=true');
        return;
      }
      if (result.resetToken) {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&token=${result.resetToken}`);
      }
    });
  };

  return (
    <div className='space-y-8'>
      <div className='flex flex-col items-center space-y-4'>
        <div className='bg-card flex size-12 items-center justify-center rounded-xl border'>
          <span className='text-foreground text-xl font-bold'>V</span>
        </div>
        <div className='space-y-1 text-center'>
          <h1 className='text-foreground text-2xl font-semibold tracking-tight'>{title}</h1>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>
      </div>

      {resendMessage && (
        <Alert className='border-green-500/50 bg-green-500/10'>
          <AlertDescription className='text-green-700 dark:text-green-400'>{resendMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='otp'
            render={({ field }) => (
              <FormItem className='flex flex-col items-center'>
                <FormControl>
                  <InputOTP
                    maxLength={6}
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      setOtpValue(val);
                    }}
                    disabled={isPending}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' className='h-11 w-full' disabled={isPending || otpValue.length < 6}>
            {isPending ? 'Verificando...' : 'Verificar código'}
          </Button>
        </form>
      </Form>

      <p className='text-muted-foreground text-center text-sm'>
        ¿No recibiste el código?{' '}
        <button
          type='button'
          onClick={handleResend}
          disabled={isPending}
          className='text-primary hover:underline disabled:opacity-50'
        >
          Reenviar
        </button>
      </p>
    </div>
  );
}
