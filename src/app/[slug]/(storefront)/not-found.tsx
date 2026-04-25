'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function StorefrontNotFound() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  return (
    <div
      className='flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center'
      style={{
        backgroundColor: 'var(--sf-bg, #ffffff)',
        color: 'var(--sf-text, #111827)',
        fontFamily: 'var(--sf-font, "Inter", sans-serif)',
      }}
    >
      <div
        className='mb-6 flex size-20 items-center justify-center'
        style={{
          borderRadius: 'var(--sf-radius, 0.75rem)',
          backgroundColor: 'color-mix(in srgb, var(--sf-primary, #000) 12%, transparent)',
          color: 'var(--sf-primary, #000)',
        }}
      >
        <Search className='size-9' />
      </div>

      <p className='text-6xl font-bold tracking-tight sm:text-7xl' style={{ color: 'var(--sf-primary, #000)' }}>
        404
      </p>

      <h1 className='mt-4 text-2xl font-bold tracking-tight sm:text-3xl'>Página no encontrada</h1>

      <p className='mt-3 max-w-md text-sm opacity-70 sm:text-base'>
        La página que buscas no existe o el enlace ya no es válido. Vuelve al inicio para seguir explorando la tienda.
      </p>

      <div className='mt-8 flex flex-col items-center gap-3 sm:flex-row'>
        <Link
          href={`/${slug}`}
          className='inline-flex h-11 items-center gap-2 px-6 text-sm font-semibold transition-opacity hover:opacity-90'
          style={{
            backgroundColor: 'var(--sf-primary, #000)',
            color: 'var(--sf-primary-contrast, #fff)',
            borderRadius: 'var(--sf-radius-full, 9999px)',
          }}
        >
          <Home className='size-4' />
          Volver al inicio
        </Link>
        <Link
          href={`/${slug}`}
          className='inline-flex h-11 items-center gap-2 px-6 text-sm font-medium transition-opacity hover:opacity-80'
          style={{
            border: '1px solid var(--sf-border, #e5e7eb)',
            borderRadius: 'var(--sf-radius-full, 9999px)',
            color: 'var(--sf-text, #111827)',
          }}
        >
          <ArrowLeft className='size-4' />
          Ver el catálogo
        </Link>
      </div>
    </div>
  );
}
