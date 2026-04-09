'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState, useTransition } from 'react';
import { Bot, Check, Loader2, FileText, ArrowLeft, ArrowRight, CreditCard } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { submitChatbotActivationRequestAction } from '@/modules/upgrade/server/actions/submit-chatbot-activation-request.action';

// ── Constants ──

const ANNUAL_DISCOUNT = 0.15;

type AiPlanKey = 'ia_starter' | 'ia_business' | 'ia_enterprise';
type BillingCycle = 'monthly' | 'annual';
type PaymentMethod = 'bank_transfer' | 'pago_movil' | 'zelle' | 'binance';

interface AiPlan {
  key: AiPlanKey;
  name: string;
  monthlyPrice: number;
  responses: string;
  description: string;
  highlighted?: boolean;
}

const AI_PLAN_LABELS: Record<string, string> = {
  ia_starter: 'AI Starter',
  ia_business: 'AI Business',
  ia_enterprise: 'AI Enterprise',
};

const AI_PLANS: AiPlan[] = [
  {
    key: 'ia_starter',
    name: 'AI Starter',
    monthlyPrice: 9.99,
    responses: '500 respuestas/mes',
    description: 'Para negocios que empiezan a automatizar su atención.',
  },
  {
    key: 'ia_business',
    name: 'AI Business',
    monthlyPrice: 24.99,
    responses: '2,500 respuestas/mes',
    description: 'Para negocios con volumen moderado de consultas.',
    highlighted: true,
  },
  {
    key: 'ia_enterprise',
    name: 'AI Enterprise',
    monthlyPrice: 49.99,
    responses: '10,000 respuestas/mes',
    description: 'Para operaciones de alto volumen y múltiples negocios.',
  },
];

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

interface ChatbotActivationCheckoutProps {
  businesses: { id: string; name: string; plan: string; hasAiQuota: boolean; aiPlanType?: string | null }[];
  userEmail: string;
  activeBusinessId: string | null;
}

type Step = 'plan' | 'payment' | 'invoice';

export function ChatbotActivationCheckout({ businesses, userEmail, activeBusinessId }: ChatbotActivationCheckoutProps) {
  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) ?? businesses[0] ?? null;
  const [step, setStep] = useState<Step>('plan');
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  // Selections
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<AiPlanKey>('ia_business');

  // Check if the active business already has AI quota
  const currentBusinessData = businesses.find((b) => b.id === activeBusiness?.id);
  const hasAiQuota = currentBusinessData?.hasAiQuota ?? false;
  const currentAiPlan = currentBusinessData?.aiPlanType ?? null;

  // Filter plans: if already has AI, show only higher tiers
  const AI_PLAN_HIERARCHY: Record<string, number> = {
    ia_starter: 0,
    ia_business: 1,
    ia_enterprise: 2,
  };

  const availableAiPlans =
    hasAiQuota && currentAiPlan
      ? AI_PLANS.filter((p) => (AI_PLAN_HIERARCHY[p.key] ?? 0) > (AI_PLAN_HIERARCHY[currentAiPlan] ?? 0))
      : AI_PLANS;

  const isOnHighestAiPlan = hasAiQuota && currentAiPlan === 'ia_enterprise';

  // Invoice form
  const [referenceId, setReferenceId] = useState('');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const plan = AI_PLANS.find((p) => p.key === selectedPlan)!;
  const pricing = getPrice(plan.monthlyPrice, billingCycle);
  const paymentAmount = billingCycle === 'annual' ? pricing.total : pricing.monthly;

  const canProceedPlan = activeBusiness && selectedPlan && !isOnHighestAiPlan && availableAiPlans.length > 0;
  const canProceedPayment = paymentMethod !== null;
  const canSubmit = referenceId.trim() && fullName.trim() && idNumber.trim() && email.trim();

  const handleSubmit = () => {
    if (!canSubmit || !paymentMethod || !activeBusiness) return;
    startTransition(async () => {
      const result = await submitChatbotActivationRequestAction({
        businessId: activeBusiness.id,
        aiPlanType: selectedPlan,
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
      toast.success('Solicitud enviada correctamente');
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
            Hemos recibido tu solicitud de activación del chatbot IA con el plan <strong>{plan.name}</strong> para{' '}
            <strong>{activeBusiness?.name}</strong>. Verificaremos tu pago y activaremos tu chatbot lo antes posible. Te
            notificaremos por correo electrónico.
          </p>
          <Button className='mt-8' asChild>
            <Link href='/dashboard/billing'>Volver a Facturación</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!activeBusiness) {
    return (
      <Card className='mx-auto max-w-lg py-16'>
        <CardContent className='flex flex-col items-center text-center'>
          <div className='bg-muted flex size-14 items-center justify-center rounded-full'>
            <Bot className='text-muted-foreground size-6' />
          </div>
          <h2 className='mt-4 text-lg font-semibold'>No tienes negocios</h2>
          <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
            Crea un negocio primero para poder activar el chatbot IA.
          </p>
          <Button className='mt-6' variant='outline' asChild>
            <Link href='/dashboard/businesses'>Ir a Negocios</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isOnHighestAiPlan) {
    return (
      <Card className='mx-auto max-w-lg py-16'>
        <CardContent className='flex flex-col items-center text-center'>
          <div className='flex size-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30'>
            <Bot className='size-6 text-amber-600 dark:text-amber-400' />
          </div>
          <h2 className='mt-4 text-lg font-semibold'>Ya tienes el plan de IA más alto</h2>
          <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
            <strong>{activeBusiness.name}</strong> ya tiene el plan <strong>AI Enterprise</strong>, que es el plan de IA
            más completo. Puedes comprar créditos adicionales desde la sección de facturación.
          </p>
          <Button className='mt-6' variant='outline' asChild>
            <Link href='/dashboard/billing'>Volver a Facturación</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Steps indicator */}
      <div className='flex items-center justify-center gap-2'>
        {(['plan', 'payment', 'invoice'] as Step[]).map((s, i) => {
          const labels = ['Plan IA', 'Pago', 'Facturación'];
          const icons = [Bot, CreditCard, FileText];
          const Icon = icons[i];
          const isActive = s === step;
          const isDone =
            (s === 'plan' && (step === 'payment' || step === 'invoice')) || (s === 'payment' && step === 'invoice');

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

      {/* Step 1: AI Plan selection */}
      {step === 'plan' && (
        <div className='space-y-6'>
          {/* Billing cycle toggle */}
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
                <span className='rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400'>
                  -15%
                </span>
              </button>
            </div>
          </div>

          {/* Current business indicator */}
          <div className='bg-muted/50 flex items-center gap-3 rounded-lg border px-4 py-3'>
            <div className='flex size-8 items-center justify-center rounded-full bg-amber-500/10'>
              <Bot className='size-4 text-amber-500' />
            </div>
            <div>
              <p className='text-sm font-medium'>
                {activeBusiness.name} — Chatbot IA{' '}
                {hasAiQuota && currentAiPlan ? (
                  <span className='font-semibold text-amber-600 dark:text-amber-400'>
                    {AI_PLAN_LABELS[currentAiPlan] ?? currentAiPlan}
                  </span>
                ) : (
                  <span className='font-semibold text-amber-600 dark:text-amber-400'>No activado</span>
                )}
              </p>
              <p className='text-muted-foreground text-xs'>
                {hasAiQuota
                  ? 'Selecciona un plan superior para mejorar tu chatbot'
                  : 'Selecciona un plan de IA para activar tu chatbot'}
              </p>
            </div>
          </div>

          {/* AI Plan cards */}
          <div
            className={`grid gap-4 ${availableAiPlans.length === 1 ? '' : availableAiPlans.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}
          >
            {availableAiPlans.map((p) => {
              const price = getPrice(p.monthlyPrice, billingCycle);
              const isSelected = selectedPlan === p.key;

              return (
                <button
                  key={p.key}
                  type='button'
                  onClick={() => setSelectedPlan(p.key)}
                  className={`relative rounded-xl border p-6 text-left transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/5 shadow-md ring-2 ring-amber-500/20'
                      : p.highlighted
                        ? 'border-amber-500/30 hover:shadow-sm'
                        : 'hover:border-amber-500/50 hover:shadow-sm'
                  }`}
                >
                  {isSelected && (
                    <div className='absolute -top-2.5 right-4 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-semibold text-white'>
                      Seleccionado
                    </div>
                  )}
                  {p.highlighted && !isSelected && (
                    <div className='absolute -top-2.5 right-4 rounded-full bg-amber-500/80 px-2.5 py-0.5 text-[10px] font-semibold text-white'>
                      Recomendado
                    </div>
                  )}
                  <div className='flex items-center gap-2'>
                    <Bot className='size-4 text-amber-500' />
                    <h3 className='text-base font-semibold'>{p.name}</h3>
                  </div>
                  <div className='mt-3 flex items-baseline gap-1'>
                    <span className='text-3xl font-bold'>{formatUsd(price.monthly)}</span>
                    <span className='text-muted-foreground text-sm'>/mes</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className='text-muted-foreground mt-1 text-xs'>
                      <span className='line-through'>{formatUsd(p.monthlyPrice)}/mes</span>
                      <span className='ml-2 font-semibold text-amber-600 dark:text-amber-400'>
                        Paga {formatUsd(price.total)} al año
                      </span>
                    </p>
                  )}
                  <p className='mt-2 text-sm font-medium text-amber-600 dark:text-amber-400'>{p.responses}</p>
                  <p className='text-muted-foreground mt-1 text-sm'>{p.description}</p>
                </button>
              );
            })}
          </div>

          <div className='flex justify-end'>
            <Button
              onClick={() => setStep('payment')}
              disabled={!canProceedPlan}
              className='bg-amber-500 text-white hover:bg-amber-600'
            >
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
              <div className='mb-4 flex items-center justify-between'>
                <div>
                  <p className='text-sm font-semibold'>
                    <Bot className='mr-1.5 inline size-4 text-amber-500' />
                    Resumen — Chatbot IA para {activeBusiness.name}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {plan.name} · {billingCycle === 'annual' ? 'Anual' : 'Mensual'} · {plan.responses}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-bold'>{formatUsd(paymentAmount)}</p>
                  <p className='text-muted-foreground text-xs'>{billingCycle === 'annual' ? 'por año' : 'por mes'}</p>
                </div>
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
            <Button variant='outline' onClick={() => setStep('plan')}>
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

      {/* Step 3: Invoice info & reference */}
      {step === 'invoice' && (
        <div className='space-y-6'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-semibold'>
                    <Bot className='mr-1.5 inline size-4 text-amber-500' />
                    {plan.name} · {billingCycle === 'annual' ? 'Anual' : 'Mensual'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.label} · {plan.responses}
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
                  Enviar solicitud
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
