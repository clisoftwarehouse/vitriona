'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { X, Search, ImageOff } from 'lucide-react';

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

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(num);
  };

  const hasDiscount = (product: Product) =>
    product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);

  return (
    <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8'>
      {/* Hero section */}
      {business.description && (
        <div className='mb-8 text-center'>
          <p className='mx-auto max-w-2xl text-gray-500'>{business.description}</p>
        </div>
      )}

      {/* Search bar */}
      <div className='relative mx-auto mb-6 max-w-md'>
        <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400' />
        <input
          type='text'
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder='Buscar productos...'
          className='w-full rounded-full border border-gray-200 py-2.5 pr-10 pl-10 text-sm transition-colors outline-none focus:border-gray-400'
        />
        {search && (
          <button
            onClick={() => handleSearch('')}
            className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600'
          >
            <X className='size-4' />
          </button>
        )}
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className='mb-8 flex flex-wrap justify-center gap-2'>
          <button
            onClick={() => handleCategoryClick()}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !activeCategory ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className='py-20 text-center'>
          <ImageOff className='mx-auto size-10 text-gray-300' />
          <p className='mt-3 text-gray-500'>
            {searchQuery ? 'No se encontraron productos para tu búsqueda.' : 'No hay productos disponibles.'}
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/${slug}/producto/${product.slug}`}
              className='group overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-md'
            >
              <div className='relative aspect-square overflow-hidden bg-gray-50'>
                {product.images[0] ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    fill
                    sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                    className='object-cover transition-transform duration-300 group-hover:scale-105'
                  />
                ) : (
                  <div className='flex size-full items-center justify-center'>
                    <ImageOff className='size-8 text-gray-300' />
                  </div>
                )}
                {hasDiscount(product) && (
                  <span className='absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white'>
                    Oferta
                  </span>
                )}
                {product.isFeatured && !hasDiscount(product) && (
                  <span className='absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white'>
                    Destacado
                  </span>
                )}
              </div>
              <div className='p-3'>
                <h3 className='truncate text-sm font-medium text-gray-900'>{product.name}</h3>
                <div className='mt-1 flex items-center gap-2'>
                  <span className='text-sm font-semibold text-gray-900'>{formatPrice(product.price)}</span>
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
