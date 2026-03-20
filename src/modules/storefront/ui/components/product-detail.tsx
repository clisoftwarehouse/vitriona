'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Tag,
  Box,
  Ruler,
  Share2,
  Weight,
  ImageOff,
  ArrowLeft,
  CheckCircle,
  ShoppingBag,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';

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
  sku: string | null;
  stock: number | null;
  type: string;
  weight: string | null;
  dimensions: { length?: number; width?: number; height?: number; unit?: string } | null;
  trackInventory: boolean;
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
  const [quantity, setQuantity] = useState(1);

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
    for (let i = 0; i < quantity; i++) {
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
    }
    toast.success(`${quantity > 1 ? `${quantity}x ` : ''}${product.name} agregado al carrito`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const isOutOfStock = product.trackInventory && product.stock !== null && product.stock <= 0;
  const isLowStock = product.trackInventory && product.stock !== null && product.stock > 0 && product.stock <= 5;
  const maxQty = product.trackInventory && product.stock !== null ? product.stock : 99;

  const allChars = [...(product.characteristics ?? []), ...(product.attributes ?? [])];
  const hasDimensions =
    product.dimensions && (product.dimensions.length || product.dimensions.width || product.dimensions.height);

  return (
    <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8'>
      <Link
        href={`/${slug}`}
        className='mb-6 inline-flex items-center gap-1.5 text-sm opacity-50 transition-opacity hover:opacity-100'
      >
        <ArrowLeft className='size-4' />
        Volver a la tienda
      </Link>

      <div className='grid gap-8 md:grid-cols-2 lg:gap-12'>
        {/* ── Image Gallery ── */}
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
              <span className='absolute top-3 left-3 rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white shadow-sm'>
                -{discount}%
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className='flex gap-2 overflow-x-auto pb-1'>
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className='relative size-16 shrink-0 overflow-hidden border-2 transition-all sm:size-20'
                  style={{
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    borderColor: idx === selectedImage ? 'var(--sf-primary, #000)' : 'transparent',
                    opacity: idx === selectedImage ? 1 : 0.6,
                  }}
                >
                  <Image src={img.url} alt={img.alt || product.name} fill sizes='80px' className='object-cover' />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className='flex flex-col'>
          {/* Category + type badges */}
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            {product.category && (
              <span
                className='inline-flex items-center gap-1 px-3 py-1 text-xs font-medium'
                style={{
                  borderRadius: 'var(--sf-radius-full, 9999px)',
                  backgroundColor: 'var(--sf-surface, #f9fafb)',
                }}
              >
                <Tag className='size-3' />
                {product.category.name}
              </span>
            )}
            {product.type === 'service' && (
              <span
                className='inline-flex items-center gap-1 px-3 py-1 text-xs font-medium'
                style={{
                  borderRadius: 'var(--sf-radius-full, 9999px)',
                  backgroundColor: 'var(--sf-primary, #000)',
                  color: '#fff',
                }}
              >
                Servicio
              </span>
            )}
          </div>

          <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{product.name}</h1>

          {/* SKU */}
          {product.sku && <p className='mt-1 text-xs tracking-wide opacity-40'>SKU: {product.sku}</p>}

          {/* Price */}
          <div className='mt-4 flex items-baseline gap-3'>
            <span className='text-3xl font-bold' style={{ color: 'var(--sf-primary, #000)' }}>
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className='text-lg line-through opacity-40'>{formatPrice(product.compareAtPrice!)}</span>
            )}
            {hasDiscount && (
              <span className='rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600'>
                Ahorra {formatPrice((parseFloat(product.compareAtPrice!) - parseFloat(product.price)).toString())}
              </span>
            )}
          </div>

          {/* Stock availability */}
          {product.trackInventory && product.type !== 'service' && (
            <div className='mt-3'>
              {isOutOfStock ? (
                <span className='inline-flex items-center gap-1.5 text-sm font-medium text-red-600'>
                  <AlertTriangle className='size-4' />
                  Agotado
                </span>
              ) : isLowStock ? (
                <span className='inline-flex items-center gap-1.5 text-sm font-medium text-amber-600'>
                  <AlertTriangle className='size-4' />
                  ¡Solo quedan {product.stock} unidades!
                </span>
              ) : (
                <span className='inline-flex items-center gap-1.5 text-sm font-medium text-green-600'>
                  <CheckCircle className='size-4' />
                  Disponible
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className='mt-4 flex flex-wrap gap-1.5'>
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className='inline-flex items-center px-2.5 py-0.5 text-xs font-medium'
                  style={{
                    borderRadius: 'var(--sf-radius-full, 9999px)',
                    backgroundColor: 'var(--sf-surface, #f3f4f6)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className='mt-6 pt-6' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
              <h2 className='mb-2 text-sm font-semibold tracking-wide uppercase opacity-50'>Descripción</h2>
              <p className='leading-relaxed whitespace-pre-line opacity-70'>{product.description}</p>
            </div>
          )}

          {/* Characteristics + Attributes */}
          {allChars.length > 0 && (
            <div className='mt-6 pt-6' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
              <h2 className='mb-3 text-sm font-semibold tracking-wide uppercase opacity-50'>Características</h2>
              <div
                className='overflow-hidden'
                style={{ borderRadius: 'var(--sf-radius, 0.75rem)', border: '1px solid var(--sf-border, #e5e7eb)' }}
              >
                {allChars.map((item, idx) => (
                  <div
                    key={idx}
                    className='flex text-sm'
                    style={{
                      borderBottom: idx < allChars.length - 1 ? '1px solid var(--sf-border, #e5e7eb)' : undefined,
                    }}
                  >
                    <span
                      className='w-2/5 shrink-0 px-3 py-2.5 text-xs font-semibold uppercase opacity-50'
                      style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
                    >
                      {item.name}
                    </span>
                    <span className='flex-1 px-3 py-2.5'>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Physical details (weight + dimensions) */}
          {(product.weight || hasDimensions) && (
            <div className='mt-6 pt-6' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
              <h2 className='mb-3 text-sm font-semibold tracking-wide uppercase opacity-50'>Información de envío</h2>
              <div className='flex flex-wrap gap-4 text-sm'>
                {product.weight && (
                  <span className='inline-flex items-center gap-1.5 opacity-70'>
                    <Weight className='size-4' />
                    {product.weight} kg
                  </span>
                )}
                {hasDimensions && (
                  <span className='inline-flex items-center gap-1.5 opacity-70'>
                    <Ruler className='size-4' />
                    {[product.dimensions!.length, product.dimensions!.width, product.dimensions!.height]
                      .filter(Boolean)
                      .join(' × ')}{' '}
                    {product.dimensions!.unit || 'cm'}
                  </span>
                )}
                {product.type === 'product' && (
                  <span className='inline-flex items-center gap-1.5 opacity-70'>
                    <Box className='size-4' />
                    Producto físico
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quantity + CTA buttons */}
          <div className='mt-8 space-y-4'>
            {!isOutOfStock && (
              <div className='flex items-center gap-3'>
                <label className='text-sm font-medium opacity-60'>Cantidad</label>
                <div
                  className='inline-flex items-center overflow-hidden border'
                  style={{
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    borderColor: 'var(--sf-border, #e5e7eb)',
                  }}
                >
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className='px-3 py-2 text-sm font-medium transition-colors hover:opacity-70'
                    style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
                  >
                    −
                  </button>
                  <span className='min-w-12 px-2 py-2 text-center text-sm font-semibold'>{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    className='px-3 py-2 text-sm font-medium transition-colors hover:opacity-70'
                    style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className='flex flex-col gap-3'>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className='inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
                style={{
                  backgroundColor: 'var(--sf-primary, #000)',
                  borderRadius: 'var(--sf-radius-full, 9999px)',
                }}
              >
                <ShoppingBag className='size-5' />
                {isOutOfStock ? 'Agotado' : 'Agregar al carrito'}
              </button>

              <div className='flex gap-3'>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex flex-1 items-center justify-center gap-2 border border-green-600 px-6 py-3 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50'
                    style={{ borderRadius: 'var(--sf-radius-full, 9999px)' }}
                  >
                    <MessageCircle className='size-4' />
                    WhatsApp
                  </a>
                )}
                <button
                  onClick={handleShare}
                  className='inline-flex items-center justify-center gap-2 border px-6 py-3 text-sm font-semibold transition-colors hover:opacity-70'
                  style={{
                    borderRadius: 'var(--sf-radius-full, 9999px)',
                    borderColor: 'var(--sf-border, #e5e7eb)',
                  }}
                >
                  <Share2 className='size-4' />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
