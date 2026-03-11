'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useState } from 'react';
import { Tag, ImageOff, ArrowLeft, ShoppingBag, MessageCircle } from 'lucide-react';

import { useCartStore } from '@/modules/storefront/stores/cart-store';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface ProductAttribute {
  name: string;
  value: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  stock: number | null;
  isFeatured: boolean;
  images: ProductImage[];
  category: Category | null;
  attributes?: ProductAttribute[];
  tags?: string[];
  characteristics?: { name: string; value: string }[] | null;
}

interface ProductDetailProps {
  slug: string;
  product: Product;
  whatsappNumber: string | null;
  currency: string;
}

export function ProductDetail({ slug, product, whatsappNumber, currency }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('es', { style: 'currency', currency }).format(num);
  };

  const hasDiscount = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);

  const discount = hasDiscount
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice!)) * 100)
    : 0;

  const whatsappMessage = encodeURIComponent(
    `Hola! Me interesa el producto: ${product.name} (${formatPrice(product.price)}). ¿Está disponible?`
  );

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null;

  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
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
    toast.success('Producto agregado al carrito');
  };

  return (
    <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8'>
      <Link
        href={`/${slug}`}
        className='mb-6 inline-flex items-center gap-1.5 text-sm opacity-50 transition-opacity hover:opacity-100'
      >
        <ArrowLeft className='size-4' />
        Volver al catálogo
      </Link>

      <div className='grid gap-8 md:grid-cols-2'>
        {/* Image gallery */}
        <div className='space-y-3'>
          <div
            className='relative aspect-square overflow-hidden'
            style={{ borderRadius: 'var(--sf-radius-lg, 1rem)', backgroundColor: 'var(--sf-surface, #f9fafb)' }}
          >
            {product.images[selectedImage] ? (
              <Image
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].alt || product.name}
                fill
                sizes='(max-width: 768px) 100vw, 50vw'
                className='object-cover'
                priority
              />
            ) : (
              <div className='flex size-full items-center justify-center'>
                <ImageOff className='size-12 text-gray-300' />
              </div>
            )}
            {hasDiscount && (
              <span className='absolute top-3 left-3 rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white'>
                -{discount}%
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className='flex gap-2 overflow-x-auto'>
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative size-16 shrink-0 overflow-hidden border-2 transition-colors sm:size-20 ${
                    idx === selectedImage ? 'border-transparent' : 'border-transparent hover:opacity-70'
                  }`}
                  style={{
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    borderColor: idx === selectedImage ? 'var(--sf-primary, #000)' : 'transparent',
                  }}
                >
                  <Image src={img.url} alt={img.alt || product.name} fill sizes='80px' className='object-cover' />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className='flex flex-col'>
          {product.category && (
            <span
              className='mb-2 inline-flex w-fit items-center gap-1 px-3 py-1 text-xs font-medium'
              style={{
                borderRadius: 'var(--sf-radius-full, 9999px)',
                backgroundColor: 'var(--sf-surface, #f9fafb)',
              }}
            >
              <Tag className='size-3' />
              {product.category.name}
            </span>
          )}

          <h1 className='text-2xl font-bold sm:text-3xl'>{product.name}</h1>

          <div className='mt-3 flex items-baseline gap-3'>
            <span className='text-2xl font-bold'>{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className='text-lg line-through opacity-40'>{formatPrice(product.compareAtPrice!)}</span>
            )}
          </div>

          {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
            <p className='mt-2 text-sm font-medium text-amber-600'>¡Solo quedan {product.stock} unidades!</p>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className='mt-4 flex flex-wrap gap-1.5'>
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className='inline-flex items-center px-2.5 py-0.5 text-xs font-medium'
                  style={{
                    borderRadius: 'var(--sf-radius-full, 9999px)',
                    backgroundColor: 'var(--sf-surface, #f3f4f6)',
                    color: 'var(--sf-primary, #374151)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {product.description && (
            <div className='mt-6 pt-6' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
              <h2 className='mb-2 text-sm font-semibold tracking-wide uppercase opacity-50'>Descripción</h2>
              <p className='leading-relaxed whitespace-pre-line opacity-70'>{product.description}</p>
            </div>
          )}

          {(() => {
            const allChars = [...(product.characteristics ?? []), ...(product.attributes ?? [])];
            if (allChars.length === 0) return null;
            return (
              <div className='mt-6 pt-6' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
                <h2 className='mb-3 text-sm font-semibold tracking-wide uppercase opacity-50'>Características</h2>
                <ul className='space-y-1.5 text-sm'>
                  {allChars.map((item, idx) => (
                    <li key={idx} className='flex items-baseline gap-2'>
                      <span className='font-medium opacity-60'>{item.name}:</span>
                      <span>{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          <div className='mt-8 flex flex-col gap-3'>
            <button
              onClick={handleAddToCart}
              className='inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90'
              style={{
                backgroundColor: 'var(--sf-primary, #000)',
                borderRadius: 'var(--sf-radius-full, 9999px)',
              }}
            >
              <ShoppingBag className='size-5' />
              Agregar al carrito
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center justify-center gap-2 border border-green-600 px-6 py-3 text-base font-semibold text-green-600 transition-colors hover:bg-green-50'
                style={{ borderRadius: 'var(--sf-radius-full, 9999px)' }}
              >
                <MessageCircle className='size-5' />
                Consultar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
