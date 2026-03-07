import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Mail, Phone, Store, MapPin } from 'lucide-react';

import { CartSheet } from '@/modules/storefront/ui/components/cart-sheet';
import { getBusinessBySlug, getDefaultCatalog } from '@/modules/storefront/server/queries/get-storefront-data';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StorefrontLayout({ children, params }: StorefrontLayoutProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const catalog = await getDefaultCatalog(business.id);
  if (!catalog) notFound();

  return (
    <div className='flex min-h-dvh flex-col bg-white text-gray-900'>
      <header className='sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6'>
          <Link href={`/${slug}`} className='flex items-center gap-2.5'>
            {business.logoUrl ? (
              <Image
                src={business.logoUrl}
                alt={business.name}
                width={36}
                height={36}
                className='size-9 rounded-lg object-cover'
              />
            ) : (
              <div className='flex size-9 items-center justify-center rounded-lg bg-gray-900'>
                <Store className='size-4.5 text-white' />
              </div>
            )}
            <div>
              <span className='text-base font-semibold'>{business.name}</span>
              {catalog.name !== 'Catálogo Principal' && (
                <span className='ml-2 text-xs text-gray-500'>{catalog.name}</span>
              )}
            </div>
          </Link>

          <div className='flex items-center gap-2'>
            {business.whatsappNumber && (
              <a
                href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, '')}`}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700'
              >
                <Phone className='size-3.5' />
                <span className='hidden sm:inline'>WhatsApp</span>
              </a>
            )}
            <CartSheet slug={slug} />
          </div>
        </div>
      </header>

      <main className='flex-1'>{children}</main>

      <footer className='border-t border-gray-100 bg-gray-50'>
        <div className='mx-auto max-w-6xl px-4 py-8 sm:px-6'>
          <div className='flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left'>
            <div>
              <p className='font-semibold'>{business.name}</p>
              {business.description && <p className='mt-1 text-sm text-gray-500'>{business.description}</p>}
            </div>
            <div className='flex flex-col gap-1.5 text-sm text-gray-500'>
              {business.phone && (
                <span className='flex items-center gap-1.5'>
                  <Phone className='size-3.5' />
                  {business.phone}
                </span>
              )}
              {business.email && (
                <span className='flex items-center gap-1.5'>
                  <Mail className='size-3.5' />
                  {business.email}
                </span>
              )}
              {business.address && (
                <span className='flex items-center gap-1.5'>
                  <MapPin className='size-3.5' />
                  {business.address}
                </span>
              )}
            </div>
          </div>
          <div className='mt-6 border-t border-gray-200 pt-4 text-center text-xs text-gray-400'>
            Creado con{' '}
            <Link href='/' className='font-medium text-gray-500 hover:text-gray-700'>
              Vitriona
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
