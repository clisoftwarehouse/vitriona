import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ConfirmationPageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  const { slug } = await params;

  return (
    <div className='mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center'>
      <div className='mb-6 flex size-16 items-center justify-center rounded-full bg-green-100'>
        <CheckCircle className='size-8 text-green-600' />
      </div>
      <h1 className='mb-2 text-2xl font-bold'>¡Pedido enviado!</h1>
      <p className='mb-8 opacity-60'>
        Tu pedido ha sido registrado exitosamente. El negocio se pondrá en contacto contigo pronto.
      </p>
      <Button asChild className='rounded-full' size='lg'>
        <Link href={`/${slug}`}>Volver al catálogo</Link>
      </Button>
    </div>
  );
}
