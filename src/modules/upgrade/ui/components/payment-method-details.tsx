import { Hash, Mail, User, Phone, Landmark, Building2 } from 'lucide-react';

type PaymentMethod = 'bank_transfer' | 'pago_movil' | 'zelle' | 'binance';

const PAYMENT_DETAILS: Record<
  PaymentMethod,
  { label: string; fields: { icon: typeof Building2; label: string; value: string }[] }
> = {
  bank_transfer: {
    label: 'Transferencia Bancaria',
    fields: [
      { icon: Hash, label: 'Número de cuenta', value: '0138-0036-76-0360092004' },
      { icon: Landmark, label: 'Banco', value: 'Banco Plaza' },
      { icon: Building2, label: 'RIF', value: 'J-50812478-2' },
    ],
  },
  pago_movil: {
    label: 'Pago Móvil',
    fields: [
      { icon: Phone, label: 'Número de teléfono', value: '0414-6927460' },
      { icon: Building2, label: 'RIF', value: 'J-50812478-2' },
      { icon: Landmark, label: 'Entidad bancaria', value: 'Banco Plaza (0138)' },
    ],
  },
  zelle: {
    label: 'Zelle',
    fields: [
      { icon: User, label: 'Nombre', value: 'Vitriona LLC' },
      { icon: Mail, label: 'Correo electrónico', value: 'pagos@vitriona.com' },
    ],
  },
  binance: {
    label: 'Binance',
    fields: [{ icon: Mail, label: 'Correo electrónico', value: 'info@clisoftwarehouse.com' }],
  },
};

const VES_METHODS: PaymentMethod[] = ['bank_transfer', 'pago_movil'];

function formatBs(amount: number) {
  return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatUsdt(amount: number) {
  return `${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
}

interface PaymentMethodDetailsProps {
  method: PaymentMethod;
  eurAmount?: number;
  eurRate?: number | null;
}

export function PaymentMethodDetails({ method, eurAmount, eurRate }: PaymentMethodDetailsProps) {
  const details = PAYMENT_DETAILS[method];
  const showBsAmount = VES_METHODS.includes(method) && eurAmount && eurRate && eurRate > 0;
  const showUsdtAmount = method === 'binance' && eurAmount;

  return (
    <div className='mt-4 rounded-xl border bg-blue-50/50 p-4 dark:bg-blue-950/20'>
      <p className='mb-3 text-sm font-semibold'>Datos para {details.label}</p>
      <div className='space-y-2.5'>
        {details.fields.map((field) => (
          <div key={field.label} className='flex items-center gap-3'>
            <field.icon className='text-muted-foreground size-4 shrink-0' />
            <div className='min-w-0'>
              <p className='text-muted-foreground text-xs'>{field.label}</p>
              <p className='text-sm font-medium'>{field.value}</p>
            </div>
          </div>
        ))}
      </div>
      {showBsAmount && (
        <div className='bg-primary/5 border-primary/20 mt-4 rounded-xl border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Monto a transferir</p>
          <p className='text-primary mt-1 text-2xl font-bold'>{formatBs(eurAmount * eurRate)}</p>
          <p className='text-muted-foreground mt-1.5 text-xs'>
            €{eurAmount % 1 === 0 ? eurAmount.toFixed(0) : eurAmount.toFixed(2)} × {eurRate.toFixed(2)} Bs/EUR · Tasa
            BCV del día
          </p>
        </div>
      )}
      {showUsdtAmount && (
        <div className='bg-primary/5 border-primary/20 mt-4 rounded-xl border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Monto a transferir</p>
          <p className='text-primary mt-1 text-2xl font-bold'>{formatUsdt(eurAmount)}</p>
        </div>
      )}
    </div>
  );
}
