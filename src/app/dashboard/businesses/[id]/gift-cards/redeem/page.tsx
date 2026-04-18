import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { GiftCardsDashboard } from '@/modules/gift-cards/ui/components/gift-cards-dashboard';

interface RedeemPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}

export default async function GiftCardRedeemPage({ params, searchParams }: RedeemPageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id: businessId } = await params;
  const { code } = await searchParams;

  const initialCode = code?.trim().toUpperCase() || undefined;

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Canjear Gift Card</h1>
        <p className='text-muted-foreground text-sm'>
          Valida y canjea gift cards de forma presencial. Ideal para promociones y canjes en local.
        </p>
      </div>

      <GiftCardsDashboard businessId={businessId} initialRedeemCode={initialCode} />
    </div>
  );
}
