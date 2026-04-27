'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState, useTransition } from 'react';
import { Check, Crown, Loader2, FileText, Sparkles, ArrowLeft, ArrowRight, CreditCard } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentMethodDetails } from '@/modules/upgrade/ui/components/payment-method-details';
import { submitUpgradeRequestAction } from '@/modules/upgrade/server/actions/submit-upgrade-request.action';

// ── Constants ──

const ANNUAL_DISCOUNT = 0.15;

type PlanKey = 'pro' | 'business';
type BillingCycle = 'monthly' | 'annual';
type PaymentMethod = 'bank_transfer' | 'pago_movil' | 'zelle' | 'binance';

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  pro: 'Emprendedor',
  business: 'Negocio',
};

interface Plan {
  key: PlanKey;
  name: string;
  monthlyPrice: number;
  features: string[];
}

const PLANS: Plan[] = [
  {
    key: 'pro',
    name: 'Emprendedor',
    monthlyPrice: 15,
    features: [
      'Hasta 100 productos',
      '5,000 visitas/mes',
      'Sin marca de agua',
      '2 Métodos de pago',
      '2 Métodos de entrega',
    ],
  },
  {
    key: 'business',
    name: 'Negocio',
    monthlyPrice: 30,
    features: [
      'Todo lo del plan Emprendedor',
      'Hasta 1,000 productos',
      '20,000 visitas/mes',
      'Soporte prioritario',
      'Métodos de pago ilimitados',
      'Métodos de entrega ilimitados',
    ],
  },
];

const PAYMENT_METHODS: { key: PaymentMethod; label: string; description: string }[] = [
  { key: 'bank_transfer', label: 'Transferencia Bancaria', description: 'Transferencia directa a nuestra cuenta' },
  { key: 'pago_movil', label: 'Pago Móvil', description: 'Pago instantáneo desde tu banco' },
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

function formatEur(amount: number) {
  return `€${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

// ── Component ──

interface UpgradeCheckoutProps {
  businesses: { id: string; name: string; plan: string }[];
  userEmail: string;
  activeBusinessId: string | null;
  billingInfo?: {
    billingCycle: string | null;
    billingCycleEnd: string | null; // ISO string
    currentPlanPrice: number;
  } | null;
  eurRate?: number | null;
}

type Step = 'plan' | 'payment' | 'invoice';

export function UpgradeCheckout({
  businesses,
  userEmail,
  activeBusinessId,
  billingInfo,
  eurRate,
}: UpgradeCheckoutProps) {
  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) ?? businesses[0] ?? null;
  const [step, setStep] = useState<Step>('plan');
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  // Selections
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  // Derive available plans for the active business
  const availablePlans = useMemo(() => {
    if (!activeBusiness) return PLANS;
    if (activeBusiness.plan === 'pro') return PLANS.filter((p) => p.key === 'business');
    if (activeBusiness.plan === 'business') return [];
    return PLANS; // free → show both
  }, [activeBusiness]);

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(() => {
    return activeBusiness?.plan === 'pro' ? 'business' : 'pro';
  });

  const isAlreadyOnHighestPlan = activeBusiness?.plan === 'business';

  // Invoice form
  const [referenceId, setReferenceId] = useState('');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const plan = PLANS.find((p) => p.key === selectedPlan)!;
  const pricing = getPrice(plan.monthlyPrice, billingCycle);
  const fullPaymentAmount = billingCycle === 'annual' ? pricing.total : pricing.monthly;

  // Proration calculation for mid-cycle upgrades
  const proration = useMemo(() => {
    if (!billingInfo?.billingCycleEnd || !billingInfo?.billingCycle || activeBusiness?.plan === 'free') {
      return null; // No proration for free plans or missing billing info
    }

    const now = new Date();
    const cycleEnd = new Date(billingInfo.billingCycleEnd);
    if (cycleEnd <= now) return null; // Expired, no proration

    // Calculate remaining days in current cycle
    const remainingMs = cycleEnd.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    const currentTotalDays = billingInfo.billingCycle === 'annual' ? 365 : 30;
    const fraction = Math.min(remainingDays / currentTotalDays, 1);

    // Credit from current plan's remaining period
    const currentPlanCredit = billingInfo.currentPlanPrice * fraction;

    const isCycleChange = billingCycle !== billingInfo.billingCycle;

    if (isCycleChange) {
      // Billing cycle is changing: charge full new cycle price minus credit from current plan
      const newPlanFullPrice =
        billingCycle === 'annual'
          ? getPrice(plan.monthlyPrice, 'annual').total
          : getPrice(plan.monthlyPrice, 'monthly').monthly;
      const difference = Math.max(newPlanFullPrice - currentPlanCredit, 0);

      return {
        remainingDays,
        totalDays: currentTotalDays,
        currentPlanCredit,
        difference,
        isCycleChange: true,
        isProrated: true,
      };
    }

    // Same billing cycle: prorate both sides by remaining fraction
    const newPlanFullPrice =
      billingInfo.billingCycle === 'annual'
        ? getPrice(plan.monthlyPrice, 'annual').total
        : getPrice(plan.monthlyPrice, 'monthly').monthly;
    const newPlanRemaining = newPlanFullPrice * fraction;
    const difference = Math.max(newPlanRemaining - currentPlanCredit, 0);

    return {
      remainingDays,
      totalDays: currentTotalDays,
      currentPlanCredit,
      difference,
      isCycleChange: false,
      isProrated: true,
    };
  }, [billingInfo, activeBusiness?.plan, plan.monthlyPrice, billingCycle]);

  const paymentAmount = proration ? proration.difference : fullPaymentAmount;

  const canProceedPlan = activeBusiness && selectedPlan && !isAlreadyOnHighestPlan;
  const canProceedPayment = paymentMethod !== null;
  const canSubmit = referenceId.trim() && fullName.trim() && idNumber.trim() && email.trim();

  const handleSubmit = () => {
    if (!canSubmit || !paymentMethod || !activeBusiness) return;
    startTransition(async () => {
      const isVesMethod = paymentMethod === 'bank_transfer' || paymentMethod === 'pago_movil';
      const result = await submitUpgradeRequestAction({
        businessId: activeBusiness.id,
        plan: selectedPlan,
        billingCycle,
        paymentMethod,
        referenceId,
        amount: paymentAmount.toFixed(2),
        fullName,
        idNumber,
        email,
        phone: phone || undefined,
        notes: notes || undefined,
        amountVes: isVesMethod && eurRate ? (paymentAmount * eurRate).toFixed(2) : undefined,
        exchangeRate: isVesMethod && eurRate ? eurRate.toFixed(2) : undefined,
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
            Hemos recibido tu solicitud de upgrade al plan <strong>{plan.name}</strong> para{' '}
            <strong>{activeBusiness?.name}</strong>. Verificaremos tu pago y activaremos tu plan lo antes posible. Te
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
            <Sparkles className='text-muted-foreground size-6' />
          </div>
          <h2 className='mt-4 text-lg font-semibold'>No tienes negocios</h2>
          <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
            Crea un negocio primero para poder solicitar un upgrade de plan.
          </p>
          <Button className='mt-6' variant='outline' asChild>
            <Link href='/dashboard/businesses'>Ir a Negocios</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isAlreadyOnHighestPlan) {
    return (
      <Card className='mx-auto max-w-lg py-16'>
        <CardContent className='flex flex-col items-center text-center'>
          <div className='flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30'>
            <Crown className='size-6 text-emerald-600 dark:text-emerald-400' />
          </div>
          <h2 className='mt-4 text-lg font-semibold'>Ya tienes el plan más alto</h2>
          <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
            <strong>{activeBusiness.name}</strong> ya tiene el plan <strong>Negocio</strong>, que es el plan más
            completo. Puedes seleccionar otro negocio desde la barra lateral.
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
          const labels = ['Plan', 'Pago', 'Facturación'];
          const icons = [Sparkles, CreditCard, FileText];
          const Icon = icons[i];
          const isActive = s === step;
          const isDone =
            (s === 'plan' && (step === 'payment' || step === 'invoice')) || (s === 'payment' && step === 'invoice');

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

      {/* Step 1: Plan selection */}
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
                <span className='bg-primary/12 text-primary rounded-full px-2 py-0.5 text-[11px] font-semibold'>
                  -15%
                </span>
              </button>
            </div>
          </div>

          {/* Current plan indicator */}
          <div className='bg-muted/50 flex items-center gap-3 rounded-lg border px-4 py-3'>
            <div className='bg-primary/10 flex size-8 items-center justify-center rounded-full'>
              <Sparkles className='text-primary size-4' />
            </div>
            <div>
              <p className='text-sm font-medium'>
                {activeBusiness.name} — Plan actual:{' '}
                <span className='text-primary font-semibold'>
                  {PLAN_LABELS[activeBusiness.plan] ?? activeBusiness.plan}
                </span>
              </p>
              <p className='text-muted-foreground text-xs'>
                {activeBusiness.plan === 'free'
                  ? 'Puedes upgradear a Emprendedor o Negocio'
                  : 'Puedes upgradear a Negocio'}
              </p>
            </div>
          </div>

          {/* Plan cards */}
          <div className={`grid gap-4 ${availablePlans.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {availablePlans.map((p) => {
              const price = getPrice(p.monthlyPrice, billingCycle);
              const isSelected = selectedPlan === p.key;

              return (
                <button
                  key={p.key}
                  type='button'
                  onClick={() => setSelectedPlan(p.key)}
                  className={`relative rounded-xl border p-6 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-primary/20 shadow-md ring-2'
                      : 'hover:border-primary/50 hover:shadow-sm'
                  }`}
                >
                  {isSelected && (
                    <div className='bg-primary text-primary-foreground absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold'>
                      Seleccionado
                    </div>
                  )}
                  <h3 className='text-lg font-semibold'>{p.name}</h3>
                  <div className='mt-3 flex items-baseline gap-1'>
                    <span className='text-3xl font-bold'>{formatEur(price.monthly)}</span>
                    <span className='text-muted-foreground text-sm'>/mes</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className='text-muted-foreground mt-1 text-xs'>
                      <span className='line-through'>{formatEur(p.monthlyPrice)}/mes</span>
                      <span className='text-primary ml-2 font-semibold'>Paga {formatEur(price.total)} al año</span>
                    </p>
                  )}
                  <ul className='mt-4 space-y-2'>
                    {p.features.map((f) => (
                      <li key={f} className='flex items-start gap-2 text-sm'>
                        <Check className='text-primary mt-0.5 size-3.5 shrink-0' />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className='flex justify-end'>
            <Button onClick={() => setStep('payment')} disabled={!canProceedPlan}>
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
                    <Sparkles className='text-primary mr-1.5 inline size-4' />
                    Resumen — Upgrade para {activeBusiness.name}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Plan {plan.name} · {billingCycle === 'annual' ? 'Anual' : 'Mensual'}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-bold'>{formatEur(paymentAmount)}</p>
                  <p className='text-muted-foreground text-xs'>
                    {proration ? 'prorrateo' : billingCycle === 'annual' ? 'por año' : 'por mes'}
                  </p>
                </div>
              </div>
              {proration && (
                <div className='rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950/30'>
                  <p className='text-xs text-blue-700 dark:text-blue-300'>
                    <strong>Pago prorrateado:</strong>{' '}
                    {proration.isCycleChange
                      ? `Se descuentan ${formatEur(proration.currentPlanCredit)} de crédito por los ${proration.remainingDays} días restantes de tu ciclo actual. Tu nuevo ciclo ${billingCycle === 'annual' ? 'anual' : 'mensual'} comienza hoy.`
                      : `Solo pagas la diferencia por los ${proration.remainingDays} días restantes de tu ciclo actual. Tu fecha de vencimiento no cambia.`}
                  </p>
                </div>
              )}
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
                      ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                      : 'hover:border-primary/50 hover:shadow-sm'
                  }`}
                >
                  <p className='text-sm font-semibold'>{m.label}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>{m.description}</p>
                </button>
              ))}
            </div>
            {paymentMethod && (
              <PaymentMethodDetails method={paymentMethod} eurAmount={paymentAmount} eurRate={eurRate} />
            )}
          </div>

          <div className='flex justify-between'>
            <Button variant='outline' onClick={() => setStep('plan')}>
              <ArrowLeft className='mr-2 size-4' />
              Atrás
            </Button>
            <Button onClick={() => setStep('invoice')} disabled={!canProceedPayment}>
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
                    Plan {plan.name} · {proration ? 'Prorrateo' : billingCycle === 'annual' ? 'Anual' : 'Mensual'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.label}
                    {proration && ` · ${proration.remainingDays} días restantes`}
                  </p>
                </div>
                <p className='text-2xl font-bold'>{formatEur(paymentAmount)}</p>
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
