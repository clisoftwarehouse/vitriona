'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { X, Plus, Search, ImageOff, ShoppingBag } from 'lucide-react';

import { useCartStore } from '@/modules/storefront/stores/cart-store';

interface Category {
  id: string;
  name: string;
  slug: string;
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
  images: ProductImage[];
}

interface Business {
  name: string;
  description: string | null;
}

interface StorefrontCatalogProps {
  slug: string;
  business: Business;
  categories: Category[];
  products: Product[];
  activeCategory?: string;
  searchQuery?: string;
}

export function StorefrontCatalog({
  slug,
  business,
  categories,
  products,
  activeCategory,
  searchQuery,
}: StorefrontCatalogProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery ?? '');
  const addItem = useCartStore((s) => s.addItem);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      const params = new URLSearchParams();
      if (activeCategory) params.set('categoria', activeCategory);
      if (value) params.set('buscar', value);
      const qs = params.toString();
      router.replace(`/${slug}${qs ? `?${qs}` : ''}`);
    },
    [slug, activeCategory, router]
  );

  const handleCategoryClick = (categoryId?: string) => {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoria', categoryId);
    if (search) params.set('buscar', search);
    const qs = params.toString();
    router.replace(`/${slug}${qs ? `?${qs}` : ''}`);
  };

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

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(num);
  };

  const hasDiscount = (product: Product) =>
    product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);

  const discountPercent = (product: Product) =>
    product.compareAtPrice ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice)) * 100) : 0;

  return (
    <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8'>
      {/* Hero section */}
      {business.description && (
        <div className='mb-8 text-center'>
          <p className='mx-auto max-w-2xl text-base leading-relaxed text-gray-500'>{business.description}</p>
        </div>
      )}

      {/* Search + filters bar */}
      <div className='mb-8 flex flex-col items-center gap-4'>
        <div className='relative w-full max-w-md'>
          <Search className='absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder='Buscar productos...'
            className='w-full rounded-full border border-gray-200 bg-gray-50/50 py-2.5 pr-10 pl-10 text-sm transition-all outline-none focus:border-gray-300 focus:bg-white focus:shadow-sm'
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className='absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
            >
              <X className='size-3.5' />
            </button>
          )}
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className='flex flex-wrap justify-center gap-2'>
            <button
              onClick={() => handleCategoryClick()}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                !activeCategory
                  ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {(searchQuery || activeCategory) && products.length > 0 && (
        <p className='mb-4 text-sm text-gray-400'>
          {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className='flex flex-col items-center py-24'>
          <div className='flex size-16 items-center justify-center rounded-full bg-gray-50'>
            <ShoppingBag className='size-7 text-gray-300' />
          </div>
          <p className='mt-4 font-medium text-gray-900'>
            {searchQuery ? 'Sin resultados' : 'No hay productos disponibles'}
          </p>
          <p className='mt-1 text-sm text-gray-500'>
            {searchQuery ? 'Intenta con otra búsqueda.' : 'Pronto agregaremos productos.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className='mt-4 text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700'
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5'>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/${slug}/producto/${product.slug}`}
              className='group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:border-gray-200 hover:shadow-lg'
            >
              {/* Image */}
              <div className='relative aspect-square overflow-hidden bg-gray-50'>
                {product.images[0] ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    fill
                    sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                    className='object-cover transition-transform duration-500 group-hover:scale-105'
                  />
                ) : (
                  <div className='flex size-full items-center justify-center'>
                    <ImageOff className='size-8 text-gray-200' />
                  </div>
                )}

                {/* Badges */}
                {hasDiscount(product) && (
                  <span className='absolute top-2.5 left-2.5 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm'>
                    -{discountPercent(product)}%
                  </span>
                )}
                {product.isFeatured && !hasDiscount(product) && (
                  <span className='absolute top-2.5 left-2.5 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-gray-900 shadow-sm'>
                    Destacado
                  </span>
                )}

                {/* Quick add button */}
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  className='absolute right-2.5 bottom-2.5 flex size-9 items-center justify-center rounded-full bg-white text-gray-700 opacity-0 shadow-md transition-all group-hover:opacity-100 hover:bg-gray-900 hover:text-white'
                  aria-label={`Agregar ${product.name} al carrito`}
                >
                  <Plus className='size-4' />
                </button>
              </div>

              {/* Info */}
              <div className='flex flex-1 flex-col p-3 sm:p-4'>
                <h3 className='line-clamp-2 text-sm leading-snug font-medium text-gray-900'>{product.name}</h3>
                <div className='mt-auto flex items-baseline gap-2 pt-2'>
                  <span className='text-base font-bold text-gray-900'>{formatPrice(product.price)}</span>
                  {hasDiscount(product) && (
                    <span className='text-xs text-gray-400 line-through'>{formatPrice(product.compareAtPrice!)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
