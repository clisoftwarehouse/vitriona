import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { ScrollReveal } from './scroll-reveal';

export function CTA() {
  return (
    <section className='py-20 md:py-28'>
      <ScrollReveal className='mx-auto max-w-7xl px-6'>
        <div className='bg-primary relative overflow-hidden rounded-3xl px-8 py-16 text-center md:px-16'>
          <div className='pointer-events-none absolute inset-0 z-0'>
            <div className='absolute -top-24 -right-24 size-64 rounded-full bg-white/10 blur-3xl' />
            <div className='absolute -bottom-24 -left-24 size-64 rounded-full bg-white/10 blur-3xl' />
          </div>
          <div className='relative z-10'>
            <h2 className='text-primary-foreground text-3xl font-bold md:text-4xl'>Empieza a vender hoy</h2>
            <p className='text-primary-foreground/80 mx-auto mt-4 max-w-xl text-base'>
              Crea tu catálogo digital en minutos, activa tu chatbot con IA y comparte el enlace con tus clientes.
            </p>
            <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Link
                href='/auth/register'
                className='text-primary inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-base font-semibold transition-opacity hover:opacity-90'
              >
                Crear cuenta gratis
                <ArrowRight className='size-4' />
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
