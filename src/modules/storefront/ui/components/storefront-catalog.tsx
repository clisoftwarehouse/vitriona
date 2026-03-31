'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Star,
  Search,
  ImageOff,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';

import { useModifierKey } from '@/hooks/use-os';
import { useCartStore } from '@/modules/storefront/stores/cart-store';

/* ─── Types ─── */

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  isFeatured: boolean;
  categoryId: string | null;
  brandName?: string | null;
  stock: number | null;
  trackInventory: boolean;
  images: ProductImage[];
  hasVariants: boolean;
  avgRating?: number;
  reviewCount?: number;
}

interface Business {
  name: string;
  description: string | null;
  currency: string;
  whatsappNumber: string | null;
}

interface CatalogSettings {
  heroEnabled: boolean | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  heroBadgeText: string | null;
  heroCtaPrimaryText: string | null;
  heroCtaPrimaryLink: string | null;
  heroCtaPrimaryAction: string | null;
  heroCtaSecondaryText: string | null;
  heroCtaSecondaryLink: string | null;
  heroCtaSecondaryAction: string | null;
  heroStyle: string | null;
  featuredEnabled: boolean | null;
  featuredTitle: string | null;
  categoriesStyle: string | null;
  aboutEnabled: boolean | null;
  aboutText: string | null;
  aboutImageUrl: string | null;
  cardStyle: string | null;
  gridColumns: number | null;
  primaryColor: string | null;
  layout: string | null;
  showPrices: boolean | null;
  showStock: boolean | null;
}

interface CatalogPreview {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  products: Product[];
  totalProducts: number;
}

interface StorefrontCatalogProps {
  slug: string;
  business: Business;
  categories: Category[];
  products: Product[];
  activeCategory?: string;
  searchQuery?: string;
  settings: CatalogSettings | null;
  catalogSections?: CatalogPreview[];
  catalogName?: string;
}

/* ─── Helpers ─── */

function formatPrice(price: string, currency = 'USD') {
  return new Intl.NumberFormat('es', { style: 'currency', currency }).format(parseFloat(price));
}

function hasDiscount(p: Product) {
  return p.compareAtPrice ? parseFloat(p.compareAtPrice) > parseFloat(p.price) : false;
}

function discountPercent(p: Product) {
  return p.compareAtPrice ? Math.round((1 - parseFloat(p.price) / parseFloat(p.compareAtPrice)) * 100) : 0;
}

const PRODUCTS_PER_PAGE = 12;

/* ─── Main Component ─── */

export function StorefrontCatalog({
  slug,
  business,
  categories,
  products: allProducts,
  activeCategory: initialCategory,
  searchQuery,
  settings,
  catalogSections,
  catalogName,
}: StorefrontCatalogProps) {
  const [search, setSearch] = useState(searchQuery ?? '');
  const [activeCat, setActiveCat] = useState<string | undefined>(initialCategory);
  const [page, setPage] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  // Client-side category + search filtering
  const products = useMemo(() => {
    let list = allProducts;
    if (activeCat) {
      list = list.filter((p) => p.categoryId === activeCat);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return list;
  }, [allProducts, activeCat, search]);

  const heroEnabled = settings?.heroEnabled ?? true;
  const heroTitle = settings?.heroTitle || business.name;
  const heroSubtitle = settings?.heroSubtitle || business.description;
  const heroBadge = settings?.heroBadgeText ?? null;
  const heroStyle = settings?.heroStyle ?? 'centered';
  const heroImage = settings?.heroImageUrl ?? null;
  const ctaPrimary = settings?.heroCtaPrimaryText ?? 'Ver productos';
  const ctaSecondary = settings?.heroCtaSecondaryText ?? null;
  const featuredEnabled = settings?.featuredEnabled ?? true;
  const featuredTitle = settings?.featuredTitle ?? 'Productos destacados';
  const catStyle = settings?.categoriesStyle ?? 'tabs';
  const aboutEnabled = settings?.aboutEnabled ?? false;
  const aboutText = settings?.aboutText;
  const aboutImage = settings?.aboutImageUrl;
  const cardStyle = settings?.cardStyle ?? 'default';
  const layout = settings?.layout ?? 'grid';
  const cols = settings?.gridColumns ?? 4;
  const showPrices = settings?.showPrices ?? true;
  const showStock = settings?.showStock ?? false;

  const featuredProducts = allProducts.filter((p) => p.isFeatured);
  const isFiltering = !!search || !!activeCat;

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(
    () => products.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE),
    [products, page]
  );

  // Sync only category to URL (click-based, no typing). Search is NOT synced to
  // avoid Next.js intercepting replaceState and triggering server re-renders.
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCat) params.set('categoria', activeCat);
    const qs = params.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [activeCat]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleCategoryClick = (categoryId?: string) => {
    setActiveCat(categoryId);
    setPage(1);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    // Products with variants must go through the product detail page
    // to select a specific variant before adding to cart
    if (product.hasVariants) {
      window.location.href = `/${slug}/producto/${product.slug}`;
      return;
    }

    addItem(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        imageUrl: product.images[0]?.url ?? null,
      },
      slug
    );
    toast.success(`${product.name} agregado al carrito`);
  };

  const gridClass =
    layout === 'list'
      ? 'flex flex-col gap-3'
      : layout === 'magazine'
        ? 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5'
        : cols === 3
          ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5'
          : 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5';

  return (
    <div>
      {/* ── Hero Section ── */}
      {heroEnabled && !isFiltering && (
        <HeroSection
          title={heroTitle}
          subtitle={heroSubtitle}
          badge={heroBadge}
          style={heroStyle}
          imageUrl={heroImage}
          ctaPrimaryText={ctaPrimary}
          ctaPrimaryLink={settings?.heroCtaPrimaryLink ?? null}
          ctaPrimaryAction={settings?.heroCtaPrimaryAction ?? 'scroll'}
          ctaSecondaryText={ctaSecondary}
          ctaSecondaryLink={settings?.heroCtaSecondaryLink ?? null}
          ctaSecondaryAction={settings?.heroCtaSecondaryAction ?? 'link'}
          slug={slug}
          whatsappNumber={business.whatsappNumber}
          search={search}
          onSearch={handleSearch}
        />
      )}

      {/* When filtering, show a compact search bar instead of hero */}
      {isFiltering && (
        <div
          className='py-6'
          style={{ backgroundColor: 'var(--sf-surface, #f9fafb)', borderBottom: '1px solid var(--sf-border, #e5e7eb)' }}
        >
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <SearchBar value={search} onChange={handleSearch} autoFocus />
          </div>
        </div>
      )}

      <div id='storefront-content' className='mx-auto max-w-7xl scroll-mt-16 px-4 py-8 sm:px-6 sm:py-12 lg:px-8'>
        {/* ── Catalogs Carousel (always visible, independent of category filter) ── */}
        {catalogSections && catalogSections.length > 1 && <CatalogsCarousel catalogs={catalogSections} slug={slug} />}
        {/* ── Category Navigation ── */}
        {categories.length > 0 && (
          <CategoryNav
            categories={categories}
            activeCategory={activeCat}
            style={catStyle}
            slug={slug}
            onCategoryClick={handleCategoryClick}
          />
        )}

        {/* ── Featured Products ── */}
        {!isFiltering && featuredEnabled && featuredProducts.length > 0 && (
          <section className='mb-12'>
            <SectionHeader title={featuredTitle} count={featuredProducts.length} />
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6'>
              {featuredProducts.slice(0, 6).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  slug={slug}
                  currency={business.currency}
                  onAddToCart={handleAddToCart}
                  cardStyle={cardStyle}
                  layout='grid'
                  showPrices={showPrices}
                  showStock={showStock}
                  featured
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Back to all products (when inside a catalog) ── */}
        {catalogName && (
          <div className='mb-6'>
            <Link
              href={`/${slug}`}
              className='inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70'
              style={{ color: 'var(--sf-primary, #000)' }}
            >
              <ChevronLeft className='size-4' />
              Volver a todos los productos
            </Link>
            <h2 className='mt-2 text-xl font-bold tracking-tight sm:text-2xl'>{catalogName}</h2>
          </div>
        )}

        {/* ── All Products (paginated) ── */}
        <section id='products' className='scroll-mt-6'>
          <SectionHeader title={isFiltering ? 'Resultados' : 'Todos los productos'} count={products.length} />

          {products.length === 0 ? (
            <EmptyState query={searchQuery} onClear={() => handleSearch('')} />
          ) : (
            <>
              <div className={gridClass}>
                {paginatedProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    slug={slug}
                    currency={business.currency}
                    onAddToCart={handleAddToCart}
                    cardStyle={cardStyle}
                    layout={layout}
                    showPrices={showPrices}
                    showStock={showStock}
                    magazineHero={layout === 'magazine' && idx === 0}
                  />
                ))}
              </div>
              {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
            </>
          )}
        </section>

        {/* ── About Section ── */}
        {!isFiltering && aboutEnabled && aboutText && (
          <AboutSection text={aboutText!} imageUrl={aboutImage ?? null} businessName={business.name} />
        )}
      </div>
    </div>
  );
}

/* ─── Hero Section ─── */

function resolveCtaHref(
  action: string | null | undefined,
  link: string | null | undefined,
  slug: string,
  whatsapp?: string | null
): string {
  switch (action) {
    case 'link':
      return link || `/${slug}`;
    case 'whatsapp':
      return whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}` : `/${slug}`;
    case 'catalog':
      return `/${slug}`;
    case 'scroll':
    default:
      return '#storefront-content';
  }
}

interface HeroProps {
  title: string;
  subtitle: string | null;
  badge: string | null;
  style: string;
  imageUrl: string | null;
  ctaPrimaryText: string;
  ctaPrimaryLink: string | null | undefined;
  ctaPrimaryAction: string | null | undefined;
  ctaSecondaryText: string | null;
  ctaSecondaryLink: string | null | undefined;
  ctaSecondaryAction: string | null | undefined;
  slug: string;
  whatsappNumber: string | null | undefined;
  search: string;
  onSearch: (value: string) => void;
}

function HeroSection({
  title,
  subtitle,
  badge,
  style,
  imageUrl,
  ctaPrimaryText,
  ctaPrimaryLink,
  ctaPrimaryAction,
  ctaSecondaryText,
  ctaSecondaryLink,
  ctaSecondaryAction,
  slug,
  whatsappNumber,
  search,
  onSearch,
}: HeroProps) {
  const primaryHref = resolveCtaHref(ctaPrimaryAction, ctaPrimaryLink, slug, whatsappNumber);
  const secondaryHref = resolveCtaHref(ctaSecondaryAction, ctaSecondaryLink, slug, whatsappNumber);
  const isSplit = style === 'split' && imageUrl;
  const isBanner = style === 'banner' && imageUrl;
  const isMinimal = style === 'minimal';

  if (isMinimal) {
    return (
      <section
        className='py-8'
        style={{ backgroundColor: 'var(--sf-surface, #f9fafb)', borderBottom: '1px solid var(--sf-border, #e5e7eb)' }}
      >
        <div className='mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8'>
          <div className='flex-1'>
            <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{title}</h1>
            {subtitle && <p className='mt-2 max-w-xl text-sm opacity-60'>{subtitle}</p>}
            <div className='mt-5 max-w-md'>
              <SearchBar value={search} onChange={onSearch} />
            </div>
          </div>
          {imageUrl && (
            <div
              className='relative hidden size-28 shrink-0 overflow-hidden sm:block sm:size-32 lg:size-40'
              style={{ borderRadius: 'var(--sf-radius-lg, 1rem)' }}
            >
              <Image src={imageUrl} alt={title} fill unoptimized className='object-cover' priority />
            </div>
          )}
        </div>
      </section>
    );
  }

  if (isBanner) {
    return (
      <section className='relative overflow-hidden'>
        <Image src={imageUrl!} alt={title} fill unoptimized className='object-cover' priority />
        <div className='absolute inset-0 bg-black/50' />
        <div className='relative mx-auto max-w-7xl px-4 py-20 text-center text-white sm:px-6 sm:py-28 lg:px-8 lg:py-36'>
          {badge && (
            <div className='mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm'>
              <Sparkles className='size-3.5' />
              {badge}
            </div>
          )}
          <h1 className='text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl'>{title}</h1>
          {subtitle && <p className='mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg'>{subtitle}</p>}
          <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
            <Link
              href={primaryHref}
              className='inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-105'
              style={{ backgroundColor: '#fff', borderRadius: 'var(--sf-radius-full, 9999px)' }}
            >
              {ctaPrimaryText} <ArrowRight className='size-4' />
            </Link>
            {ctaSecondaryText && (
              <Link
                href={secondaryHref}
                className='inline-flex items-center gap-2 border border-white/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10'
                style={{ borderRadius: 'var(--sf-radius-full, 9999px)' }}
              >
                {ctaSecondaryText}
              </Link>
            )}
          </div>
          <div className='mx-auto mt-8 max-w-lg'>
            <SearchBar value={search} onChange={onSearch} dark />
          </div>
        </div>
      </section>
    );
  }

  if (isSplit) {
    return (
      <section
        style={{ backgroundColor: 'var(--sf-surface, #f9fafb)', borderBottom: '1px solid var(--sf-border, #e5e7eb)' }}
      >
        <div className='mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20'>
          <div className='flex flex-col justify-center'>
            {badge && (
              <div
                className='mb-4 inline-flex w-fit items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium'
                style={{
                  backgroundColor: 'var(--sf-primary, #000)',
                  color: 'var(--sf-primary-contrast, #fff)',
                  borderRadius: 'var(--sf-radius-full, 9999px)',
                }}
              >
                <Sparkles className='size-3.5' />
                {badge}
              </div>
            )}
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>{title}</h1>
            {subtitle && <p className='mt-4 max-w-lg text-base leading-relaxed opacity-60 sm:text-lg'>{subtitle}</p>}
            <div className='mt-8 flex flex-wrap gap-3'>
              <Link
                href={primaryHref}
                className='inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-transform hover:scale-105'
                style={{
                  backgroundColor: 'var(--sf-primary, #000)',
                  color: 'var(--sf-primary-contrast, #fff)',
                  borderRadius: 'var(--sf-radius-full, 9999px)',
                }}
              >
                {ctaPrimaryText} <ArrowRight className='size-4' />
              </Link>
              {ctaSecondaryText && (
                <Link
                  href={secondaryHref}
                  className='inline-flex items-center gap-2 border px-6 py-3 text-sm font-semibold opacity-70 transition-colors hover:opacity-100'
                  style={{ borderColor: 'currentColor', borderRadius: 'var(--sf-radius-full, 9999px)' }}
                >
                  {ctaSecondaryText}
                </Link>
              )}
            </div>
            <div className='mt-8 max-w-md'>
              <SearchBar value={search} onChange={onSearch} />
            </div>
          </div>
          <div
            className='relative aspect-4/3 overflow-hidden lg:aspect-auto'
            style={{ borderRadius: 'var(--sf-radius-lg, 1rem)' }}
          >
            <Image src={imageUrl!} alt={title} fill unoptimized className='object-cover' priority />
          </div>
        </div>
      </section>
    );
  }

  // Default: centered
  const hasCenteredImage = !!imageUrl;

  return (
    <section
      className={hasCenteredImage ? 'relative overflow-hidden' : ''}
      style={
        hasCenteredImage
          ? undefined
          : { backgroundColor: 'var(--sf-surface, #f9fafb)', borderBottom: '1px solid var(--sf-border, #e5e7eb)' }
      }
    >
      {hasCenteredImage && (
        <>
          <Image src={imageUrl!} alt={title} fill unoptimized className='object-cover' priority />
          <div className='absolute inset-0 bg-black/50' />
        </>
      )}
      <div
        className={`mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8 ${hasCenteredImage ? 'relative text-white' : ''}`}
      >
        {badge && (
          <div
            className='mb-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium'
            style={
              hasCenteredImage
                ? {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 'var(--sf-radius-full, 9999px)',
                    backdropFilter: 'blur(8px)',
                  }
                : {
                    backgroundColor: 'var(--sf-primary, #000)',
                    color: 'var(--sf-primary-contrast, #fff)',
                    borderRadius: 'var(--sf-radius-full, 9999px)',
                  }
            }
          >
            <Sparkles className='size-3.5' />
            {badge}
          </div>
        )}
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>{title}</h1>
        {subtitle && (
          <p
            className={`mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${hasCenteredImage ? 'text-white/80' : 'opacity-60'}`}
          >
            {subtitle}
          </p>
        )}
        <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
          <Link
            href={primaryHref}
            className='inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-transform hover:scale-105'
            style={
              hasCenteredImage
                ? { backgroundColor: '#fff', color: '#000', borderRadius: 'var(--sf-radius-full, 9999px)' }
                : {
                    backgroundColor: 'var(--sf-primary, #000)',
                    color: 'var(--sf-primary-contrast, #fff)',
                    borderRadius: 'var(--sf-radius-full, 9999px)',
                  }
            }
          >
            {ctaPrimaryText} <ChevronRight className='size-4' />
          </Link>
          {ctaSecondaryText && (
            <Link
              href={secondaryHref}
              className='inline-flex items-center gap-2 border px-6 py-3 text-sm font-semibold transition-colors hover:opacity-100'
              style={
                hasCenteredImage
                  ? {
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: '#fff',
                      borderRadius: 'var(--sf-radius-full, 9999px)',
                    }
                  : { borderColor: 'currentColor', opacity: 0.7, borderRadius: 'var(--sf-radius-full, 9999px)' }
              }
            >
              {ctaSecondaryText}
            </Link>
          )}
        </div>
        <div className='mx-auto mt-8 max-w-lg'>
          <SearchBar value={search} onChange={onSearch} dark={hasCenteredImage} />
        </div>
      </div>
    </section>
  );
}

/* ─── Search Bar ─── */

function SearchBar({
  value,
  onChange,
  dark,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  dark?: boolean;
  autoFocus?: boolean;
}) {
  const modKey = useModifierKey();

  return (
    <div className='relative w-full'>
      <Search className={`absolute top-1/2 left-4 size-4 -translate-y-1/2 ${dark ? 'text-white/50' : 'opacity-40'}`} />
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Buscar productos...'
        autoFocus={autoFocus}
        className={`w-full py-3 pr-12 pl-11 text-sm shadow-sm transition-all outline-none ${
          dark
            ? 'border border-white/20 bg-white/10 text-white placeholder-white/50 backdrop-blur-sm focus:border-white/40'
            : 'shadow-sm focus:shadow-md'
        }`}
        style={{
          borderRadius: 'var(--sf-radius-full, 9999px)',
          backgroundColor: dark ? undefined : 'var(--sf-bg, #fff)',
          border: dark ? undefined : '1px solid var(--sf-border, #e5e7eb)',
        }}
      />
      {value ? (
        <button
          onClick={() => onChange('')}
          className={`absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-0.5 transition-colors ${dark ? 'text-white/50 hover:text-white' : 'opacity-40 hover:opacity-70'}`}
        >
          <X className='size-4' />
        </button>
      ) : (
        <kbd
          className='absolute top-1/2 right-4 -translate-y-1/2 border px-1.5 py-0.5 font-mono text-[10px]'
          style={{
            borderColor: dark ? 'rgba(255,255,255,0.2)' : 'var(--sf-border, #e5e7eb)',
            color: dark ? 'rgba(255,255,255,0.4)' : 'var(--sf-border, #e5e7eb)',
            borderRadius: 'calc(var(--sf-radius, 0.75rem) * 0.5)',
          }}
        >
          {modKey}K
        </kbd>
      )}
    </div>
  );
}

/* ─── Category Nav ─── */

interface CategoryNavProps {
  categories: Category[];
  activeCategory?: string;
  style: string;
  slug: string;
  onCategoryClick: (id?: string) => void;
}

function CategoryNav({ categories, activeCategory, style, onCategoryClick }: CategoryNavProps) {
  if (style === 'cards') {
    return (
      <div className='mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4'>
        <button
          onClick={() => onCategoryClick()}
          className='group relative overflow-hidden p-4 text-left transition-all hover:shadow-md'
          style={{
            borderRadius: 'var(--sf-radius-lg, 1rem)',
            backgroundColor: !activeCategory ? 'var(--sf-primary, #000)' : 'var(--sf-surface, #f9fafb)',
            color: !activeCategory ? 'var(--sf-primary-contrast, #fff)' : 'inherit',
          }}
        >
          <span className='text-sm font-semibold'>Todos</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryClick(cat.id)}
            className='group relative overflow-hidden text-left transition-all hover:shadow-md'
            style={{
              borderRadius: 'var(--sf-radius-lg, 1rem)',
              backgroundColor: activeCategory === cat.id ? 'var(--sf-primary, #000)' : 'var(--sf-surface, #f9fafb)',
              color: activeCategory === cat.id ? 'var(--sf-primary-contrast, #fff)' : 'inherit',
            }}
          >
            {cat.imageUrl && (
              <div className='relative aspect-video overflow-hidden'>
                <Image src={cat.imageUrl} alt={cat.name} fill unoptimized className='object-cover' sizes='25vw' />
              </div>
            )}
            <div className='p-3'>
              <span className='text-sm font-semibold'>{cat.name}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (style === 'pills') {
    return (
      <div className='mb-8 flex flex-wrap items-center gap-2'>
        <button
          onClick={() => onCategoryClick()}
          className='border px-4 py-2 text-sm font-medium transition-all'
          style={{
            borderRadius: 'var(--sf-radius-full, 9999px)',
            backgroundColor: !activeCategory ? 'var(--sf-primary, #000)' : 'transparent',
            color: !activeCategory ? 'var(--sf-primary-contrast, #fff)' : 'inherit',
            borderColor: !activeCategory ? 'var(--sf-primary, #000)' : 'var(--sf-border, #e5e7eb)',
          }}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryClick(cat.id)}
            className='border px-4 py-2 text-sm font-medium transition-all'
            style={{
              borderRadius: 'var(--sf-radius-full, 9999px)',
              backgroundColor: activeCategory === cat.id ? 'var(--sf-primary, #000)' : 'transparent',
              color: activeCategory === cat.id ? 'var(--sf-primary-contrast, #fff)' : 'inherit',
              borderColor: activeCategory === cat.id ? 'var(--sf-primary, #000)' : 'var(--sf-border, #e5e7eb)',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>
    );
  }

  // Default: tabs
  return (
    <div
      className='mb-8 flex items-center gap-1 overflow-x-auto'
      style={{ borderBottom: '1px solid var(--sf-border, #e5e7eb)' }}
    >
      <button
        onClick={() => onCategoryClick()}
        className='relative shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors'
        style={{
          color: !activeCategory ? 'var(--sf-primary, #000)' : undefined,
          opacity: !activeCategory ? 1 : 0.5,
        }}
      >
        Todos
        {!activeCategory && (
          <span className='absolute inset-x-0 bottom-0 h-0.5' style={{ backgroundColor: 'var(--sf-primary, #000)' }} />
        )}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryClick(cat.id)}
          className='relative shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors'
          style={{
            color: activeCategory === cat.id ? 'var(--sf-primary, #000)' : undefined,
            opacity: activeCategory === cat.id ? 1 : 0.5,
          }}
        >
          {cat.name}
          {activeCategory === cat.id && (
            <span
              className='absolute inset-x-0 bottom-0 h-0.5'
              style={{ backgroundColor: 'var(--sf-primary, #000)' }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Section Header ─── */

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className='mb-6 flex items-center justify-between'>
      <h2 className='text-xl font-bold tracking-tight'>{title}</h2>
      <span className='text-sm opacity-40'>
        {count} producto{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

/* ─── Empty State ─── */

function EmptyState({ query, onClear }: { query?: string; onClear: () => void }) {
  return (
    <div
      className='flex flex-col items-center py-20'
      style={{ borderRadius: 'var(--sf-radius-lg, 1rem)', border: '1px dashed var(--sf-border, #e5e7eb)' }}
    >
      <div
        className='flex size-16 items-center justify-center'
        style={{ borderRadius: 'var(--sf-radius-full, 9999px)', backgroundColor: 'var(--sf-surface, #f9fafb)' }}
      >
        <ShoppingBag className='size-7 opacity-30' />
      </div>
      <p className='mt-4 font-medium'>{query ? 'Sin resultados' : 'No hay productos disponibles'}</p>
      <p className='mt-1 text-sm opacity-50'>
        {query ? 'Intenta con otra búsqueda.' : 'Pronto agregaremos productos.'}
      </p>
      {query && (
        <button
          onClick={onClear}
          className='mt-4 text-sm font-medium underline underline-offset-4 opacity-70 hover:opacity-100'
        >
          Limpiar búsqueda
        </button>
      )}
    </div>
  );
}

/* ─── Catalogs Carousel ─── */

function CatalogsCarousel({ catalogs, slug }: { catalogs: CatalogPreview[]; slug: string }) {
  return (
    <div className='mb-10'>
      <h2 className='mb-4 text-lg font-bold tracking-tight'>Colecciones</h2>
      <div className='flex gap-4 overflow-x-auto pb-2'>
        {catalogs.map((cat) => (
          <Link
            key={cat.id}
            href={`/${slug}/${cat.slug ?? cat.id}`}
            className='group flex w-52 shrink-0 flex-col overflow-hidden border transition-shadow hover:shadow-lg sm:w-60'
            style={{
              borderRadius: 'var(--sf-radius-lg, 1rem)',
              borderColor: 'var(--sf-border, #e5e7eb)',
              backgroundColor: 'var(--sf-bg, #fff)',
            }}
          >
            <div
              className='relative aspect-3/2 overflow-hidden'
              style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
            >
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  unoptimized
                  sizes='15rem'
                  className='object-cover transition-transform duration-500 group-hover:scale-105'
                />
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
              <div className='flex shrink-0 items-center gap-1 pl-2'>
                <span className='text-xs opacity-40'>{cat.totalProducts}</span>
                <ChevronRight className='size-3.5 opacity-40 transition-transform group-hover:translate-x-0.5' />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Pagination ─── */

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible =
    totalPages <= 7
      ? pages
      : page <= 4
        ? [...pages.slice(0, 5), -1, totalPages]
        : page >= totalPages - 3
          ? [1, -1, ...pages.slice(totalPages - 5)]
          : [1, -1, page - 1, page, page + 1, -2, totalPages];

  return (
    <div className='mt-8 flex items-center justify-center gap-1.5'>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className='flex size-9 items-center justify-center border transition-colors disabled:opacity-30'
        style={{ borderRadius: 'var(--sf-radius, 0.75rem)', borderColor: 'var(--sf-border, #e5e7eb)' }}
      >
        <ChevronLeft className='size-4' />
      </button>
      {visible.map((p, i) =>
        p < 0 ? (
          <span key={`ellipsis-${i}`} className='px-1 text-sm opacity-40'>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className='flex size-9 items-center justify-center text-sm font-medium transition-colors'
            style={{
              borderRadius: 'var(--sf-radius, 0.75rem)',
              backgroundColor: p === page ? 'var(--sf-primary, #000)' : 'transparent',
              color: p === page ? 'var(--sf-primary-contrast, #fff)' : 'inherit',
              border: p === page ? 'none' : '1px solid var(--sf-border, #e5e7eb)',
            }}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className='flex size-9 items-center justify-center border transition-colors disabled:opacity-30'
        style={{ borderRadius: 'var(--sf-radius, 0.75rem)', borderColor: 'var(--sf-border, #e5e7eb)' }}
      >
        <ChevronRight className='size-4' />
      </button>
    </div>
  );
}

/* ─── Product Card ─── */

interface ProductCardProps {
  product: Product;
  slug: string;
  currency: string;
  featured?: boolean;
  cardStyle: string;
  layout?: string;
  showPrices?: boolean;
  showStock?: boolean;
  magazineHero?: boolean;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
}

function ProductCard({
  product,
  slug,
  currency,
  featured,
  cardStyle,
  layout = 'grid',
  showPrices = true,
  showStock = false,
  magazineHero = false,
  onAddToCart,
}: ProductCardProps) {
  const isBordered = cardStyle === 'bordered';
  const isMinimal = cardStyle === 'minimal';
  const isShadow = cardStyle === 'shadow';
  const isList = layout === 'list';

  const borderStyle = isMinimal
    ? 'none'
    : isBordered
      ? '2px solid var(--sf-border, #e5e7eb)'
      : '1px solid var(--sf-border, #e5e7eb)';

  const cardClasses = `group overflow-hidden transition-all ${isList ? 'flex flex-row' : 'flex flex-col'} ${
    isMinimal
      ? 'bg-transparent'
      : isBordered
        ? 'hover:shadow-sm'
        : isShadow
          ? 'shadow-sm hover:shadow-xl'
          : 'hover:shadow-lg'
  } ${magazineHero ? 'col-span-2 row-span-2' : ''}`;

  const stockLabel =
    showStock && product.trackInventory ? ((product.stock ?? 0) > 0 ? `${product.stock} en stock` : 'Agotado') : null;

  return (
    <Link
      href={`/${slug}/producto/${product.slug}`}
      className={cardClasses}
      style={{
        borderRadius: isMinimal ? '0' : 'var(--sf-radius-lg, 1rem)',
        backgroundColor: isMinimal ? 'transparent' : 'var(--sf-bg, #fff)',
        border: borderStyle,
      }}
    >
      {/* Image */}
      <div
        className={`relative overflow-hidden ${
          isList ? 'aspect-square w-28 shrink-0 sm:w-36' : featured || magazineHero ? 'aspect-4/3' : 'aspect-square'
        }`}
        style={{
          borderRadius: isMinimal ? 'var(--sf-radius-lg, 1rem)' : '0',
          backgroundColor: 'var(--sf-surface, #f9fafb)',
        }}
      >
        {product.images[0] ? (
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            fill
            unoptimized
            sizes={
              isList
                ? '144px'
                : magazineHero
                  ? '(max-width: 640px) 100vw, 66vw'
                  : featured
                    ? '(max-width: 640px) 100vw, 33vw'
                    : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
            }
            className='object-cover transition-transform duration-500 group-hover:scale-105'
          />
        ) : (
          <div className='flex size-full items-center justify-center'>
            <ImageOff className='size-8 opacity-20' />
          </div>
        )}

        {/* Badges */}
        <div className='absolute top-2.5 left-2.5 flex flex-col items-start gap-1'>
          {product.isFeatured && (
            <span
              className='px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase'
              style={{
                backgroundColor: 'var(--sf-primary, #000)',
                color: 'var(--sf-primary-contrast, #fff)',
                borderRadius: 'max(var(--sf-radius, 0.75rem), 0.375rem)',
              }}
            >
              Destacado
            </span>
          )}
          {hasDiscount(product) && (
            <span
              className='px-2.5 py-1 text-[11px] font-bold tracking-wide text-white'
              style={{ backgroundColor: '#ef4444', borderRadius: 'max(var(--sf-radius, 0.75rem), 0.375rem)' }}
            >
              -{discountPercent(product)}%
            </span>
          )}
        </div>

        {/* Quick add */}
        {!isList && (
          <button
            onClick={(e) => onAddToCart(e, product)}
            className='absolute right-2.5 bottom-2.5 flex size-9 items-center justify-center opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:scale-110'
            style={{
              backgroundColor: 'var(--sf-primary, #000)',
              color: 'var(--sf-primary-contrast, #fff)',
              borderRadius: 'var(--sf-radius-full, 9999px)',
            }}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <Plus className='size-4' />
          </button>
        )}
      </div>

      {/* Info */}
      <div className={`flex flex-1 flex-col ${isMinimal ? 'pt-3' : 'p-3.5 sm:p-4'}`}>
        {product.brandName && (
          <span
            className='mb-0.5 text-[11px] font-semibold tracking-wide uppercase'
            style={{ color: 'var(--sf-primary, #000)', opacity: 0.6 }}
          >
            {product.brandName}
          </span>
        )}
        <h3 className={`leading-snug font-medium ${isList || magazineHero ? 'text-base' : 'line-clamp-2 text-sm'}`}>
          {product.name}
        </h3>
        {(featured || isList || magazineHero) && product.description && (
          <p className='mt-1 line-clamp-2 text-xs leading-relaxed opacity-50'>{product.description}</p>
        )}
        <div className='mt-auto flex flex-wrap items-center gap-2 pt-2'>
          {showPrices && (
            <div className='flex items-baseline gap-2'>
              <span className='text-base font-bold'>{formatPrice(product.price, currency)}</span>
              {hasDiscount(product) && (
                <span className='text-xs line-through opacity-40'>
                  {formatPrice(product.compareAtPrice!, currency)}
                </span>
              )}
            </div>
          )}
          {stockLabel && (
            <span
              className='text-[11px] font-medium'
              style={{ color: (product.stock ?? 0) > 0 ? 'var(--sf-primary, #000)' : '#ef4444', opacity: 0.7 }}
            >
              · {stockLabel}
            </span>
          )}
        </div>
        {(product.reviewCount ?? 0) > 0 && (
          <div className='mt-1 flex items-center gap-1'>
            <div className='flex items-center gap-0.5'>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`size-3 ${s <= Math.round(product.avgRating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className='text-[10px] opacity-40'>({product.reviewCount})</span>
          </div>
        )}
        {isList && (
          <button
            onClick={(e) => onAddToCart(e, product)}
            className='mt-2 self-start px-4 py-1.5 text-xs font-semibold transition-colors hover:opacity-90'
            style={{
              backgroundColor: 'var(--sf-primary, #000)',
              color: 'var(--sf-primary-contrast, #fff)',
              borderRadius: 'var(--sf-radius, 0.75rem)',
            }}
          >
            Agregar
          </button>
        )}
      </div>
    </Link>
  );
}

/* ─── About Section ─── */

function AboutSection({
  text,
  imageUrl,
  businessName,
}: {
  text: string;
  imageUrl: string | null;
  businessName: string;
}) {
  return (
    <section className='mt-16 pt-16' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
      <div className={imageUrl ? 'grid gap-8 lg:grid-cols-2 lg:gap-12' : 'mx-auto max-w-3xl text-center'}>
        {imageUrl && (
          <div className='relative aspect-4/3 overflow-hidden' style={{ borderRadius: 'var(--sf-radius-lg, 1rem)' }}>
            <Image src={imageUrl} alt={businessName} fill unoptimized className='object-cover' />
          </div>
        )}
        <div className={imageUrl ? 'flex flex-col justify-center' : ''}>
          <h2 className='text-2xl font-bold tracking-tight'>Sobre {businessName}</h2>
          <p className='mt-4 leading-relaxed opacity-60'>{text}</p>
        </div>
      </div>
    </section>
  );
}
