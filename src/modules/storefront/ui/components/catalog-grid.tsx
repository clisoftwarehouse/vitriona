'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Plus, ImageOff, ArrowRight } from 'lucide-react';

import { formatPrice } from '@/lib/format';
import { WatermarkOverlay } from './watermark-overlay';
import { useCartStore } from '@/modules/storefront/stores/cart-store';

/* ─── Types ─── */

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
  brandName?: string | null;
  images: ProductImage[];
}

interface CatalogWithProducts {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  type: string;
  isDefault: boolean;
  products: Product[];
  totalProducts: number;
}

interface CatalogSectionsProps {
  slug: string;
  currency: string;
  catalogs: CatalogWithProducts[];
  showWatermark?: boolean;
}

/* ─── Helpers ─── */

function hasDiscount(p: Product) {
  return p.compareAtPrice ? parseFloat(p.compareAtPrice) > parseFloat(p.price) : false;
}

function discountPercent(p: Product) {
  return p.compareAtPrice ? Math.round((1 - parseFloat(p.price) / parseFloat(p.compareAtPrice)) * 100) : 0;
}

/* ─── Main Component ─── */

export function CatalogSections({ slug, currency, catalogs, showWatermark = false }: CatalogSectionsProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <div className='mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8'>
      {catalogs.map((catalog) => {
        if (catalog.products.length === 0) return null;
        const hasMore = catalog.totalProducts > catalog.products.length;
        const catalogHref = `/${slug}/${catalog.slug ?? catalog.id}`;

        return (
          <section key={catalog.id}>
            <div className='mb-5 flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-bold tracking-tight'>{catalog.name}</h2>
                {catalog.description && <p className='mt-0.5 text-sm opacity-50'>{catalog.description}</p>}
              </div>
              {hasMore && (
                <Link
                  href={catalogHref}
                  className='flex shrink-0 items-center gap-1 text-sm font-medium opacity-60 transition-opacity hover:opacity-100'
                >
                  Ver más
                  <ArrowRight className='size-3.5' />
                </Link>
              )}
            </div>

            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5'>
              {catalog.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/${slug}/producto/${product.slug}?id=${product.id}`}
                  className='group overflow-hidden transition-shadow hover:shadow-md'
                  style={{ borderRadius: 'var(--sf-radius-lg, 1rem)', border: '1px solid var(--sf-border, #e5e7eb)' }}
                >
                  <div
                    className='relative aspect-square overflow-hidden'
                    style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
                  >
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        fill
                        sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                        quality={90}
                        className='object-cover transition-transform duration-300 group-hover:scale-105'
                      />
                    ) : (
                      <div className='flex size-full items-center justify-center'>
                        <ImageOff className='size-8 opacity-20' />
                      </div>
                    )}
                    {showWatermark && product.images[0] && <WatermarkOverlay />}

                    {hasDiscount(product) && (
                      <span
                        className='absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold text-white'
                        style={{
                          backgroundColor: '#ef4444',
                          borderRadius: 'max(var(--sf-radius, 0.75rem), 0.375rem)',
                        }}
                      >
                        -{discountPercent(product)}%
                      </span>
                    )}

                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      className='absolute right-2 bottom-2 flex size-8 items-center justify-center text-white opacity-0 shadow-lg transition-all group-hover:opacity-100'
                      style={{ backgroundColor: 'var(--sf-primary, #000)', borderRadius: 'var(--sf-radius, 0.75rem)' }}
                    >
                      <Plus className='size-4' />
                    </button>
                  </div>

                  <div className='p-3'>
                    {product.brandName && (
                      <span
                        className='mb-0.5 block text-[11px] font-semibold tracking-wide uppercase'
                        style={{ color: 'var(--sf-primary, #000)', opacity: 0.6 }}
                      >
                        {product.brandName}
                      </span>
                    )}
                    <h3 className='line-clamp-2 text-sm leading-tight font-medium'>{product.name}</h3>
                    <div className='mt-1.5 flex items-center gap-2'>
                      <span className='text-sm font-bold' style={{ color: 'var(--sf-primary, #000)' }}>
                        {formatPrice(product.price, currency)}
                      </span>
                      {hasDiscount(product) && (
                        <span className='text-xs line-through opacity-40'>
                          {formatPrice(product.compareAtPrice!, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className='mt-4 text-center'>
                <Link
                  href={catalogHref}
                  className='inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium transition-colors'
                  style={{
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    border: '1px solid var(--sf-border, #e5e7eb)',
                    color: 'var(--sf-primary, #000)',
                  }}
                >
                  Ver todos los productos de {catalog.name}
                  <ArrowRight className='size-3.5' />
                </Link>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
