'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState, useTransition } from 'react';
import { Check, Crown, Loader2, FileText, ArrowLeft, RefreshCw, ArrowRight, CreditCard } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { submitUpgradeRequestAction } from '@/modules/upgrade/server/actions/submit-upgrade-request.action';

// ── Constants ──

const ANNUAL_DISCOUNT = 0.15;

type BillingCycle = 'monthly' | 'annual';
type PaymentMethod = 'bank_transfer' | 'pago_movil' | 'zelle' | 'binance';

const PLAN_LABELS: Record<string, string> = {
  pro: 'Emprendedor',
  business: 'Negocio',
};

const PLAN_PRICES: Record<string, number> = {
  pro: 15,
  business: 30,
};

const PAYMENT_METHODS: { key: PaymentMethod; label: string; description: string }[] = [
  { key: 'bank_transfer', label: 'Transferencia Bancaria', description: 'Transferencia directa a nuestra cuenta' },
  { key: 'pago_movil', label: 'Pago Móvil', description: 'Pago instantáneo desde tu banco' },
  { key: 'zelle', label: 'Zelle', description: 'Transferencia vía Zelle' },
  { key: 'binance', label: 'Binance', description: 'Pago con criptomonedas vía Binance Pay' },
];

// ── Helpers ──

function getPrice(monthlyPrice: number, cycle: BillingCycle) {
  if (cycle === 'annual') {
    const discounted = monthlyPrice * (1 - ANNUAL_DISCOUNT);
    return { monthly: discounted, total: discounted * 12 };
  }
  return { monthly: monthlyPrice, total: monthlyPrice };
}

function formatUsd(amount: number) {
  return `$${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

// ── Component ──

interface RenewalCheckoutProps {
  businessId: string;
  businessName: string;
  currentPlan: string;
  currentBillingCycle: string | null;
  billingCycleEnd: string | null; // ISO string
  userEmail: string;
}

type Step = 'payment' | 'invoice';

export function RenewalCheckout({
  businessId,
  businessName,
  currentPlan,
  currentBillingCycle,
  billingCycleEnd,
  userEmail,
}: RenewalCheckoutProps) {
  const [step, setStep] = useState<Step>('payment');
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  // Selections
  const [billingCycle, setBillingCycle] = useState<BillingCycle>((currentBillingCycle as BillingCycle) ?? 'annual');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  // Invoice form
  const [referenceId, setReferenceId] = useState('');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const monthlyPrice = PLAN_PRICES[currentPlan] ?? 15;
  const pricing = getPrice(monthlyPrice, billingCycle);
  const paymentAmount = billingCycle === 'annual' ? pricing.total : pricing.monthly;

  const canProceedPayment = paymentMethod !== null;
  const canSubmit = referenceId.trim() && fullName.trim() && idNumber.trim() && email.trim();

  const formattedExpiry = billingCycleEnd
    ? new Intl.DateTimeFormat('es', { year: 'numeric', month: 'long', day: 'numeric' }).format(
        new Date(billingCycleEnd)
      )
    : null;

  const handleSubmit = () => {
    if (!canSubmit || !paymentMethod) return;
    startTransition(async () => {
      const result = await submitUpgradeRequestAction({
        businessId,
        plan: currentPlan as 'pro' | 'business',
        billingCycle,
        paymentMethod,
        referenceId,
        amount: paymentAmount.toFixed(2),
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
      toast.success('Solicitud de renovación enviada correctamente');
    });
  };

  if (submitted) {
    return (
      <Card className='mx-auto max-w-lg py-16'>
        <CardContent className='flex flex-col items-center text-center'>
          <div className='flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
            <Check className='size-8 text-green-600 dark:text-green-400' />
          </div>
          <h2 className='mt-6 text-xl font-semibold'>Solicitud de renovación enviada</h2>
          <p className='text-muted-foreground mt-2 max-w-sm text-sm'>
            Hemos recibido tu solicitud de renovación del plan{' '}
            <strong>{PLAN_LABELS[currentPlan] ?? currentPlan}</strong> para <strong>{businessName}</strong>.
            Verificaremos tu pago y extenderemos tu suscripción lo antes posible. Te notificaremos por correo
            electrónico.
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
        <h1 className='text-2xl font-bold tracking-tight'>Renovar Suscripción</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Renueva tu plan actual para seguir disfrutando de todas las funcionalidades.
        </p>
      </div>

      {/* Plan summary */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center gap-4'>
            <div className='bg-primary/10 flex size-12 items-center justify-center rounded-full'>
              <Crown className='text-primary size-6' />
            </div>
            <div className='flex-1'>
              <p className='text-lg font-semibold'>Plan {PLAN_LABELS[currentPlan] ?? currentPlan}</p>
              <p className='text-muted-foreground text-sm'>{businessName}</p>
              {formattedExpiry && <p className='text-muted-foreground mt-0.5 text-xs'>Vence el {formattedExpiry}</p>}
            </div>
            <div className='text-right'>
              <RefreshCw className='text-primary mx-auto mb-1 size-5' />
              <p className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>Renovación</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps indicator */}
      <div className='flex items-center justify-center gap-2'>
        {(['payment', 'invoice'] as Step[]).map((s, i) => {
          const labels = ['Pago', 'Facturación'];
          const icons = [CreditCard, FileText];
          const Icon = icons[i];
          const isActive = s === step;
          const isDone = s === 'payment' && step === 'invoice';

          return (
            <div key={s} className='flex items-center gap-2'>
              {i > 0 && <div className={`h-px w-8 ${isDone || isActive ? 'bg-primary' : 'bg-border'}`} />}
              <button
                onClick={() => {
                  if (isDone) setStep(s);
                }}
                disabled={!isDone}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                      ? 'bg-primary/10 text-primary cursor-pointer'
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

      {/* Step 1: Billing cycle + Payment method */}
      {step === 'payment' && (
        <div className='space-y-6'>
          {/* Billing cycle toggle */}
          <div>
            <Label className='mb-3 block text-base font-semibold'>Ciclo de facturación</Label>
            <div className='flex justify-center'>
              <div className='bg-muted inline-flex items-center gap-1 rounded-full p-1'>
                <button
                  type='button'
                  onClick={() => setBillingCycle('monthly')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mensual
                </button>
                <button
                  type='button'
                  onClick={() => setBillingCycle('annual')}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    billingCycle === 'annual'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Anual
                  <span className='bg-primary/12 text-primary rounded-full px-2 py-0.5 text-[11px] font-semibold'>
                    -15%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Price summary */}
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-semibold'>
                    <RefreshCw className='text-primary mr-1.5 inline size-4' />
                    Renovación — Plan {PLAN_LABELS[currentPlan] ?? currentPlan}
                  </p>
                  <p className='text-muted-foreground text-xs'>{billingCycle === 'annual' ? 'Anual' : 'Mensual'}</p>
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-bold'>{formatUsd(paymentAmount)}</p>
                  <p className='text-muted-foreground text-xs'>{billingCycle === 'annual' ? 'por año' : 'por mes'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment methods */}
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
                      ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                      : 'hover:border-primary/50 hover:shadow-sm'
                  }`}
                >
                  <p className='text-sm font-semibold'>{m.label}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>{m.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className='flex justify-between'>
            <Button variant='outline' asChild>
              <Link href='/dashboard/billing'>
                <ArrowLeft className='mr-2 size-4' />
                Volver
              </Link>
            </Button>
            <Button onClick={() => setStep('invoice')} disabled={!canProceedPayment}>
              Continuar
              <ArrowRight className='ml-2 size-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Invoice info & reference */}
      {step === 'invoice' && (
        <div className='space-y-6'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-semibold'>
                    Renovación — Plan {PLAN_LABELS[currentPlan] ?? currentPlan} ·{' '}
                    {billingCycle === 'annual' ? 'Anual' : 'Mensual'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.label}
                  </p>
                </div>
                <p className='text-2xl font-bold'>{formatUsd(paymentAmount)}</p>
              </div>
            </CardContent>
          </Card>

          <div className='space-y-6'>
            <div>
              <Label className='mb-4 block text-base font-semibold'>Comprobante de pago</Label>
              <div className='space-y-4'>
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
            <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar solicitud de renovación
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
