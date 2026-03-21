import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { CouponsDashboard } from '@/modules/coupons/ui/components/coupons-dashboard';

interface CouponsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CouponsPage({ params }: CouponsPageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id: businessId } = await params;

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Cupones</h1>
        <p className='text-muted-foreground text-sm'>Crea y gestiona cupones de descuento para tus clientes.</p>
      </div>

      <CouponsDashboard businessId={businessId} />
    </div>
  );
}
