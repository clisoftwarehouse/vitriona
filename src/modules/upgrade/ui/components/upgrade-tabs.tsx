'use client';

import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';

import { UpgradeCheckout } from './upgrade-checkout';
import { ChatbotActivationCheckout } from './chatbot-activation-checkout';

type Tab = 'plan' | 'chatbot';

interface BusinessWithAiStatus {
  id: string;
  name: string;
  slug: string;
  plan: string;
  hasAiQuota: boolean;
  aiPlanType?: string | null;
}

interface UpgradeTabsProps {
  businesses: BusinessWithAiStatus[];
  userEmail: string;
  defaultTab?: Tab;
  activeBusinessId: string | null;
  billingInfo?: {
    billingCycle: string | null;
    billingCycleEnd: string | null;
    currentPlanPrice: number;
  } | null;
  eurRate?: number | null;
}

export function UpgradeTabs({
  businesses,
  userEmail,
  defaultTab = 'plan',
  activeBusinessId,
  billingInfo,
  eurRate,
}: UpgradeTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-6 py-2'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold tracking-tight'>Mejorar mi Plan</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Actualiza tu plan o agrega funcionalidades premium a tu negocio.
        </p>
      </div>

      {/* Tab bar */}
      <div className='bg-muted mx-auto inline-flex w-fit items-center gap-1 rounded-full p-1'>
        <button
          type='button'
          onClick={() => setActiveTab('plan')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'plan'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className='size-3.5' />
          Actualizar Plan
        </button>
        <button
          type='button'
          onClick={() => setActiveTab('chatbot')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'chatbot'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bot className='size-3.5' />
          Chatbot IA
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'plan' && (
        <UpgradeCheckout
          businesses={businesses}
          userEmail={userEmail}
          activeBusinessId={activeBusinessId}
          billingInfo={billingInfo}
          eurRate={eurRate}
        />
      )}

      {activeTab === 'chatbot' && (
        <ChatbotActivationCheckout
          businesses={businesses}
          userEmail={userEmail}
          activeBusinessId={activeBusinessId}
          eurRate={eurRate}
        />
      )}
    </div>
  );
}
