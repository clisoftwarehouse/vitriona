'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Star,
  List,
  Search,
  ImageOff,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  ChevronLeft,
  ChevronDown,
  ShoppingBag,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react';

import { formatPrice } from '@/lib/format';
import { useModifierKey } from '@/hooks/use-os';
import { WatermarkOverlay } from './watermark-overlay';
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
  type: string;
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
  plan: 'free' | 'pro' | 'business';
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
  viewMode: string | null;
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

function hasDiscount(p: Product) {
  return p.compareAtPrice ? parseFloat(p.compareAtPrice) > parseFloat(p.price) : false;
}

function discountPercent(p: Product) {
  return p.compareAtPrice ? Math.round((1 - parseFloat(p.price) / parseFloat(p.compareAtPrice)) * 100) : 0;
}

const PRODUCTS_PER_PAGE = 12;

type SortOption = 'default' | 'az' | 'za' | 'price_asc' | 'price_desc' | 'newest';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Orden predeterminado' },
  { value: 'az', label: 'Nombre: A → Z' },
  { value: 'za', label: 'Nombre: Z → A' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'newest', label: 'Más recientes' },
];

function sortProducts(list: Product[], sort: SortOption): Product[] {
  if (sort === 'default') return list;
  const sorted = [...list];
  switch (sort) {
    case 'az':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'za':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'price_asc':
      return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    case 'price_desc':
      return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    case 'newest':
      return sorted.reverse();
    default:
      return sorted;
  }
}

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
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [userViewMode, setUserViewMode] = useState<'grid' | 'list' | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  // Close sort dropdown on click outside
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortOpen]);

  // Client-side category + search filtering + sorting
  const products = useMemo(() => {
    let list = allProducts;
    if (activeCat) {
      list = list.filter((p) => p.categoryId === activeCat);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return sortProducts(list, sortBy);
  }, [allProducts, activeCat, search, sortBy]);

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
  const viewMode = settings?.viewMode ?? 'default';

  const featuredProducts = allProducts.filter((p) => p.isFeatured);
  const isSearching = !!search;
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
    window.history.replaceState(window.history.state, '', newUrl);
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

    if (product.trackInventory && (product.stock ?? 0) <= 0) {
      toast.error(`${product.name} no está disponible en este momento`);
      return;
    }

    // Products with variants must go through the product detail page
    // to select a specific variant before adding to cart
    if (product.hasVariants) {
      window.location.href = `/${slug}/producto/${product.slug}?id=${product.id}`;
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

  // User can toggle between grid/list; fallback to admin-configured layout
  const effectiveLayout = userViewMode ?? layout;

  const gridClass =
    effectiveLayout === 'list'
      ? 'flex flex-col gap-3'
      : effectiveLayout === 'magazine'
        ? 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5'
        : effectiveLayout === 'restaurant'
          ? 'flex flex-col'
          : cols === 3
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5'
            : 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5';

  return (
    <div>
      {/* ── Hero Section ── */}
      {heroEnabled && !isSearching && (
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
      {isSearching && (
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
        {!isSearching && featuredEnabled && featuredProducts.length > 0 && (
          <section className='mb-12'>
            <SectionHeader title={featuredTitle} count={featuredProducts.length} />
            {viewMode === 'experiences' ? (
              <ExperiencesGrid
                products={featuredProducts.slice(0, 6)}
                slug={slug}
                currency={business.currency}
                showPrices={showPrices}
                showWatermark={business.plan === 'free'}
                onAddToCart={handleAddToCart}
              />
            ) : (
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
                    showWatermark={business.plan === 'free'}
                    showAddButton={viewMode === 'products'}
                    featured
                  />
                ))}
              </div>
            )}
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
          {/* Toolbar: title + sort + view toggle */}
          <div className='relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <h2 className='text-xl font-bold tracking-tight'>
                {isSearching
                  ? 'Resultados'
                  : viewMode === 'restaurant'
                    ? 'Menú'
                    : viewMode === 'services'
                      ? 'Nuestros servicios'
                      : viewMode === 'products'
                        ? 'Tienda'
                        : viewMode === 'experiences'
                          ? 'Experiencias'
                          : 'Todos los productos'}
              </h2>
              <span className='text-sm opacity-60'>
                {products.length} producto{products.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className='flex items-center gap-2'>
              {/* Sort dropdown */}
              <div className='relative' ref={sortRef}>
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className='inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-medium transition-colors hover:opacity-70'
                  style={{
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    borderColor: 'var(--sf-border, #e5e7eb)',
                    backgroundColor: 'var(--sf-bg, #fff)',
                  }}
                >
                  <ArrowUpDown className='size-3.5 opacity-60' />
                  <span className='hidden sm:inline'>
                    {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Ordenar'}
                  </span>
                  <ChevronDown className='size-3 opacity-40' />
                </button>
                {sortOpen && (
                  <div
                    className='absolute left-0 z-20 mt-1 min-w-[200px] overflow-hidden border py-1 shadow-lg sm:right-0 sm:left-auto'
                    style={{
                      borderRadius: 'var(--sf-radius, 0.75rem)',
                      borderColor: 'var(--sf-border, #e5e7eb)',
                      backgroundColor: 'var(--sf-bg, #fff)',
                    }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setPage(1);
                          setSortOpen(false);
                        }}
                        className='flex w-full items-center px-3 py-2 text-left text-xs transition-colors hover:opacity-70'
                        style={{
                          backgroundColor: sortBy === option.value ? 'var(--sf-surface, #f9fafb)' : 'transparent',
                          fontWeight: sortBy === option.value ? 600 : 400,
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View toggle (grid / list) — only in default/products mode */}
              {(viewMode === 'default' || viewMode === 'products') && (
                <div
                  className='inline-flex overflow-hidden border'
                  style={{
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    borderColor: 'var(--sf-border, #e5e7eb)',
                  }}
                >
                  <button
                    onClick={() => setUserViewMode('grid')}
                    className='flex items-center justify-center p-2 transition-colors'
                    style={{
                      backgroundColor: effectiveLayout !== 'list' ? 'var(--sf-primary, #000)' : 'var(--sf-bg, #fff)',
                      color: effectiveLayout !== 'list' ? 'var(--sf-primary-contrast, #fff)' : 'inherit',
                    }}
                    aria-label='Vista de cuadrícula'
                  >
                    <LayoutGrid className='size-3.5' />
                  </button>
                  <button
                    onClick={() => setUserViewMode('list')}
                    className='flex items-center justify-center p-2 transition-colors'
                    style={{
                      backgroundColor: effectiveLayout === 'list' ? 'var(--sf-primary, #000)' : 'var(--sf-bg, #fff)',
                      color: effectiveLayout === 'list' ? 'var(--sf-primary-contrast, #fff)' : 'inherit',
                    }}
                    aria-label='Vista de lista'
                  >
                    <List className='size-3.5' />
                  </button>
                </div>
              )}
            </div>
          </div>

          {products.length === 0 ? (
            <EmptyState query={searchQuery} onClear={() => handleSearch('')} />
          ) : (
            <>
              {viewMode === 'restaurant' && userViewMode === null ? (
                <RestaurantMenu
                  products={paginatedProducts}
                  categories={categories}
                  slug={slug}
                  currency={business.currency}
                  showPrices={showPrices}
                  showWatermark={business.plan === 'free'}
                  onAddToCart={handleAddToCart}
                />
              ) : viewMode === 'services' && userViewMode === null ? (
                <ServicesList
                  products={paginatedProducts}
                  categories={categories}
                  slug={slug}
                  currency={business.currency}
                  showPrices={showPrices}
                  showWatermark={business.plan === 'free'}
                  onAddToCart={handleAddToCart}
                />
              ) : viewMode === 'experiences' && userViewMode === null ? (
                <ExperiencesGrid
                  products={paginatedProducts}
                  slug={slug}
                  currency={business.currency}
                  showPrices={showPrices}
                  showWatermark={business.plan === 'free'}
                  onAddToCart={handleAddToCart}
                />
              ) : (
                <div className={gridClass}>
                  {paginatedProducts.map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      slug={slug}
                      currency={business.currency}
                      onAddToCart={handleAddToCart}
                      cardStyle={cardStyle}
                      layout={effectiveLayout}
                      showPrices={showPrices}
                      showStock={showStock}
                      showWatermark={business.plan === 'free'}
                      magazineHero={effectiveLayout === 'magazine' && idx === 0}
                      showAddButton={viewMode === 'products'}
                    />
                  ))}
                </div>
              )}
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
  const titlePlain = title.replace(/<[^>]*>/g, '');

  if (isMinimal) {
    return (
      <section
        className='py-8'
        style={{ backgroundColor: 'var(--sf-surface, #f9fafb)', borderBottom: '1px solid var(--sf-border, #e5e7eb)' }}
      >
        <div className='mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8'>
          <div className='flex-1'>
            <h1 className='text-2xl font-bold tracking-tight sm:text-3xl' dangerouslySetInnerHTML={{ __html: title }} />
            {subtitle && (
              <div className='mt-2 max-w-xl text-sm opacity-60' dangerouslySetInnerHTML={{ __html: subtitle }} />
            )}
            <div className='mt-5 max-w-md'>
              <SearchBar value={search} onChange={onSearch} />
            </div>
          </div>
          {imageUrl && (
            <div
              className='relative hidden size-28 shrink-0 overflow-hidden sm:block sm:size-32 lg:size-40'
              style={{ borderRadius: 'var(--sf-radius-lg, 1rem)' }}
            >
              <Image
                src={imageUrl}
                alt={titlePlain}
                fill
                sizes='(max-width: 640px) 0px, (max-width: 1024px) 128px, 160px'
                className='object-cover'
                priority
              />
            </div>
          )}
        </div>
      </section>
    );
  }

  if (isBanner) {
    return (
      <section className='relative overflow-hidden'>
        <Image src={imageUrl!} alt={titlePlain} fill sizes='100vw' quality={90} className='object-cover' priority />
        <div className='absolute inset-0 bg-black/50' />
        <div className='relative mx-auto max-w-7xl px-4 py-20 text-center text-white sm:px-6 sm:py-28 lg:px-8 lg:py-36'>
          {badge && (
            <div className='mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm'>
              <Sparkles className='size-3.5' />
              {badge}
            </div>
          )}
          <h1
            className='text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl'
            dangerouslySetInnerHTML={{ __html: title }}
          />
          {subtitle && (
            <div
              className='mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg'
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          )}
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
            <h1
              className='text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'
              dangerouslySetInnerHTML={{ __html: title }}
            />
            {subtitle && (
              <div
                className='mt-4 max-w-lg text-base leading-relaxed opacity-60 sm:text-lg'
                dangerouslySetInnerHTML={{ __html: subtitle }}
              />
            )}
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
            <Image
              src={imageUrl!}
              alt={titlePlain}
              fill
              sizes='(max-width: 1024px) 100vw, 50vw'
              quality={90}
              className='object-cover'
              priority
            />
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
          <Image src={imageUrl!} alt={titlePlain} fill sizes='100vw' quality={90} className='object-cover' priority />
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
        <h1
          className='text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {subtitle && (
          <div
            className={`mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${hasCenteredImage ? 'text-white/80' : 'opacity-60'}`}
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
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
      <Search className={`absolute top-1/2 left-4 size-4 -translate-y-1/2 ${dark ? 'text-white/70' : 'opacity-60'}`} />
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
          aria-label='Limpiar búsqueda'
          className={`absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-0.5 transition-colors ${dark ? 'text-white/70 hover:text-white' : 'opacity-60 hover:opacity-90'}`}
        >
          <X className='size-4' />
        </button>
      ) : (
        <kbd
          className='absolute top-1/2 right-4 -translate-y-1/2 border px-1.5 py-0.5 font-mono text-[10px]'
          style={{
            borderColor: dark ? 'rgba(255,255,255,0.3)' : 'var(--sf-border, #e5e7eb)',
            color: dark ? 'rgba(255,255,255,0.7)' : 'var(--sf-muted-foreground, #6b7280)',
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
                <Image src={cat.imageUrl} alt={cat.name} fill className='object-cover' sizes='25vw' />
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
      <span className='text-sm opacity-60'>
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
                  sizes='240px'
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
                {cat.description && <p className='mt-0.5 truncate text-xs opacity-70'>{cat.description}</p>}
              </div>
              <div className='flex shrink-0 items-center gap-1 pl-2'>
                <span className='text-xs opacity-60'>{cat.totalProducts}</span>
                <ChevronRight className='size-3.5 opacity-60 transition-transform group-hover:translate-x-0.5' />
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

/* ─── Restaurant Menu Layout ─── */

function RestaurantMenu({
  products,
  categories,
  slug,
  currency,
  showPrices,
  showWatermark = false,
  onAddToCart,
}: {
  products: Product[];
  categories: Category[];
  slug: string;
  currency: string;
  showPrices: boolean;
  showWatermark?: boolean;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
}) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const grouped = new Map<string, Product[]>();

  for (const p of products) {
    const key = p.categoryId ?? '__uncategorized';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  const sections = Array.from(grouped.entries()).map(([key, items]) => ({
    name: key === '__uncategorized' ? 'Otros' : (catMap.get(key) ?? 'Otros'),
    items,
  }));

  const fmt = (price: string) => formatPrice(price, currency);

  return (
    <div className='space-y-10'>
      {sections.map((section) => (
        <div key={section.name}>
          <div className='mb-5 border-b-2 pb-2' style={{ borderColor: 'var(--sf-primary, #000)' }}>
            <h2 className='text-lg font-bold tracking-tight sm:text-xl' style={{ color: 'var(--sf-primary, #000)' }}>
              {section.name}
            </h2>
          </div>
          <div className='space-y-5'>
            {section.items.map((p) => {
              const disc = hasDiscount(p);
              return (
                <Link key={p.id} href={`/${slug}/producto/${p.slug}?id=${p.id}`} className='group flex gap-4'>
                  <div
                    className='relative shrink-0 overflow-hidden'
                    style={{
                      width: 96,
                      height: 96,
                      minWidth: 96,
                      borderRadius: 'var(--sf-radius, 0.75rem)',
                      backgroundColor: 'var(--sf-surface, #f9fafb)',
                    }}
                  >
                    {p.images[0]?.url ? (
                      <Image src={p.images[0].url} alt={p.name} fill sizes='96px' className='object-cover' />
                    ) : (
                      <div className='flex size-full items-center justify-center'>
                        <ImageOff className='size-5 opacity-20' />
                      </div>
                    )}
                    {showWatermark && p.images[0]?.url && <WatermarkOverlay />}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-baseline gap-3'>
                      <span className='text-sm font-semibold transition-colors group-hover:opacity-70 sm:text-base'>
                        {p.name}
                      </span>
                      <span
                        className='min-w-0 flex-1 border-b border-dotted'
                        style={{ borderColor: 'color-mix(in srgb, var(--sf-text, #111) 20%, transparent)' }}
                      />
                      {showPrices && (
                        <div className='flex shrink-0 items-baseline gap-2'>
                          {disc && <span className='text-xs line-through opacity-40'>{fmt(p.compareAtPrice!)}</span>}
                          <span className='text-sm font-bold sm:text-base' style={{ color: 'var(--sf-primary, #000)' }}>
                            {fmt(p.price)}
                          </span>
                        </div>
                      )}
                    </div>
                    {p.description && (
                      <p className='mt-1 line-clamp-2 text-xs leading-relaxed opacity-50 sm:text-sm'>{p.description}</p>
                    )}
                    <div className='mt-2 flex flex-wrap items-center gap-2'>
                      {p.isFeatured && (
                        <span
                          className='px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase'
                          style={{
                            backgroundColor: 'var(--sf-primary, #000)',
                            borderRadius: 'var(--sf-radius, 0.75rem)',
                          }}
                        >
                          Destacado
                        </span>
                      )}
                      {disc && (
                        <span
                          className='px-2 py-0.5 text-[10px] font-bold tracking-wide text-white'
                          style={{ backgroundColor: '#ef4444', borderRadius: 'var(--sf-radius, 0.75rem)' }}
                        >
                          -{discountPercent(p)}%
                        </span>
                      )}
                      {!p.hasVariants && (
                        <button
                          onClick={(e) => onAddToCart(e, p)}
                          className='ml-auto flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80'
                          style={{
                            backgroundColor: 'var(--sf-primary, #000)',
                            borderRadius: 'var(--sf-radius, 0.75rem)',
                          }}
                        >
                          <Plus className='size-3' />
                          Agregar
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Services List Layout ─── */

function ServicesList({
  products,
  categories,
  slug,
  currency,
  showPrices,
  showWatermark = false,
  onAddToCart,
}: {
  products: Product[];
  categories: Category[];
  slug: string;
  currency: string;
  showPrices: boolean;
  showWatermark?: boolean;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
}) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const grouped = new Map<string, Product[]>();

  for (const p of products) {
    const key = p.categoryId ?? '__uncategorized';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  const sections = Array.from(grouped.entries()).map(([key, items]) => ({
    name: key === '__uncategorized' ? 'Otros' : (catMap.get(key) ?? 'Otros'),
    items,
  }));

  const fmt = (price: string) => formatPrice(price, currency);

  return (
    <div className='space-y-10'>
      {sections.map((section) => (
        <div key={section.name}>
          <h2 className='mb-4 text-lg font-bold tracking-tight sm:text-xl' style={{ color: 'var(--sf-primary, #000)' }}>
            {section.name}
          </h2>
          <div className='grid gap-4'>
            {section.items.map((p) => (
              <Link
                key={p.id}
                href={`/${slug}/producto/${p.slug}?id=${p.id}`}
                className='group flex gap-4 overflow-hidden transition-shadow hover:shadow-md'
                style={{
                  borderRadius: 'var(--sf-radius-lg, 1rem)',
                  border: '1px solid var(--sf-border, #e5e7eb)',
                }}
              >
                <div
                  className='relative aspect-square w-32 shrink-0 overflow-hidden sm:w-40'
                  style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
                >
                  {p.images[0]?.url ? (
                    <Image
                      src={p.images[0].url}
                      alt={p.images[0].alt || p.name}
                      fill
                      sizes='(max-width: 640px) 128px, 160px'
                      className='object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                  ) : (
                    <div className='flex size-full items-center justify-center'>
                      <ImageOff className='size-6 opacity-20' />
                    </div>
                  )}
                  {showWatermark && p.images[0]?.url && <WatermarkOverlay />}
                </div>
                <div className='flex flex-1 flex-col justify-center py-3 pr-4'>
                  <h3 className='text-sm font-semibold sm:text-base'>{p.name}</h3>
                  {p.description && (
                    <p className='mt-1 line-clamp-2 text-xs leading-relaxed opacity-50 sm:text-sm'>{p.description}</p>
                  )}
                  <div className='mt-2 flex flex-wrap items-center gap-3'>
                    {showPrices && (
                      <span className='text-sm font-bold' style={{ color: 'var(--sf-primary, #000)' }}>
                        {fmt(p.price)}
                      </span>
                    )}
                    {!p.hasVariants && (
                      <button
                        onClick={(e) => onAddToCart(e, p)}
                        className='flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80'
                        style={{
                          backgroundColor: 'var(--sf-primary, #000)',
                          borderRadius: 'var(--sf-radius, 0.75rem)',
                        }}
                      >
                        <Plus className='size-3' />
                        Reservar
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Experiences Grid Layout ─── */

function ExperiencesGrid({
  products,
  slug,
  currency,
  showPrices,
  showWatermark = false,
  onAddToCart,
}: {
  products: Product[];
  slug: string;
  currency: string;
  showPrices: boolean;
  showWatermark?: boolean;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
}) {
  const fmt = (price: string) => formatPrice(price, currency);

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/${slug}/producto/${p.slug}?id=${p.id}`}
          className='group relative overflow-hidden transition-shadow hover:shadow-lg'
          style={{ borderRadius: 'var(--sf-radius-lg, 1rem)', border: '1px solid var(--sf-border, #e5e7eb)' }}
        >
          <div
            className='relative aspect-video overflow-hidden'
            style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
          >
            {p.images[0]?.url ? (
              <Image
                src={p.images[0].url}
                alt={p.images[0].alt || p.name}
                fill
                sizes='(max-width: 640px) 100vw, 50vw'
                quality={90}
                className='object-cover transition-transform duration-500 group-hover:scale-105'
              />
            ) : (
              <div className='flex size-full items-center justify-center'>
                <ImageOff className='size-10 opacity-20' />
              </div>
            )}
            {showWatermark && p.images[0]?.url && <WatermarkOverlay />}
            {/* Gradient overlay */}
            <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
            {/* Text overlay */}
            <div className='absolute inset-x-0 bottom-0 p-4 text-white'>
              <h3 className='text-base font-bold sm:text-lg'>{p.name}</h3>
              {p.description && <p className='mt-1 line-clamp-2 text-xs text-white/80 sm:text-sm'>{p.description}</p>}
              <div className='mt-2 flex items-center gap-3'>
                {showPrices && <span className='text-sm font-bold'>{fmt(p.price)}</span>}
                {!p.hasVariants && (
                  <button
                    onClick={(e) => onAddToCart(e, p)}
                    className='flex items-center gap-1 px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80'
                    style={{
                      backgroundColor: 'var(--sf-primary, #000)',
                      color: 'var(--sf-primary-contrast, #fff)',
                      borderRadius: 'var(--sf-radius, 0.75rem)',
                    }}
                  >
                    Descubrir
                  </button>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
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
  showWatermark?: boolean;
  magazineHero?: boolean;
  showAddButton?: boolean;
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
  showWatermark = false,
  magazineHero = false,
  showAddButton = false,
  onAddToCart,
}: ProductCardProps) {
  const isBordered = cardStyle === 'bordered';
  const isMinimal = cardStyle === 'minimal';
  const isShadow = cardStyle === 'shadow';
  const isList = layout === 'list';
  const typeLabel = product.type === 'bundle' ? 'Paquete' : product.type === 'service' ? 'Servicio' : null;

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
      href={`/${slug}/producto/${product.slug}?id=${product.id}`}
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
            quality={90}
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
        {showWatermark && product.images[0] && <WatermarkOverlay />}

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
        {!isList && !showAddButton && (
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
        {typeLabel && (
          <span className='mb-1 inline-flex w-fit rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase opacity-70'>
            {typeLabel}
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
        {(isList || showAddButton) && (
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
            <Image
              src={imageUrl}
              alt={businessName}
              fill
              sizes='(max-width: 1024px) 100vw, 50vw'
              quality={90}
              className='object-cover'
            />
          </div>
        )}
        <div className={imageUrl ? 'flex flex-col justify-center' : ''}>
          <h2 className='text-2xl font-bold tracking-tight'>Sobre {businessName}</h2>
          <div
            className='prose prose-sm mt-4 max-w-none leading-relaxed opacity-60'
            dangerouslySetInnerHTML={{ __html: text }}
          />
        </div>
      </div>
    </section>
  );
}
