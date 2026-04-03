'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check } from 'lucide-react';

import { ScrollReveal } from './scroll-reveal';

const ANNUAL_DISCOUNT = 0.15;

type BillingCycle = 'monthly' | 'annual';

const PLANS = [
  {
    name: 'Gratis',
    monthlyPrice: 0,
    description: 'Ideal para probar la plataforma sin compromiso.',
    features: [
      'URL en Vitriona',
      'Hasta 10 productos',
      '500 visitas/mes',
      'Marca de agua de Vitriona',
      '1 Método de pago',
      '1 Método de entrega',
      'Storefront público',
      'Pedidos por WhatsApp',
    ],
    cta: 'Empezar gratis',
    highlighted: false,
  },
  {
    name: 'Emprendedor',
    monthlyPrice: 15,
    description: 'Para negocios que quieren crecer sin límites.',
    features: [
      'Hasta 100 productos',
      '5,000 visitas/mes',
      'Sin marca de agua',
      '2 Método de pago',
      '2 Método de entrega',
    ],
    cta: 'Comenzar ahora',
    highlighted: true,
  },
  {
    name: 'Negocio',
    monthlyPrice: 30,
    description: 'Para negocios que necesitan escalar.',
    features: [
      'Todo lo del plan Emprendedor',
      'Hasta 1,000 productos',
      '20,000 visitas/mes',
      'Soporte prioritario',
      'Métodos de pago ilimitados',
      'Métodos de entrega ilimitados',
    ],
    cta: 'Comenzar ahora',
    highlighted: false,
  },
];

function formatPrice(amount: number) {
  const hasDecimals = !Number.isInteger(amount);
  return `$${hasDecimals ? amount.toFixed(2) : amount.toFixed(0)}`;
}

function getPlanPricing(monthlyPrice: number, billingCycle: BillingCycle) {
  if (monthlyPrice === 0) {
    return {
      discountLabel: null,
      helperText: 'Siempre gratis',
      price: formatPrice(0),
      period: '/mes',
      savingsText: null,
      strikethroughText: null,
    };
  }

  if (billingCycle === 'annual') {
    const discountedMonthlyPrice = monthlyPrice * (1 - ANNUAL_DISCOUNT);
    const annualTotal = discountedMonthlyPrice * 12;
    const annualSavings = monthlyPrice * 12 - annualTotal;

    return {
      discountLabel: '-15%',
      helperText: `Pagando ${formatPrice(annualTotal)} al año`,
      price: formatPrice(discountedMonthlyPrice),
      period: '/mes',
      savingsText: `Ahorras ${formatPrice(annualSavings)} al año`,
      strikethroughText: `${formatPrice(monthlyPrice)}/mes`,
    };
  }

  return {
    discountLabel: null,
    helperText: 'Pago mensual, cancela cuando quieras',
    price: formatPrice(monthlyPrice),
    period: '/mes',
    savingsText: null,
    strikethroughText: null,
  };
}

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');

  return (
    <section id='pricing' className='py-20 md:py-28'>
      <ScrollReveal className='mx-auto max-w-7xl px-6'>
        <div className='text-center'>
          <p className='text-primary text-sm font-semibold'>Precios</p>
          <h2 className='mt-2 text-3xl font-bold tracking-tight md:text-4xl'>Simple y transparente</h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-xl'>
            Empieza gratis y escala cuando lo necesites. Sin sorpresas.
          </p>

          <div className='mt-8 flex justify-center'>
            <div
              className='bg-muted inline-flex flex-wrap items-center justify-center gap-2 rounded-full p-1'
              role='tablist'
              aria-label='Tipo de facturación'
            >
              <button
                type='button'
                role='tab'
                aria-selected={billingCycle === 'monthly'}
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
                role='tab'
                aria-selected={billingCycle === 'annual'}
                onClick={() => setBillingCycle('annual')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Anual
                <span className='bg-primary/12 text-primary rounded-full px-2 py-0.5 text-[11px] font-semibold'>
                  Ahorra 15%
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className='mt-16 grid gap-8 lg:grid-cols-3'>
          {PLANS.map((plan) => {
            const pricing = getPlanPricing(plan.monthlyPrice, billingCycle);

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 transition-shadow ${
                  plan.highlighted
                    ? 'border-primary bg-card shadow-primary/10 shadow-xl'
                    : 'border-border/50 bg-card hover:shadow-lg'
                }`}
              >
                {plan.highlighted && (
                  <div className='bg-primary text-primary-foreground absolute -top-3 right-6 rounded-full px-3 py-0.5 text-xs font-semibold'>
                    Popular
                  </div>
                )}
                <h3 className='text-lg font-semibold'>{plan.name}</h3>
                <div className='mt-4 flex flex-wrap items-center gap-2'>
                  <div className='flex items-baseline gap-1'>
                    <span className='text-4xl font-bold'>{pricing.price}</span>
                    <span className='text-muted-foreground text-sm'>{pricing.period}</span>
                  </div>
                  {pricing.discountLabel && (
                    <span className='bg-primary/12 text-primary rounded-full px-2.5 py-1 text-xs font-semibold'>
                      {pricing.discountLabel}
                    </span>
                  )}
                </div>
                {pricing.strikethroughText && (
                  <p className='text-muted-foreground mt-2 text-xs line-through'>Antes {pricing.strikethroughText}</p>
                )}
                <p className='text-muted-foreground mt-2 text-sm'>{plan.description}</p>
                <p className='text-muted-foreground mt-2 text-sm'>{pricing.helperText}</p>
                {pricing.savingsText && (
                  <p className='text-primary mt-1 text-sm font-semibold'>{pricing.savingsText}</p>
                )}
                <Link
                  href='/auth/register'
                  className={`mt-6 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-primary text-primary-foreground shadow-primary/25 shadow-md hover:opacity-90'
                      : 'border-border bg-background hover:bg-accent border'
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className='mt-8 space-y-3'>
                  {plan.features.map((feature) => (
                    <li key={feature} className='flex items-start gap-2.5 text-sm'>
                      <Check className='text-primary mt-0.5 size-4 shrink-0' />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </section>
  );
}
