import Link from 'next/link';
import { Star } from 'lucide-react';

export function Footer() {
  return (
    <footer className='border-border/50 border-t py-12'>
      <div className='mx-auto max-w-7xl px-6'>
        <div className='grid gap-8 md:grid-cols-4'>
          <div className='md:col-span-2'>
            <Link href='/' className='flex items-center gap-2'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src='/images/vitriona-logo-dark.png' className='hidden h-8 w-auto dark:block' alt='Vitriona' />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src='/images/vitriona-logo-light.png' className='block h-8 w-auto dark:hidden' alt='Vitriona' />
            </Link>
            <p className='text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed'>
              La plataforma todo-en-uno para crear catálogos digitales, gestionar pedidos y atender clientes con
              inteligencia artificial.
            </p>
          </div>
          <div>
            <h4 className='text-sm font-semibold'>Producto</h4>
            <ul className='mt-3 space-y-2'>
              {['Funcionalidades', 'Precios', 'FAQ'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className='text-muted-foreground hover:text-foreground text-sm'>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className='text-sm font-semibold'>Cuenta</h4>
            <ul className='mt-3 space-y-2'>
              <li>
                <Link href='/auth/login' className='text-muted-foreground hover:text-foreground text-sm'>
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href='/auth/register' className='text-muted-foreground hover:text-foreground text-sm'>
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className='border-border/50 mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row'>
          <p className='text-muted-foreground text-xs'>
            &copy; {new Date().getFullYear()} Vitriona. Hecho por{' '}
            <span className='text-foreground font-medium'>CLI Software House</span>.
          </p>
          <div className='text-muted-foreground flex items-center gap-1 text-xs'>
            <Star className='fill-primary text-primary size-3' />
            Hecho en Venezuela
          </div>
        </div>
      </div>
    </footer>
  );
}
