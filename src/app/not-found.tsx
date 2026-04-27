import Link from 'next/link';
import type { Metadata } from 'next';
import { Home, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que estás buscando no existe o fue movida.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className='relative grid min-h-dvh place-items-center overflow-hidden px-6 py-20'>
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='bg-primary/8 absolute top-1/3 left-1/2 h-150 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl' />
      </div>

      <div className='w-full max-w-2xl text-center'>
        <Link href='/' className='mx-auto mb-10 inline-flex items-center gap-2'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/images/vitriona-logo-dark.png' className='hidden h-12 w-auto dark:block' alt='Vitriona' />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/images/vitriona-logo-light.png' className='block h-12 w-auto dark:hidden' alt='Vitriona' />
        </Link>

        <p className='from-primary bg-linear-to-r to-purple-400 bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl md:text-9xl'>
          404
        </p>

        <h1 className='mt-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>Página no encontrada</h1>

        <p className='text-muted-foreground mx-auto mt-4 max-w-md text-base md:text-lg'>
          La página que buscas no existe, fue movida o el enlace está roto.
        </p>

        <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'>
          <Link
            href='/'
            className='bg-primary text-primary-foreground shadow-primary/25 hover:shadow-primary/30 inline-flex h-12 items-center gap-2 rounded-xl px-8 text-base font-semibold shadow-lg transition-all hover:opacity-90 hover:shadow-xl'
          >
            <Home className='size-4' />
            Ir al inicio
          </Link>
          <Link
            href='/dashboard'
            className='border-border hover:bg-accent inline-flex h-12 items-center gap-2 rounded-xl border px-8 text-base font-medium transition-colors'
          >
            <ArrowLeft className='size-4' />
            Ir al panel
          </Link>
        </div>
      </div>
    </div>
  );
}
