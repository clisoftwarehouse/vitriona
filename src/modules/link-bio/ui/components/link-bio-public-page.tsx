'use client';

import Image from 'next/image';
import { Store, ExternalLink } from 'lucide-react';

import type { LinkType } from '../schemas/link-bio.schemas';
import { LINK_TYPE_DEFAULT_ICONS } from '../schemas/link-bio.schemas';
import type { linkPages, businesses, linkPageLinks } from '@/db/schema';

type Business = typeof businesses.$inferSelect;
type LinkPage = typeof linkPages.$inferSelect;
type LinkItem = typeof linkPageLinks.$inferSelect;

interface LinkBioPublicPageProps {
  business: Business;
  page: LinkPage;
  links: LinkItem[];
  storefrontTheme?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius?: number;
  } | null;
}

const FONT_MAP: Record<string, string> = {
  inter: '"Inter", sans-serif',
  playfair: '"Playfair Display", serif',
  'dm-sans': '"DM Sans", sans-serif',
  poppins: '"Poppins", sans-serif',
  roboto: '"Roboto", sans-serif',
  'space-grotesk': '"Space Grotesk", sans-serif',
  outfit: '"Outfit", sans-serif',
};

interface BtnStyleProps {
  btnColor: string;
  btnTextColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  radius: number;
  style: string;
}

function getButtonStyle({
  btnColor,
  btnTextColor,
  gradientFrom,
  gradientTo,
  gradientAngle,
  radius,
  style,
}: BtnStyleProps): React.CSSProperties {
  const r = `${radius}px`;
  switch (style) {
    case 'outlined':
      return { background: 'transparent', color: btnColor, borderRadius: r, border: `2px solid ${btnColor}` };
    case 'soft':
      return { background: `${btnColor}28`, color: btnColor, borderRadius: r, border: `1px solid ${btnColor}40` };
    case 'glass':
      return {
        background: 'rgba(255,255,255,0.08)',
        color: btnTextColor,
        borderRadius: r,
        border: '1px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      };
    case 'gradient':
      return {
        background: `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`,
        color: btnTextColor,
        borderRadius: r,
        border: 'none',
      };
    case 'pill-filled':
      return { background: btnColor, color: btnTextColor, borderRadius: '9999px', border: 'none' };
    case 'pill-outlined':
      return { background: 'transparent', color: btnColor, borderRadius: '9999px', border: `2px solid ${btnColor}` };
    case 'link':
      return {
        background: 'transparent',
        color: btnTextColor,
        border: 'none',
        textDecoration: 'underline',
        borderRadius: r,
      };
    case 'filled':
    default:
      return { background: btnColor, color: btnTextColor, borderRadius: r, border: 'none' };
  }
}

function LinkItemIcon({ link }: { link: LinkItem }) {
  if (link.iconImageUrl) {
    return (
      <div className='relative size-7 shrink-0 overflow-hidden rounded-full'>
        <Image src={link.iconImageUrl} alt='' fill className='object-cover' />
      </div>
    );
  }
  const emoji = link.iconEmoji || LINK_TYPE_DEFAULT_ICONS[link.linkType as LinkType] || '🔗';
  return <span className='shrink-0 text-base leading-none'>{emoji}</span>;
}

export function LinkBioPublicPage({ business, page, links, storefrontTheme }: LinkBioPublicPageProps) {
  const useStorefront = page.useStorefrontTheme && storefrontTheme;

  const bgColor = useStorefront ? storefrontTheme!.backgroundColor : (page.backgroundColor ?? '#0f0f0f');
  const txtColor = useStorefront ? storefrontTheme!.textColor : (page.textColor ?? '#ffffff');
  const btnColor = useStorefront ? storefrontTheme!.primaryColor : (page.buttonColor ?? '#8b1a1a');
  const btnTextColor = page.buttonTextColor ?? '#ffffff';
  const btnRadius = useStorefront ? (storefrontTheme!.borderRadius ?? 999) : (page.buttonRadius ?? 999);
  const fontFamily = FONT_MAP[page.font ?? 'inter'] ?? FONT_MAP.inter;
  const buttonStyle = page.buttonStyle ?? 'pill-filled';
  const gradientFrom = page.buttonGradientFrom ?? '#6366f1';
  const gradientTo = page.buttonGradientTo ?? '#a855f7';
  const gradientAngle = page.buttonGradientAngle ?? 135;
  const overlayOpacity = (page.backgroundOverlayOpacity ?? 50) / 100;

  const avatarUrl = page.avatarUrl || business.logoUrl;
  const title = page.title || business.name;
  const bio = page.bio || business.description;
  const showStorefrontLink = page.storefrontLinkEnabled !== false;
  const storefrontLinkTitle = page.storefrontLinkTitle ?? 'Ver nuestra tienda';

  const btnProps: BtnStyleProps = {
    btnColor,
    btnTextColor,
    gradientFrom,
    gradientTo,
    gradientAngle,
    radius: btnRadius,
    style: buttonStyle,
  };

  const hasImageBg = page.backgroundType === 'image' && page.backgroundImageUrl && !useStorefront;
  const bgStyle: React.CSSProperties = hasImageBg
    ? {}
    : {
        background:
          page.backgroundType === 'gradient' && !useStorefront ? (page.backgroundGradient ?? bgColor) : bgColor,
      };

  return (
    <div className='relative flex min-h-dvh flex-col' style={{ fontFamily, color: txtColor }}>
      {/* Background */}
      {hasImageBg ? (
        <>
          <Image src={page.backgroundImageUrl!} alt='' fill className='object-cover' priority />
          {page.backgroundOverlay && (
            <div
              className='absolute inset-0'
              style={{ backgroundColor: page.backgroundOverlayColor ?? '#000000', opacity: overlayOpacity }}
            />
          )}
        </>
      ) : (
        <div className='absolute inset-0' style={bgStyle} />
      )}

      {/* Content */}
      <div className='relative z-10 flex min-h-dvh flex-col items-center px-4 py-12'>
        <div className='flex w-full max-w-md flex-col items-center gap-5'>
          {/* Avatar */}
          {avatarUrl && (
            <div className='relative size-24 overflow-hidden rounded-full shadow-2xl ring-2 ring-white/20'>
              <Image src={avatarUrl} alt={title} fill className='object-cover' priority />
            </div>
          )}

          {/* Title + bio */}
          <div className='text-center'>
            <h1 className='text-lg font-bold tracking-tight' style={{ color: txtColor }}>
              {title}
            </h1>
            {bio && (
              <p className='mt-1 text-sm leading-relaxed opacity-75' style={{ color: txtColor }}>
                {bio}
              </p>
            )}
          </div>

          {/* Links */}
          <div className='flex w-full flex-col gap-3'>
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target='_blank'
                rel='noopener noreferrer'
                className='flex min-h-13 w-full cursor-pointer items-center gap-3 px-4 py-3 font-medium transition-all duration-150 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'
                style={getButtonStyle(btnProps)}
              >
                <LinkItemIcon link={link} />
                <span className='flex-1 text-center text-sm font-semibold'>{link.title}</span>
                <ExternalLink className='size-3 shrink-0 opacity-40' />
              </a>
            ))}

            {/* Default storefront link */}
            {showStorefrontLink && (
              <a
                href={`/${business.slug}`}
                className='flex min-h-13 w-full cursor-pointer items-center gap-3 px-4 py-3 font-medium transition-all duration-150 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'
                style={getButtonStyle(btnProps)}
              >
                <Store className='size-5 shrink-0' />
                <span className='flex-1 text-center text-sm font-semibold'>{storefrontLinkTitle}</span>
                <ExternalLink className='size-3 shrink-0 opacity-40' />
              </a>
            )}
          </div>

          {/* Powered by */}
          <p className='mt-4 text-[11px] font-medium tracking-wide uppercase opacity-30' style={{ color: txtColor }}>
            Creado con Vitriona
          </p>
        </div>
      </div>
    </div>
  );
}
