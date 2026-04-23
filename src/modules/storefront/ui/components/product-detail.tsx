'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import {
  Tag,
  Box,
  Plus,
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

import { Input } from '@/components/ui/input';
import { WatermarkOverlay } from './watermark-overlay';
import { BundleConfigurator } from './bundle-configurator';
import { useCartStore } from '@/modules/storefront/stores/cart-store';
import { StarsDisplay } from '@/modules/reviews/ui/components/product-reviews';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface ProductAttribute {
  name: string;
  value: string;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: string | null;
  stock: number;
  imageUrl: string | null;
  options: Record<string, string>;
}

interface BundleItem {
  productId: string;
  name: string;
  slug: string;
  type: string;
  price: string;
  stock: number | null;
  trackInventory: boolean;
  quantity: number;
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
  variantImagesMap?: Record<string, ProductImage[]>;
  category: Category | null;
  brand?: Brand | null;
  attributes?: ProductAttribute[];
  tags?: string[];
  variants?: ProductVariant[];
  bundleItems?: BundleItem[];
}

interface ReviewStats {
  average: number;
  total: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BundleConfig = any;

interface ProductDetailProps {
  slug: string;
  product: Product;
  whatsappNumber: string | null;
  currency: string;
  reviewStats?: ReviewStats;
  showWatermark?: boolean;
  bundleConfig?: BundleConfig | null;
}

export function ProductDetail({
  slug,
  product,
  whatsappNumber,
  currency,
  reviewStats,
  showWatermark = false,
  bundleConfig = null,
}: ProductDetailProps) {
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const hasVariants = variants.length > 0;

  // Build option groups from variants: { "Talla": ["S","M","L"], "Color": ["Rojo","Azul"] }
  const optionGroups = useMemo(() => {
    if (!hasVariants) return {} as Record<string, string[]>;
    const groups: Record<string, Set<string>> = {};
    for (const v of variants) {
      for (const [key, val] of Object.entries(v.options)) {
        if (!groups[key]) groups[key] = new Set();
        groups[key].add(val);
      }
    }
    return Object.fromEntries(Object.entries(groups).map(([k, s]) => [k, Array.from(s)]));
  }, [variants, hasVariants]);

  // Selected options state: { "Talla": "M", "Color": "Rojo" }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (!hasVariants) return {};
    // Default: select first variant's options
    return { ...variants[0].options };
  });

  // Find the variant matching current selection
  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find((v) => Object.entries(selectedOptions).every(([k, val]) => v.options[k] === val)) ?? null;
  }, [variants, selectedOptions, hasVariants]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // When variant changes, show variant-specific images if available, otherwise fall back to product images
  const displayImages = useMemo(() => {
    if (selectedVariant) {
      const vImages = product.variantImagesMap?.[selectedVariant.id];
      if (vImages && vImages.length > 0) return vImages;
      // Fallback: if variant has a single imageUrl, show it first
      if (selectedVariant.imageUrl) {
        const varImg = { id: `var-${selectedVariant.id}`, url: selectedVariant.imageUrl, alt: selectedVariant.name };
        const others = product.images.filter((img) => img.url !== selectedVariant.imageUrl);
        return [varImg, ...others];
      }
    }
    return product.images;
  }, [selectedVariant, product.images, product.variantImagesMap]);

  // Effective price/stock based on variant selection
  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveStock = hasVariants ? (selectedVariant?.stock ?? 0) : product.stock;

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency, useGrouping: true }).format(num);
  };

  const hasDiscount = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(effectivePrice);

  const discount = hasDiscount
    ? Math.round((1 - parseFloat(effectivePrice) / parseFloat(product.compareAtPrice!)) * 100)
    : 0;

  const whatsappMessage = encodeURIComponent(
    `Hola! Me interesa el producto: ${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ''} (${formatPrice(effectivePrice)}). ¿Está disponible?`
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
          variantId: selectedVariant?.id,
          variantName: selectedVariant?.name,
          name: product.name,
          slug: product.slug,
          price: effectivePrice,
          imageUrl: selectedVariant?.imageUrl ?? product.images[0]?.url ?? null,
        },
        slug
      );
    }
    const label = selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name;
    toast.success(`${quantity > 1 ? `${quantity}x ` : ''}${label} agregado al carrito`);
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

  const isOutOfStock = product.trackInventory && effectiveStock !== null && effectiveStock <= 0;
  const isLowStock = product.trackInventory && effectiveStock !== null && effectiveStock > 0 && effectiveStock <= 5;
  const maxQty = product.trackInventory && effectiveStock !== null ? effectiveStock : 99;

  const allChars = product.attributes ?? [];
  const bundleItems = product.bundleItems ?? [];
  const bundleItemsTotal = bundleItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const bundleUnitsTotal = bundleItems.reduce((sum, item) => sum + item.quantity, 0);
  const bundleSavings = Math.max(bundleItemsTotal - parseFloat(effectivePrice), 0);
  const hasDimensions =
    product.dimensions && (product.dimensions.length || product.dimensions.width || product.dimensions.height);

  const handleSelectOption = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
    setQuantity(1);
    setSelectedImage(0);
  };

  return (
    <>
      <Link
        href={`/${slug}`}
        className='mb-6 inline-flex items-center gap-1.5 text-sm opacity-50 transition-opacity hover:opacity-100'
      >
        <ArrowLeft className='size-4' />
        Volver a la tienda
      </Link>

      <div className='grid gap-8 md:grid-cols-2 lg:gap-12'>
        {/* ── Image Gallery ── */}
        <div className='w-full min-w-0 space-y-3'>
          <div
            className='relative aspect-square w-full overflow-hidden'
            style={{ borderRadius: 'var(--sf-radius-lg, 1rem)', backgroundColor: 'var(--sf-surface, #f9fafb)' }}
          >
            {displayImages[selectedImage] ? (
              <Image
                src={displayImages[selectedImage].url}
                alt={displayImages[selectedImage].alt || product.name}
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
            {showWatermark && displayImages[selectedImage] && <WatermarkOverlay />}
            {hasDiscount && (
              <span className='absolute top-3 left-3 rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white shadow-sm'>
                -{discount}%
              </span>
            )}
          </div>

          {displayImages.length > 1 && (
            <div className='scrollbar-none flex w-full gap-2 overflow-x-auto pb-1'>
              {displayImages.map((img, idx) => (
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
          {/* Brand + Category + type badges */}
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            {product.brand && (
              <span
                className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold'
                style={{
                  borderRadius: 'var(--sf-radius-full, 9999px)',
                  backgroundColor: 'var(--sf-primary, #000)',
                  color: '#fff',
                }}
              >
                {product.brand.name}
              </span>
            )}
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
            {product.type === 'bundle' && (
              <span
                className='inline-flex items-center gap-1 px-3 py-1 text-xs font-medium'
                style={{
                  borderRadius: 'var(--sf-radius-full, 9999px)',
                  backgroundColor: 'var(--sf-primary, #000)',
                  color: '#fff',
                }}
              >
                Paquete
              </span>
            )}
          </div>

          <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{product.name}</h1>

          {/* Review stars */}
          {reviewStats && reviewStats.total > 0 && (
            <a href='#reviews' className='mt-2 inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100'>
              <StarsDisplay rating={reviewStats.average} />
              <span>
                {reviewStats.average.toFixed(1)} ({reviewStats.total} reseña{reviewStats.total !== 1 ? 's' : ''})
              </span>
            </a>
          )}

          {/* Price */}
          <div className='mt-4 flex items-baseline gap-3'>
            <span className='text-3xl font-bold' style={{ color: 'var(--sf-primary, #000)' }}>
              {formatPrice(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className='text-lg line-through opacity-40'>{formatPrice(product.compareAtPrice!)}</span>
            )}
            {hasDiscount && (
              <span className='rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600'>
                Ahorra {formatPrice((parseFloat(product.compareAtPrice!) - parseFloat(effectivePrice)).toString())}
              </span>
            )}
          </div>

          {product.type === 'bundle' && bundleConfig && product.description && (
            <div className='mt-6 pt-6' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
              <h2 className='mb-2 text-sm font-semibold tracking-wide uppercase opacity-50'>Descripción</h2>
              <p className='leading-relaxed whitespace-pre-line opacity-70'>{product.description}</p>
            </div>
          )}

          {product.type === 'bundle' && bundleConfig && (
            <BundleConfigurator product={product} config={bundleConfig} currency={currency} businessSlug={slug} />
          )}

          {product.type === 'bundle' && !bundleConfig && bundleItems.length > 0 && (
            <div
              className='mt-5 overflow-hidden border'
              style={{
                borderRadius: 'var(--sf-radius-lg, 1rem)',
                borderColor: 'var(--sf-border, #e5e7eb)',
                backgroundColor: 'var(--sf-surface, #f9fafb)',
              }}
            >
              <div className='flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5'>
                <div>
                  <p className='text-xs font-semibold tracking-[0.18em] uppercase opacity-45'>Este paquete incluye</p>
                  <p className='mt-1 text-sm font-medium'>
                    {bundleItems.length} componente{bundleItems.length !== 1 ? 's' : ''} · {bundleUnitsTotal} unidad
                    {bundleUnitsTotal !== 1 ? 'es' : ''} en total
                  </p>
                </div>
                <div className='text-right text-sm opacity-70'>
                  <p>Valor por separado</p>
                  <p className='font-semibold'>{formatPrice(bundleItemsTotal.toFixed(2))}</p>
                </div>
              </div>

              <div className='border-t' style={{ borderColor: 'var(--sf-border, #e5e7eb)' }}>
                {bundleItems.map((item, idx) => (
                  <Link
                    key={`${item.productId}-${idx}`}
                    href={`/${slug}/producto/${item.slug}`}
                    className='flex items-start justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-black/2 sm:px-5'
                    style={{
                      borderBottom: idx < bundleItems.length - 1 ? '1px solid var(--sf-border, #e5e7eb)' : undefined,
                    }}
                  >
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='font-medium'>
                          {item.quantity}x {item.name}
                        </span>
                        <span
                          className='inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase'
                          style={{
                            borderRadius: 'var(--sf-radius-full, 9999px)',
                            backgroundColor: 'rgba(0, 0, 0, 0.06)',
                          }}
                        >
                          {item.type === 'service' ? 'Servicio' : 'Producto'}
                        </span>
                      </div>
                      {item.trackInventory && item.stock !== null && (
                        <p className='mt-1 text-xs opacity-55'>Stock disponible: {item.stock}</p>
                      )}
                    </div>
                    <span className='shrink-0 font-medium opacity-75'>
                      {formatPrice((parseFloat(item.price) * item.quantity).toFixed(2))}
                    </span>
                  </Link>
                ))}
              </div>

              {bundleSavings > 0 && (
                <div
                  className='px-4 py-3 text-sm font-medium text-emerald-700 sm:px-5'
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.10)' }}
                >
                  Te ahorras {formatPrice(bundleSavings.toFixed(2))} comprando el paquete completo.
                </div>
              )}
            </div>
          )}

          {/* ── Amazon-style Variant Selector ── */}
          {hasVariants && (
            <div
              className='mt-6 space-y-4'
              style={{
                borderTop: '1px solid var(--sf-border, #e5e7eb)',
                paddingTop: '1.5rem',
              }}
            >
              {Object.entries(optionGroups).map(([optionName, values]) => (
                <div key={optionName}>
                  <span className='mb-2 block text-sm font-semibold'>
                    {optionName}: <span className='font-normal opacity-70'>{selectedOptions[optionName]}</span>
                  </span>
                  <div className='flex flex-wrap gap-2'>
                    {values.map((value) => {
                      const isSelected = selectedOptions[optionName] === value;
                      // Check if this option leads to a valid variant
                      const testOpts = { ...selectedOptions, [optionName]: value };
                      const matchingVariant = variants.find((v) =>
                        Object.entries(testOpts).every(([k, val]) => v.options[k] === val)
                      );
                      const isAvailable = matchingVariant && (!product.trackInventory || matchingVariant.stock > 0);
                      const isOutOfStockVariant =
                        product.trackInventory && matchingVariant && matchingVariant.stock <= 0;

                      return (
                        <button
                          key={value}
                          type='button'
                          onClick={() => handleSelectOption(optionName, value)}
                          className='relative px-4 py-2 text-sm font-medium transition-all'
                          style={{
                            borderRadius: 'var(--sf-radius, 0.75rem)',
                            border: isSelected
                              ? '2px solid var(--sf-primary, #000)'
                              : '1px solid var(--sf-border, #e5e7eb)',
                            backgroundColor: isSelected ? 'var(--sf-surface, #f9fafb)' : 'transparent',
                            opacity: isOutOfStockVariant ? 0.4 : 1,
                            textDecoration: isOutOfStockVariant ? 'line-through' : 'none',
                          }}
                          disabled={!matchingVariant}
                        >
                          {value}
                          {isSelected && isAvailable && (
                            <span
                              className='absolute -top-1 -right-1 size-3 rounded-full'
                              style={{ backgroundColor: 'var(--sf-primary, #000)' }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                  ¡Solo quedan {effectiveStock} unidades!
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

          {/* Description (skip for customer_choice bundles — already rendered above configurator) */}
          {product.description && !(product.type === 'bundle' && bundleConfig) && (
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

          {/* Quantity + CTA buttons (hidden for customer_choice bundles — configurator has its own) */}
          {product.type === 'bundle' && bundleConfig ? null : (
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
                    <Input
                      type='number'
                      min={1}
                      max={maxQty}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setQuantity(Math.min(maxQty, Math.max(1, val)));
                      }}
                      className='min-w-12 [appearance:textfield] border-0 bg-transparent px-2 py-2 text-center text-sm font-semibold shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                    />
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
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Related Products Section ─── */

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string | null;
  images: { url: string; alt: string | null }[];
  brandName: string | null;
  hasVariants: boolean;
}

interface RelatedProductsSectionProps {
  products: RelatedProduct[];
  slug: string;
  currency: string;
  showWatermark?: boolean;
}

export function RelatedProductsSection({
  products,
  slug,
  currency,
  showWatermark = false,
}: RelatedProductsSectionProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent, product: RelatedProduct) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.hasVariants) {
      window.location.assign(`/${slug}/producto/${product.slug}`);
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

  const fmt = (price: string) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency, useGrouping: true }).format(parseFloat(price));

  return (
    <section className='mt-12 pt-10' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
      <h2 className='mb-6 text-xl font-bold tracking-tight'>También te puede interesar</h2>
      <div className='flex gap-4 overflow-x-auto pb-4'>
        {products.map((product) => {
          const hasDisc = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);
          return (
            <Link
              key={product.id}
              href={`/${slug}/producto/${product.slug}?id=${product.id}`}
              className='group flex w-44 shrink-0 flex-col overflow-hidden border transition-shadow hover:shadow-lg sm:w-52'
              style={{
                borderRadius: 'var(--sf-radius-lg, 1rem)',
                borderColor: 'var(--sf-border, #e5e7eb)',
                backgroundColor: 'var(--sf-bg, #fff)',
              }}
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
                    sizes='(max-width: 640px) 44vw, 13rem'
                    className='object-cover transition-transform duration-500 group-hover:scale-105'
                  />
                ) : (
                  <div className='flex size-full items-center justify-center'>
                    <ImageOff className='size-6 opacity-20' />
                  </div>
                )}
                {showWatermark && product.images[0] && <WatermarkOverlay />}
                {!product.hasVariants && (
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className='absolute right-2 bottom-2 flex size-8 items-center justify-center opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:scale-110'
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
              <div className='p-3'>
                {product.brandName && (
                  <span
                    className='mb-0.5 block text-[11px] font-semibold tracking-wide uppercase'
                    style={{ color: 'var(--sf-primary, #000)', opacity: 0.6 }}
                  >
                    {product.brandName}
                  </span>
                )}
                <h3 className='line-clamp-2 text-sm leading-snug font-medium'>{product.name}</h3>
                <div className='mt-1.5 flex items-baseline gap-1.5'>
                  <span className='text-sm font-bold'>{fmt(product.price)}</span>
                  {hasDisc && <span className='text-xs line-through opacity-40'>{fmt(product.compareAtPrice!)}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
