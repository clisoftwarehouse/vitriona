'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import { Plus, Minus, Trash2, ImageOff, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';
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

  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const getTotal = useCartStore((s) => s.getTotal);

  const itemCount = hydrated ? getItemCount() : 0;
  const total = hydrated ? getTotal() : 0;

  const formatPrice = (amount: number) => new Intl.NumberFormat('es', { style: 'currency', currency }).format(amount);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className='relative inline-flex items-center justify-center rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100'>
          <ShoppingBag className='size-5' />
          {itemCount > 0 && (
            <span className='absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white'>
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className='flex w-full flex-col bg-white p-0 sm:max-w-md'>
        {/* Header */}
        <SheetHeader className='border-b px-5 py-4'>
          <SheetTitle className='text-base'>Carrito ({itemCount})</SheetTitle>
          <SheetDescription className='sr-only'>Tu carrito de compras</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-4 px-5'>
            <div className='flex size-20 items-center justify-center rounded-full bg-gray-50'>
              <ShoppingBag className='size-8 text-gray-300' />
            </div>
            <div className='text-center'>
              <p className='font-medium text-gray-900'>Tu carrito está vacío</p>
              <p className='mt-1 text-sm text-gray-500'>Agrega productos para comenzar</p>
            </div>
            <SheetClose asChild>
              <Button variant='outline' className='mt-2 rounded-full' asChild>
                <Link href={`/${slug}`}>Explorar productos</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className='flex-1 divide-y divide-gray-100 overflow-y-auto'>
              {items.map((item) => (
                <div key={item.productId} className='flex gap-3 px-5 py-4'>
                  <div className='relative size-16 shrink-0 overflow-hidden rounded-lg bg-gray-50'>
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill sizes='64px' className='object-cover' />
                    ) : (
                      <div className='flex size-full items-center justify-center'>
                        <ImageOff className='size-4 text-gray-300' />
                      </div>
                    )}
                  </div>

                  <div className='flex min-w-0 flex-1 flex-col justify-between'>
                    <div className='flex items-start justify-between gap-2'>
                      <SheetClose asChild>
                        <Link
                          href={`/${slug}/producto/${item.slug}`}
                          className='line-clamp-2 text-sm leading-tight font-medium text-gray-900 hover:underline'
                        >
                          {item.name}
                        </Link>
                      </SheetClose>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className='shrink-0 rounded-md p-0.5 text-gray-300 transition-colors hover:text-red-500'
                        aria-label='Eliminar'
                      >
                        <Trash2 className='size-3.5' />
                      </button>
                    </div>

                    <div className='mt-2 flex items-center justify-between'>
                      <div className='flex items-center overflow-hidden rounded-lg border border-gray-200'>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className='flex size-7 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50'
                        >
                          <Minus className='size-3' />
                        </button>
                        <span className='w-8 text-center text-xs font-semibold'>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className='flex size-7 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50'
                        >
                          <Plus className='size-3' />
                        </button>
                      </div>
                      <span className='text-sm font-semibold text-gray-900'>
                        {formatPrice(parseFloat(item.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <SheetFooter className='border-t px-5 pb-5'>
              <div className='flex items-center justify-between'>
                <div>
                  <span className='text-sm text-gray-500'>Subtotal</span>
                  <p className='text-lg font-bold text-gray-900'>{formatPrice(total)}</p>
                </div>
                <button onClick={clearCart} className='text-xs font-medium text-gray-400 underline hover:text-gray-600'>
                  Vaciar carrito
                </button>
              </div>
              <SheetClose asChild>
                <Button asChild className='w-full rounded-full' size='lg'>
                  <Link href={`/${slug}/checkout`}>Finalizar pedido</Link>
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
