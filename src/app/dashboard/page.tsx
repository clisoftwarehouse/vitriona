import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, TrendingUp, TrendingDown, ArrowUpRight, ShoppingCart, MessageSquare } from 'lucide-react';

import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { TopProducts } from '@/modules/dashboard/ui/components/top-products';
import { RevenueChart } from '@/modules/dashboard/ui/components/revenue-chart';
import { UsageOverview } from '@/modules/dashboard/ui/components/usage-overview';
import { getUsageStats } from '@/modules/dashboard/server/queries/get-usage-stats';
import { DashboardGreeting } from '@/modules/dashboard/ui/components/dashboard-greeting';
import { getDashboardStats } from '@/modules/dashboard/server/queries/get-dashboard-stats';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getActiveBusinessId } from '@/modules/businesses/server/actions/set-active-business.action';
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from '@/components/ui/table';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  payment_verified: 'Pago verificado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_CLASSES: Record<string, string> = {
  pending_payment:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  payment_verified: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400',
  preparing:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400',
  shipped: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-400',
  delivered:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  cancelled: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400',
};

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es', { style: 'currency', currency }).format(amount);
}

const DashboardPage = async () => {
  const [session, businessList] = await Promise.all([auth(), getBusinessesAction()]);

  if (businessList.length === 0) redirect('/dashboard/businesses/new');

  const firstName = session?.user?.name?.split(' ')[0] ?? 'usuario';

  // Resolve active business
  const activeId = await getActiveBusinessId();
  const businessId = activeId ?? businessList[0].id;

  const [data, usageData] = await Promise.all([getDashboardStats(businessId), getUsageStats(businessId)]);

  const stats = data?.stats;
  const recentOrders = data?.recentOrders.slice(0, 5) ?? [];
  const currency = data?.currency ?? 'USD';

  const dailyRevenue = data?.dailyRevenue ?? [];
  const topSellingProducts = data?.topSellingProducts.slice(0, 4) ?? [];

  const ordersChange = stats ? pctChange(stats.orders.current, stats.orders.previous) : '0%';
  const ordersUp = stats ? stats.orders.current >= stats.orders.previous : true;

  const statCards = [
    {
      label: 'Pedidos del mes',
      value: String(stats?.orders.current ?? 0),
      change: ordersChange,
      up: ordersUp,
      sub: 'vs mes anterior',
      icon: ShoppingCart,
    },
    {
      label: 'Productos activos',
      value: String(stats?.products.active ?? 0),
      change: `${stats?.products.total ?? 0} total`,
      up: true,
      sub: '',
      icon: Package,
    },
    {
      label: 'Reseñas pendientes',
      value: String(stats?.reviews.pending ?? 0),
      change: '',
      up: true,
      sub: 'por aprobar',
      icon: MessageSquare,
    },
  ];

  return (
    <div className='flex flex-col gap-2'>
      <DashboardGreeting firstName={firstName} />

      <div className='mt-2 grid grid-cols-1 gap-2 lg:grid-cols-3'>
        <div className='col-span-2 grid gap-2'>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
            {statCards.map(({ label, value, change, up, sub, icon: Icon }) => (
              <Card key={label} className='gap-4 py-5'>
                <CardHeader className='px-5 pb-0'>
                  <div className='flex items-start justify-between'>
                    <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>{label}</p>
                    <div className='bg-muted flex size-8 items-center justify-center rounded-lg'>
                      <Icon className='text-muted-foreground size-4' />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='px-5'>
                  <div className='flex items-baseline gap-2'>
                    <span className='text-2xl font-bold tracking-tight'>{value}</span>
                    {change && (
                      <span
                        className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
                      >
                        {up ? <TrendingUp className='size-3' /> : <TrendingDown className='size-3' />}
                        {change}
                      </span>
                    )}
                  </div>
                  {sub && <p className='text-muted-foreground mt-1 text-xs'>{sub}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
          <RevenueChart data={dailyRevenue} currency={currency} />
        </div>
        {usageData && <UsageOverview data={usageData} />}
      </div>

      <div className='grid grid-cols-1 gap-2 lg:grid-cols-3'>
        <div className='lg:col-span-1'>
          <TopProducts products={topSellingProducts} currency={currency} />
        </div>
        <Card className='gap-0 py-0 lg:col-span-2'>
          <CardHeader className='flex flex-row items-center justify-between border-b px-6 py-4'>
            <h3 className='font-semibold'>Pedidos recientes</h3>
            <Link
              href={`/dashboard/businesses/${businessId}/orders`}
              className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors'
            >
              Ver todos
              <ArrowUpRight className='size-3.5' />
            </Link>
          </CardHeader>
          <CardContent className='p-0'>
            {recentOrders.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <ShoppingCart className='text-muted-foreground mb-3 size-8 opacity-30' />
                <p className='text-muted-foreground text-sm'>No hay pedidos aún.</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table className='min-w-140'>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead className='pl-6'>Orden</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead className='pr-6'>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className='pl-6 font-medium'>#{order.orderNumber}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell className='text-muted-foreground'>{order.firstProductName ?? '—'}</TableCell>
                        <TableCell className='font-medium'>
                          {formatCurrency(parseFloat(order.total), currency)}
                        </TableCell>
                        <TableCell className='pr-6'>
                          <Badge variant='outline' className={STATUS_CLASSES[order.status] ?? ''}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
