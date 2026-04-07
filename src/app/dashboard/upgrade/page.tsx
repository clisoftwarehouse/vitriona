import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { UpgradeCheckout } from '@/modules/upgrade/ui/components/upgrade-checkout';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';

export const metadata = {
  title: 'Solicitar Upgrade — Vitriona',
};

interface UpgradePageProps {
  searchParams: Promise<{ businessId?: string }>;
}

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { businessId } = await searchParams;

  const businesses = await getBusinessesAction();
  const eligibleBusinesses = businesses
    .filter((b) => b.plan === 'free' || b.plan === 'pro')
    .map((b) => ({ id: b.id, name: b.name, plan: b.plan }));

  return (
    <div className='mx-auto flex max-w-4xl flex-col gap-8 py-2'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Solicitar Upgrade</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Selecciona el plan, realiza el pago y completa el formulario. Verificaremos tu pago y activaremos tu plan.
        </p>
      </div>
      <UpgradeCheckout
        businesses={eligibleBusinesses}
        userEmail={session.user.email ?? ''}
        preselectedBusinessId={businessId}
      />
    </div>
  );
}
