'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useSyncExternalStore } from 'react';
import {
  X,
  Copy,
  Gift,
  Clock,
  Truck,
  Upload,
  Loader2,
  ImageOff,
  ArrowLeft,
  CreditCard,
  CalendarIcon,
  MessageCircle,
  TicketPercent,
} from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { useCartStore } from '@/modules/storefront/stores/cart-store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { validateCouponAction } from '@/modules/coupons/server/actions/coupon-actions';
import { createOrderAction } from '@/modules/storefront/server/actions/create-order.action';
import { validateGiftCardAction } from '@/modules/gift-cards/server/actions/gift-card-actions';
import {
  type OrderType,
  formatReservationDateTime,
  validateReservationSelection,
} from '@/modules/orders/lib/reservations';

const TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
];

interface PaymentMethodData {
  id: string;
  name: string;
  instructions: string | null;
  fields: { label: string; value: string }[];
}

interface DeliveryMethodData {
  id: string;
  name: string;
  description: string | null;
  price: string;
  estimatedTime: string | null;
}

interface CheckoutFormProps {
  slug: string;
  businessId: string;
  catalogId: string;
  businessName: string;
  whatsappNumber: string | null;
  currency: string;
  paymentMethods: PaymentMethodData[];
  deliveryMethods: DeliveryMethodData[];
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
  deliveryMethods,
}: CheckoutFormProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const getItems = useCartStore((s) => s.getItems);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const items = getItems(slug);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('order');
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  // Payment method state
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    paymentMethods.length === 1 ? paymentMethods[0].id : null
  );
  const [paymentProof, setPaymentProof] = useState<Record<string, string>>({});
  const [uploadingProof, setUploadingProof] = useState(false);

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId) ?? null;

  // Delivery method state
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    deliveryMethods.length === 1 ? deliveryMethods[0].id : null
  );
  const selectedDelivery = deliveryMethods.find((d) => d.id === selectedDeliveryId) ?? null;
  const shippingCost = selectedDelivery ? parseFloat(selectedDelivery.price) : 0;

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

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardError, setGiftCardError] = useState('');
  const [validatingGiftCard, setValidatingGiftCard] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    giftCardId: string;
    code: string;
    discount: number;
    currentBalance: number;
  } | null>(null);

  const subtotal = hydrated ? getTotal(slug) : 0;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const giftCardDiscount = appliedGiftCard?.discount ?? 0;
  const discount = couponDiscount + giftCardDiscount;
  const total = Math.max(0, subtotal - discount + shippingCost);
  const isReservation = orderType === 'reservation';

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency, useGrouping: true }).format(amount);

  const buildWhatsAppMessage = () => {
    let msg = `Hola! Acabo de hacer una ${isReservation ? 'reserva' : 'pedido'} en ${businessName}.\n\n`;
    msg += `Nombre: ${name}\n`;
    if (phone) msg += `Teléfono: ${phone}\n`;
    if (email) msg += `Email: ${email}\n`;
    if (isReservation && reservationDate && reservationTime) {
      msg += `Reserva para: ${formatReservationDateTime(reservationDate, reservationTime)}\n`;
    }
    msg += `\n${isReservation ? 'Items reservados' : 'Productos'}:\n`;
    items.forEach((item) => {
      const label = item.variantName ? `${item.name} (${item.variantName})` : item.name;
      msg += `- ${label} x${item.quantity}  ${formatPrice(parseFloat(item.price) * item.quantity)}\n`;
    });
    if (appliedCoupon) msg += `\nCupón: ${appliedCoupon.code} (-${formatPrice(discount)})`;
    msg += `\nTotal: ${formatPrice(total)}`;
    if (shippingCost > 0) msg += `\nEnvío: ${formatPrice(shippingCost)}`;
    if (selectedMethod) msg += `\n\nMétodo de pago: ${selectedMethod.name}`;
    if (selectedDelivery) msg += `\nEntrega: ${selectedDelivery.name}`;
    if (notes) msg += `\n\n${isReservation ? 'Detalles adicionales' : 'Nota'}: ${notes}`;
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

    const reservationValidation = validateReservationSelection({
      orderType,
      reservationDate,
      reservationTime,
    });
    if (!reservationValidation.ok) {
      toast.error(reservationValidation.error);
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
        orderType,
        reservationDate: isReservation ? reservationDate : undefined,
        reservationTime: isReservation ? reservationTime : undefined,
        checkoutType: whatsappNumber ? 'whatsapp' : 'internal',
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.variantName ? `${item.name} (${item.variantName})` : item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          bundleSelections: item.bundleSelections,
        })),
        couponId: appliedCoupon?.couponId,
        couponCode: appliedCoupon?.code,
        discount,
        paymentMethodId: selectedMethod?.id,
        paymentMethodName: selectedMethod?.name,
        paymentDetails: Object.keys(paymentProof).length > 0 ? paymentProof : undefined,
        deliveryMethodId: selectedDelivery?.id,
        deliveryMethodName: selectedDelivery?.name,
        shippingCost,
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

      clearCart(slug);
      toast.success(isReservation ? '¡Reserva enviada con éxito!' : '¡Pedido enviado con éxito!');
      router.push(`/${slug}/pedido-confirmado?tipo=${orderType}`);
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
    <div
      className={`mx-auto overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 ${paymentMethods.length > 0 || deliveryMethods.length > 0 ? 'max-w-6xl' : 'max-w-2xl'}`}
    >
      <Link
        href={`/${slug}`}
        className='mb-6 inline-flex items-center gap-1.5 text-sm opacity-50 transition-opacity hover:opacity-100'
      >
        <ArrowLeft className='size-3.5' />
        Seguir comprando
      </Link>

      <h1 className='mb-1 text-2xl font-bold'>{isReservation ? 'Confirmar reserva' : 'Finalizar pedido'}</h1>
      <p className='mb-8 text-sm opacity-45'>
        {isReservation ? 'Completa tus datos para solicitar la reserva.' : 'Revisa tu pedido y completa tus datos.'}
      </p>

      <form onSubmit={handleSubmit}>
        <div
          className={`grid gap-8 ${paymentMethods.length > 0 || deliveryMethods.length > 0 ? 'lg:grid-cols-[1fr_1fr_1fr]' : 'sm:grid-cols-2'}`}
        >
          {/* Column 1: Customer data */}
          <div className='min-w-0 space-y-4'>
            <h2 className='text-sm font-semibold tracking-wide uppercase opacity-50'>Tus datos</h2>
            {/* Order type segmented toggle */}
            <div
              className='overflow-hidden'
              style={{
                borderRadius: 'var(--sf-radius, 0.75rem)',
                border: '1px solid var(--sf-border, #e5e7eb)',
              }}
            >
              <div className='grid grid-cols-2' style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}>
                <button
                  type='button'
                  onClick={() => setOrderType('order')}
                  className='relative px-3 py-2.5 text-sm font-medium transition-all'
                  style={{
                    backgroundColor: orderType === 'order' ? 'var(--sf-bg, #fff)' : 'transparent',
                    color: orderType === 'order' ? 'var(--sf-text, #111827)' : undefined,
                    opacity: orderType === 'order' ? 1 : 0.55,
                    boxShadow: orderType === 'order' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Pedido normal
                </button>
                <button
                  type='button'
                  onClick={() => setOrderType('reservation')}
                  className='relative px-3 py-2.5 text-sm font-medium transition-all'
                  style={{
                    backgroundColor: orderType === 'reservation' ? 'var(--sf-bg, #fff)' : 'transparent',
                    color: orderType === 'reservation' ? 'var(--sf-text, #111827)' : undefined,
                    opacity: orderType === 'reservation' ? 1 : 0.55,
                    boxShadow: orderType === 'reservation' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Reserva
                </button>
              </div>
            </div>

            {isReservation && (
              <div
                className='space-y-3 px-4 py-4'
                style={{
                  borderRadius: 'var(--sf-radius, 0.75rem)',
                  border: '1px solid var(--sf-border, #e5e7eb)',
                  backgroundColor: 'var(--sf-surface, #f9fafb)',
                }}
              >
                <p className='flex items-center gap-2 text-xs font-semibold tracking-wide uppercase opacity-50'>
                  <CalendarIcon className='size-3.5' />
                  Fecha y hora
                </p>

                <div className='grid gap-3 sm:grid-cols-2'>
                  {/* Date picker with Calendar popover */}
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type='button'
                        className='flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors'
                        style={{
                          borderRadius: 'var(--sf-radius, 0.75rem)',
                          border: '1px solid var(--sf-border, #e5e7eb)',
                          backgroundColor: 'var(--sf-bg, #fff)',
                        }}
                      >
                        <CalendarIcon className='size-4 shrink-0 opacity-40' />
                        {calendarDate ? (
                          <span className='font-medium'>
                            {format(calendarDate, "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        ) : (
                          <span className='opacity-40'>Seleccionar fecha</span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className='w-auto'
                      align='start'
                      sideOffset={8}
                      style={
                        {
                          '--background': 'oklch(0.994 0 0)',
                          '--foreground': 'oklch(0 0 0)',
                          '--popover': 'oklch(0.9911 0 0)',
                          '--popover-foreground': 'oklch(0 0 0)',
                          '--primary': 'oklch(0.5393 0 271.7462)',
                          '--primary-foreground': 'oklch(1 0 0)',
                          '--accent': 'oklch(0.9393 0.0288 266.368)',
                          '--accent-foreground': 'oklch(0.5445 0.1903 259.4848)',
                          '--muted': 'oklch(0.9702 0 0)',
                          '--muted-foreground': 'oklch(0.4386 0 0)',
                          '--border': 'oklch(0.93 0.0094 286.2156)',
                          '--input': 'oklch(0.9401 0 0)',
                          '--ring': 'oklch(0 0 0)',
                          backgroundColor: 'oklch(0.9911 0 0)',
                          color: 'oklch(0 0 0)',
                          zIndex: 9999,
                          padding: 0,
                        } as React.CSSProperties
                      }
                    >
                      <Calendar
                        mode='single'
                        locale={es}
                        selected={calendarDate}
                        onSelect={(date) => {
                          setCalendarDate(date);
                          if (date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            setReservationDate(`${y}-${m}-${d}`);
                          } else {
                            setReservationDate('');
                          }
                          setCalendarOpen(false);
                        }}
                        disabled={{ before: new Date() }}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Time picker with Popover */}
                  <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type='button'
                        className='flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors'
                        style={{
                          borderRadius: 'var(--sf-radius, 0.75rem)',
                          border: '1px solid var(--sf-border, #e5e7eb)',
                          backgroundColor: 'var(--sf-bg, #fff)',
                        }}
                      >
                        <Clock className='size-4 shrink-0 opacity-40' />
                        {reservationTime ? (
                          <span className='font-medium'>{reservationTime}</span>
                        ) : (
                          <span className='opacity-40'>Seleccionar hora</span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className='w-52 p-2'
                      align='start'
                      style={{ backgroundColor: '#fff', color: '#1f2937' }}
                    >
                      <div className='grid max-h-56 grid-cols-3 gap-1 overflow-y-auto'>
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            type='button'
                            onClick={() => {
                              setReservationTime(slot);
                              setTimeOpen(false);
                            }}
                            className='rounded-md px-2 py-1.5 text-xs font-medium transition-colors'
                            style={{
                              backgroundColor: reservationTime === slot ? 'var(--sf-primary, #000)' : 'transparent',
                              color: reservationTime === slot ? '#fff' : '#374151',
                            }}
                            onMouseEnter={(e) => {
                              if (reservationTime !== slot) e.currentTarget.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              if (reservationTime !== slot) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <p className='text-[11px] opacity-45'>El comercio confirmará la disponibilidad por su propia vía.</p>
              </div>
            )}

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
                className='w-full px-3 py-2.5 text-sm transition-shadow outline-none placeholder:opacity-40 focus:ring-2'
                style={
                  {
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    border: '1px solid var(--sf-border, #e5e7eb)',
                    '--tw-ring-color': 'color-mix(in srgb, var(--sf-primary, #000) 20%, transparent)',
                  } as React.CSSProperties
                }
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
                className='w-full px-3 py-2.5 text-sm transition-shadow outline-none placeholder:opacity-40 focus:ring-2'
                style={
                  {
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    border: '1px solid var(--sf-border, #e5e7eb)',
                    '--tw-ring-color': 'color-mix(in srgb, var(--sf-primary, #000) 20%, transparent)',
                  } as React.CSSProperties
                }
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
                className='w-full px-3 py-2.5 text-sm transition-shadow outline-none placeholder:opacity-40 focus:ring-2'
                style={
                  {
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    border: '1px solid var(--sf-border, #e5e7eb)',
                    '--tw-ring-color': 'color-mix(in srgb, var(--sf-primary, #000) 20%, transparent)',
                  } as React.CSSProperties
                }
              />
            </div>
            <div>
              <label htmlFor='notes' className='mb-1 block text-sm font-medium opacity-70'>
                {isReservation ? 'Detalles de la reserva' : 'Notas adicionales'}
              </label>
              <textarea
                id='notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isReservation
                    ? 'Ej: mesa para 4 personas, cumpleaños, área preferida...'
                    : 'Instrucciones especiales, dirección de entrega, etc.'
                }
                rows={3}
                className='w-full resize-none px-3 py-2.5 text-sm transition-shadow outline-none placeholder:opacity-40 focus:ring-2'
                style={
                  {
                    borderRadius: 'var(--sf-radius, 0.75rem)',
                    border: '1px solid var(--sf-border, #e5e7eb)',
                    '--tw-ring-color': 'color-mix(in srgb, var(--sf-primary, #000) 20%, transparent)',
                  } as React.CSSProperties
                }
              />
            </div>
          </div>

          {/* Column 2: Payment methods */}
          {paymentMethods.length > 0 && (
            <div className='min-w-0 space-y-4'>
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
                                className='flex items-center justify-between gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm'
                                style={{ backgroundColor: 'var(--sf-surface, #f9fafb)' }}
                              >
                                <span className='shrink-0 opacity-60'>{field.label}</span>
                                <div className='flex min-w-0 items-center gap-1.5'>
                                  <span className='truncate font-mono text-xs font-medium'>{field.value}</span>
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

          {/* Delivery methods */}
          {deliveryMethods.length > 0 && (
            <div className='min-w-0 space-y-4'>
              <h2 className='text-sm font-semibold tracking-wide uppercase opacity-50'>Método de entrega</h2>
              <div className='space-y-2'>
                {deliveryMethods.map((dm) => (
                  <button
                    key={dm.id}
                    type='button'
                    onClick={() => setSelectedDeliveryId(dm.id)}
                    className='flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-all'
                    style={{
                      borderRadius: 'var(--sf-radius, 0.75rem)',
                      border:
                        selectedDeliveryId === dm.id
                          ? '2px solid var(--sf-primary, #000)'
                          : '1px solid var(--sf-border, #e5e7eb)',
                    }}
                  >
                    <Truck className='size-4 shrink-0 opacity-50' />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-medium'>{dm.name}</span>
                        <span className='shrink-0 font-semibold'>
                          {parseFloat(dm.price) === 0 ? 'Gratis' : formatPrice(parseFloat(dm.price))}
                        </span>
                      </div>
                      {dm.description && <p className='mt-0.5 text-xs opacity-50'>{dm.description}</p>}
                      {dm.estimatedTime && (
                        <p className='mt-0.5 flex items-center gap-1 text-xs opacity-40'>
                          <Clock className='size-3' />
                          {dm.estimatedTime}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Column 3: Order summary */}
          <div className='min-w-0'>
            <h2 className='text-sm font-semibold tracking-wide uppercase opacity-50'>Resumen</h2>
            {isReservation && reservationDate && reservationTime && (
              <div
                className='mt-4 flex items-start gap-3 px-4 py-3'
                style={{
                  borderRadius: 'var(--sf-radius, 0.75rem)',
                  border: '1px solid var(--sf-border, #e5e7eb)',
                  borderLeft: '3px solid var(--sf-primary, #000)',
                  backgroundColor: 'var(--sf-surface, #f9fafb)',
                }}
              >
                <CalendarIcon className='mt-0.5 size-4 shrink-0 opacity-40' />
                <div className='min-w-0'>
                  <p className='text-[11px] font-semibold tracking-wide uppercase opacity-45'>Reserva para</p>
                  <p className='mt-0.5 text-sm leading-snug font-medium'>
                    {formatReservationDateTime(reservationDate, reservationTime)}
                  </p>
                </div>
              </div>
            )}
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
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes='48px'
                        className='object-cover'
                      />
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
                      const cartItemsForCoupon = items.map((item) => ({
                        productId: item.productId,
                        price: parseFloat(item.price),
                        quantity: item.quantity,
                      }));
                      const res = await validateCouponAction(businessId, couponCode, subtotal, cartItemsForCoupon);
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

            {/* Gift card */}
            <div>
              <div className='mb-1.5 flex items-center gap-1.5 text-xs font-medium opacity-70'>
                <Gift className='size-3.5' />
                Gift Card
              </div>
              {appliedGiftCard ? (
                <div className='flex items-center justify-between rounded-lg bg-green-50 px-3 py-2'>
                  <div>
                    <span className='font-mono text-xs font-semibold tracking-wider'>{appliedGiftCard.code}</span>
                    <span className='ml-2 text-xs text-green-600'>-{formatPrice(giftCardDiscount)}</span>
                  </div>
                  <button type='button' onClick={() => setAppliedGiftCard(null)} className='text-green-600'>
                    <X className='size-4' />
                  </button>
                </div>
              ) : (
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={giftCardCode}
                    onChange={(e) => {
                      setGiftCardCode(e.target.value.toUpperCase());
                      setGiftCardError('');
                    }}
                    placeholder='Código gift card'
                    className='min-w-0 flex-1 px-3 py-2 font-mono text-sm tracking-wider uppercase outline-none'
                    style={{
                      borderRadius: 'var(--sf-radius, 0.75rem)',
                      border: '1px solid var(--sf-border, #e5e7eb)',
                    }}
                  />
                  <button
                    type='button'
                    disabled={validatingGiftCard || !giftCardCode.trim()}
                    className='shrink-0 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40'
                    style={{
                      backgroundColor: 'var(--sf-primary, #000)',
                      borderRadius: 'var(--sf-radius, 0.75rem)',
                    }}
                    onClick={async () => {
                      setValidatingGiftCard(true);
                      setGiftCardError('');
                      const cartItemsForGC = items.map((item) => ({
                        productId: item.productId,
                        price: parseFloat(item.price),
                        quantity: item.quantity,
                      }));
                      const res = await validateGiftCardAction(businessId, giftCardCode, subtotal, cartItemsForGC);
                      setValidatingGiftCard(false);
                      if (res.error) {
                        setGiftCardError(res.error);
                      } else if (res.data) {
                        setAppliedGiftCard(res.data);
                        setGiftCardCode('');
                      }
                    }}
                  >
                    {validatingGiftCard ? <Loader2 className='size-3 animate-spin' /> : 'Aplicar'}
                  </button>
                </div>
              )}
              {giftCardError && <p className='mt-1 text-xs text-red-500'>{giftCardError}</p>}
            </div>

            {/* Totals */}
            <div className='mt-3 space-y-1'>
              <div className='flex items-center justify-between text-sm opacity-60'>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className='flex items-center justify-between text-sm text-green-600'>
                  <span>Cupón</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              {giftCardDiscount > 0 && (
                <div className='flex items-center justify-between text-sm text-green-600'>
                  <span>Gift Card</span>
                  <span>-{formatPrice(giftCardDiscount)}</span>
                </div>
              )}
              {shippingCost > 0 && (
                <div className='flex items-center justify-between text-sm opacity-60'>
                  <span>Envío</span>
                  <span>{formatPrice(shippingCost)}</span>
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
              className='mt-6 flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50'
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
                  {isReservation ? 'Enviar reserva por WhatsApp' : 'Enviar pedido por WhatsApp'}
                </>
              ) : isReservation ? (
                'Confirmar reserva'
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
