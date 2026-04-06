import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { GiftCardsDashboard } from '@/modules/gift-cards/ui/components/gift-cards-dashboard';

interface GiftCardsPageProps {
  params: Promise<{ id: string }>;
}

export default async function GiftCardsPage({ params }: GiftCardsPageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id: businessId } = await params;

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Gift Cards</h1>
        <p className='text-muted-foreground text-sm'>Crea y gestiona gift cards para tus clientes.</p>
      </div>

      <GiftCardsDashboard businessId={businessId} />
    </div>
  );
}
