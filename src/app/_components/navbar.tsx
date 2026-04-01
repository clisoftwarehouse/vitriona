'use client';

import Link from 'next/link';
import { useState } from 'react';
import { X, Menu, ArrowRight } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className='bg-background/80 fixed top-0 right-0 left-0 z-50 border-b border-white/10 backdrop-blur-xl'>
      <nav className='mx-auto flex h-16 max-w-7xl items-center justify-between px-6'>
        <Link href='/' className='flex items-center gap-2'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/images/vitriona-logo-dark.png' className='hidden h-12 w-auto dark:block' alt='Vitriona' />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/images/vitriona-logo-light.png' className='block h-12 w-auto dark:hidden' alt='Vitriona' />
        </Link>
        <div className='hidden items-center gap-8 md:flex'>
          <a href='#features' className='text-muted-foreground hover:text-foreground text-sm transition-colors'>
            Funcionalidades
          </a>
          <a href='#how-it-works' className='text-muted-foreground hover:text-foreground text-sm transition-colors'>
            Cómo funciona
          </a>
          <a href='#pricing' className='text-muted-foreground hover:text-foreground text-sm transition-colors'>
            Precios
          </a>
          <a href='#faq' className='text-muted-foreground hover:text-foreground text-sm transition-colors'>
            FAQ
          </a>
        </div>
        <div className='flex items-center gap-3'>
          <Link
            href='/auth/register'
            className='bg-primary text-primary-foreground hidden h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-opacity hover:opacity-90 sm:inline-flex'
          >
            Empezar gratis
            <ArrowRight className='size-3.5' />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='text-muted-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-lg md:hidden'
            aria-label='Toggle menu'
          >
            {mobileMenuOpen ? <X className='size-5' /> : <Menu className='size-5' />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className='bg-background border-border absolute top-16 right-0 left-0 border-b shadow-lg md:hidden'>
          <div className='flex flex-col px-6 py-4'>
            <a
              href='#features'
              onClick={() => setMobileMenuOpen(false)}
              className='text-foreground hover:bg-accent rounded-lg px-4 py-3 text-sm font-medium transition-colors'
            >
              Funcionalidades
            </a>
            <a
              href='#how-it-works'
              onClick={() => setMobileMenuOpen(false)}
              className='text-foreground hover:bg-accent rounded-lg px-4 py-3 text-sm font-medium transition-colors'
            >
              Cómo funciona
            </a>
            <a
              href='#pricing'
              onClick={() => setMobileMenuOpen(false)}
              className='text-foreground hover:bg-accent rounded-lg px-4 py-3 text-sm font-medium transition-colors'
            >
              Precios
            </a>
            <a
              href='#faq'
              onClick={() => setMobileMenuOpen(false)}
              className='text-foreground hover:bg-accent rounded-lg px-4 py-3 text-sm font-medium transition-colors'
            >
              FAQ
            </a>
            <Link
              href='/auth/register'
              onClick={() => setMobileMenuOpen(false)}
              className='bg-primary text-primary-foreground mt-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90'
            >
              Empezar gratis
              <ArrowRight className='size-3.5' />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
