'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState, useTransition } from 'react';
import { Bot, Plus, Check, Minus, Loader2, FileText, ArrowLeft, ArrowRight, CreditCard } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { submitAiCreditsPurchaseAction } from '@/modules/upgrade/server/actions/submit-ai-credits-purchase.action';

// ── Constants ──

const CREDITS_PRICE = 5;
const CREDITS_AMOUNT = 1000;

type PaymentMethod = 'bank_transfer' | 'pago_movil' | 'zelle' | 'binance';

const PAYMENT_METHODS: { key: PaymentMethod; label: string; description: string }[] = [
  { key: 'bank_transfer', label: 'Transferencia Bancaria', description: 'Transferencia directa a nuestra cuenta' },
  { key: 'pago_movil', label: 'Pago Móvil', description: 'Pago instantáneo desde tu banco' },
  { key: 'zelle', label: 'Zelle', description: 'Transferencia vía Zelle' },
  { key: 'binance', label: 'Binance', description: 'Pago con criptomonedas vía Binance Pay' },
];

function formatUsd(amount: number) {
  return `$${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

// ── Component ──

interface AiCreditsCheckoutProps {
  businessId: string;
  businessName: string;
  currentAiPlan: string;
  messagesUsed: number;
  messagesLimit: number;
  userEmail: string;
}

type Step = 'quantity' | 'payment' | 'invoice';

export function AiCreditsCheckout({
  businessId,
  businessName,
  currentAiPlan,
  messagesUsed,
  messagesLimit,
  userEmail,
}: AiCreditsCheckoutProps) {
  const [step, setStep] = useState<Step>('quantity');
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  // Invoice form
  const [referenceId, setReferenceId] = useState('');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const totalCredits = quantity * CREDITS_AMOUNT;
  const totalPrice = quantity * CREDITS_PRICE;

  const canProceedPayment = paymentMethod !== null;
  const canSubmit = referenceId.trim() && fullName.trim() && idNumber.trim() && email.trim();

  const AI_PLAN_LABELS: Record<string, string> = {
    ia_starter: 'AI Starter',
    ia_business: 'AI Business',
    ia_enterprise: 'AI Enterprise',
  };

  const handleSubmit = () => {
    if (!canSubmit || !paymentMethod) return;
    startTransition(async () => {
      const result = await submitAiCreditsPurchaseAction({
        businessId,
        quantity,
        paymentMethod,
        referenceId,
        amount: totalPrice.toFixed(2),
        fullName,
        idNumber,
        email,
        phone: phone || undefined,
        notes: notes || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setSubmitted(true);
      toast.success('Solicitud de créditos enviada correctamente');
    });
  };

  if (submitted) {
    return (
      <Card className='mx-auto max-w-lg py-16'>
        <CardContent className='flex flex-col items-center text-center'>
          <div className='flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
            <Check className='size-8 text-green-600 dark:text-green-400' />
          </div>
          <h2 className='mt-6 text-xl font-semibold'>Solicitud enviada</h2>
          <p className='text-muted-foreground mt-2 max-w-sm text-sm'>
            Hemos recibido tu solicitud de <strong>{totalCredits.toLocaleString()} créditos adicionales</strong> de IA
            para <strong>{businessName}</strong>. Verificaremos tu pago y agregaremos los créditos lo antes posible.
          </p>
          <Button className='mt-8' asChild>
            <Link href='/dashboard/billing'>Volver a Facturación</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-6 py-2'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold tracking-tight'>Comprar Créditos de IA</h1>
        <p className='text-muted-foreground mt-1 text-sm'>Agrega mensajes adicionales a tu plan de IA actual.</p>
      </div>

      {/* Current AI plan summary */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center gap-4'>
            <div className='flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30'>
              <Bot className='size-6 text-amber-600 dark:text-amber-400' />
            </div>
            <div className='flex-1'>
              <p className='text-lg font-semibold'>{AI_PLAN_LABELS[currentAiPlan] ?? currentAiPlan}</p>
              <p className='text-muted-foreground text-sm'>{businessName}</p>
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium'>
                {messagesUsed.toLocaleString()} / {messagesLimit.toLocaleString()}
              </p>
              <p className='text-muted-foreground text-xs'>mensajes usados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps indicator */}
      <div className='flex items-center justify-center gap-2'>
        {(['quantity', 'payment', 'invoice'] as Step[]).map((s, i) => {
          const labels = ['Cantidad', 'Pago', 'Facturación'];
          const icons = [Bot, CreditCard, FileText];
          const Icon = icons[i];
          const isActive = s === step;
          const isDone =
            (s === 'quantity' && (step === 'payment' || step === 'invoice')) || (s === 'payment' && step === 'invoice');

          return (
            <div key={s} className='flex items-center gap-2'>
              {i > 0 && <div className={`h-px w-8 ${isDone || isActive ? 'bg-amber-500' : 'bg-border'}`} />}
              <button
                onClick={() => {
                  if (isDone) setStep(s);
                }}
                disabled={!isDone}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-white'
                    : isDone
                      ? 'cursor-pointer bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check className='size-3.5' /> : <Icon className='size-3.5' />}
                {labels[i]}
              </button>
            </div>
          );
        })}
      </div>

      {/* Step 1: Quantity selection */}
      {step === 'quantity' && (
        <div className='space-y-6'>
          <Card>
            <CardContent className='space-y-6 pt-6'>
              <div className='text-center'>
                <p className='text-muted-foreground text-sm'>Precio por paquete</p>
                <p className='mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400'>{formatUsd(CREDITS_PRICE)}</p>
                <p className='text-muted-foreground text-sm'>por {CREDITS_AMOUNT.toLocaleString()} mensajes</p>
              </div>

              <div className='flex items-center justify-center gap-4'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className='size-4' />
                </Button>
                <div className='text-center'>
                  <p className='text-4xl font-bold'>{quantity}</p>
                  <p className='text-muted-foreground text-xs'>{quantity === 1 ? 'paquete' : 'paquetes'}</p>
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= 10}
                >
                  <Plus className='size-4' />
                </Button>
              </div>

              <div className='rounded-lg bg-amber-50 px-4 py-3 text-center dark:bg-amber-950/30'>
                <p className='text-sm font-medium text-amber-800 dark:text-amber-200'>
                  {totalCredits.toLocaleString()} mensajes adicionales por {formatUsd(totalPrice)}
                </p>
                <p className='text-xs text-amber-700 dark:text-amber-300'>
                  Los créditos se agregan a tu límite actual y no expiran con el ciclo.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className='flex justify-between'>
            <Button variant='outline' asChild>
              <Link href='/dashboard/billing'>
                <ArrowLeft className='mr-2 size-4' />
                Volver
              </Link>
            </Button>
            <Button onClick={() => setStep('payment')} className='bg-amber-500 text-white hover:bg-amber-600'>
              Continuar
              <ArrowRight className='ml-2 size-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Payment method */}
      {step === 'payment' && (
        <div className='space-y-6'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-semibold'>
                    <Bot className='mr-1.5 inline size-4 text-amber-500' />
                    {totalCredits.toLocaleString()} créditos de IA
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {quantity} {quantity === 1 ? 'paquete' : 'paquetes'} × {formatUsd(CREDITS_PRICE)}
                  </p>
                </div>
                <p className='text-2xl font-bold'>{formatUsd(totalPrice)}</p>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label className='mb-4 block text-base font-semibold'>Selecciona el método de pago</Label>
            <div className='grid gap-4 sm:grid-cols-2'>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  type='button'
                  onClick={() => setPaymentMethod(m.key)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    paymentMethod === m.key
                      ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
                      : 'hover:border-amber-500/50 hover:shadow-sm'
                  }`}
                >
                  <p className='text-sm font-semibold'>{m.label}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>{m.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className='flex justify-between'>
            <Button variant='outline' onClick={() => setStep('quantity')}>
              <ArrowLeft className='mr-2 size-4' />
              Atrás
            </Button>
            <Button
              onClick={() => setStep('invoice')}
              disabled={!canProceedPayment}
              className='bg-amber-500 text-white hover:bg-amber-600'
            >
              Continuar
              <ArrowRight className='ml-2 size-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Invoice info */}
      {step === 'invoice' && (
        <div className='space-y-6'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-semibold'>
                    <Bot className='mr-1.5 inline size-4 text-amber-500' />
                    {totalCredits.toLocaleString()} créditos de IA
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.label}
                  </p>
                </div>
                <p className='text-2xl font-bold'>{formatUsd(totalPrice)}</p>
              </div>
            </CardContent>
          </Card>

          <div className='space-y-6'>
            <div>
              <Label className='mb-4 block text-base font-semibold'>Comprobante de pago</Label>
              <div className='grid gap-2'>
                <Label htmlFor='referenceId'>Número de referencia / ID de transacción *</Label>
                <Input
                  id='referenceId'
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder='Ej: 00012345678'
                />
              </div>
            </div>

            <div>
              <Label className='mb-4 block text-base font-semibold'>Datos de facturación</Label>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label htmlFor='fullName'>Nombre completo / Razón social *</Label>
                  <Input
                    id='fullName'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder='Juan Pérez'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='idNumber'>Cédula / RIF *</Label>
                  <Input
                    id='idNumber'
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder='V-12345678'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='email'>Correo electrónico *</Label>
                  <Input
                    id='email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='correo@ejemplo.com'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='phone'>Teléfono (opcional)</Label>
                  <Input
                    id='phone'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder='+58 412 1234567'
                  />
                </div>
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='notes'>Notas adicionales (opcional)</Label>
              <Textarea
                id='notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Cualquier información adicional sobre tu pago...'
                rows={3}
              />
            </div>
          </div>

          <div className='flex justify-between'>
            <Button variant='outline' onClick={() => setStep('payment')}>
              <ArrowLeft className='mr-2 size-4' />
              Atrás
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
              className='bg-amber-500 text-white hover:bg-amber-600'
            >
              {isPending ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' />
                  Enviando...
                </>
              ) : (
                <>
                  Comprar créditos
                  <ArrowRight className='ml-2 size-4' />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
