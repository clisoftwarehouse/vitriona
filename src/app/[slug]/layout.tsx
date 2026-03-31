import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Mail, Phone, Store, MapPin } from 'lucide-react';

import { CartSheet } from '@/modules/storefront/ui/components/cart-sheet';
import { GoogleAnalytics } from '@/modules/storefront/ui/components/google-analytics';
import { ChatWidgetLoader } from '@/modules/ai-chat/ui/components/chat-widget-loader';
import { StorefrontThemeStyle } from '@/modules/storefront/ui/components/storefront-theme';
import {
  getBusinessBySlug,
  getDefaultCatalog,
  getCatalogSettings,
} from '@/modules/storefront/server/queries/get-storefront-data';

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

  const settings = await getCatalogSettings(catalog.id);

  const theme = {
    primaryColor: settings?.primaryColor ?? '#000000',
    accentColor: settings?.accentColor ?? '#6366f1',
    backgroundColor: settings?.backgroundColor ?? '#ffffff',
    surfaceColor: settings?.surfaceColor ?? '#f9fafb',
    textColor: settings?.textColor ?? '#111827',
    borderColor: settings?.borderColor ?? '#e5e7eb',
    font: settings?.font ?? 'inter',
    roundedCorners: settings?.roundedCorners ?? true,
    borderRadius: settings?.borderRadius ?? 12,
  };

  const currentYear = new Date().getFullYear();

  // Support individual social columns with fallback to legacy jsonb
  const legacySocial = settings?.socialLinks as {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  } | null;
  const socialLinks = {
    instagram: settings?.socialInstagram ?? legacySocial?.instagram,
    facebook: settings?.socialFacebook ?? legacySocial?.facebook,
    twitter: settings?.socialTwitter ?? legacySocial?.twitter,
    tiktok: settings?.socialTiktok ?? legacySocial?.tiktok,
    youtube: settings?.socialYoutube ?? legacySocial?.youtube,
    whatsapp: settings?.socialWhatsapp,
    email: settings?.socialEmail,
    phone: settings?.socialPhone,
  };
  const hasSocials = Object.values(socialLinks).some(Boolean);

  return (
    <>
      <StorefrontThemeStyle theme={theme} />
      {settings?.googleAnalyticsId && <GoogleAnalytics measurementId={settings.googleAnalyticsId} />}
      <div
        className='flex min-h-dvh flex-col scroll-smooth'
        style={{
          backgroundColor: 'var(--sf-bg, #fff)',
          color: 'var(--sf-text, #111827)',
          fontFamily: 'var(--sf-font, "Inter", sans-serif)',
        }}
      >
        {/* Announcement Bar */}
        {settings?.announcementEnabled && settings.announcementText && (
          <div
            className='px-4 py-2 text-center text-xs font-medium sm:text-sm'
            style={{
              backgroundColor: settings.announcementBgColor ?? '#000',
              color: settings.announcementTextColor ?? '#fff',
            }}
          >
            {settings.announcementLink ? (
              <a
                href={settings.announcementLink}
                target='_blank'
                rel='noopener noreferrer'
                className='underline underline-offset-2 hover:opacity-80'
              >
                {settings.announcementText}
              </a>
            ) : (
              settings.announcementText
            )}
          </div>
        )}

        {/* Header */}
        <header
          className='sticky top-0 z-30 backdrop-blur-xl'
          style={{
            backgroundColor: 'color-mix(in srgb, var(--sf-bg, #fff) 85%, transparent)',
            borderBottom: '1px solid var(--sf-border, #e5e7eb)',
          }}
        >
          <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
            <Link href={`/${slug}`} className='flex items-center gap-3'>
              {business.logoUrl ? (
                <Image
                  src={business.logoUrl}
                  alt={business.name}
                  width={36}
                  height={36}
                  unoptimized
                  className='size-9 object-cover'
                  style={{ borderRadius: 'var(--sf-radius, 0.75rem)' }}
                />
              ) : (
                <div
                  className='flex size-9 items-center justify-center'
                  style={{
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    backgroundColor: 'var(--sf-primary, #000)',
                    color: 'var(--sf-primary-contrast, #fff)',
                  }}
                >
                  <Store className='size-4.5' />
                </div>
              )}
              <span className='text-base font-bold tracking-tight'>{business.name}</span>
            </Link>

            <div className='flex items-center gap-3'>
              {business.whatsappNumber && (
                <a
                  href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, '')}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hidden items-center gap-1.5 px-4 py-2 text-sm font-medium text-white transition-colors sm:inline-flex'
                  style={{
                    backgroundColor: '#25D366',
                    borderRadius: 'var(--sf-radius-full, 9999px)',
                  }}
                >
                  <Phone className='size-3.5' />
                  WhatsApp
                </a>
              )}
              <CartSheet slug={slug} currency={business.currency} />
            </div>
          </div>
        </header>

        <main className='flex-1'>{children}</main>

        {/* Footer */}
        <footer
          style={{ backgroundColor: 'var(--sf-surface, #f9fafb)', borderTop: '1px solid var(--sf-border, #e5e7eb)' }}
        >
          <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
            <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
              {/* Brand column */}
              <div className='sm:col-span-2 lg:col-span-1'>
                <div className='flex items-center gap-2.5'>
                  {business.logoUrl ? (
                    <Image
                      src={business.logoUrl}
                      alt={business.name}
                      width={32}
                      height={32}
                      unoptimized
                      className='size-8 object-cover'
                      style={{ borderRadius: 'var(--sf-radius, 0.75rem)' }}
                    />
                  ) : (
                    <div
                      className='flex size-8 items-center justify-center'
                      style={{
                        borderRadius: 'var(--sf-radius, 0.75rem)',
                        backgroundColor: 'var(--sf-primary, #000)',
                        color: 'var(--sf-primary-contrast, #fff)',
                      }}
                    >
                      <Store className='size-4' />
                    </div>
                  )}
                  <span className='font-bold'>{business.name}</span>
                </div>
                {business.description && (
                  <p className='mt-3 text-sm leading-relaxed opacity-60'>{business.description}</p>
                )}
              </div>

              {/* Contact column */}
              <div>
                <h4 className='mb-3 text-sm font-semibold tracking-wider uppercase opacity-40'>Contacto</h4>
                <div className='flex flex-col gap-2.5 text-sm opacity-70'>
                  {business.phone && (
                    <span className='flex items-center gap-2'>
                      <Phone className='size-3.5 shrink-0' />
                      {business.phone}
                    </span>
                  )}
                  {business.email && (
                    <a href={`mailto:${business.email}`} className='flex items-center gap-2 hover:opacity-100'>
                      <Mail className='size-3.5 shrink-0' />
                      {business.email}
                    </a>
                  )}
                  {business.address && (
                    <span className='flex items-center gap-2'>
                      <MapPin className='size-3.5 shrink-0' />
                      {business.address}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick links */}
              <div>
                <h4 className='mb-3 text-sm font-semibold tracking-wider uppercase opacity-40'>Tienda</h4>
                <div className='flex flex-col gap-2 text-sm opacity-70'>
                  <Link href={`/${slug}`} className='hover:opacity-100'>
                    Todos los productos
                  </Link>
                  <Link href={`/${slug}/checkout`} className='hover:opacity-100'>
                    Carrito
                  </Link>
                  {business.whatsappNumber && (
                    <a
                      href={`https://wa.me/${business.whatsappNumber.replace(/\D/g, '')}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='hover:opacity-100'
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Social links */}
              {hasSocials && (
                <div>
                  <h4 className='mb-3 text-sm font-semibold tracking-wider uppercase opacity-40'>Redes sociales</h4>
                  <div className='flex flex-col gap-2 text-sm opacity-70'>
                    {socialLinks?.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:opacity-100'
                      >
                        Instagram
                      </a>
                    )}
                    {socialLinks?.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:opacity-100'
                      >
                        Facebook
                      </a>
                    )}
                    {socialLinks?.tiktok && (
                      <a
                        href={socialLinks.tiktok}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:opacity-100'
                      >
                        TikTok
                      </a>
                    )}
                    {socialLinks?.twitter && (
                      <a
                        href={socialLinks.twitter}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:opacity-100'
                      >
                        Twitter / X
                      </a>
                    )}
                    {socialLinks?.youtube && (
                      <a
                        href={socialLinks.youtube}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:opacity-100'
                      >
                        YouTube
                      </a>
                    )}
                    {socialLinks?.whatsapp && (
                      <a
                        href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:opacity-100'
                      >
                        WhatsApp
                      </a>
                    )}
                    {socialLinks?.email && (
                      <a href={`mailto:${socialLinks.email}`} className='hover:opacity-100'>
                        {socialLinks.email}
                      </a>
                    )}
                    {socialLinks?.phone && (
                      <a href={`tel:${socialLinks.phone}`} className='hover:opacity-100'>
                        {socialLinks.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              className='mt-10 pt-6 text-center text-xs opacity-40'
              style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}
            >
              © {currentYear} {business.name}. Creado con{' '}
              <Link href='/' className='font-medium underline underline-offset-2 hover:opacity-80'>
                Vitriona
              </Link>
            </div>
          </div>
        </footer>

        <ChatWidgetLoader businessId={business.id} />
      </div>
    </>
  );
}
