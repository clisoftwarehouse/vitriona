'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Clock, Truck, Loader2, Package, XCircle, BadgeCheck, CheckCircle, CalendarClock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { formatReservationDateTime, formatReservationDateTimeShort } from '@/modules/orders/lib/reservations';
import {
  orderKeys,
  useOrders,
  useOrderDetail,
  useCancelOrder,
  useUpdateOrderStatus,
} from '@/modules/orders/ui/hooks/use-orders';

type OrderStatus = 'pending_payment' | 'payment_verified' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  customerNotes: string | null;
  orderType: 'order' | 'reservation';
  reservationDate: string | null;
  reservationTime: string | null;
  total: string;
  status: string;
  checkoutType: string;
  inventoryDeducted: boolean;
  createdAt: Date;
  paymentMethodName: string | null;
  paymentDetails: unknown;
  deliveryMethodName: string | null;
  shippingCost: string;
  discount: string;
  subtotal: string;
}

interface OrdersTableProps {
  businessId: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }
> = {
  pending_payment: { label: 'Pendiente de pago', variant: 'outline', icon: Clock },
  payment_verified: { label: 'Pago verificado', variant: 'default', icon: BadgeCheck },
  preparing: { label: 'Preparando', variant: 'secondary', icon: Package },
  shipped: { label: 'Enviado', variant: 'secondary', icon: Truck },
  delivered: { label: 'Entregado', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
};

const STATUS_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending_payment: ['payment_verified', 'cancelled'],
  payment_verified: ['preparing', 'cancelled'],
  preparing: ['shipped', 'delivered'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function OrdersTable({ businessId }: OrdersTableProps) {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useOrders(businessId);
  const updateStatus = useUpdateOrderStatus(businessId);
  const cancelOrder = useCancelOrder(businessId);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const selectedOrder = (orders as Order[]).find((o) => o.id === selectedOrderId) ?? null;
  const { data: detail, isLoading: detailLoading } = useOrderDetail(detailOpen ? selectedOrderId : null);
  const orderItems = detail?.items ?? [];
  const statusHistory = detail?.statusHistory ?? [];

  const isPending = updateStatus.isPending || cancelOrder.isPending;

  const formatPrice = (price: string) =>
    new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(parseFloat(price));

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

  const handleViewDetail = (order: Order) => {
    setSelectedOrderId(order.id);
    setDetailOpen(true);
    queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'cancelled') {
      setSelectedOrderId(orderId);
      setCancelOpen(true);
      return;
    }
    updateStatus.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          toast.success('Estado actualizado');
          if (detailOpen) queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }

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
            <p className='text-muted-foreground mt-3'>No hay pedidos o reservas todavía.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {filteredOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending_payment;
            const StatusIcon = statusCfg.icon;
            return (
              <Card key={order.id} className='transition-shadow hover:shadow-sm'>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-mono text-sm font-semibold'>{order.orderNumber}</span>
                        {order.orderType === 'reservation' && <Badge variant='secondary'>Reserva</Badge>}
                        <Badge variant={statusCfg.variant} className='gap-1'>
                          <StatusIcon className='size-3' />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p className='text-muted-foreground mt-1 text-sm'>
                        {order.customerName}
                        {order.customerPhone && ` · ${order.customerPhone}`}
                      </p>
                      {order.orderType === 'reservation' && order.reservationDate && order.reservationTime && (
                        <p className='mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-700'>
                          <CalendarClock className='size-3.5' />
                          {formatReservationDateTimeShort(order.reservationDate, order.reservationTime)}
                        </p>
                      )}
                    </div>
                    <div className='text-right'>
                      <span className='text-lg font-bold'>{formatPrice(order.total)}</span>
                      <p className='text-muted-foreground text-xs'>{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='flex items-center justify-between gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      {order.checkoutType === 'whatsapp' ? '📱 WhatsApp' : '📋 Interno'}
                    </Badge>
                    <div className='flex items-center gap-2'>
                      {(() => {
                        const transitions = STATUS_TRANSITIONS[order.status] ?? [];
                        if (transitions.length === 0) return null;
                        return (
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                            disabled={isPending}
                          >
                            <SelectTrigger className='h-8 w-40 text-xs'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={order.status} disabled>
                                {STATUS_CONFIG[order.status]?.label ?? order.status}
                              </SelectItem>
                              {transitions.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s === 'cancelled' ? '❌ ' : '→ '}
                                  {STATUS_CONFIG[s]?.label ?? s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                      <Button variant='ghost' size='sm' onClick={() => handleViewDetail(order)}>
                        <Eye className='mr-1 size-3.5' />
                        Detalle
                      </Button>
                    </div>
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
            <DialogTitle>
              {selectedOrder?.orderType === 'reservation' ? 'Reserva' : 'Pedido'} {selectedOrder?.orderNumber}
            </DialogTitle>
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

              {selectedOrder.orderType === 'reservation' &&
                selectedOrder.reservationDate &&
                selectedOrder.reservationTime && (
                  <div>
                    <h4 className='mb-1 text-sm font-semibold'>Reserva solicitada</h4>
                    <p className='text-sm'>
                      {formatReservationDateTime(selectedOrder.reservationDate, selectedOrder.reservationTime)}
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      El comercio confirma la disponibilidad fuera de Vitriona.
                    </p>
                  </div>
                )}

              {selectedOrder.customerNotes && (
                <div>
                  <h4 className='mb-1 text-sm font-semibold'>
                    {selectedOrder.orderType === 'reservation' ? 'Detalles de la reserva' : 'Notas del cliente'}
                  </h4>
                  <p className='text-muted-foreground text-sm whitespace-pre-line'>{selectedOrder.customerNotes}</p>
                </div>
              )}

              {selectedOrder.deliveryMethodName && (
                <div>
                  <h4 className='mb-1 text-sm font-semibold'>Método de entrega</h4>
                  <p className='text-sm'>{selectedOrder.deliveryMethodName}</p>
                </div>
              )}

              {(selectedOrder.paymentMethodName || selectedOrder.paymentDetails != null) && (
                <div>
                  <h4 className='mb-1 text-sm font-semibold'>Método de pago</h4>
                  <div className='flex items-center gap-2'>
                    {selectedOrder.paymentMethodName && <p className='text-sm'>{selectedOrder.paymentMethodName}</p>}
                    {(() => {
                      const d = selectedOrder.paymentDetails as Record<string, string> | null;
                      if (d?.source === 'chatbot')
                        return (
                          <Badge variant='outline' className='text-[10px]'>
                            🤖 Chatbot
                          </Badge>
                        );
                      return null;
                    })()}
                  </div>
                  {(() => {
                    const details = selectedOrder.paymentDetails as Record<string, string> | null;
                    if (!details || typeof details !== 'object') return null;

                    const PAYMENT_DETAIL_LABELS: Record<string, string> = {
                      verification_type: 'Tipo de verificación',
                      verification_value: 'Identificación del cliente',
                      reference: 'Referencia de pago',
                      source: 'Origen',
                      proofImageUrl: '',
                    };
                    const VERIFICATION_TYPE_LABELS: Record<string, string> = {
                      phone: 'Teléfono',
                      email: 'Correo electrónico',
                      document_id: 'Cédula / ID',
                      custom: 'Personalizado',
                    };

                    const textEntries = Object.entries(details).filter(
                      ([k, v]) => k !== 'proofImageUrl' && k !== 'source' && v
                    );
                    const proofUrl = details.proofImageUrl;
                    if (textEntries.length === 0 && !proofUrl) return null;
                    return (
                      <div className='mt-2 space-y-2'>
                        {textEntries.length > 0 && (
                          <div className='bg-muted/50 space-y-1 rounded-lg p-3'>
                            {textEntries.map(([key, val]) => (
                              <div key={key} className='flex items-center justify-between text-sm'>
                                <span className='text-muted-foreground'>{PAYMENT_DETAIL_LABELS[key] ?? key}</span>
                                <span className='font-medium'>
                                  {key === 'verification_type' ? (VERIFICATION_TYPE_LABELS[val] ?? val) : val}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {proofUrl && (
                          <div>
                            <p className='text-muted-foreground mb-1 text-xs font-medium'>Comprobante:</p>
                            <a href={proofUrl} target='_blank' rel='noopener noreferrer'>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={proofUrl}
                                alt='Comprobante de pago'
                                className='max-h-52 rounded-lg border object-contain'
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <h4 className='mb-2 text-sm font-semibold'>Productos</h4>
                <div className='space-y-2'>
                  {detailLoading ? (
                    <div className='flex justify-center py-4'>
                      <Loader2 className='text-muted-foreground size-4 animate-spin' />
                    </div>
                  ) : (
                    orderItems.map((item) => (
                      <div key={item.id} className='space-y-2'>
                        <div className='flex items-center justify-between text-sm'>
                          <span>
                            {item.productName} <span className='text-muted-foreground'>x{item.quantity}</span>
                          </span>
                          <span className='font-medium'>{formatPrice(item.subtotal)}</span>
                        </div>
                        {item.bundleSelections &&
                          (
                            item.bundleSelections as {
                              slotId: string | null;
                              slotName: string | null;
                              productId: string;
                              productName: string;
                              quantity: number;
                              unitPrice: string;
                            }[]
                          ).length > 0 && (
                            <div className='bg-muted/40 space-y-1 rounded-lg px-3 py-2 text-xs'>
                              <p className='text-muted-foreground font-medium'>Selección del cliente:</p>
                              {(
                                item.bundleSelections as {
                                  slotId: string | null;
                                  slotName: string | null;
                                  productId: string;
                                  productName: string;
                                  quantity: number;
                                  unitPrice: string;
                                }[]
                              ).map((sel, sIdx) => (
                                <div key={sIdx} className='flex items-center justify-between gap-3'>
                                  <span>
                                    {sel.quantity}x {sel.productName}
                                    {sel.slotName && (
                                      <span className='text-muted-foreground ml-1'>({sel.slotName})</span>
                                    )}
                                  </span>
                                  <span className='text-muted-foreground'>
                                    {formatPrice((parseFloat(sel.unitPrice) * sel.quantity).toFixed(2))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        {item.bundleComponents?.length > 0 &&
                          !(item.bundleSelections && (item.bundleSelections as unknown[]).length > 0) && (
                            <div className='bg-muted/40 space-y-1 rounded-lg px-3 py-2 text-xs'>
                              <p className='text-muted-foreground font-medium'>Incluye:</p>
                              {item.bundleComponents.map((component) => (
                                <div key={component.id} className='flex items-center justify-between gap-3'>
                                  <span>
                                    {component.totalQuantity}x {component.componentProductName}
                                  </span>
                                  <span className='text-muted-foreground'>{formatPrice(component.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ))
                  )}
                </div>
                <div className='mt-3 space-y-1 border-t pt-3'>
                  <div className='flex items-center justify-between text-sm opacity-60'>
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  {parseFloat(selectedOrder.discount) > 0 && (
                    <div className='flex items-center justify-between text-sm text-green-600'>
                      <span>Descuento</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {parseFloat(selectedOrder.shippingCost) > 0 && (
                    <div className='flex items-center justify-between text-sm opacity-60'>
                      <span>Envío</span>
                      <span>{formatPrice(selectedOrder.shippingCost)}</span>
                    </div>
                  )}
                  <div className='flex items-center justify-between pt-1'>
                    <span className='font-semibold'>Total</span>
                    <span className='text-lg font-bold'>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              {statusHistory.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-semibold'>Historial</h4>
                  <div className='relative space-y-3 pl-4'>
                    <div className='bg-border absolute top-1 bottom-1 left-1.75 w-px' />
                    {statusHistory.map((entry) => {
                      const cfg = STATUS_CONFIG[entry.toStatus] ?? STATUS_CONFIG.pending_payment;
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
                        {selectedOrder.orderType === 'reservation' ? 'Cancelar reserva' : 'Cancelar pedido'}
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
            <DialogTitle>
              {selectedOrder?.orderType === 'reservation' ? 'Cancelar reserva' : 'Cancelar pedido'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.inventoryDeducted
                ? '¿Estás seguro? El inventario será restaurado automáticamente.'
                : '¿Estás seguro? Esta acción marcará la solicitud como cancelada.'}
            </DialogDescription>
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
                  cancelOrder.mutate(
                    { orderId: selectedOrder.id, reason: cancelReason || undefined },
                    {
                      onSuccess: () => {
                        toast.success(
                          selectedOrder?.inventoryDeducted
                            ? `${selectedOrder.orderType === 'reservation' ? 'Reserva' : 'Pedido'} cancelado. Inventario restaurado.`
                            : `${selectedOrder?.orderType === 'reservation' ? 'Reserva' : 'Pedido'} cancelado.`
                        );
                        setCancelOpen(false);
                        setDetailOpen(false);
                        setCancelReason('');
                      },
                      onError: (err) => toast.error(err.message),
                    }
                  );
                }}
              >
                {cancelOrder.isPending
                  ? 'Cancelando...'
                  : `Confirmar cancelación de ${selectedOrder?.orderType === 'reservation' ? 'reserva' : 'pedido'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
