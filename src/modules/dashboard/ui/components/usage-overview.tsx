import Link from 'next/link';
import { Bot, Gauge, ArrowUpCircle } from 'lucide-react';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { type UsageStats } from '@/modules/dashboard/server/queries/get-usage-stats';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
};

const AI_PLAN_LABELS: Record<string, string> = {
  ia_starter: 'AI Starter',
  ia_business: 'AI Business',
  ia_enterprise: 'AI Enterprise',
};

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  if (limit === null) {
    return (
      <div>
        <div className='mb-1 flex items-center justify-between text-sm'>
          <span className='font-medium'>{label}</span>
          <span className='text-muted-foreground text-xs'>{used.toLocaleString()} (ilimitado)</span>
        </div>
        <div className='bg-muted h-2 overflow-hidden rounded-full'>
          <div className='h-full w-full rounded-full bg-emerald-500/40' />
        </div>
      </div>
    );
  }

  const percentage = Math.min((used / limit) * 100, 100);
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  return (
    <div>
      <div className='mb-1 flex items-center justify-between text-sm'>
        <span className='font-medium'>{label}</span>
        <span
          className={`text-xs font-medium ${isCritical ? 'text-destructive' : isWarning ? 'text-amber-500' : 'text-muted-foreground'}`}
        >
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className='bg-muted h-2 overflow-hidden rounded-full'>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isCritical ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function UsageOverview({ data }: { data: UsageStats }) {
  const planItems = data.items.filter((i) => i.category === 'plan');
  const addonItems = data.items.filter((i) => i.category === 'addon');

  const hasAnyNearLimit = data.items.some((i) => i.limit !== null && i.used / i.limit > 0.95);

  return (
    <Card className='gap-4 py-5'>
      <CardHeader className='px-5 pb-0'>
        <div className='flex items-start justify-between'>
          <div>
            <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>Uso del plan</p>
            <div className='mt-1 flex items-baseline gap-2'>
              <span className='text-lg font-bold tracking-tight'>
                Plan {PLAN_LABELS[data.planType] ?? data.planType}
              </span>
              {data.aiPlanType && (
                <span className='rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400'>
                  {AI_PLAN_LABELS[data.aiPlanType] ?? data.aiPlanType}
                </span>
              )}
            </div>
          </div>
          <div className='bg-muted flex size-8 items-center justify-center rounded-lg'>
            <Gauge className='text-muted-foreground size-4' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4 px-5'>
        {planItems.map((item) => (
          <UsageBar key={item.label} label={item.label} used={item.used} limit={item.limit} />
        ))}

        {addonItems.length > 0 && (
          <>
            <div className='flex items-center gap-2 pt-1'>
              <Bot className='size-3.5 text-amber-500' />
              <span className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>
                Add-on de IA
              </span>
            </div>
            {addonItems.map((item) => (
              <UsageBar key={item.label} label={item.label} used={item.used} limit={item.limit} />
            ))}
          </>
        )}

        {data.planType !== 'business' && (
          <Link
            href='/dashboard/billing'
            className={`mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-opacity hover:opacity-90 ${
              hasAnyNearLimit
                ? 'bg-primary text-primary-foreground'
                : 'border border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950'
            }`}
          >
            <ArrowUpCircle className='size-3.5' />
            {hasAnyNearLimit ? 'Mejorar plan' : 'Ver facturación'}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
