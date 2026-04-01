'use client';

import Link from 'next/link';
import { useRef, useEffect } from 'react';
import { Zap, ArrowRight } from 'lucide-react';

export function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      if (!bgRef.current) return;
      const y = window.scrollY;
      bgRef.current.style.transform = `translateY(${y * 0.35}px)`;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className='relative grid min-h-screen place-items-center overflow-hidden px-6 pt-20 pb-12'>
      {/* Background gradient with parallax */}
      <div ref={bgRef} className='pointer-events-none absolute inset-0 -z-10 will-change-transform'>
        <div className='bg-primary/8 absolute top-0 left-1/2 h-150 w-200 -translate-x-1/2 rounded-full blur-3xl' />
        <div className='bg-primary/5 absolute top-40 right-0 h-100 w-100 rounded-full blur-3xl' />
      </div>

      <div className='w-full max-w-7xl text-center'>
        <div className='animate-fade-in-up border-primary/20 bg-primary/5 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm'>
          <Zap className='size-3.5' />
          Plataforma todo-en-uno para tu negocio
        </div>

        <h1 className='animate-fade-in-up mx-auto max-w-4xl text-4xl font-bold tracking-tight delay-100 sm:text-5xl md:text-6xl lg:text-7xl'>
          Tu catálogo digital con{' '}
          <span className='from-primary bg-linear-to-r to-purple-400 bg-clip-text text-transparent'>
            asistente de IA
          </span>
        </h1>

        <p className='animate-fade-in-up text-muted-foreground mx-auto mt-6 max-w-2xl text-lg delay-200 md:text-xl'>
          Crea catálogos personalizados, recibe pedidos por WhatsApp, agenda citas y potencia tu atención al cliente con
          un chatbot de IA.
        </p>

        <div className='animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-4 delay-300 sm:flex-row'>
          <Link
            href='/auth/register'
            className='bg-primary text-primary-foreground shadow-primary/25 hover:shadow-primary/30 inline-flex h-12 items-center gap-2 rounded-xl px-8 text-base font-semibold shadow-lg transition-all hover:opacity-90 hover:shadow-xl'
          >
            Crear mi catálogo gratis
            <ArrowRight className='size-4' />
          </Link>
          <a
            href='#features'
            className='border-border hover:bg-accent inline-flex h-12 items-center gap-2 rounded-xl border px-8 text-base font-medium transition-colors'
          >
            Ver funcionalidades
          </a>
        </div>

        {/* Stats */}
        <div className='animate-fade-in-up mt-16 grid grid-cols-2 gap-8 delay-500 md:grid-cols-4'>
          {[
            { value: 'Ilimitados', label: 'Catálogos' },
            { value: '24/7', label: 'Chatbot IA' },
            { value: 'WhatsApp', label: 'Checkout' },
            { value: 'Gratis', label: 'Para empezar' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className='text-primary text-2xl font-bold md:text-3xl'>{stat.value}</p>
              <p className='text-muted-foreground mt-1 text-sm'>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
