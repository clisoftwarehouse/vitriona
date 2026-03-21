'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useSyncExternalStore } from 'react';
import { X, Loader2, ImageOff, ArrowLeft, MessageCircle, TicketPercent } from 'lucide-react';

import { useCartStore } from '@/modules/storefront/stores/cart-store';
import { validateCouponAction } from '@/modules/coupons/server/actions/coupon-actions';
import { createOrderAction } from '@/modules/storefront/server/actions/create-order.action';

interface CheckoutFormProps {
  slug: string;
  businessId: string;
  catalogId: string;
  businessName: string;
  whatsappNumber: string | null;
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

export function CheckoutForm({
  slug,
  businessId,
  catalogId,
  businessName,
  whatsappNumber,
  currency,
}: CheckoutFormProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    code: string;
    discount: number;
    description: string | null;
  } | null>(null);

  const subtotal = hydrated ? getTotal() : 0;
  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const formatPrice = (amount: number) => new Intl.NumberFormat('es', { style: 'currency', currency }).format(amount);

  const buildWhatsAppMessage = () => {
    let msg = `Hola! Acabo de hacer un pedido en ${businessName}.\n\n`;
    msg += `Nombre: ${name}\n`;
    if (phone) msg += `Teléfono: ${phone}\n`;
    if (email) msg += `Email: ${email}\n`;
    msg += `\nProductos:\n`;
    items.forEach((item) => {
      const label = item.variantName ? `${item.name} (${item.variantName})` : item.name;
      msg += `- ${label} x${item.quantity}  ${formatPrice(parseFloat(item.price) * item.quantity)}\n`;
    });
    if (appliedCoupon) msg += `\nCupón: ${appliedCoupon.code} (-${formatPrice(discount)})`;
    msg += `\nTotal: ${formatPrice(total)}`;
    if (notes) msg += `\n\nNota: ${notes}`;
    return msg;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Ingresa tu nombre');
      return;
    }

    if (items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    startTransition(async () => {
      const result = await createOrderAction({
        businessId,
        catalogId,
        customerName: name,
        customerPhone: phone || undefined,
        customerEmail: email || undefined,
        customerNotes: notes || undefined,
        checkoutType: whatsappNumber ? 'whatsapp' : 'internal',
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.variantName ? `${item.name} (${item.variantName})` : item.name,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
        couponId: appliedCoupon?.couponId,
        couponCode: appliedCoupon?.code,
        discount,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (whatsappNumber) {
        const message = buildWhatsAppMessage();
        const url = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }

      clearCart();
      toast.success('¡Pedido enviado con éxito!');
      router.push(`/${slug}/pedido-confirmado`);
    });
  };

  if (items.length === 0) {
    return (
      <div className='mx-auto max-w-lg px-4 py-20 text-center'>
        <p className='mb-4 text-gray-500'>Tu carrito está vacío</p>
        <Link
          href={`/${slug}`}
          className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80'
          style={{
            borderRadius: 'var(--sf-radius, 0.75rem)',
            border: '1px solid var(--sf-border, #e5e7eb)',
          }}
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8'>
      <Link
        href={`/${slug}`}
        className='mb-6 inline-flex items-center gap-1.5 text-sm opacity-50 transition-opacity hover:opacity-100'
      >
        <ArrowLeft className='size-4' />
        Seguir comprando
      </Link>

      <h1 className='mb-8 text-2xl font-bold'>Finalizar pedido</h1>

      <form onSubmit={handleSubmit}>
        <div className='grid gap-8 sm:grid-cols-2'>
          {/* Customer form */}
          <div className='space-y-4'>
            <h2 className='text-sm font-semibold tracking-wide uppercase opacity-50'>Tus datos</h2>
            <div>
              <label htmlFor='name' className='mb-1 block text-sm font-medium opacity-70'>
                Nombre *
              </label>
              <input
                id='name'
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Tu nombre completo'
                required
                className='w-full px-3 py-2.5 text-sm transition-colors outline-none'
                style={{ borderRadius: 'var(--sf-radius, 0.75rem)', border: '1px solid var(--sf-border, #e5e7eb)' }}
              />
            </div>
            <div>
              <label htmlFor='phone' className='mb-1 block text-sm font-medium opacity-70'>
                Teléfono
              </label>
              <input
                id='phone'
                type='tel'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='+1 809 000 0000'
                className='w-full px-3 py-2.5 text-sm transition-colors outline-none'
                style={{ borderRadius: 'var(--sf-radius, 0.75rem)', border: '1px solid var(--sf-border, #e5e7eb)' }}
              />
            </div>
            <div>
              <label htmlFor='email' className='mb-1 block text-sm font-medium opacity-70'>
                Email
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='tu@email.com'
                className='w-full px-3 py-2.5 text-sm transition-colors outline-none'
                style={{ borderRadius: 'var(--sf-radius, 0.75rem)', border: '1px solid var(--sf-border, #e5e7eb)' }}
              />
            </div>
            <div>
              <label htmlFor='notes' className='mb-1 block text-sm font-medium opacity-70'>
                Notas adicionales
              </label>
              <textarea
                id='notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Instrucciones especiales, dirección de entrega, etc.'
                rows={3}
                className='w-full resize-none px-3 py-2.5 text-sm transition-colors outline-none'
                style={{ borderRadius: 'var(--sf-radius, 0.75rem)', border: '1px solid var(--sf-border, #e5e7eb)' }}
              />
            </div>
          </div>

          {/* Order summary */}
          <div>
            <h2 className='text-sm font-semibold tracking-wide uppercase opacity-50'>Resumen</h2>
            <div className='mt-4 space-y-3'>
              {items.map((item) => (
                <div
                  key={item.variantId ? `${item.productId}:${item.variantId}` : item.productId}
                  className='flex items-center gap-3'
                >
                  <div
                    className='relative size-12 shrink-0 overflow-hidden'
                    style={{
                      borderRadius: 'var(--sf-radius, 0.75rem)',
                      backgroundColor: 'var(--sf-surface, #f9fafb)',
                    }}
                  >
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill sizes='48px' className='object-cover' />
                    ) : (
                      <div className='flex size-full items-center justify-center'>
                        <ImageOff className='size-4 text-gray-300' />
                      </div>
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>
                      {item.name}
                      {item.variantName && (
                        <span className='block text-[11px] font-normal opacity-50'>{item.variantName}</span>
                      )}
                    </p>
                    <p className='text-xs opacity-50'>x{item.quantity}</p>
                  </div>
                  <span className='shrink-0 text-sm font-medium'>
                    {formatPrice(parseFloat(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon input */}
            <div className='mt-4 pt-4' style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}>
              {appliedCoupon ? (
                <div className='flex items-center justify-between rounded-lg bg-green-50 px-3 py-2'>
                  <div className='flex items-center gap-2'>
                    <TicketPercent className='size-4 text-green-600' />
                    <span className='text-sm font-medium text-green-700'>{appliedCoupon.code}</span>
                    <span className='text-xs text-green-600'>-{formatPrice(discount)}</span>
                  </div>
                  <button type='button' onClick={() => setAppliedCoupon(null)} className='text-green-600'>
                    <X className='size-4' />
                  </button>
                </div>
              ) : (
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    placeholder='Cupón'
                    className='min-w-0 flex-1 px-3 py-2 font-mono text-sm tracking-wider uppercase outline-none'
                    style={{
                      borderRadius: 'var(--sf-radius, 0.75rem)',
                      border: '1px solid var(--sf-border, #e5e7eb)',
                    }}
                  />
                  <button
                    type='button'
                    disabled={validatingCoupon || !couponCode.trim()}
                    className='shrink-0 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40'
                    style={{
                      backgroundColor: 'var(--sf-primary, #000)',
                      borderRadius: 'var(--sf-radius, 0.75rem)',
                    }}
                    onClick={async () => {
                      setValidatingCoupon(true);
                      setCouponError('');
                      const res = await validateCouponAction(businessId, couponCode, subtotal);
                      setValidatingCoupon(false);
                      if (res.error) {
                        setCouponError(res.error);
                      } else if (res.data) {
                        setAppliedCoupon(res.data);
                        setCouponCode('');
                      }
                    }}
                  >
                    {validatingCoupon ? <Loader2 className='size-3 animate-spin' /> : 'Aplicar'}
                  </button>
                </div>
              )}
              {couponError && <p className='mt-1 text-xs text-red-500'>{couponError}</p>}
            </div>

            {/* Totals */}
            <div className='mt-3 space-y-1'>
              <div className='flex items-center justify-between text-sm opacity-60'>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className='flex items-center justify-between text-sm text-green-600'>
                  <span>Descuento</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div
                className='flex items-center justify-between pt-2'
                style={{ borderTop: '1px solid var(--sf-border, #e5e7eb)' }}
              >
                <span className='font-medium'>Total</span>
                <span className='text-lg font-bold'>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit button full width */}
        <button
          type='submit'
          disabled={isPending}
          className='mt-8 flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50'
          style={{
            backgroundColor: 'var(--sf-primary, #000)',
            borderRadius: 'var(--sf-radius, 0.75rem)',
          }}
        >
          {isPending ? (
            <>
              <Loader2 className='size-4 animate-spin' />
              Procesando...
            </>
          ) : whatsappNumber ? (
            <>
              <MessageCircle className='size-4' />
              Enviar pedido por WhatsApp
            </>
          ) : (
            'Confirmar pedido'
          )}
        </button>
      </form>
    </div>
  );
}
