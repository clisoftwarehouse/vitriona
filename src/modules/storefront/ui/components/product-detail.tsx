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
}

interface ProductDetailProps {
  slug: string;
  product: Product;
  whatsappNumber: string | null;
}

export function ProductDetail({ slug, product, whatsappNumber }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(num);
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
        className='mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900'
      >
        <ArrowLeft className='size-4' />
        Volver al catálogo
      </Link>

      <div className='grid gap-8 md:grid-cols-2'>
        {/* Image gallery */}
        <div className='space-y-3'>
          <div className='relative aspect-square overflow-hidden rounded-xl bg-gray-50'>
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
                  className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:size-20 ${
                    idx === selectedImage ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                  }`}
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
            <span className='mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600'>
              <Tag className='size-3' />
              {product.category.name}
            </span>
          )}

          <h1 className='text-2xl font-bold text-gray-900 sm:text-3xl'>{product.name}</h1>

          <div className='mt-3 flex items-baseline gap-3'>
            <span className='text-2xl font-bold text-gray-900'>{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className='text-lg text-gray-400 line-through'>{formatPrice(product.compareAtPrice!)}</span>
            )}
          </div>

          {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
            <p className='mt-2 text-sm font-medium text-amber-600'>¡Solo quedan {product.stock} unidades!</p>
          )}

          {product.description && (
            <div className='mt-6 border-t border-gray-100 pt-6'>
              <h2 className='mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase'>Descripción</h2>
              <p className='leading-relaxed whitespace-pre-line text-gray-600'>{product.description}</p>
            </div>
          )}

          <div className='mt-8 flex flex-col gap-3'>
            <button
              onClick={handleAddToCart}
              className='inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-gray-800'
            >
              <ShoppingBag className='size-5' />
              Agregar al carrito
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center justify-center gap-2 rounded-full border border-green-600 px-6 py-3 text-base font-semibold text-green-600 transition-colors hover:bg-green-50'
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
