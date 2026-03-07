'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, ImageOff, ArrowLeft, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCartStore } from '@/modules/storefront/stores/cart-store';
import { createOrderAction } from '@/modules/storefront/server/actions/create-order.action';

interface CheckoutFormProps {
  slug: string;
  businessId: string;
  catalogId: string;
  businessName: string;
  whatsappNumber: string | null;
}

export function CheckoutForm({ slug, businessId, catalogId, businessName, whatsappNumber }: CheckoutFormProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const total = getTotal();

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(amount);

  const buildWhatsAppMessage = () => {
    let msg = `🛒 *Nuevo pedido — ${businessName}*\n\n`;
    msg += `👤 *Cliente:* ${name}\n`;
    if (phone) msg += `📞 *Teléfono:* ${phone}\n`;
    if (email) msg += `📧 *Email:* ${email}\n`;
    msg += `\n📦 *Productos:*\n`;
    items.forEach((item) => {
      msg += `• ${item.name} x${item.quantity} — ${formatPrice(parseFloat(item.price) * item.quantity)}\n`;
    });
    msg += `\n💰 *Total: ${formatPrice(total)}*`;
    if (notes) msg += `\n\n📝 *Notas:* ${notes}`;
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
          productName: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
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
        <Button asChild variant='outline' className='rounded-full'>
          <Link href={`/${slug}`}>Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8'>
      <Link
        href={`/${slug}`}
        className='mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900'
      >
        <ArrowLeft className='size-4' />
        Seguir comprando
      </Link>

      <h1 className='mb-8 text-2xl font-bold'>Finalizar pedido</h1>

      <div className='grid gap-8 lg:grid-cols-5'>
        {/* Order summary */}
        <div className='lg:col-span-2'>
          <h2 className='mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase'>Resumen</h2>
          <div className='space-y-3'>
            {items.map((item) => (
              <div key={item.productId} className='flex items-center gap-3'>
                <div className='relative size-12 shrink-0 overflow-hidden rounded-lg bg-gray-50'>
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill sizes='48px' className='object-cover' />
                  ) : (
                    <div className='flex size-full items-center justify-center'>
                      <ImageOff className='size-4 text-gray-300' />
                    </div>
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{item.name}</p>
                  <p className='text-xs text-gray-500'>x{item.quantity}</p>
                </div>
                <span className='text-sm font-medium'>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className='mt-4 flex items-center justify-between border-t pt-4'>
            <span className='font-medium'>Total</span>
            <span className='text-lg font-bold'>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Customer form */}
        <form onSubmit={handleSubmit} className='space-y-4 lg:col-span-3'>
          <h2 className='mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase'>Tus datos</h2>

          <div>
            <label htmlFor='name' className='mb-1 block text-sm font-medium text-gray-700'>
              Nombre *
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Tu nombre completo'
              required
              className='w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-colors outline-none focus:border-gray-400'
            />
          </div>

          <div>
            <label htmlFor='phone' className='mb-1 block text-sm font-medium text-gray-700'>
              Teléfono
            </label>
            <input
              id='phone'
              type='tel'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='+1 809 000 0000'
              className='w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-colors outline-none focus:border-gray-400'
            />
          </div>

          <div>
            <label htmlFor='email' className='mb-1 block text-sm font-medium text-gray-700'>
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='tu@email.com'
              className='w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-colors outline-none focus:border-gray-400'
            />
          </div>

          <div>
            <label htmlFor='notes' className='mb-1 block text-sm font-medium text-gray-700'>
              Notas adicionales
            </label>
            <textarea
              id='notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Instrucciones especiales, dirección de entrega, etc.'
              rows={3}
              className='w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-colors outline-none focus:border-gray-400'
            />
          </div>

          <Button type='submit' disabled={isPending} className='w-full rounded-full' size='lg'>
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
          </Button>
        </form>
      </div>
    </div>
  );
}
