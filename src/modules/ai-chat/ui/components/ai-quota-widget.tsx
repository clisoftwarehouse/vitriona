import Link from 'next/link';
import { Bot, ArrowUpCircle } from 'lucide-react';

import { getAiQuotaAction } from '@/modules/ai-chat/server/actions/get-ai-quota.action';

const PLAN_LABELS: Record<string, string> = {
  ia_starter: 'AI Starter',
  ia_business: 'AI Business',
  ia_enterprise: 'AI Enterprise',
};

export async function AIQuotaWidget({ businessId }: { businessId: string }) {
  const quota = await getAiQuotaAction(businessId);

  if (!quota) {
    return (
      <div className='border-border/50 bg-card rounded-xl border p-5'>
        <div className='flex items-center gap-2'>
          <Bot className='text-muted-foreground size-5' />
          <h3 className='text-sm font-semibold'>Chatbot IA</h3>
        </div>
        <p className='text-muted-foreground mt-2 text-sm'>No tienes un plan de IA activo.</p>
        <Link
          href='/pricing'
          className='bg-primary text-primary-foreground mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-opacity hover:opacity-90'
        >
          <ArrowUpCircle className='size-3.5' />
          Activar plan de IA
        </Link>
      </div>
    );
  }

  const { planType, messagesUsed, messagesLimit, billingCycleStart } = quota;
  const percentage = Math.min((messagesUsed / messagesLimit) * 100, 100);
  const isWarning = percentage > 90;
  const isExhausted = messagesUsed >= messagesLimit;

  const now = new Date();
  const cycleEnd = new Date(billingCycleStart);
  cycleEnd.setDate(cycleEnd.getDate() + 30);
  const daysLeft = Math.max(0, Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className='border-border/50 bg-card rounded-xl border p-5'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Bot className='size-5 text-amber-500' />
          <h3 className='text-sm font-semibold'>{PLAN_LABELS[planType] ?? planType}</h3>
        </div>
        <span className='text-muted-foreground text-xs'>{daysLeft} días restantes</span>
      </div>

      <div className='mt-4'>
        <div className='flex items-baseline justify-between'>
          <span className='text-sm font-medium'>
            Mensajes de IA: {messagesUsed.toLocaleString()} / {messagesLimit.toLocaleString()}
          </span>
          <span className={`text-xs font-medium ${isWarning ? 'text-destructive' : 'text-muted-foreground'}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className='bg-muted mt-2 h-2.5 w-full overflow-hidden rounded-full'>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isWarning ? 'bg-destructive' : 'bg-amber-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {isExhausted && (
        <div className='mt-4'>
          <p className='text-destructive text-xs font-medium'>Has alcanzado el límite de tu plan.</p>
          <Link
            href='/pricing'
            className='bg-primary text-primary-foreground mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-opacity hover:opacity-90'
          >
            <ArrowUpCircle className='size-3.5' />
            Hacer upgrade de plan
          </Link>
        </div>
      )}
    </div>
  );
}
