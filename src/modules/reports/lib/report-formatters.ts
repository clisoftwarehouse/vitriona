export function fmtCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function fmtNumber(n: number) {
  return new Intl.NumberFormat('es').format(n);
}

export function fmtPercent(n: number) {
  return `${n.toFixed(1)}%`;
}

export function fmtDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  payment_verified: 'Pago verificado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export function fmtStatus(status: string) {
  return STATUS_LABELS[status] ?? status;
}

const CHECKOUT_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  internal: 'Interno',
  pos: 'Punto de Venta',
};

export function fmtCheckoutType(type: string) {
  return CHECKOUT_LABELS[type] ?? type;
}

const MOVEMENT_LABELS: Record<string, string> = {
  in: 'Entrada',
  out: 'Salida',
  adjustment: 'Ajuste',
  order: 'Pedido',
};

export function fmtMovementType(type: string) {
  return MOVEMENT_LABELS[type] ?? type;
}
