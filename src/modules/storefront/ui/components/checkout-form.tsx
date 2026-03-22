'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useSyncExternalStore } from 'react';
import { X, Copy, Upload, Loader2, ImageOff, ArrowLeft, CreditCard, MessageCircle, TicketPercent } from 'lucide-react';

import { useCartStore } from '@/modules/storefront/stores/cart-store';
import { validateCouponAction } from '@/modules/coupons/server/actions/coupon-actions';
import { createOrderAction } from '@/modules/storefront/server/actions/create-order.action';

interface PaymentMethodData {
  id: string;
  name: string;
  instructions: string | null;
  fields: { label: string; value: string }[];
}

interface CheckoutFormProps {
  slug: string;
  businessId: string;
  catalogId: string;
  businessName: string;
  whatsappNumber: string | null;
  currency: string;
  paymentMethods: PaymentMethodData[];
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
  paymentMethods,
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

  // Payment method state
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    paymentMethods.length === 1 ? paymentMethods[0].id : null
  );
  const [paymentProof, setPaymentProof] = useState<Record<string, string>>({});
  const [uploadingProof, setUploadingProof] = useState(false);

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId) ?? null;

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
    if (selectedMethod) msg += `\n\nMétodo de pago: ${selectedMethod.name}`;
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
        paymentMethodId: selectedMethod?.id,
        paymentMethodName: selectedMethod?.name,
        paymentDetails: Object.keys(paymentProof).length > 0 ? paymentProof : undefined,
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
    <div className={`mx-auto px-4 py-6 sm:px-6 sm:py-8 ${paymentMethods.length > 0 ? 'max-w-6xl' : 'max-w-2xl'}`}>
      <Link
        href={`/${slug}`}
        className='mb-6 inline-flex items-center gap-1.5 text-sm opacity-50 transition-opacity hover:opacity-100'
      >
        <ArrowLeft className='size-4' />
        Seguir comprando
      </Link>

      <h1 className='mb-8 text-2xl font-bold'>Finalizar pedido</h1>

      <form onSubmit={handleSubmit}>
        <div className={`grid gap-8 ${paymentMethods.length > 0 ? 'lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {/* Column 1: Customer data */}
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

          {/* Column 2: Payment methods */}
          {paymentMethods.length > 0 && (
            <div className='space-y-4'>
              <h2 className='text-sm font-semibold tracking-wide uppercase opacity-50'>Método de pago</h2>
              <div className='space-y-2'>
                {paymentMethods.map((method) => (
                  <div key={method.id}>
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedMethodId(method.id);
                        setPaymentProof({});
                      }}
                      className='flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-all'
                      style={{
                        borderRadius: 'var(--sf-radius, 0.75rem)',
                        border:
                          selectedMethodId === method.id
                            ? '2px solid var(--sf-primary, #000)'
                            : '1px solid var(--sf-border, #e5e7eb)',
                      }}
                    >
                      <CreditCard className='size-4 shrink-0 opacity-50' />
                      <span className='font-medium'>{method.name}</span>
                    </button>

                    {selectedMethodId === method.id && (
                      <div className='mt-2 space-y-3 px-1' style={{ animation: 'fadeIn 0.2s ease-out' }}>
                        {method.instructions && <p className='text-xs opacity-60'>{method.instructions}</p>}
                        {method.fields.length > 0 && (
                          <div className='space-y-1.5'>
                            <p className='text-xs font-semibold opacity-50'>Datos para el pago:</p>
                            {method.fields.map((field, i) => (
                              <div
                                key={i}
                                className='flex items-center justify-between rounded-lg px-3 py-2 text-sm'
                                style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
                              >
                                <span className='opacity-60'>{field.label}</span>
                                <div className='flex items-center gap-1.5'>
                                  <span className='font-mono text-xs font-medium'>{field.value}</span>
                                  <button
                                    type='button'
                                    onClick={() => {
                                      navigator.clipboard.writeText(field.value);
                                      toast.success(`${field.label} copiado`);
                                    }}
                                    className='opacity-40 hover:opacity-100'
                                  >
                                    <Copy className='size-3' />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                          <label className='mb-1 block text-xs font-medium opacity-60'>Nro. de referencia</label>
                          <input
                            type='text'
                            value={paymentProof.reference ?? ''}
                            onChange={(e) => setPaymentProof({ ...paymentProof, reference: e.target.value })}
                            placeholder='Ej: 00012345678'
                            className='w-full px-3 py-2 text-sm outline-none'
                            style={{
                              borderRadius: 'var(--sf-radius, 0.75rem)',
                              border: '1px solid var(--sf-border, #e5e7eb)',
                            }}
                          />
                        </div>
                        <div>
                          <label className='mb-1 block text-xs font-medium opacity-60'>
                            Comprobante de pago (imagen)
                          </label>
                          {paymentProof.proofImageUrl ? (
                            <div
                              className='relative overflow-hidden'
                              style={{ borderRadius: 'var(--sf-radius, 0.75rem)' }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={paymentProof.proofImageUrl}
                                alt='Comprobante'
                                className='max-h-48 w-full object-contain'
                                style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
                              />
                              <button
                                type='button'
                                onClick={() => {
                                  const { proofImageUrl: _removed, ...rest } = paymentProof;
                                  void _removed;
                                  setPaymentProof(rest);
                                }}
                                className='absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-red-600'
                              >
                                <X className='size-3.5' />
                              </button>
                            </div>
                          ) : (
                            <label
                              className={`flex cursor-pointer items-center justify-center gap-2 px-3 py-3 text-sm transition-colors ${
                                uploadingProof ? 'pointer-events-none opacity-50' : ''
                              }`}
                              style={{
                                borderRadius: 'var(--sf-radius, 0.75rem)',
                                border: '1px dashed var(--sf-border, #e5e7eb)',
                              }}
                            >
                              {uploadingProof ? (
                                <Loader2 className='size-4 animate-spin opacity-50' />
                              ) : (
                                <Upload className='size-4 opacity-50' />
                              )}
                              <span className='opacity-60'>{uploadingProof ? 'Subiendo...' : 'Subir comprobante'}</span>
                              <input
                                type='file'
                                accept='image/jpeg,image/png,image/webp'
                                className='hidden'
                                disabled={uploadingProof}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 3 * 1024 * 1024) {
                                    toast.error('La imagen no debe exceder 3MB');
                                    return;
                                  }
                                  setUploadingProof(true);
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const res = await fetch('/api/upload-payment-proof', {
                                      method: 'POST',
                                      body: formData,
                                    });
                                    if (!res.ok) {
                                      const err = await res.json();
                                      toast.error(err.error || 'Error al subir imagen');
                                      return;
                                    }
                                    const blob = await res.json();
                                    setPaymentProof((prev) => ({ ...prev, proofImageUrl: blob.url }));
                                  } catch {
                                    toast.error('Error al subir la imagen');
                                  } finally {
                                    setUploadingProof(false);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          )}
                          <p className='mt-1 text-[10px] opacity-40'>JPG, PNG o WebP. Máx 3MB.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Column 3: Order summary */}
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

            {/* Submit button inside summary column */}
            <button
              type='submit'
              disabled={isPending}
              className='mt-6 flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50'
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
          </div>
        </div>
      </form>
    </div>
  );
}
