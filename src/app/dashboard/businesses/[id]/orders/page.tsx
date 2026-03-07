import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { OrdersTable } from '@/modules/orders/ui/components/orders-table';
import { getOrdersByBusinessAction } from '@/modules/orders/server/actions/get-orders.action';

interface OrdersPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id: businessId } = await params;
  const result = await getOrdersByBusinessAction(businessId);

  if (result.error || !result.orders) notFound();

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Pedidos</h1>
        <p className='text-muted-foreground text-sm'>Gestiona los pedidos recibidos de tus clientes.</p>
      </div>

      <OrdersTable orders={result.orders} />
    </div>
  );
}
