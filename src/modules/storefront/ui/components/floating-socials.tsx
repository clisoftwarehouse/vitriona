'use client';

import { useState } from 'react';
import { X, Mail, Phone, Share2, Twitter, Youtube, Facebook, Instagram } from 'lucide-react';

interface FloatingSocialsProps {
  socials: {
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  /** When true, renders as absolute + disables links (for site builder preview) */
  preview?: boolean;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5' />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

const SOCIAL_CONFIG = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    Icon: WhatsAppIcon,
    color: '#25D366',
    href: (v: string) => `https://wa.me/${v.replace(/\D/g, '')}`,
  },
  { key: 'instagram', label: 'Instagram', Icon: Instagram, color: '#E4405F', href: (v: string) => v },
  { key: 'facebook', label: 'Facebook', Icon: Facebook, color: '#1877F2', href: (v: string) => v },
  { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon, color: '#000000', href: (v: string) => v },
  { key: 'twitter', label: 'Twitter / X', Icon: Twitter, color: '#1DA1F2', href: (v: string) => v },
  { key: 'youtube', label: 'YouTube', Icon: Youtube, color: '#FF0000', href: (v: string) => v },
  { key: 'email', label: 'Email', Icon: Mail, color: '#6B7280', href: (v: string) => `mailto:${v}` },
  { key: 'phone', label: 'Teléfono', Icon: Phone, color: '#6B7280', href: (v: string) => `tel:${v}` },
] as const;

export function FloatingSocials({ socials, preview = false }: FloatingSocialsProps) {
  const [open, setOpen] = useState(false);

  const links = SOCIAL_CONFIG.filter(({ key }) => socials[key]);
  if (links.length === 0) return null;

  return (
    <div
      className={`${preview ? 'absolute' : 'fixed'} z-50 flex flex-col gap-2`}
      style={{ bottom: '1.5rem', left: '1.5rem' }}
    >
      {/* Expanded social icons */}
      {open && (
        <div className='mb-1 flex flex-col items-start gap-2'>
          {links.map(({ key, label, Icon, color, href }) => {
            const value = socials[key]!;
            const Wrapper = preview ? 'span' : 'a';
            const linkProps = preview
              ? {}
              : { href: href(value), target: '_blank' as const, rel: 'noopener noreferrer' };

            return (
              <Wrapper
                key={key}
                {...linkProps}
                className='flex aspect-square w-16 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110'
                style={{ backgroundColor: color, color: '#fff' }}
                aria-label={label}
                title={label}
              >
                <Icon className='size-8' />
              </Wrapper>
            );
          })}
        </div>
      )}

      {/* FAB toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className='flex aspect-square w-16 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white shadow-xl transition-all duration-200 hover:scale-105 hover:bg-gray-800'
        aria-label={open ? 'Cerrar redes sociales' : 'Redes sociales'}
      >
        {open ? <X className='size-8' /> : <Share2 className='size-8' />}
      </button>
    </div>
  );
}
