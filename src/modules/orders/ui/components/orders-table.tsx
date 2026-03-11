'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Eye, Clock, Truck, Package, XCircle, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { getOrderDetailAction } from '@/modules/orders/server/actions/get-orders.action';
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { cancelOrderAction, updateOrderStatusAction } from '@/modules/orders/server/actions/update-order-status.action';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  total: string;
  status: string;
  checkoutType: string;
  createdAt: Date;
}

interface OrderItem {
  id: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: Date;
}

interface OrdersTableProps {
  orders: Order[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }
> = {
  pending: { label: 'Pendiente', variant: 'outline', icon: Clock },
  confirmed: { label: 'Confirmado', variant: 'default', icon: CheckCircle },
  preparing: { label: 'Preparando', variant: 'secondary', icon: Package },
  shipped: { label: 'Enviado', variant: 'secondary', icon: Truck },
  delivered: { label: 'Entregado', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
};

const STATUS_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped', 'delivered'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const formatPrice = (price: string) =>
    new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(parseFloat(price));

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

  const handleViewDetail = async (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
    const result = await getOrderDetailAction(order.id);
    if (result.items) setOrderItems(result.items as OrderItem[]);
    if (result.statusHistory) setStatusHistory(result.statusHistory as StatusHistoryEntry[]);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, newStatus);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Estado actualizado');
      setDetailOpen(false);
      router.refresh();
    });
  };

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <>
      {/* Status filter pills */}
      <div className='flex flex-wrap gap-2'>
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Todos ({orders.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = orders.filter((o) => o.status === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <Package className='text-muted-foreground mx-auto size-10' />
            <p className='text-muted-foreground mt-3'>No hay pedidos todavía.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {filteredOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            return (
              <Card key={order.id} className='transition-shadow hover:shadow-sm'>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-mono text-sm font-semibold'>{order.orderNumber}</span>
                        <Badge variant={statusCfg.variant} className='gap-1'>
                          <StatusIcon className='size-3' />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p className='text-muted-foreground mt-1 text-sm'>
                        {order.customerName}
                        {order.customerPhone && ` · ${order.customerPhone}`}
                      </p>
                    </div>
                    <div className='text-right'>
                      <span className='text-lg font-bold'>{formatPrice(order.total)}</span>
                      <p className='text-muted-foreground text-xs'>{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='flex items-center justify-between'>
                    <Badge variant='outline' className='text-xs'>
                      {order.checkoutType === 'whatsapp' ? '📱 WhatsApp' : '📋 Interno'}
                    </Badge>
                    <Button variant='ghost' size='sm' onClick={() => handleViewDetail(order)}>
                      <Eye className='mr-1 size-3.5' />
                      Ver detalle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Pedido {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>{selectedOrder && formatDate(selectedOrder.createdAt)}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className='space-y-4'>
              <div>
                <h4 className='mb-1 text-sm font-semibold'>Cliente</h4>
                <p className='text-sm'>{selectedOrder.customerName}</p>
                {selectedOrder.customerPhone && (
                  <p className='text-muted-foreground text-sm'>{selectedOrder.customerPhone}</p>
                )}
                {selectedOrder.customerEmail && (
                  <p className='text-muted-foreground text-sm'>{selectedOrder.customerEmail}</p>
                )}
              </div>

              <div>
                <h4 className='mb-2 text-sm font-semibold'>Productos</h4>
                <div className='space-y-2'>
                  {orderItems.map((item) => (
                    <div key={item.id} className='flex items-center justify-between text-sm'>
                      <span>
                        {item.productName} <span className='text-muted-foreground'>x{item.quantity}</span>
                      </span>
                      <span className='font-medium'>{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className='mt-3 flex items-center justify-between border-t pt-3'>
                  <span className='font-semibold'>Total</span>
                  <span className='text-lg font-bold'>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Status History Timeline */}
              {statusHistory.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-semibold'>Historial</h4>
                  <div className='relative space-y-3 pl-4'>
                    <div className='bg-border absolute top-1 bottom-1 left-[7px] w-px' />
                    {statusHistory.map((entry) => {
                      const cfg = STATUS_CONFIG[entry.toStatus] ?? STATUS_CONFIG.pending;
                      return (
                        <div key={entry.id} className='relative flex items-start gap-2'>
                          <div
                            className='bg-background absolute top-1 -left-4 size-3 rounded-full border-2'
                            style={{ borderColor: entry.toStatus === 'cancelled' ? '#ef4444' : 'var(--primary)' }}
                          />
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-1.5'>
                              <span className='text-xs font-medium'>{cfg.label}</span>
                              <span className='text-muted-foreground text-[10px]'>{formatDate(entry.createdAt)}</span>
                            </div>
                            {entry.note && <p className='text-muted-foreground text-xs'>{entry.note}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator />

              {STATUS_TRANSITIONS[selectedOrder.status]?.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-semibold'>Cambiar estado</h4>
                  <div className='flex flex-wrap gap-2'>
                    {STATUS_TRANSITIONS[selectedOrder.status]
                      .filter((s) => s !== 'cancelled')
                      .map((newStatus) => {
                        const cfg = STATUS_CONFIG[newStatus];
                        return (
                          <Button
                            key={newStatus}
                            variant='outline'
                            size='sm'
                            disabled={isPending}
                            onClick={() => handleStatusChange(selectedOrder.id, newStatus)}
                          >
                            {cfg.label}
                          </Button>
                        );
                      })}
                    {STATUS_TRANSITIONS[selectedOrder.status].includes('cancelled') && (
                      <Button variant='destructive' size='sm' disabled={isPending} onClick={() => setCancelOpen(true)}>
                        <XCircle className='mr-1 size-3.5' />
                        Cancelar pedido
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>¿Estás seguro? El inventario será restaurado automáticamente.</DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Razón de cancelación (opcional)'
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={isPending}
            />
            <div className='flex justify-end gap-2'>
              <Button variant='outline' size='sm' onClick={() => setCancelOpen(false)} disabled={isPending}>
                Volver
              </Button>
              <Button
                variant='destructive'
                size='sm'
                disabled={isPending}
                onClick={() => {
                  if (!selectedOrder) return;
                  startTransition(async () => {
                    const result = await cancelOrderAction(selectedOrder.id, cancelReason || undefined);
                    if (result.error) {
                      toast.error(result.error);
                      return;
                    }
                    toast.success('Pedido cancelado. Inventario restaurado.');
                    setCancelOpen(false);
                    setDetailOpen(false);
                    setCancelReason('');
                    router.refresh();
                  });
                }}
              >
                {isPending ? 'Cancelando...' : 'Confirmar cancelación'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
