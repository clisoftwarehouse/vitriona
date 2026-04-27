import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Bot,
  Plus,
  Clock,
  Crown,
  Calendar,
  Sparkles,
  ArrowUpCircle,
  AlertTriangle,
  ArrowDownCircle,
} from 'lucide-react';

import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { UsageOverview } from '@/modules/dashboard/ui/components/usage-overview';
import { getUsageStats } from '@/modules/dashboard/server/queries/get-usage-stats';
import { getBillingInfo } from '@/modules/dashboard/server/queries/get-billing-info';
import { SubscriptionActions } from '@/modules/upgrade/ui/components/subscription-actions';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getActiveBusinessId } from '@/modules/businesses/server/actions/set-active-business.action';

export const metadata = {
  title: 'Facturación — Vitriona',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  pro: 'Emprendedor',
  business: 'Negocio',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  business: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const AI_PLAN_LABELS: Record<string, string> = {
  ia_starter: 'IA Starter',
  ia_business: 'IA Business',
  ia_enterprise: 'IA Enterprise',
};

const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: 'Mensual',
  annual: 'Anual',
};

function formatDate(date: Date | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const businessList = await getBusinessesAction();
  if (businessList.length === 0) redirect('/dashboard/businesses/new');

  const activeId = await getActiveBusinessId();
  const activeBusiness = businessList.find((b) => b.id === activeId) ?? businessList[0];

  const [billing, usageData] = await Promise.all([getBillingInfo(activeBusiness.id), getUsageStats(activeBusiness.id)]);

  if (!billing) redirect('/dashboard');

  const daysLeft = daysUntil(billing.billingCycleEnd);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isFree = billing.plan === 'free';
  const isHighestPlan = billing.plan === 'business';

  return (
    <div className='mx-auto flex max-w-4xl flex-col gap-6 py-2'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Facturación</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Gestiona tu plan, revisa el uso de recursos y actualiza tu suscripción.
        </p>
      </div>

      {/* Expiring soon warning */}
      {isExpiringSoon && !isFree && (
        <div className='flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/50'>
          <AlertTriangle className='size-5 shrink-0 text-amber-600 dark:text-amber-400' />
          <div>
            <p className='text-sm font-medium text-amber-800 dark:text-amber-200'>
              Tu plan vence en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
            </p>
            <p className='text-xs text-amber-700 dark:text-amber-300'>
              Renueva tu suscripción para no perder las funcionalidades de tu plan actual.
            </p>
          </div>
        </div>
      )}

      {/* Expired warning */}
      {isExpired && !isFree && (
        <div className='flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 dark:border-red-700 dark:bg-red-950/50'>
          <AlertTriangle className='size-5 shrink-0 text-red-600 dark:text-red-400' />
          <div>
            <p className='text-sm font-medium text-red-800 dark:text-red-200'>Tu plan ha expirado</p>
            <p className='text-xs text-red-700 dark:text-red-300'>
              Tu negocio será migrado al plan Gratis si no renuevas. Renueva ahora para mantener tu plan.
            </p>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left column: Plan info + AI addon */}
        <div className='flex flex-col gap-6 lg:col-span-2'>
          {/* Current Plan Card */}
          <Card className='gap-0 py-0'>
            <CardHeader className='flex flex-row items-center justify-between border-b px-6 py-4'>
              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 flex size-10 items-center justify-center rounded-full'>
                  <Crown className='text-primary size-5' />
                </div>
                <div>
                  <h2 className='font-semibold'>Plan actual</h2>
                  <p className='text-muted-foreground text-xs'>{billing.businessName}</p>
                </div>
              </div>
              <Badge className={PLAN_COLORS[billing.plan] ?? ''} variant='outline'>
                {PLAN_LABELS[billing.plan] ?? billing.plan}
              </Badge>
            </CardHeader>
            <CardContent className='space-y-4 px-6 py-5'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                    Ciclo de facturación
                  </p>
                  <p className='mt-1 text-sm font-semibold'>
                    {isFree ? 'Sin costo' : (BILLING_CYCLE_LABELS[billing.billingCycle ?? ''] ?? 'No definido')}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                    {isFree ? 'Miembro desde' : 'Vencimiento'}
                  </p>
                  <div className='mt-1 flex items-center gap-2'>
                    <Calendar className='text-muted-foreground size-3.5' />
                    <p className='text-sm font-semibold'>
                      {isFree ? formatDate(billing.createdAt) : formatDate(billing.billingCycleEnd)}
                    </p>
                    {daysLeft !== null && daysLeft > 0 && !isFree && (
                      <span
                        className={`text-xs font-medium ${isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
                      >
                        ({daysLeft} {daysLeft === 1 ? 'día' : 'días'} restantes)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {billing.pendingRequest && (
                <>
                  <Separator />
                  <div className='flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-950/30'>
                    <Clock className='mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400' />
                    <div className='text-xs text-amber-800 dark:text-amber-300'>
                      <p className='font-medium'>Solicitud pendiente de revisión</p>
                      <p className='mt-0.5'>
                        Recibimos tu{' '}
                        {billing.pendingRequest.requestType === 'renewal'
                          ? 'renovación'
                          : billing.pendingRequest.requestType === 'upgrade'
                            ? 'upgrade'
                            : billing.pendingRequest.requestType === 'downgrade'
                              ? 'cambio de plan'
                              : 'solicitud'}{' '}
                        a <strong>{PLAN_LABELS[billing.pendingRequest.plan] ?? billing.pendingRequest.plan}</strong> (
                        {BILLING_CYCLE_LABELS[billing.pendingRequest.billingCycle] ??
                          billing.pendingRequest.billingCycle}
                        ). El proceso de verificación tarda entre 24 y 48 horas hábiles. Te notificaremos por correo.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {billing.scheduledPlan && !billing.pendingRequest && (
                <>
                  <Separator />
                  <div className='flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950/30'>
                    <Sparkles className='size-4 shrink-0 text-blue-600 dark:text-blue-400' />
                    <p className='text-xs text-blue-700 dark:text-blue-300'>
                      {billing.scheduledPlan === 'free' ? (
                        <>
                          Cancelación programada. Tu plan pasará a <strong>Gratis</strong> el{' '}
                          <strong>{formatDate(billing.billingCycleEnd)}</strong>.
                        </>
                      ) : (
                        <>
                          Cambio programado al plan{' '}
                          <strong>{PLAN_LABELS[billing.scheduledPlan] ?? billing.scheduledPlan}</strong>
                          {billing.scheduledBillingCycle && (
                            <>
                              {' '}
                              ({BILLING_CYCLE_LABELS[billing.scheduledBillingCycle] ?? billing.scheduledBillingCycle})
                            </>
                          )}{' '}
                          a partir del <strong>{formatDate(billing.billingCycleEnd)}</strong>.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}

              {!isFree && !billing.pendingRequest && (
                <>
                  <Separator />
                  <div className='flex flex-wrap gap-2'>
                    {!isHighestPlan && !billing.scheduledPlan && (
                      <Button size='sm' asChild>
                        <Link href='/dashboard/billing/upgrade'>
                          <ArrowUpCircle className='mr-2 size-3.5' />
                          Cambiar de plan
                        </Link>
                      </Button>
                    )}
                    {isHighestPlan && !billing.scheduledPlan && (
                      <Button size='sm' variant='outline' asChild>
                        <Link href='/dashboard/billing/downgrade'>
                          <ArrowDownCircle className='mr-2 size-3.5' />
                          Bajar de plan
                        </Link>
                      </Button>
                    )}
                    <Button size='sm' variant='outline' asChild>
                      <Link href='/dashboard/billing/renew'>Renovar suscripción</Link>
                    </Button>
                    <SubscriptionActions
                      businessId={billing.businessId}
                      scheduledPlan={billing.scheduledPlan}
                      billingCycleEndFormatted={billing.billingCycleEnd ? formatDate(billing.billingCycleEnd) : null}
                    />
                  </div>
                </>
              )}

              {isFree && !billing.pendingRequest && (
                <>
                  <Separator />
                  <div className='flex flex-wrap gap-2'>
                    <Button size='sm' asChild>
                      <Link href='/dashboard/billing/upgrade'>
                        <ArrowUpCircle className='mr-2 size-3.5' />
                        Mejorar plan
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* AI Addon Card */}
          <Card className='gap-0 py-0'>
            <CardHeader className='flex flex-row items-center justify-between border-b px-6 py-4'>
              <div className='flex items-center gap-3'>
                <div className='flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30'>
                  <Bot className='size-5 text-amber-600 dark:text-amber-400' />
                </div>
                <div>
                  <h2 className='font-semibold'>Chatbot IA</h2>
                  <p className='text-muted-foreground text-xs'>Add-on de inteligencia artificial</p>
                </div>
              </div>
              {billing.aiPlanType ? (
                <Badge
                  className='border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400'
                  variant='outline'
                >
                  {AI_PLAN_LABELS[billing.aiPlanType] ?? billing.aiPlanType}
                </Badge>
              ) : (
                <Badge variant='outline' className='text-muted-foreground'>
                  No activo
                </Badge>
              )}
            </CardHeader>
            <CardContent className='space-y-4 px-6 py-5'>
              {billing.aiPlanType ? (
                <>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div>
                      <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                        Ciclo de facturación
                      </p>
                      <p className='mt-1 text-sm font-semibold'>
                        {BILLING_CYCLE_LABELS[billing.aiBillingCycle ?? ''] ?? 'No definido'}
                      </p>
                    </div>
                    <div>
                      <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>Vencimiento</p>
                      <div className='mt-1 flex items-center gap-2'>
                        <Calendar className='text-muted-foreground size-3.5' />
                        <p className='text-sm font-semibold'>{formatDate(billing.aiBillingCycleEnd)}</p>
                      </div>
                    </div>
                  </div>

                  {billing.aiMessagesUsed !== null && billing.aiMessagesLimit !== null && (
                    <div>
                      <div className='mb-1 flex items-center justify-between text-sm'>
                        <span className='font-medium'>Mensajes de IA utilizados</span>
                        <span className='text-muted-foreground text-xs font-medium'>
                          {billing.aiMessagesUsed.toLocaleString()} / {billing.aiMessagesLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className='bg-muted h-2.5 overflow-hidden rounded-full'>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            billing.aiMessagesUsed / billing.aiMessagesLimit > 0.95
                              ? 'bg-destructive'
                              : billing.aiMessagesUsed / billing.aiMessagesLimit > 0.8
                                ? 'bg-amber-500'
                                : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min((billing.aiMessagesUsed / billing.aiMessagesLimit) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {billing.scheduledAiPlanType && (
                    <div className='flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/30'>
                      <Bot className='size-4 text-amber-600 dark:text-amber-400' />
                      <p className='text-xs text-amber-700 dark:text-amber-300'>
                        Al renovar, tu plan de IA cambiará a{' '}
                        <strong>{AI_PLAN_LABELS[billing.scheduledAiPlanType] ?? billing.scheduledAiPlanType}</strong>.
                      </p>
                    </div>
                  )}

                  <Separator />
                  <div className='flex flex-wrap gap-2'>
                    <Button size='sm' variant='outline' asChild>
                      <Link href='/dashboard/billing/upgrade?tab=chatbot'>
                        <ArrowUpCircle className='mr-2 size-3.5' />
                        Cambiar plan de IA
                      </Link>
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className='border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950'
                      asChild
                    >
                      <Link href='/dashboard/billing/ai-credits'>
                        <Plus className='mr-2 size-3.5' />
                        Comprar créditos
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className='flex flex-col items-center py-4 text-center'>
                  <p className='text-muted-foreground text-sm'>
                    Aún no tienes el chatbot de IA activado para este negocio.
                  </p>
                  <Button size='sm' className='mt-3' asChild>
                    <Link href='/dashboard/billing/upgrade?tab=chatbot'>
                      <Bot className='mr-2 size-3.5' />
                      Activar Chatbot IA
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Usage overview */}
        <div className='flex flex-col gap-6'>{usageData && <UsageOverview data={usageData} />}</div>
      </div>
    </div>
  );
}
