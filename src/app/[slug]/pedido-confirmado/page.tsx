import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ConfirmationPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const { slug } = await params;
  const { tipo } = await searchParams;
  const isReservation = tipo === 'reservation';

  return (
    <div className='mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center'>
      <div className='mb-6 flex size-16 items-center justify-center rounded-full bg-green-100'>
        <CheckCircle className='size-8 text-green-600' />
      </div>
      <h1 className='mb-2 text-2xl font-bold'>{isReservation ? '¡Reserva enviada!' : '¡Pedido enviado!'}</h1>
      <p className='mb-8 opacity-60'>
        {isReservation
          ? 'Tu reserva ha sido registrada exitosamente. El negocio validará la disponibilidad y se pondrá en contacto contigo pronto.'
          : 'Tu pedido ha sido registrado exitosamente. El negocio se pondrá en contacto contigo pronto.'}
      </p>
      <Button asChild className='rounded-full' size='lg'>
        <Link href={`/${slug}`}>Volver al catálogo</Link>
      </Button>
    </div>
  );
}
