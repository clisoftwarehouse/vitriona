'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import { X, Plus, Minus, Trash2, ImageOff, ShoppingBag } from 'lucide-react';

import { useCartStore } from '@/modules/storefront/stores/cart-store';
import {
  Sheet,
  SheetClose,
  SheetTitle,
  SheetFooter,
  SheetHeader,
  SheetContent,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';

interface CartSheetProps {
  slug: string;
  currency: string;
}

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function CartSheet({ slug, currency }: CartSheetProps) {
  const hydrated = useHydrated();

  const carts = useCartStore((s) => s.carts);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const cartItems = hydrated ? (carts[slug] ?? []) : [];
  const items = cartItems;
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const total = cartItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

  const formatPrice = (amount: number) => new Intl.NumberFormat('es', { style: 'currency', currency }).format(amount);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className='relative inline-flex items-center justify-center rounded-full p-2 transition-opacity hover:opacity-70'
          style={{ color: 'var(--sf-text, #111827)' }}
        >
          <ShoppingBag className='size-5' />
          {itemCount > 0 && (
            <span
              className='absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full text-[10px] font-bold'
              style={{ backgroundColor: 'var(--sf-primary, #111827)', color: 'var(--sf-bg, #ffffff)' }}
            >
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        showCloseButton={false}
        className='flex w-full flex-col p-0 sm:max-w-md'
        style={{
          backgroundColor: 'var(--sf-bg, #ffffff)',
          color: 'var(--sf-text, #111827)',
          fontFamily: 'var(--sf-font, inherit)',
        }}
      >
        {/* Header */}
        <SheetHeader className='px-5 py-4' style={{ borderBottom: '1px solid var(--sf-border, #e5e7eb)' }}>
          <div className='flex items-center justify-between'>
            <SheetTitle className='text-base font-semibold' style={{ color: 'var(--sf-text, #111827)' }}>
              Carrito ({itemCount})
            </SheetTitle>
            <SheetClose asChild>
              <button
                className='flex size-8 items-center justify-center rounded-full transition-opacity hover:opacity-70'
                style={{ color: 'var(--sf-text, #111827)' }}
                aria-label='Cerrar'
              >
                <X className='size-4' />
              </button>
            </SheetClose>
          </div>
          <SheetDescription className='sr-only'>Tu carrito de compras</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-4 px-5'>
            <div
              className='flex size-20 items-center justify-center rounded-full'
              style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
            >
              <ShoppingBag className='size-8 opacity-30' />
            </div>
            <div className='text-center'>
              <p className='font-medium'>Tu carrito está vacío</p>
              <p className='mt-1 text-sm opacity-50'>Agrega productos para comenzar</p>
            </div>
            <SheetClose asChild>
              <Link
                href={`/${slug}`}
                className='mt-2 inline-flex items-center justify-center px-5 py-2 text-sm font-medium transition-opacity hover:opacity-80'
                style={{
                  borderRadius: 'var(--sf-radius-full, 9999px)',
                  border: '1px solid var(--sf-border, #e5e7eb)',
                  color: 'var(--sf-text, #111827)',
                }}
              >
                Explorar productos
              </Link>
            </SheetClose>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className='flex-1 overflow-y-auto'>
              {items.map((item, idx) => (
                <div
                  key={
                    item.bundleKey
                      ? `${item.productId}:bundle:${item.bundleKey}`
                      : item.variantId
                        ? `${item.productId}:${item.variantId}`
                        : item.productId
                  }
                  className='flex gap-3 px-5 py-4'
                  style={idx > 0 ? { borderTop: '1px solid var(--sf-border, #e5e7eb)', opacity: 1 } : undefined}
                >
                  <div
                    className='relative size-16 shrink-0 overflow-hidden'
                    style={{
                      borderRadius: 'var(--sf-radius, 0.5rem)',
                      backgroundColor: 'var(--sf-surface, #f9fafb)',
                    }}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes='64px'
                        className='object-cover'
                      />
                    ) : (
                      <div className='flex size-full items-center justify-center'>
                        <ImageOff className='size-4 opacity-30' />
                      </div>
                    )}
                  </div>

                  <div className='flex min-w-0 flex-1 flex-col justify-between'>
                    <div className='flex items-start justify-between gap-2'>
                      <SheetClose asChild>
                        <Link
                          href={`/${slug}/producto/${item.slug}`}
                          className='line-clamp-2 text-sm leading-tight font-medium hover:underline'
                          style={{ color: 'var(--sf-text, #111827)' }}
                        >
                          {item.name}
                          {item.variantName && (
                            <span className='block text-[11px] font-normal opacity-50'>{item.variantName}</span>
                          )}
                        </Link>
                      </SheetClose>
                      <button
                        onClick={() => removeItem(item.productId, slug, item.variantId, item.bundleKey)}
                        className='shrink-0 rounded-md p-0.5 opacity-40 transition-opacity hover:opacity-100'
                        style={{ color: '#ef4444' }}
                        aria-label='Eliminar'
                      >
                        <Trash2 className='size-3.5' />
                      </button>
                    </div>

                    {item.bundleSelections && item.bundleSelections.length > 0 && (
                      <div
                        className='mt-1.5 space-y-0.5 rounded-md px-2 py-1.5'
                        style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
                      >
                        {item.bundleSelections.map((sel, sIdx) => (
                          <div key={sIdx} className='flex items-center justify-between text-[11px] opacity-60'>
                            <span className='truncate'>
                              {sel.quantity}x {sel.productName}
                            </span>
                            <span className='ml-2 shrink-0'>
                              {formatPrice(parseFloat(sel.unitPrice) * sel.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className='mt-2 flex items-center justify-between'>
                      <div
                        className='flex items-center overflow-hidden'
                        style={{
                          borderRadius: 'var(--sf-radius, 0.5rem)',
                          border: '1px solid var(--sf-border, #e5e7eb)',
                        }}
                      >
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, slug, item.variantId, item.bundleKey)
                          }
                          className='flex size-7 items-center justify-center opacity-60 transition-opacity hover:opacity-100'
                        >
                          <Minus className='size-3' />
                        </button>
                        <span className='w-8 text-center text-xs font-semibold'>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, slug, item.variantId, item.bundleKey)
                          }
                          className='flex size-7 items-center justify-center opacity-60 transition-opacity hover:opacity-100'
                        >
                          <Plus className='size-3' />
                        </button>
                      </div>
                      <span className='text-sm font-semibold'>
                        {formatPrice(parseFloat(item.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <SheetFooter className='px-5 pb-5' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
              <div className='flex items-center justify-between'>
                <div>
                  <span className='text-sm opacity-50'>Subtotal</span>
                  <p className='text-lg font-bold'>{formatPrice(total)}</p>
                </div>
                <button
                  onClick={() => clearCart(slug)}
                  className='text-xs font-medium underline opacity-40 hover:opacity-70'
                >
                  Vaciar carrito
                </button>
              </div>
              <SheetClose asChild>
                <Link
                  href={`/${slug}/checkout`}
                  className='flex w-full items-center justify-center py-3 text-sm font-semibold transition-opacity hover:opacity-90'
                  style={{
                    borderRadius: 'var(--sf-radius-full, 9999px)',
                    backgroundColor: 'var(--sf-primary, #111827)',
                    color: 'var(--sf-bg, #ffffff)',
                  }}
                >
                  Finalizar pedido
                </Link>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
