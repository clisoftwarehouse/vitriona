import Link from 'next/link';
import { Bot, Sparkles } from 'lucide-react';

import { ScrollReveal } from './scroll-reveal';

const AI_PLANS = [
  {
    name: 'AI Starter',
    price: '$9.99',
    period: '/mes',
    responses: '500 respuestas/mes',
    description: 'Para negocios que empiezan a automatizar su atención.',
  },
  {
    name: 'AI Business',
    price: '$24.99',
    period: '/mes',
    responses: '2,500 respuestas/mes',
    description: 'Para negocios con volumen moderado de consultas.',
    highlighted: true,
  },
  {
    name: 'AI Enterprise',
    price: '$49.99',
    period: '/mes',
    responses: '10,000 respuestas/mes',
    description: 'Para operaciones de alto volumen y múltiples negocios.',
  },
];

export function AIAddOn() {
  return (
    <section className='border-border/50 bg-muted/30 border-t py-20 md:py-28'>
      <ScrollReveal className='mx-auto max-w-7xl px-6'>
        <div className='text-center'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400'>
            <Sparkles className='size-3.5' />
            Add-on de Inteligencia Artificial
          </div>
          <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>Potencia tu negocio con un chatbot IA</h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-2xl'>
            Agrega un asistente de inteligencia artificial a cualquier plan. Tu chatbot conoce tu catálogo, atiende
            clientes, crea pedidos y agenda citas — todo automáticamente.
          </p>
        </div>
        <div className='mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3'>
          {AI_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-2xl border p-6 transition-shadow ${
                plan.highlighted
                  ? 'bg-card border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'border-border/50 bg-card hover:shadow-md'
              }`}
            >
              {plan.highlighted && (
                <div className='absolute top-0 right-0 rounded-bl-lg bg-amber-500 px-3 py-1 text-[10px] font-semibold text-white'>
                  Recomendado
                </div>
              )}
              <div className='flex items-center gap-2'>
                <Bot className='size-5 text-amber-500' />
                <h4 className='text-base font-semibold'>{plan.name}</h4>
              </div>
              <div className='mt-3 flex items-baseline gap-1'>
                <span className='text-3xl font-bold'>{plan.price}</span>
                <span className='text-muted-foreground text-sm'>{plan.period}</span>
              </div>
              <p className='mt-1 text-sm font-medium text-amber-600 dark:text-amber-400'>{plan.responses}</p>
              <p className='text-muted-foreground mt-2 text-sm'>{plan.description}</p>
              <Link
                href='/auth/register'
                className={`mt-5 flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 hover:opacity-90'
                    : 'border-border bg-background hover:bg-accent border'
                }`}
              >
                Agregar a mi plan
              </Link>
            </div>
          ))}
        </div>
        <p className='text-muted-foreground mt-8 text-center text-xs'>
          El add-on de IA se combina con cualquier plan base. Se cobra por separado según el volumen de respuestas.
        </p>
      </ScrollReveal>
    </section>
  );
}
