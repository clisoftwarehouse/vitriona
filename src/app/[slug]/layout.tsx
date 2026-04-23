import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Mail, Phone, Store, MapPin, Twitter, Youtube, Facebook, Instagram } from 'lucide-react';

import { getPlanLimits } from '@/lib/plan-limits';
import { incrementVisit } from '@/lib/visit-tracker';
import { CartSheet } from '@/modules/storefront/ui/components/cart-sheet';
import { FloatingSocials } from '@/modules/storefront/ui/components/floating-socials';
import { GoogleAnalytics } from '@/modules/storefront/ui/components/google-analytics';
import { ChatWidgetLoader } from '@/modules/ai-chat/ui/components/chat-widget-loader';
import { StorefrontThemeStyle } from '@/modules/storefront/ui/components/storefront-theme';
import { StorefrontAnalyticsTracker } from '@/modules/storefront/ui/components/storefront-analytics-tracker';
import {
  getBusinessBySlug,
  getDefaultCatalog,
  getCatalogSettings,
} from '@/modules/storefront/server/queries/get-storefront-data';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StorefrontLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return {};

  const catalog = await getDefaultCatalog(business.id);
  const settings = catalog ? await getCatalogSettings(catalog.id) : null;

  const title = settings?.seoTitle || `${business.name} — Tienda`;
  const description = settings?.seoDescription || business.description || `Explora la tienda de ${business.name}`;
  const faviconUrl = settings?.faviconUrl || business.logoUrl || null;

  return {
    title,
    description,
    ...(settings?.seoKeywords ? { keywords: settings.seoKeywords.split(',').map((k: string) => k.trim()) } : {}),
    ...(settings?.seoCanonicalUrl ? { alternates: { canonical: settings.seoCanonicalUrl } } : {}),
    ...(faviconUrl ? { icons: { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl } } : {}),
    openGraph: {
      title,
      description,
      type: 'website',
      ...(settings?.ogImageUrl ? { images: [{ url: settings.ogImageUrl }] } : {}),
    },
  };
}

export default async function StorefrontLayout({ children, params }: StorefrontLayoutProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  // ── Visit tracking (Redis, fire-and-forget) ──
  const limits = getPlanLimits(business.plan, business);
  let visitLimitReached = false;
  try {
    const count = await incrementVisit(business.id);
    if (count > limits.maxVisitsPerMonth) visitLimitReached = true;
  } catch {
    // Redis down — don't block the storefront
  }

  if (visitLimitReached) {
    return (
      <div className='flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-6 text-center'>
        <Store className='mb-4 size-16 text-gray-300' />
        <h1 className='text-2xl font-bold text-gray-900'>Tienda no disponible temporalmente</h1>
        <p className='mt-2 max-w-md text-gray-500'>
          Esta tienda ha alcanzado el límite de visitas mensuales de su plan actual. Por favor, inténtalo más tarde o
          contacta al dueño de la tienda.
        </p>
      </div>
    );
  }

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

  const logoSize = settings?.logoSize ?? 36;
  const footerLogoSize = Math.round(logoSize * 0.88);
  const currentYear = new Date().getFullYear();

  // Support individual social columns with fallback to legacy jsonb, then business-level fields
  const legacySocial = settings?.socialLinks as {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  } | null;
  const socialLinks = {
    instagram: settings?.socialInstagram ?? legacySocial?.instagram ?? business.instagramUrl,
    facebook: settings?.socialFacebook ?? legacySocial?.facebook ?? business.facebookUrl,
    twitter: settings?.socialTwitter ?? legacySocial?.twitter ?? business.twitterUrl,
    tiktok: settings?.socialTiktok ?? legacySocial?.tiktok ?? business.tiktokUrl,
    youtube: settings?.socialYoutube ?? legacySocial?.youtube ?? business.youtubeUrl,
    whatsapp: settings?.socialWhatsapp ?? business.whatsappNumber,
    email: settings?.socialEmail ?? business.email,
    phone: settings?.socialPhone ?? business.phone,
  };
  const hasSocials = Object.values(socialLinks).some(Boolean);

  return (
    <>
      <StorefrontAnalyticsTracker businessId={business.id} eventType='storefront_view' />
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
                  width={logoSize}
                  height={logoSize}
                  unoptimized
                  className='object-contain'
                  style={{
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    width: logoSize,
                    height: logoSize,
                  }}
                />
              ) : (
                <div
                  className='flex items-center justify-center'
                  style={{
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    backgroundColor: 'var(--sf-primary, #000)',
                    color: 'var(--sf-primary-contrast, #fff)',
                    width: logoSize,
                    height: logoSize,
                  }}
                >
                  <Store style={{ width: logoSize * 0.5, height: logoSize * 0.5 }} />
                </div>
              )}
              {settings?.headerTitle && (
                <span className='text-base font-bold tracking-tight'>{settings.headerTitle}</span>
              )}
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
                      width={footerLogoSize}
                      height={footerLogoSize}
                      unoptimized
                      className='object-contain'
                      style={{
                        borderRadius: 'var(--sf-radius, 0.75rem)',
                        width: footerLogoSize,
                        height: footerLogoSize,
                      }}
                    />
                  ) : (
                    <div
                      className='flex items-center justify-center'
                      style={{
                        borderRadius: 'var(--sf-radius, 0.75rem)',
                        backgroundColor: 'var(--sf-primary, #000)',
                        color: 'var(--sf-primary-contrast, #fff)',
                        width: footerLogoSize,
                        height: footerLogoSize,
                      }}
                    >
                      <Store style={{ width: footerLogoSize * 0.5, height: footerLogoSize * 0.5 }} />
                    </div>
                  )}
                  {!business.logoUrl && <span className='font-bold'>{business.name}</span>}
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
                    <a href={`tel:${business.phone}`} className='flex items-center gap-2 hover:opacity-100'>
                      <Phone className='size-3.5 shrink-0' />
                      {business.phone}
                    </a>
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
                  <div className='flex flex-wrap gap-3'>
                    {socialLinks?.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='opacity-60 transition-opacity hover:opacity-100'
                        aria-label='Instagram'
                      >
                        <Instagram className='size-5' />
                      </a>
                    )}
                    {socialLinks?.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='opacity-60 transition-opacity hover:opacity-100'
                        aria-label='Facebook'
                      >
                        <Facebook className='size-5' />
                      </a>
                    )}
                    {socialLinks?.tiktok && (
                      <a
                        href={socialLinks.tiktok}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='opacity-60 transition-opacity hover:opacity-100'
                        aria-label='TikTok'
                      >
                        <svg
                          className='size-5'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <path d='M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5' />
                        </svg>
                      </a>
                    )}
                    {socialLinks?.twitter && (
                      <a
                        href={socialLinks.twitter}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='opacity-60 transition-opacity hover:opacity-100'
                        aria-label='Twitter / X'
                      >
                        <Twitter className='size-5' />
                      </a>
                    )}
                    {socialLinks?.youtube && (
                      <a
                        href={socialLinks.youtube}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='opacity-60 transition-opacity hover:opacity-100'
                        aria-label='YouTube'
                      >
                        <Youtube className='size-5' />
                      </a>
                    )}
                    {socialLinks?.whatsapp && (
                      <a
                        href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='opacity-60 transition-opacity hover:opacity-100'
                        aria-label='WhatsApp'
                      >
                        <svg
                          className='size-5'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <path d='M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21' />
                          <path d='M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1' />
                        </svg>
                      </a>
                    )}
                    {socialLinks?.email && (
                      <a
                        href={`mailto:${socialLinks.email}`}
                        className='opacity-60 transition-opacity hover:opacity-100'
                        aria-label='Email'
                      >
                        <Mail className='size-5' />
                      </a>
                    )}
                    {socialLinks?.phone && (
                      <a
                        href={`tel:${socialLinks.phone}`}
                        className='opacity-60 transition-opacity hover:opacity-100'
                        aria-label='Teléfono'
                      >
                        <Phone className='size-5' />
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

        {settings?.showFloatingSocials && hasSocials && <FloatingSocials socials={socialLinks} />}

        <ChatWidgetLoader businessId={business.id} />
      </div>
    </>
  );
}
