'use client';

import { useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

type Currency = 'EUR' | 'USD';
type Direction = 'to-bs' | 'from-bs';

interface CurrencyConverterProps {
  eurRate: number | null;
  usdRate: number | null;
}

export function CurrencyConverter({ eurRate, usdRate }: CurrencyConverterProps) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [direction, setDirection] = useState<Direction>('to-bs');
  const [amount, setAmount] = useState('');

  const rate = currency === 'EUR' ? eurRate : usdRate;
  const hasRates = eurRate !== null || usdRate !== null;

  const result = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || !rate) return null;
    if (direction === 'to-bs') return num * rate;
    return num / rate;
  }, [amount, rate, direction]);

  const formatResult = (value: number) => {
    return value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const inputLabel = direction === 'to-bs' ? currency : 'Bs';
  const outputLabel = direction === 'to-bs' ? 'Bs' : currency;
  const inputSymbol = direction === 'to-bs' ? (currency === 'EUR' ? '€' : '$') : 'Bs';
  const outputSymbol = direction === 'to-bs' ? 'Bs' : currency === 'EUR' ? '€' : '$';

  if (!hasRates) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='gap-1.5 text-xs font-medium'>
          <span className='hidden sm:inline'>Bs</span>
          <span className='hidden sm:inline'>⇄</span>
          <span className='hidden sm:inline'>EUR/USD</span>
          <span className='sm:hidden'>BCV</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Calculadora de Cambio BCV</DialogTitle>
          <DialogDescription>Convierte entre Bolívares y divisas a tasa oficial del BCV.</DialogDescription>
        </DialogHeader>

        <div className='space-y-5'>
          {/* Currency selector */}
          <div className='flex gap-2'>
            <Button
              variant={currency === 'USD' ? 'default' : 'outline'}
              size='sm'
              className='flex-1'
              onClick={() => {
                setCurrency('USD');
                setAmount('');
              }}
            >
              $ Dólar (USD)
            </Button>
            <Button
              variant={currency === 'EUR' ? 'default' : 'outline'}
              size='sm'
              className='flex-1'
              onClick={() => {
                setCurrency('EUR');
                setAmount('');
              }}
            >
              € Euro (EUR)
            </Button>
          </div>

          {/* Rate display */}
          {rate && (
            <div className='bg-muted/50 rounded-lg border px-4 py-2.5 text-center'>
              <p className='text-muted-foreground text-xs font-medium'>Tasa BCV del día</p>
              <p className='text-lg font-bold'>
                1 {currency === 'EUR' ? '€' : '$'} = {formatResult(rate)} Bs
              </p>
            </div>
          )}

          {/* Direction toggle */}
          <div className='flex items-center gap-2'>
            <Button
              variant={direction === 'to-bs' ? 'default' : 'outline'}
              size='sm'
              className='flex-1 text-xs'
              onClick={() => {
                setDirection('to-bs');
                setAmount('');
              }}
            >
              {currency === 'EUR' ? '€' : '$'} → Bs
            </Button>
            <Button
              variant={direction === 'from-bs' ? 'default' : 'outline'}
              size='sm'
              className='flex-1 text-xs'
              onClick={() => {
                setDirection('from-bs');
                setAmount('');
              }}
            >
              Bs → {currency === 'EUR' ? '€' : '$'}
            </Button>
          </div>

          {/* Input */}
          <div>
            <label className='text-muted-foreground mb-1.5 block text-xs font-medium'>Monto en {inputLabel}</label>
            <div className='relative'>
              <span className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium'>
                {inputSymbol}
              </span>
              <Input
                type='number'
                min='0'
                step='any'
                placeholder='0.00'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className='pl-10 text-lg font-semibold'
                autoFocus
              />
            </div>
          </div>

          {/* Result */}
          {result !== null && (
            <div className='bg-primary/5 border-primary/20 rounded-xl border p-4 text-center'>
              <p className='text-muted-foreground text-xs font-medium'>Resultado en {outputLabel}</p>
              <p className='text-primary mt-1 text-3xl font-bold'>
                {outputSymbol} {formatResult(result)}
              </p>
              {rate && (
                <p className='text-muted-foreground mt-1.5 text-xs'>
                  {inputSymbol} {parseFloat(amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  {' × '}
                  {direction === 'to-bs'
                    ? `${formatResult(rate)} Bs/${currency}`
                    : `(1/${formatResult(rate)}) ${currency}/Bs`}
                </p>
              )}
            </div>
          )}

          {!rate && (
            <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm'>
              No hay tasa {currency} disponible.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
