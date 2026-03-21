'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRef, useState, useCallback, useTransition } from 'react';
import { Mail, Store, Phone, Search, MapPin, Sparkles, ArrowRight, ShoppingBag, ChevronRight } from 'lucide-react';
import {
  Eye,
  Type,
  Check,
  Globe,
  Laptop,
  Trash2,
  Upload,
  Loader2,
  Monitor,
  Palette,
  ArrowLeft,
  ImageIcon,
  Smartphone,
  ChevronDown,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useModifierKey } from '@/hooks/use-os';
import {
  type CatalogSettingsInput,
  updateCatalogSettingsAction,
} from '@/modules/catalogs/server/actions/update-catalog-settings.action';

/* ─── Types ─── */

type FontOption = 'inter' | 'playfair' | 'dm-sans' | 'poppins' | 'roboto' | 'space-grotesk' | 'outfit';
type CardStyleOption = 'default' | 'minimal' | 'bordered' | 'shadow';
type HeroStyleOption = 'centered' | 'split' | 'banner' | 'minimal';
type CategoriesStyleOption = 'tabs' | 'pills' | 'cards';
type LayoutOption = 'grid' | 'list' | 'magazine';

type ThemePreset = 'light' | 'dark' | 'elegant' | 'vibrant' | 'ocean' | 'custom';
type CtaAction = 'scroll' | 'link' | 'whatsapp' | 'catalog';

interface Settings {
  themePreset: ThemePreset;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  borderColor: string;
  font: FontOption;
  roundedCorners: boolean;
  borderRadius: number;
  cardStyle: CardStyleOption;
  heroEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroBadgeText: string;
  heroBadgeIcon: string;
  heroStyle: HeroStyleOption;
  heroImageUrl: string;
  heroCtaPrimaryText: string;
  heroCtaPrimaryAction: CtaAction;
  heroCtaPrimaryLink: string;
  heroCtaSecondaryText: string;
  heroCtaSecondaryAction: CtaAction;
  heroCtaSecondaryLink: string;
  featuredEnabled: boolean;
  featuredTitle: string;
  categoriesStyle: CategoriesStyleOption;
  aboutEnabled: boolean;
  aboutText: string;
  aboutImageUrl: string;
  layout: LayoutOption;
  gridColumns: number;
  showPrices: boolean;
  showStock: boolean;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  seoCanonicalUrl: string;
  seoKeywords: string;
  faviconUrl: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTwitter: string;
  socialTiktok: string;
  socialYoutube: string;
  socialWhatsapp: string;
  socialEmail: string;
  socialPhone: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementBgColor: string;
  announcementTextColor: string;
  announcementLink: string;
  announcementDismissable: boolean;
  announcementIcon: string;
}

interface PreviewProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  stock: number | null;
  trackInventory: boolean;
  brandName: string | null;
}

interface PreviewBusiness {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  address: string | null;
}

interface PreviewCategory {
  id: string;
  name: string;
}

interface PreviewCatalog {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
}

interface SiteBuilderProps {
  businessId: string;
  catalogId: string;
  businessSlug: string;
  catalogName?: string;
  initialSettings: Record<string, unknown> | null;
  previewData: {
    business: PreviewBusiness;
    categories: PreviewCategory[];
    products: PreviewProduct[];
    catalogs: PreviewCatalog[];
  };
}

const FONTS: { value: FontOption; label: string }[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'dm-sans', label: 'DM Sans' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'space-grotesk', label: 'Space Grotesk' },
  { value: 'outfit', label: 'Outfit' },
];

const CARD_STYLES: { value: CardStyleOption; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'bordered', label: 'Bordered' },
  { value: 'shadow', label: 'Shadow' },
];

const HERO_STYLES: { value: HeroStyleOption; label: string }[] = [
  { value: 'centered', label: 'Centrado' },
  { value: 'split', label: 'Split (imagen)' },
  { value: 'banner', label: 'Banner (imagen)' },
  { value: 'minimal', label: 'Minimal' },
];

const CAT_STYLES: { value: CategoriesStyleOption; label: string }[] = [
  { value: 'tabs', label: 'Tabs' },
  { value: 'pills', label: 'Pills' },
  { value: 'cards', label: 'Cards' },
];

type Section = 'theme' | 'hero' | 'sections' | 'announcement' | 'seo';

const LAYOUT_OPTIONS: { value: LayoutOption; label: string }[] = [
  { value: 'grid', label: 'Grilla' },
  { value: 'list', label: 'Lista' },
  { value: 'magazine', label: 'Magazine' },
];

const GRID_COLUMNS: { value: string; label: string }[] = [
  { value: '3', label: '3 columnas' },
  { value: '4', label: '4 columnas' },
];

const THEME_PRESETS: {
  value: ThemePreset;
  label: string;
  colors: Pick<Settings, 'primaryColor' | 'backgroundColor' | 'surfaceColor' | 'textColor' | 'borderColor'>;
}[] = [
  {
    value: 'light',
    label: 'Claro',
    colors: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      surfaceColor: '#f9fafb',
      textColor: '#111827',
      borderColor: '#e5e7eb',
    },
  },
  {
    value: 'dark',
    label: 'Oscuro',
    colors: {
      primaryColor: '#ffffff',
      backgroundColor: '#0a0a0a',
      surfaceColor: '#171717',
      textColor: '#fafafa',
      borderColor: '#262626',
    },
  },
  {
    value: 'elegant',
    label: 'Elegante',
    colors: {
      primaryColor: '#1a1a2e',
      backgroundColor: '#fefefe',
      surfaceColor: '#f0f0f5',
      textColor: '#1a1a2e',
      borderColor: '#d4d4e0',
    },
  },
  {
    value: 'vibrant',
    label: 'Vibrante',
    colors: {
      primaryColor: '#7c3aed',
      backgroundColor: '#ffffff',
      surfaceColor: '#f5f3ff',
      textColor: '#1e1b4b',
      borderColor: '#e0e0ff',
    },
  },
  {
    value: 'ocean',
    label: 'Océano',
    colors: {
      primaryColor: '#0ea5e9',
      backgroundColor: '#ffffff',
      surfaceColor: '#f0f9ff',
      textColor: '#0c4a6e',
      borderColor: '#bae6fd',
    },
  },
];

const RADIUS_STEPS = [0, 4, 8, 12, 16, 20, 24];

const CTA_ACTIONS: { value: CtaAction; label: string }[] = [
  { value: 'scroll', label: 'Scroll a productos' },
  { value: 'link', label: 'Enlace externo' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'catalog', label: 'Catálogo' },
];

function toSettings(raw: Record<string, unknown> | null): Settings {
  // Support legacy socialLinks jsonb fallback
  const legacySocial = raw?.socialLinks as Record<string, string> | null;
  return {
    themePreset: (raw?.themePreset as ThemePreset) ?? 'custom',
    primaryColor: (raw?.primaryColor as string) ?? '#000000',
    accentColor: (raw?.accentColor as string) ?? '#6366f1',
    backgroundColor: (raw?.backgroundColor as string) ?? '#ffffff',
    surfaceColor: (raw?.surfaceColor as string) ?? '#f9fafb',
    textColor: (raw?.textColor as string) ?? '#111827',
    borderColor: (raw?.borderColor as string) ?? '#e5e7eb',
    font: (raw?.font as FontOption) ?? 'inter',
    roundedCorners: (raw?.roundedCorners as boolean) ?? true,
    borderRadius: (raw?.borderRadius as number) ?? 12,
    cardStyle: (raw?.cardStyle as CardStyleOption) ?? 'default',
    heroEnabled: (raw?.heroEnabled as boolean) ?? true,
    heroTitle: (raw?.heroTitle as string) ?? '',
    heroSubtitle: (raw?.heroSubtitle as string) ?? '',
    heroBadgeText: (raw?.heroBadgeText as string) ?? '',
    heroBadgeIcon: (raw?.heroBadgeIcon as string) ?? 'sparkles',
    heroStyle: (raw?.heroStyle as HeroStyleOption) ?? 'centered',
    heroImageUrl: (raw?.heroImageUrl as string) ?? '',
    heroCtaPrimaryText: (raw?.heroCtaPrimaryText as string) ?? 'Ver productos',
    heroCtaPrimaryAction: (raw?.heroCtaPrimaryAction as CtaAction) ?? 'scroll',
    heroCtaPrimaryLink: (raw?.heroCtaPrimaryLink as string) ?? '',
    heroCtaSecondaryText: (raw?.heroCtaSecondaryText as string) ?? '',
    heroCtaSecondaryAction: (raw?.heroCtaSecondaryAction as CtaAction) ?? 'link',
    heroCtaSecondaryLink: (raw?.heroCtaSecondaryLink as string) ?? '',
    featuredEnabled: (raw?.featuredEnabled as boolean) ?? true,
    featuredTitle: (raw?.featuredTitle as string) ?? 'Productos destacados',
    categoriesStyle: (raw?.categoriesStyle as CategoriesStyleOption) ?? 'tabs',
    aboutEnabled: (raw?.aboutEnabled as boolean) ?? false,
    aboutText: (raw?.aboutText as string) ?? '',
    aboutImageUrl: (raw?.aboutImageUrl as string) ?? '',
    layout: (raw?.layout as LayoutOption) ?? 'grid',
    gridColumns: (raw?.gridColumns as number) ?? 4,
    showPrices: (raw?.showPrices as boolean) ?? true,
    showStock: (raw?.showStock as boolean) ?? false,
    seoTitle: (raw?.seoTitle as string) ?? '',
    seoDescription: (raw?.seoDescription as string) ?? '',
    ogImageUrl: (raw?.ogImageUrl as string) ?? '',
    seoCanonicalUrl: (raw?.seoCanonicalUrl as string) ?? '',
    seoKeywords: (raw?.seoKeywords as string) ?? '',
    faviconUrl: (raw?.faviconUrl as string) ?? '',
    socialInstagram: (raw?.socialInstagram as string) ?? legacySocial?.instagram ?? '',
    socialFacebook: (raw?.socialFacebook as string) ?? legacySocial?.facebook ?? '',
    socialTwitter: (raw?.socialTwitter as string) ?? legacySocial?.twitter ?? '',
    socialTiktok: (raw?.socialTiktok as string) ?? legacySocial?.tiktok ?? '',
    socialYoutube: (raw?.socialYoutube as string) ?? legacySocial?.youtube ?? '',
    socialWhatsapp: (raw?.socialWhatsapp as string) ?? '',
    socialEmail: (raw?.socialEmail as string) ?? '',
    socialPhone: (raw?.socialPhone as string) ?? '',
    announcementEnabled: (raw?.announcementEnabled as boolean) ?? false,
    announcementText: (raw?.announcementText as string) ?? '',
    announcementBgColor: (raw?.announcementBgColor as string) ?? '#000000',
    announcementTextColor: (raw?.announcementTextColor as string) ?? '#ffffff',
    announcementLink: (raw?.announcementLink as string) ?? '',
    announcementDismissable: (raw?.announcementDismissable as boolean) ?? false,
    announcementIcon: (raw?.announcementIcon as string) ?? '',
  };
}

/* ─── Helpers ─── */

const FONT_FAMILY: Record<string, string> = {
  inter: '"Inter", sans-serif',
  playfair: '"Playfair Display", serif',
  'dm-sans': '"DM Sans", sans-serif',
  poppins: '"Poppins", sans-serif',
  roboto: '"Roboto", sans-serif',
  'space-grotesk': '"Space Grotesk", sans-serif',
  outfit: '"Outfit", sans-serif',
};

function buildPayload(settings: Settings): CatalogSettingsInput {
  return {
    themePreset: settings.themePreset,
    primaryColor: settings.primaryColor,
    accentColor: settings.accentColor,
    backgroundColor: settings.backgroundColor,
    surfaceColor: settings.surfaceColor,
    textColor: settings.textColor,
    borderColor: settings.borderColor,
    font: settings.font,
    roundedCorners: settings.borderRadius > 0,
    borderRadius: settings.borderRadius,
    cardStyle: settings.cardStyle,
    heroEnabled: settings.heroEnabled,
    heroTitle: settings.heroTitle || null,
    heroSubtitle: settings.heroSubtitle || null,
    heroBadgeText: settings.heroBadgeText || null,
    heroBadgeIcon: settings.heroBadgeIcon || null,
    heroStyle: settings.heroStyle,
    heroImageUrl: settings.heroImageUrl || null,
    heroCtaPrimaryText: settings.heroCtaPrimaryText || null,
    heroCtaPrimaryAction: settings.heroCtaPrimaryAction,
    heroCtaPrimaryLink: settings.heroCtaPrimaryLink || null,
    heroCtaSecondaryText: settings.heroCtaSecondaryText || null,
    heroCtaSecondaryAction: settings.heroCtaSecondaryAction,
    heroCtaSecondaryLink: settings.heroCtaSecondaryLink || null,
    featuredEnabled: settings.featuredEnabled,
    featuredTitle: settings.featuredTitle || null,
    categoriesStyle: settings.categoriesStyle,
    aboutEnabled: settings.aboutEnabled,
    aboutText: settings.aboutText || null,
    aboutImageUrl: settings.aboutImageUrl || null,
    layout: settings.layout,
    gridColumns: settings.gridColumns,
    showPrices: settings.showPrices,
    showStock: settings.showStock,
    seoTitle: settings.seoTitle || null,
    seoDescription: settings.seoDescription || null,
    ogImageUrl: settings.ogImageUrl || null,
    seoCanonicalUrl: settings.seoCanonicalUrl || null,
    seoKeywords: settings.seoKeywords || null,
    faviconUrl: settings.faviconUrl || null,
    socialInstagram: settings.socialInstagram || null,
    socialFacebook: settings.socialFacebook || null,
    socialTwitter: settings.socialTwitter || null,
    socialTiktok: settings.socialTiktok || null,
    socialYoutube: settings.socialYoutube || null,
    socialWhatsapp: settings.socialWhatsapp || null,
    socialEmail: settings.socialEmail || null,
    socialPhone: settings.socialPhone || null,
    announcementEnabled: settings.announcementEnabled,
    announcementText: settings.announcementText || null,
    announcementBgColor: settings.announcementBgColor,
    announcementTextColor: settings.announcementTextColor,
    announcementLink: settings.announcementLink || null,
    announcementDismissable: settings.announcementDismissable,
    announcementIcon: settings.announcementIcon || null,
  };
}

export function SiteBuilder({ businessId, catalogId, businessSlug, initialSettings, previewData }: SiteBuilderProps) {
  const [settings, setSettings] = useState<Settings>(() => toSettings(initialSettings));
  const [activeSection, setActiveSection] = useState<Section>('theme');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isPending, startTransition] = useTransition();
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setHasUnsaved(true);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePublish = () => {
    startTransition(async () => {
      const result = await updateCatalogSettingsAction(catalogId, buildPayload(settings));
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Cambios publicados');
        setHasUnsaved(false);
      }
    });
  };

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'theme', label: 'Tema', icon: <Palette className='size-4' /> },
    { id: 'hero', label: 'Hero', icon: <Monitor className='size-4' /> },
    { id: 'sections', label: 'Secciones', icon: <Type className='size-4' /> },
    { id: 'announcement', label: 'Anuncio', icon: <Eye className='size-4' /> },
    { id: 'seo', label: 'SEO', icon: <Globe className='size-4' /> },
  ];

  return (
    <div className='fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-950'>
      {/* Top Bar */}
      <div className='flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-neutral-800'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon-sm' asChild>
            <Link href={`/dashboard/businesses/${businessId}`}>
              <ArrowLeft className='size-4' />
            </Link>
          </Button>
          <div>
            <p className='text-sm font-semibold dark:text-white'>Site Builder</p>
            <p className='text-muted-foreground text-xs'>{previewData.business.name}</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {/* Device toggle */}
          <div className='flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-neutral-700'>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`rounded-md p-1.5 transition-colors ${previewDevice === 'desktop' ? 'bg-gray-100 dark:bg-neutral-800' : 'hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
            >
              <Laptop className='size-4' />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`rounded-md p-1.5 transition-colors ${previewDevice === 'mobile' ? 'bg-gray-100 dark:bg-neutral-800' : 'hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
            >
              <Smartphone className='size-4' />
            </button>
          </div>

          <Button variant='outline' size='sm' asChild>
            <a href={`/${businessSlug}`} target='_blank' rel='noopener noreferrer'>
              <Eye className='mr-1.5 size-3.5' />
              Ver tienda
            </a>
          </Button>

          <Button size='sm' onClick={handlePublish} disabled={isPending}>
            {isPending ? <Loader2 className='mr-1.5 size-3.5 animate-spin' /> : <Check className='mr-1.5 size-3.5' />}
            {hasUnsaved ? 'Publicar cambios' : 'Publicado'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        <aside className='flex w-80 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-gray-50/50 dark:border-neutral-800 dark:bg-neutral-900'>
          {/* Section tabs */}
          <div className='flex border-b border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-950'>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex flex-1 flex-col items-center gap-1 border-b-2 px-2 py-2.5 text-[11px] font-medium transition-colors ${
                  activeSection === s.id
                    ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          {/* Settings panels */}
          <div className='flex-1 space-y-1 p-4'>
            {activeSection === 'theme' && <ThemePanel settings={settings} update={update} />}
            {activeSection === 'hero' && <HeroPanel settings={settings} update={update} />}
            {activeSection === 'sections' && <SectionsPanel settings={settings} update={update} />}
            {activeSection === 'announcement' && <AnnouncementPanel settings={settings} update={update} />}
            {activeSection === 'seo' && <SeoPanel settings={settings} update={update} />}
          </div>
        </aside>

        {/* Preview */}
        <div className='flex flex-1 items-center justify-center bg-gray-100 p-6 dark:bg-neutral-950'>
          <div
            className={`h-full overflow-hidden rounded-xl border border-gray-200 shadow-2xl transition-all dark:border-neutral-700 ${
              previewDevice === 'mobile' ? 'w-97.5' : 'w-full'
            }`}
          >
            <BuilderPreview
              settings={settings}
              business={previewData.business}
              categories={previewData.categories}
              products={previewData.products}
              catalogs={previewData.catalogs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Panels ─── */

interface PanelProps {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1.5'>
      <Label className='text-xs font-medium text-gray-500 dark:text-neutral-400'>{label}</Label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className='flex items-center justify-between'>
      <span className='text-sm dark:text-neutral-200'>{label}</span>
      <div className='flex items-center gap-2'>
        <span className='font-mono text-xs text-gray-400 dark:text-neutral-500'>{value}</span>
        <label className='relative size-8 cursor-pointer overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700'>
          <input
            type='color'
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className='absolute inset-0 size-full cursor-pointer opacity-0'
          />
          <span className='block size-full' style={{ backgroundColor: value }} />
        </label>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className='flex cursor-pointer items-center justify-between gap-3 py-1'>
      <div>
        <p className='text-sm font-medium dark:text-neutral-200'>{label}</p>
        {description && <p className='text-xs text-gray-400 dark:text-neutral-500'>{description}</p>}
      </div>
      <button
        type='button'
        role='switch'
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-neutral-700'}`}
      >
        <span
          className={`inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform dark:bg-neutral-900 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <FieldGroup label={label}>
      <div className='relative'>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className='w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pr-8 pl-3 text-sm outline-none focus:border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className='pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-gray-400' />
      </div>
    </FieldGroup>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <p className='pt-4 pb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-neutral-500'>
      {title}
    </p>
  );
}

/* ── Image Upload Field ── */

function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Error al subir imagen');
        return;
      }
      const data = await res.json();
      onChange(data.url);
      toast.success('Imagen subida');
    } catch {
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <FieldGroup label={label}>
      {value ? (
        <div className='relative overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700'>
          <Image src={value} alt={label} width={280} height={160} className='h-32 w-full object-cover' />
          <div className='absolute top-1.5 right-1.5 flex gap-1'>
            <button
              type='button'
              onClick={() => inputRef.current?.click()}
              className='rounded-md bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white'
            >
              <Upload className='size-3.5 text-gray-600' />
            </button>
            <button
              type='button'
              onClick={() => onChange('')}
              className='rounded-md bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50'
            >
              <Trash2 className='size-3.5 text-red-500' />
            </button>
          </div>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className='dark:hover:bg-neutral-750 flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-6 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:border-neutral-600'
        >
          {uploading ? <Loader2 className='size-5 animate-spin' /> : <ImageIcon className='size-5' />}
          <span className='text-xs font-medium'>{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />
    </FieldGroup>
  );
}

/* ── Theme Panel ── */

function ThemePanel({ settings, update }: PanelProps) {
  const applyPreset = (preset: ThemePreset) => {
    const p = THEME_PRESETS.find((t) => t.value === preset);
    if (!p) return;
    update('themePreset', preset);
    update('primaryColor', p.colors.primaryColor);
    update('backgroundColor', p.colors.backgroundColor);
    update('surfaceColor', p.colors.surfaceColor);
    update('textColor', p.colors.textColor);
    update('borderColor', p.colors.borderColor);
  };

  return (
    <div className='space-y-4'>
      <SectionDivider title='Tema predefinido' />
      <div className='grid grid-cols-3 gap-2'>
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => applyPreset(preset.value)}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors ${
              settings.themePreset === preset.value
                ? 'border-gray-900 bg-gray-100 dark:border-white dark:bg-neutral-800'
                : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700 dark:hover:border-neutral-600'
            }`}
          >
            <div className='flex gap-0.5'>
              <span className='size-3 rounded-full' style={{ backgroundColor: preset.colors.primaryColor }} />
              <span
                className='size-3 rounded-full'
                style={{ backgroundColor: preset.colors.backgroundColor, border: '1px solid #ccc' }}
              />
              <span
                className='size-3 rounded-full'
                style={{ backgroundColor: preset.colors.surfaceColor, border: '1px solid #ccc' }}
              />
            </div>
            <span className='text-[10px] font-medium'>{preset.label}</span>
          </button>
        ))}
        <button
          onClick={() => update('themePreset', 'custom')}
          className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors ${
            settings.themePreset === 'custom'
              ? 'border-gray-900 bg-gray-100 dark:border-white dark:bg-neutral-800'
              : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700 dark:hover:border-neutral-600'
          }`}
        >
          <Palette className='size-4 opacity-50' />
          <span className='text-[10px] font-medium'>Custom</span>
        </button>
      </div>

      <SectionDivider title='Colores' />
      <ColorField
        label='Primario'
        value={settings.primaryColor}
        onChange={(v) => {
          update('primaryColor', v);
          update('themePreset', 'custom');
        }}
      />
      <ColorField
        label='Acento'
        value={settings.accentColor}
        onChange={(v) => {
          update('accentColor', v);
          update('themePreset', 'custom');
        }}
      />
      <ColorField
        label='Fondo'
        value={settings.backgroundColor}
        onChange={(v) => {
          update('backgroundColor', v);
          update('themePreset', 'custom');
        }}
      />
      <ColorField
        label='Superficie'
        value={settings.surfaceColor}
        onChange={(v) => {
          update('surfaceColor', v);
          update('themePreset', 'custom');
        }}
      />
      <ColorField
        label='Texto'
        value={settings.textColor}
        onChange={(v) => {
          update('textColor', v);
          update('themePreset', 'custom');
        }}
      />
      <ColorField
        label='Bordes'
        value={settings.borderColor}
        onChange={(v) => {
          update('borderColor', v);
          update('themePreset', 'custom');
        }}
      />

      <SectionDivider title='Tipografía' />
      <SelectField label='Fuente' value={settings.font} options={FONTS} onChange={(v) => update('font', v)} />

      <SectionDivider title='Estilo' />
      <FieldGroup label={`Border radius: ${settings.borderRadius}px`}>
        <input
          type='range'
          min={0}
          max={24}
          step={4}
          value={settings.borderRadius}
          onChange={(e) => update('borderRadius', Number(e.target.value))}
          className='w-full accent-gray-900 dark:accent-white'
        />
        <div className='flex justify-between text-[10px] text-gray-400'>
          {RADIUS_STEPS.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
      </FieldGroup>
      <SelectField
        label='Estilo de cards'
        value={settings.cardStyle}
        options={CARD_STYLES}
        onChange={(v) => update('cardStyle', v)}
      />
    </div>
  );
}

/* ── Hero Panel ── */

function HeroPanel({ settings, update }: PanelProps) {
  return (
    <div className='space-y-4'>
      <Toggle
        label='Hero habilitado'
        description='Mostrar sección hero en la tienda'
        checked={settings.heroEnabled}
        onChange={(v) => update('heroEnabled', v)}
      />

      {settings.heroEnabled && (
        <>
          <SelectField
            label='Estilo'
            value={settings.heroStyle}
            options={HERO_STYLES}
            onChange={(v) => update('heroStyle', v)}
          />

          <ImageUploadField
            label='Imagen del hero'
            value={settings.heroImageUrl}
            onChange={(v) => update('heroImageUrl', v)}
          />

          <FieldGroup label='Título'>
            <Input
              value={settings.heroTitle}
              onChange={(e) => update('heroTitle', e.target.value)}
              placeholder='Título del hero'
            />
          </FieldGroup>

          <FieldGroup label='Subtítulo'>
            <Input
              value={settings.heroSubtitle}
              onChange={(e) => update('heroSubtitle', e.target.value)}
              placeholder='Descripción breve'
            />
          </FieldGroup>

          <FieldGroup label='Badge (opcional)'>
            <Input
              value={settings.heroBadgeText}
              onChange={(e) => update('heroBadgeText', e.target.value)}
              placeholder='Ej: Envío gratis'
            />
          </FieldGroup>

          <SectionDivider title='Botón principal (CTA)' />

          <FieldGroup label='Texto'>
            <Input
              value={settings.heroCtaPrimaryText}
              onChange={(e) => update('heroCtaPrimaryText', e.target.value)}
              placeholder='Ver productos'
            />
          </FieldGroup>
          <SelectField
            label='Acción'
            value={settings.heroCtaPrimaryAction}
            options={CTA_ACTIONS}
            onChange={(v) => update('heroCtaPrimaryAction', v)}
          />
          {settings.heroCtaPrimaryAction === 'link' && (
            <FieldGroup label='URL del enlace'>
              <Input
                value={settings.heroCtaPrimaryLink}
                onChange={(e) => update('heroCtaPrimaryLink', e.target.value)}
                placeholder='https://...'
              />
            </FieldGroup>
          )}

          <SectionDivider title='Botón secundario (opcional)' />

          <FieldGroup label='Texto'>
            <Input
              value={settings.heroCtaSecondaryText}
              onChange={(e) => update('heroCtaSecondaryText', e.target.value)}
              placeholder='Ver colección'
            />
          </FieldGroup>
          {settings.heroCtaSecondaryText && (
            <>
              <SelectField
                label='Acción'
                value={settings.heroCtaSecondaryAction}
                options={CTA_ACTIONS}
                onChange={(v) => update('heroCtaSecondaryAction', v)}
              />
              {settings.heroCtaSecondaryAction === 'link' && (
                <FieldGroup label='URL del enlace'>
                  <Input
                    value={settings.heroCtaSecondaryLink}
                    onChange={(e) => update('heroCtaSecondaryLink', e.target.value)}
                    placeholder='https://...'
                  />
                </FieldGroup>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ── Sections Panel ── */

function SectionsPanel({ settings, update }: PanelProps) {
  return (
    <div className='space-y-4'>
      <SectionDivider title='Layout de productos' />
      <SelectField
        label='Disposición'
        value={settings.layout}
        options={LAYOUT_OPTIONS}
        onChange={(v) => update('layout', v)}
      />
      {settings.layout === 'grid' && (
        <SelectField
          label='Columnas'
          value={String(settings.gridColumns)}
          options={GRID_COLUMNS}
          onChange={(v) => update('gridColumns', Number(v))}
        />
      )}
      <Toggle
        label='Mostrar precios'
        description='Muestra el precio en las tarjetas de producto'
        checked={settings.showPrices}
        onChange={(v) => update('showPrices', v)}
      />
      <Toggle
        label='Mostrar stock'
        description='Muestra la disponibilidad del producto'
        checked={settings.showStock}
        onChange={(v) => update('showStock', v)}
      />

      <SectionDivider title='Categorías' />
      <SelectField
        label='Estilo de navegación'
        value={settings.categoriesStyle}
        options={CAT_STYLES}
        onChange={(v) => update('categoriesStyle', v)}
      />

      <SectionDivider title='Productos destacados' />
      <Toggle
        label='Sección de destacados'
        description='Mostrar productos marcados como destacados'
        checked={settings.featuredEnabled}
        onChange={(v) => update('featuredEnabled', v)}
      />
      {settings.featuredEnabled && (
        <FieldGroup label='Título de sección'>
          <Input
            value={settings.featuredTitle}
            onChange={(e) => update('featuredTitle', e.target.value)}
            placeholder='Productos destacados'
          />
        </FieldGroup>
      )}

      <SectionDivider title='Sobre nosotros' />
      <Toggle
        label='Sección "Sobre nosotros"'
        description='Texto informativo sobre tu negocio'
        checked={settings.aboutEnabled}
        onChange={(v) => update('aboutEnabled', v)}
      />
      {settings.aboutEnabled && (
        <>
          <FieldGroup label='Texto'>
            <textarea
              value={settings.aboutText}
              onChange={(e) => update('aboutText', e.target.value)}
              rows={4}
              className='w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
              placeholder='Cuéntale a tus clientes sobre tu negocio...'
            />
          </FieldGroup>
          <ImageUploadField
            label='Imagen "Sobre nosotros"'
            value={settings.aboutImageUrl}
            onChange={(v) => update('aboutImageUrl', v)}
          />
        </>
      )}
    </div>
  );
}

/* ── Announcement Panel ── */

function AnnouncementPanel({ settings, update }: PanelProps) {
  return (
    <div className='space-y-4'>
      <Toggle
        label='Barra de anuncio'
        description='Barra fija en la parte superior de la tienda'
        checked={settings.announcementEnabled}
        onChange={(v) => update('announcementEnabled', v)}
      />

      {settings.announcementEnabled && (
        <>
          <FieldGroup label='Texto del anuncio'>
            <Input
              value={settings.announcementText}
              onChange={(e) => update('announcementText', e.target.value)}
              placeholder='Envío gratis en compras mayores a $50'
            />
          </FieldGroup>
          <FieldGroup label='Enlace (opcional)'>
            <Input
              value={settings.announcementLink}
              onChange={(e) => update('announcementLink', e.target.value)}
              placeholder='https://...'
            />
          </FieldGroup>
          <FieldGroup label='Icono (opcional)'>
            <Input
              value={settings.announcementIcon}
              onChange={(e) => update('announcementIcon', e.target.value)}
              placeholder='Ej: megaphone, gift, zap'
            />
          </FieldGroup>
          <Toggle
            label='Permitir cerrar'
            description='El usuario puede ocultar el anuncio'
            checked={settings.announcementDismissable}
            onChange={(v) => update('announcementDismissable', v)}
          />
          <ColorField
            label='Color de fondo'
            value={settings.announcementBgColor}
            onChange={(v) => update('announcementBgColor', v)}
          />
          <ColorField
            label='Color de texto'
            value={settings.announcementTextColor}
            onChange={(v) => update('announcementTextColor', v)}
          />
        </>
      )}
    </div>
  );
}

/* ── SEO & Social Panel ── */

function SeoPanel({ settings, update }: PanelProps) {
  const descLength = settings.seoDescription.length;
  const descColor = descLength === 0 ? 'text-gray-400' : descLength <= 160 ? 'text-green-600' : 'text-amber-500';

  return (
    <div className='space-y-4'>
      <SectionDivider title='SEO' />
      <FieldGroup label='Título de página'>
        <Input
          value={settings.seoTitle}
          onChange={(e) => update('seoTitle', e.target.value)}
          placeholder='Mi tienda — Los mejores productos'
        />
      </FieldGroup>
      <FieldGroup label='Meta descripción'>
        <textarea
          value={settings.seoDescription}
          onChange={(e) => update('seoDescription', e.target.value)}
          rows={3}
          className='w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
          placeholder='Descripción que aparece en buscadores...'
        />
        <p className={`text-right text-[10px] ${descColor}`}>{descLength}/160</p>
      </FieldGroup>
      <FieldGroup label='Palabras clave'>
        <Input
          value={settings.seoKeywords}
          onChange={(e) => update('seoKeywords', e.target.value)}
          placeholder='tienda, productos, envío gratis'
        />
      </FieldGroup>
      <FieldGroup label='URL canónica'>
        <Input
          value={settings.seoCanonicalUrl}
          onChange={(e) => update('seoCanonicalUrl', e.target.value)}
          placeholder='https://mi-tienda.com'
        />
      </FieldGroup>
      <ImageUploadField
        label='Imagen Open Graph'
        value={settings.ogImageUrl}
        onChange={(v) => update('ogImageUrl', v)}
      />
      <ImageUploadField label='Favicon' value={settings.faviconUrl} onChange={(v) => update('faviconUrl', v)} />

      <SectionDivider title='Redes sociales' />
      <FieldGroup label='Instagram'>
        <Input
          value={settings.socialInstagram}
          onChange={(e) => update('socialInstagram', e.target.value)}
          placeholder='https://instagram.com/tu-negocio'
        />
      </FieldGroup>
      <FieldGroup label='Facebook'>
        <Input
          value={settings.socialFacebook}
          onChange={(e) => update('socialFacebook', e.target.value)}
          placeholder='https://facebook.com/tu-negocio'
        />
      </FieldGroup>
      <FieldGroup label='TikTok'>
        <Input
          value={settings.socialTiktok}
          onChange={(e) => update('socialTiktok', e.target.value)}
          placeholder='https://tiktok.com/@tu-negocio'
        />
      </FieldGroup>
      <FieldGroup label='Twitter / X'>
        <Input
          value={settings.socialTwitter}
          onChange={(e) => update('socialTwitter', e.target.value)}
          placeholder='https://x.com/tu-negocio'
        />
      </FieldGroup>
      <FieldGroup label='YouTube'>
        <Input
          value={settings.socialYoutube}
          onChange={(e) => update('socialYoutube', e.target.value)}
          placeholder='https://youtube.com/@tu-negocio'
        />
      </FieldGroup>

      <SectionDivider title='Contacto directo' />
      <FieldGroup label='WhatsApp'>
        <Input
          value={settings.socialWhatsapp}
          onChange={(e) => update('socialWhatsapp', e.target.value)}
          placeholder='+1234567890'
        />
      </FieldGroup>
      <FieldGroup label='Email'>
        <Input
          value={settings.socialEmail}
          onChange={(e) => update('socialEmail', e.target.value)}
          placeholder='contacto@mi-tienda.com'
        />
      </FieldGroup>
      <FieldGroup label='Teléfono'>
        <Input
          value={settings.socialPhone}
          onChange={(e) => update('socialPhone', e.target.value)}
          placeholder='+1234567890'
        />
      </FieldGroup>
    </div>
  );
}

/* ─── Inline Preview (matches production layout from [slug]/layout.tsx + storefront-catalog.tsx) ─── */

const PREVIEW_PER_PAGE = 8;

function BuilderPreview({
  settings: s,
  business,
  categories,
  products,
  catalogs,
}: {
  settings: Settings;
  business: PreviewBusiness;
  categories: PreviewCategory[];
  products: PreviewProduct[];
  catalogs: PreviewCatalog[];
}) {
  const [previewPage, setPreviewPage] = useState(1);
  const br = s.borderRadius;
  const radius = br > 0 ? `${br * 0.0625}rem` : '0';
  const radiusLg = br > 0 ? `${(br + 4) * 0.0625}rem` : '0';
  const radiusFull = br >= 20 ? '9999px' : br > 0 ? `${br * 0.125}rem` : '0';
  const font = FONT_FAMILY[s.font] || FONT_FAMILY.inter;
  const featured = products.filter((p) => p.isFeatured);
  const previewTotalPages = Math.ceil(products.length / PREVIEW_PER_PAGE);
  const paginatedPreviewProducts = products.slice((previewPage - 1) * PREVIEW_PER_PAGE, previewPage * PREVIEW_PER_PAGE);
  const layout = s.layout ?? 'grid';
  // Preview is always in a narrow container (~400px), so we use mobile-only
  // grid classes. Tailwind sm:/lg: breakpoints would fire based on viewport width
  // and break the layout.
  const gridClass =
    layout === 'list'
      ? 'flex flex-col gap-3'
      : layout === 'magazine'
        ? 'grid grid-cols-2 gap-3'
        : 'grid grid-cols-2 gap-3';

  const fmt = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? v : new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n);
  };

  const hasSocials =
    s.socialInstagram ||
    s.socialFacebook ||
    s.socialTwitter ||
    s.socialTiktok ||
    s.socialYoutube ||
    s.socialWhatsapp ||
    s.socialEmail ||
    s.socialPhone;

  return (
    <div
      className='flex size-full flex-col overflow-y-auto scroll-smooth'
      style={{ backgroundColor: s.backgroundColor, color: s.textColor, fontFamily: font }}
    >
      {/* Announcement */}
      {s.announcementEnabled && s.announcementText && (
        <div
          className='px-4 py-2 text-center text-xs font-medium sm:text-sm'
          style={{ backgroundColor: s.announcementBgColor, color: s.announcementTextColor }}
        >
          {s.announcementText}
        </div>
      )}

      {/* Header — matches [slug]/layout.tsx */}
      <header
        className='sticky top-0 z-30 backdrop-blur-xl'
        style={{
          backgroundColor: `color-mix(in srgb, ${s.backgroundColor} 85%, transparent)`,
          borderBottom: `1px solid ${s.borderColor}`,
        }}
      >
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-3'>
            {business.logoUrl ? (
              <Image
                src={business.logoUrl}
                alt={business.name}
                width={36}
                height={36}
                className='size-9 object-cover'
                style={{ borderRadius: radius }}
              />
            ) : (
              <div
                className='flex size-9 items-center justify-center'
                style={{ borderRadius: radius, backgroundColor: s.primaryColor }}
              >
                <Store className='size-4.5 text-white' />
              </div>
            )}
            <span className='text-base font-bold tracking-tight'>{business.name}</span>
          </div>
          <div className='flex items-center gap-3'>
            <ShoppingBag className='size-5 opacity-60' />
          </div>
        </div>
      </header>

      <main className='flex-1'>
        {/* Hero */}
        {s.heroEnabled && (
          <PreviewHero s={s} business={business} radius={radius} radiusLg={radiusLg} radiusFull={radiusFull} />
        )}

        <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8'>
          {/* Catalogs Carousel (always visible, independent of category filter) */}
          {catalogs.length > 1 && (
            <div className='mb-10'>
              <h2 className='mb-4 text-lg font-bold tracking-tight'>Colecciones</h2>
              <div className='flex gap-4 overflow-x-auto pb-2'>
                {catalogs.map((cat) => (
                  <div
                    key={cat.id}
                    className='flex w-52 shrink-0 flex-col overflow-hidden border transition-shadow hover:shadow-lg sm:w-60'
                    style={{
                      borderRadius: radiusLg,
                      borderColor: s.borderColor,
                      backgroundColor: s.backgroundColor,
                    }}
                  >
                    <div className='relative aspect-3/2 overflow-hidden' style={{ backgroundColor: s.surfaceColor }}>
                      {cat.imageUrl ? (
                        <Image src={cat.imageUrl} alt={cat.name} fill className='object-cover' />
                      ) : (
                        <div className='flex size-full items-center justify-center'>
                          <ShoppingBag className='size-8 opacity-15' />
                        </div>
                      )}
                    </div>
                    <div className='flex items-center justify-between p-3'>
                      <div className='min-w-0'>
                        <h3 className='truncate text-sm font-semibold'>{cat.name}</h3>
                        {cat.description && <p className='mt-0.5 truncate text-xs opacity-50'>{cat.description}</p>}
                      </div>
                      <ChevronRight className='size-3.5 shrink-0 opacity-40' />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <PreviewCategoryNav
              categories={categories}
              style={s.categoriesStyle}
              s={s}
              radiusFull={radiusFull}
              radiusLg={radiusLg}
            />
          )}

          {/* Featured */}
          {s.featuredEnabled && featured.length > 0 && (
            <section className='mb-12'>
              <div className='mb-6 flex items-center justify-between'>
                <h2 className='text-xl font-bold tracking-tight'>{s.featuredTitle || 'Productos destacados'}</h2>
                <span className='text-sm opacity-40'>
                  {featured.length} producto{featured.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                {featured.slice(0, 6).map((p) => (
                  <PreviewCard key={p.id} product={p} s={s} radiusLg={radiusLg} fmt={fmt} featured />
                ))}
              </div>
            </section>
          )}

          {/* All Products (paginated) */}
          <section id='products'>
            <div className='mb-6 flex items-center justify-between'>
              <h2 className='text-xl font-bold tracking-tight'>Todos los productos</h2>
              <span className='text-sm opacity-40'>
                {products.length} producto{products.length !== 1 ? 's' : ''}
              </span>
            </div>
            {products.length > 0 ? (
              <>
                <div className={gridClass}>
                  {paginatedPreviewProducts.map((p, idx) => (
                    <PreviewCard
                      key={p.id}
                      product={p}
                      s={s}
                      radiusLg={radiusLg}
                      fmt={fmt}
                      layout={layout}
                      magazineHero={layout === 'magazine' && idx === 0}
                    />
                  ))}
                </div>
                {previewTotalPages > 1 && (
                  <div className='mt-6 flex items-center justify-center gap-1'>
                    <button
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      disabled={previewPage === 1}
                      className='flex size-8 items-center justify-center border text-xs transition-colors disabled:opacity-30'
                      style={{ borderRadius: radius, borderColor: s.borderColor }}
                    >
                      ‹
                    </button>
                    {Array.from({ length: previewTotalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPreviewPage(p)}
                        className='flex size-8 items-center justify-center text-xs font-medium transition-colors'
                        style={{
                          borderRadius: radius,
                          backgroundColor: p === previewPage ? s.primaryColor : 'transparent',
                          color: p === previewPage ? '#fff' : 'inherit',
                          border: p === previewPage ? 'none' : `1px solid ${s.borderColor}`,
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPreviewPage((p) => Math.min(previewTotalPages, p + 1))}
                      disabled={previewPage === previewTotalPages}
                      className='flex size-8 items-center justify-center border text-xs transition-colors disabled:opacity-30'
                      style={{ borderRadius: radius, borderColor: s.borderColor }}
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div
                className='flex flex-col items-center py-20'
                style={{ borderRadius: radiusLg, border: `1px dashed ${s.borderColor}` }}
              >
                <div
                  className='flex size-16 items-center justify-center'
                  style={{ borderRadius: radiusFull, backgroundColor: s.surfaceColor }}
                >
                  <ShoppingBag className='size-7 opacity-30' />
                </div>
                <p className='mt-4 font-medium'>No hay productos disponibles</p>
                <p className='mt-1 text-sm opacity-50'>Pronto agregaremos productos.</p>
              </div>
            )}
          </section>

          {/* About */}
          {s.aboutEnabled && s.aboutText && (
            <section className='mt-16 pt-16' style={{ borderTop: `1px solid ${s.borderColor}` }}>
              <div className={s.aboutImageUrl ? 'grid gap-8' : 'mx-auto max-w-3xl text-center'}>
                {s.aboutImageUrl && (
                  <div className='relative aspect-4/3 overflow-hidden' style={{ borderRadius: radiusLg }}>
                    <Image src={s.aboutImageUrl} alt={business.name} fill className='object-cover' />
                  </div>
                )}
                <div className={s.aboutImageUrl ? 'flex flex-col justify-center' : ''}>
                  <h2 className='text-2xl font-bold tracking-tight'>Sobre {business.name}</h2>
                  <p className='mt-4 leading-relaxed opacity-60'>{s.aboutText}</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer — matches [slug]/layout.tsx */}
      <footer style={{ backgroundColor: s.surfaceColor, borderTop: `1px solid ${s.borderColor}` }}>
        <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
          <div className='grid gap-8'>
            {/* Brand */}
            <div>
              <div className='flex items-center gap-2.5'>
                {business.logoUrl ? (
                  <Image
                    src={business.logoUrl}
                    alt={business.name}
                    width={32}
                    height={32}
                    className='size-8 object-cover'
                    style={{ borderRadius: radius }}
                  />
                ) : (
                  <div
                    className='flex size-8 items-center justify-center'
                    style={{ borderRadius: radius, backgroundColor: s.primaryColor }}
                  >
                    <Store className='size-4 text-white' />
                  </div>
                )}
                <span className='font-bold'>{business.name}</span>
              </div>
              {business.description && (
                <p className='mt-3 text-sm leading-relaxed opacity-60'>{business.description}</p>
              )}
            </div>
            {/* Contact */}
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
                  <span className='flex items-center gap-2'>
                    <Mail className='size-3.5 shrink-0' />
                    {business.email}
                  </span>
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
                <span>Todos los productos</span>
                <span>Carrito</span>
                {business.whatsappNumber && <span>WhatsApp</span>}
              </div>
            </div>
            {/* Social */}
            {hasSocials && (
              <div>
                <h4 className='mb-3 text-sm font-semibold tracking-wider uppercase opacity-40'>Redes sociales</h4>
                <div className='flex flex-col gap-2 text-sm opacity-70'>
                  {s.socialInstagram && <span>Instagram</span>}
                  {s.socialFacebook && <span>Facebook</span>}
                  {s.socialTiktok && <span>TikTok</span>}
                  {s.socialTwitter && <span>Twitter / X</span>}
                  {s.socialYoutube && <span>YouTube</span>}
                  {s.socialWhatsapp && <span>WhatsApp</span>}
                  {s.socialEmail && <span>Email</span>}
                  {s.socialPhone && <span>Teléfono</span>}
                </div>
              </div>
            )}
          </div>
          <div
            className='mt-10 pt-6 text-center text-xs opacity-40'
            style={{ borderTop: `1px solid ${s.borderColor}` }}
          >
            © {new Date().getFullYear()} {business.name}. Creado con Vitriona
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Preview Sub-components ─── */

function PreviewHero({
  s,
  business,
  radius,
  radiusLg,
  radiusFull,
}: {
  s: Settings;
  business: PreviewBusiness;
  radius: string;
  radiusLg: string;
  radiusFull: string;
}) {
  const modKey = useModifierKey();
  const title = s.heroTitle || business.name;
  const subtitle = s.heroSubtitle || business.description;
  const hasImage = !!s.heroImageUrl;

  // Search bar element reused across hero styles
  const searchBar = (dark?: boolean) => (
    <div className='relative w-full'>
      <Search className={`absolute top-1/2 left-4 size-4 -translate-y-1/2 ${dark ? 'text-white/50' : 'opacity-40'}`} />
      <div
        className={`w-full py-3 pr-12 pl-11 text-sm ${dark ? 'border border-white/20 bg-white/10 text-white/50 backdrop-blur-sm' : 'shadow-sm'}`}
        style={{
          borderRadius: radiusFull,
          backgroundColor: dark ? undefined : s.backgroundColor,
          border: dark ? undefined : `1px solid ${s.borderColor}`,
        }}
      >
        Buscar productos...
      </div>
      <span
        className='absolute top-1/2 right-4 -translate-y-1/2 border px-1.5 py-0.5 font-mono text-[10px]'
        style={{
          borderColor: dark ? 'rgba(255,255,255,0.2)' : s.borderColor,
          color: dark ? 'rgba(255,255,255,0.4)' : s.borderColor,
          borderRadius: `calc(${radius} * 0.5)`,
        }}
      >
        {modKey}K
      </span>
    </div>
  );

  if (s.heroStyle === 'minimal') {
    return (
      <section className='py-8' style={{ backgroundColor: s.surfaceColor, borderBottom: `1px solid ${s.borderColor}` }}>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-6'>
            <div className='flex-1'>
              <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{title}</h1>
              {subtitle && <p className='mt-2 max-w-xl text-sm opacity-60'>{subtitle}</p>}
              <div className='mt-5 max-w-md'>{searchBar()}</div>
            </div>
            {hasImage && (
              <div
                className='relative hidden size-28 shrink-0 overflow-hidden sm:block sm:size-32 lg:size-40'
                style={{ borderRadius: radiusLg }}
              >
                <Image src={s.heroImageUrl} alt={title} fill className='object-cover' />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (s.heroStyle === 'banner' && hasImage) {
    return (
      <section className='relative overflow-hidden'>
        <Image src={s.heroImageUrl} alt={title} fill className='object-cover' />
        <div className='absolute inset-0 bg-black/50' />
        <div className='relative mx-auto max-w-7xl px-4 py-20 text-center text-white sm:px-6 sm:py-28 lg:px-8 lg:py-36'>
          {s.heroBadgeText && (
            <div className='mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm'>
              <Sparkles className='size-3.5' />
              {s.heroBadgeText}
            </div>
          )}
          <h1 className='text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl'>{title}</h1>
          {subtitle && <p className='mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg'>{subtitle}</p>}
          <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
            <span
              className='inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-black transition-transform'
              style={{ backgroundColor: '#fff', borderRadius: radiusFull }}
            >
              {s.heroCtaPrimaryText || 'Ver productos'} <ArrowRight className='size-4' />
            </span>
            {s.heroCtaSecondaryText && (
              <span
                className='inline-flex items-center gap-2 border border-white/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm'
                style={{ borderRadius: radiusFull }}
              >
                {s.heroCtaSecondaryText}
              </span>
            )}
          </div>
          <div className='mx-auto mt-8 max-w-lg'>{searchBar(true)}</div>
        </div>
      </section>
    );
  }

  if (s.heroStyle === 'split' && hasImage) {
    return (
      <section style={{ backgroundColor: s.surfaceColor, borderBottom: `1px solid ${s.borderColor}` }}>
        <div className='mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20'>
          <div className='flex flex-col justify-center'>
            {s.heroBadgeText && (
              <div
                className='mb-4 inline-flex w-fit items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white'
                style={{ backgroundColor: s.primaryColor, borderRadius: radiusFull }}
              >
                <Sparkles className='size-3.5' />
                {s.heroBadgeText}
              </div>
            )}
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>{title}</h1>
            {subtitle && <p className='mt-4 max-w-lg text-base leading-relaxed opacity-60 sm:text-lg'>{subtitle}</p>}
            <div className='mt-8 flex flex-wrap gap-3'>
              <span
                className='inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white'
                style={{ backgroundColor: s.primaryColor, borderRadius: radiusFull }}
              >
                {s.heroCtaPrimaryText || 'Ver productos'} <ArrowRight className='size-4' />
              </span>
              {s.heroCtaSecondaryText && (
                <span
                  className='inline-flex items-center gap-2 border px-6 py-3 text-sm font-semibold opacity-70'
                  style={{ borderColor: 'currentColor', borderRadius: radiusFull }}
                >
                  {s.heroCtaSecondaryText}
                </span>
              )}
            </div>
            <div className='mt-8 max-w-md'>{searchBar()}</div>
          </div>
          <div className='relative aspect-4/3 overflow-hidden lg:aspect-auto' style={{ borderRadius: radiusLg }}>
            <Image src={s.heroImageUrl} alt={title} fill className='object-cover' />
          </div>
        </div>
      </section>
    );
  }

  // Default: centered
  return (
    <section
      className={hasImage ? 'relative overflow-hidden' : ''}
      style={hasImage ? undefined : { backgroundColor: s.surfaceColor, borderBottom: `1px solid ${s.borderColor}` }}
    >
      {hasImage && (
        <>
          <Image src={s.heroImageUrl} alt={title} fill className='object-cover' />
          <div className='absolute inset-0 bg-black/50' />
        </>
      )}
      <div
        className={`mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8 ${hasImage ? 'relative text-white' : ''}`}
      >
        {s.heroBadgeText && (
          <div
            className='mb-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium'
            style={
              hasImage
                ? { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radiusFull, backdropFilter: 'blur(8px)' }
                : { backgroundColor: s.primaryColor, color: '#fff', borderRadius: radiusFull }
            }
          >
            <Sparkles className='size-3.5' />
            {s.heroBadgeText}
          </div>
        )}
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>{title}</h1>
        {subtitle && (
          <p
            className={`mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${hasImage ? 'text-white/80' : 'opacity-60'}`}
          >
            {subtitle}
          </p>
        )}
        <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
          <span
            className='inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold'
            style={
              hasImage
                ? { backgroundColor: '#fff', color: '#000', borderRadius: radiusFull }
                : { backgroundColor: s.primaryColor, color: '#fff', borderRadius: radiusFull }
            }
          >
            {s.heroCtaPrimaryText || 'Ver productos'} <ChevronRight className='size-4' />
          </span>
          {s.heroCtaSecondaryText && (
            <span
              className='inline-flex items-center gap-2 border px-6 py-3 text-sm font-semibold'
              style={
                hasImage
                  ? { borderColor: 'rgba(255,255,255,0.3)', color: '#fff', borderRadius: radiusFull }
                  : { borderColor: 'currentColor', opacity: 0.7, borderRadius: radiusFull }
              }
            >
              {s.heroCtaSecondaryText}
            </span>
          )}
        </div>
        <div className='mx-auto mt-8 max-w-lg'>{searchBar(hasImage)}</div>
      </div>
    </section>
  );
}

function PreviewCategoryNav({
  categories,
  style,
  s,
  radiusFull,
  radiusLg,
}: {
  categories: PreviewCategory[];
  style: string;
  s: Settings;
  radiusFull: string;
  radiusLg: string;
}) {
  if (style === 'cards') {
    return (
      <div className='mb-10 grid grid-cols-2 gap-3'>
        <div className='p-4 text-left text-white' style={{ borderRadius: radiusLg, backgroundColor: s.primaryColor }}>
          <span className='text-sm font-semibold'>Todos</span>
        </div>
        {categories.map((c) => (
          <div key={c.id} className='p-3' style={{ borderRadius: radiusLg, backgroundColor: s.surfaceColor }}>
            <span className='text-sm font-semibold'>{c.name}</span>
          </div>
        ))}
      </div>
    );
  }

  if (style === 'pills') {
    return (
      <div className='mb-8 flex flex-wrap items-center gap-2'>
        <span
          className='border px-4 py-2 text-sm font-medium text-white'
          style={{ borderRadius: radiusFull, backgroundColor: s.primaryColor, borderColor: s.primaryColor }}
        >
          Todos
        </span>
        {categories.map((c) => (
          <span
            key={c.id}
            className='border px-4 py-2 text-sm font-medium'
            style={{ borderRadius: radiusFull, borderColor: s.borderColor }}
          >
            {c.name}
          </span>
        ))}
      </div>
    );
  }

  // Default: tabs
  return (
    <div
      className='mb-8 flex items-center gap-1 overflow-x-auto'
      style={{ borderBottom: `1px solid ${s.borderColor}` }}
    >
      <span
        className='relative shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap'
        style={{ color: s.primaryColor }}
      >
        Todos
        <span className='absolute inset-x-0 bottom-0 h-0.5' style={{ backgroundColor: s.primaryColor }} />
      </span>
      {categories.map((c) => (
        <span key={c.id} className='shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap opacity-50'>
          {c.name}
        </span>
      ))}
    </div>
  );
}

function PreviewCard({
  product: p,
  s,
  radiusLg,
  fmt,
  featured,
  layout = 'grid',
  magazineHero = false,
}: {
  product: PreviewProduct;
  s: Settings;
  radiusLg: string;
  fmt: (v: string) => string;
  featured?: boolean;
  layout?: string;
  magazineHero?: boolean;
}) {
  const isMinimal = s.cardStyle === 'minimal';
  const isBordered = s.cardStyle === 'bordered';
  const isShadow = s.cardStyle === 'shadow';
  const isList = layout === 'list';
  const radius = s.borderRadius > 0 ? `${s.borderRadius * 0.0625}rem` : '0';

  const stockLabel = s.showStock && p.trackInventory ? ((p.stock ?? 0) > 0 ? `${p.stock} en stock` : 'Agotado') : null;
  const hasDiscount = p.compareAtPrice && parseFloat(p.compareAtPrice) > parseFloat(p.price);
  const discountPct = hasDiscount ? Math.round((1 - parseFloat(p.price) / parseFloat(p.compareAtPrice!)) * 100) : 0;

  return (
    <div
      className={`overflow-hidden ${isList ? 'flex flex-row' : 'flex flex-col'} ${magazineHero ? 'col-span-2 row-span-2' : ''}`}
      style={{
        borderRadius: isMinimal ? '0' : radiusLg,
        backgroundColor: isMinimal ? 'transparent' : s.backgroundColor,
        border: isMinimal ? 'none' : isBordered ? `2px solid ${s.borderColor}` : `1px solid ${s.borderColor}`,
        boxShadow: isShadow ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div
        className={`relative overflow-hidden ${isList ? 'aspect-square w-28 shrink-0' : featured || magazineHero ? 'aspect-4/3' : 'aspect-square'}`}
        style={{ borderRadius: isMinimal ? radiusLg : '0', backgroundColor: s.surfaceColor }}
      >
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt={p.name} fill className='object-cover' />
        ) : (
          <div className='flex size-full items-center justify-center'>
            <ImageIcon className='size-8 opacity-20' />
          </div>
        )}
        {/* Badges */}
        <div className='absolute top-2 left-2 flex flex-col items-start gap-1'>
          {p.isFeatured && (
            <span
              className='px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase'
              style={{ backgroundColor: s.primaryColor, borderRadius: radius }}
            >
              Destacado
            </span>
          )}
          {hasDiscount && (
            <span
              className='px-2 py-0.5 text-[10px] font-bold tracking-wide text-white'
              style={{ backgroundColor: '#ef4444', borderRadius: radius }}
            >
              -{discountPct}%
            </span>
          )}
        </div>
      </div>
      <div className={`flex flex-1 flex-col ${isMinimal ? 'pt-3' : 'p-3'}`}>
        {p.brandName && (
          <span
            className='mb-0.5 text-[10px] font-semibold tracking-wide uppercase'
            style={{ color: s.primaryColor, opacity: 0.6 }}
          >
            {p.brandName}
          </span>
        )}
        <h3 className={`leading-snug font-medium ${isList || magazineHero ? 'text-base' : 'line-clamp-2 text-sm'}`}>
          {p.name}
        </h3>
        {(isList || magazineHero) && p.description && (
          <p className='mt-1 line-clamp-2 text-xs leading-relaxed opacity-50'>{p.description}</p>
        )}
        <div className='mt-auto flex flex-wrap items-center gap-2 pt-2'>
          {s.showPrices && (
            <div className='flex items-baseline gap-2'>
              <span className='text-base font-bold'>{fmt(p.price)}</span>
              {p.compareAtPrice && parseFloat(p.compareAtPrice) > parseFloat(p.price) && (
                <span className='text-xs line-through opacity-40'>{fmt(p.compareAtPrice)}</span>
              )}
            </div>
          )}
          {stockLabel && (
            <span
              className='text-[11px] font-medium'
              style={{ color: (p.stock ?? 0) > 0 ? s.primaryColor : '#ef4444', opacity: 0.7 }}
            >
              · {stockLabel}
            </span>
          )}
        </div>
        {isList && (
          <span
            className='mt-2 self-start px-4 py-1.5 text-xs font-semibold text-white'
            style={{ backgroundColor: s.primaryColor, borderRadius: radius }}
          >
            Agregar
          </span>
        )}
      </div>
    </div>
  );
}
