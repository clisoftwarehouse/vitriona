import { Eye, DollarSign, TrendingUp, ArrowUpRight, ShoppingCart } from 'lucide-react';

import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { DashboardGreeting } from '@/modules/dashboard/ui/components/dashboard-greeting';
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from '@/components/ui/table';

const STATS = [
  {
    label: 'Ingresos totales',
    value: '$48,294',
    change: '+12.5%',
    sub: 'vs mes anterior',
    icon: DollarSign,
  },
  {
    label: 'Órdenes activas',
    value: '342',
    change: '+8.2%',
    sub: 'vs mes anterior',
    icon: ShoppingCart,
  },
  {
    label: 'Visitas de página',
    value: '12.4K',
    change: '+24.1%',
    sub: 'vs mes anterior',
    icon: Eye,
  },
];

const RECENT_ORDERS = [
  {
    id: '#ORD-7291',
    customer: 'Alex Morgan',
    product: 'Lámpara de escritorio',
    amount: '$129.00',
    status: 'Entregado',
  },
  { id: '#ORD-7290', customer: 'Sarah Chen', product: 'Set de jarrones', amount: '$89.00', status: 'En proceso' },
  { id: '#ORD-7289', customer: 'James Wilson', product: 'Bolso de cuero', amount: '$245.00', status: 'Enviado' },
  { id: '#ORD-7288', customer: 'Emily Park', product: 'Manta de lana', amount: '$175.00', status: 'Entregado' },
  { id: '#ORD-7287', customer: 'Michael Lee', product: 'Candelero de latón', amount: '$64.00', status: 'En proceso' },
] as const;

type OrderStatus = (typeof RECENT_ORDERS)[number]['status'];

const STATUS_CLASSES: Record<OrderStatus, string> = {
  Entregado:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  'En proceso':
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Enviado: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-400',
};

const DashboardPage = async () => {
  const session = await auth();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'usuario';

  return (
    <div className='flex flex-col gap-6'>
      <DashboardGreeting firstName={firstName} />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        {STATS.map(({ label, value, change, sub, icon: Icon }) => (
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
                <span className='flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                  <TrendingUp className='size-3' />
                  {change}
                </span>
              </div>
              <p className='text-muted-foreground mt-1 text-xs'>{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='gap-0 py-0'>
        <CardHeader className='flex flex-row items-center justify-between border-b px-6 py-4'>
          <h3 className='font-semibold'>Órdenes recientes</h3>
          <a
            href='#'
            className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors'
          >
            Ver todo
            <ArrowUpRight className='size-3.5' />
          </a>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table className='min-w-[560px]'>
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
                {RECENT_ORDERS.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className='pl-6 font-medium'>{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className='text-muted-foreground'>{order.product}</TableCell>
                    <TableCell className='font-medium'>{order.amount}</TableCell>
                    <TableCell className='pr-6'>
                      <Badge variant='outline' className={STATUS_CLASSES[order.status]}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
