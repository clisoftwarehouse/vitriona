import Link from 'next/link';
import { Check } from 'lucide-react';

import { ScrollReveal } from './scroll-reveal';

const PLANS = [
  {
    name: 'Gratis',
    price: '$0',
    period: '/mes',
    description: 'Ideal para probar la plataforma sin compromiso.',
    features: [
      'Subdominio de Vitriona',
      'Hasta 10 productos',
      '500 visitas/mes',
      'Marca de agua de Vitriona',
      'Storefront público',
      'Pedidos por WhatsApp',
    ],
    cta: 'Empezar gratis',
    highlighted: false,
  },
  {
    name: 'Emprendedor',
    price: '$15',
    period: '/mes',
    description: 'Para negocios que quieren crecer sin límites.',
    features: [
      'Dominio propio',
      'Hasta 100 productos',
      '5,000 visitas/mes',
      'Sin marca de agua',
      'Agenda de citas',
      'Inventario y variantes',
      'Cupones y descuentos',
      'Métodos de pago',
    ],
    cta: 'Comenzar ahora',
    highlighted: true,
  },
  {
    name: 'Negocio',
    price: '$30',
    period: '/mes',
    description: 'Para negocios que necesitan escalar.',
    features: [
      'Todo lo del plan Emprendedor',
      'Dominio propio',
      'Hasta 1,000 productos',
      '20,000 visitas/mes',
      'Soporte prioritario',
      'Reportes avanzados',
      'Integraciones custom',
    ],
    cta: 'Comenzar ahora',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id='pricing' className='py-20 md:py-28'>
      <ScrollReveal className='mx-auto max-w-7xl px-6'>
        <div className='text-center'>
          <p className='text-primary text-sm font-semibold'>Precios</p>
          <h2 className='mt-2 text-3xl font-bold tracking-tight md:text-4xl'>Simple y transparente</h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-xl'>
            Empieza gratis y escala cuando lo necesites. Sin sorpresas.
          </p>
        </div>
        <div className='mt-16 grid gap-8 lg:grid-cols-3'>
          {PLANS.map((plan) => (
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
              <div className='mt-4 flex items-baseline gap-1'>
                <span className='text-4xl font-bold'>{plan.price}</span>
                <span className='text-muted-foreground text-sm'>{plan.period}</span>
              </div>
              <p className='text-muted-foreground mt-2 text-sm'>{plan.description}</p>
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
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
