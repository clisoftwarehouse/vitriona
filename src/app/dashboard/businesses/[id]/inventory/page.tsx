import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { InventoryDashboard } from '@/modules/inventory/ui/components/inventory-dashboard';

interface InventoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id: businessId } = await params;

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Inventario</h1>
        <p className='text-muted-foreground text-sm'>Gestiona el stock de tus productos.</p>
      </div>

      <InventoryDashboard businessId={businessId} />
    </div>
  );
}
