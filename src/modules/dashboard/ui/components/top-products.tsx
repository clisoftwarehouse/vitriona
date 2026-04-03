'use client';

import { BarChart3 } from 'lucide-react';

import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface TopProductsProps {
  products: { name: string; quantity: number; revenue: number }[];
  currency: string;
  title: string;
  emptyMessage: string;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es', { style: 'currency', currency }).format(amount);
}

export function TopProducts({ products, currency, title, emptyMessage }: TopProductsProps) {
  const maxQty = Math.max(...products.map((p) => p.quantity), 1);

  return (
    <Card className='h-full gap-4 py-5'>
      <CardHeader className='px-5 pb-0'>
        <div className='flex items-start justify-between'>
          <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>{title}</p>
          <div className='bg-muted flex size-8 items-center justify-center rounded-lg'>
            <BarChart3 className='text-muted-foreground size-4' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-5'>
        {products.length === 0 ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>{emptyMessage}</p>
        ) : (
          <div className='space-y-4'>
            {products.map((p, i) => (
              <div key={i}>
                <div className='mb-1 flex items-center justify-between text-sm'>
                  <span className='truncate font-medium'>{p.name}</span>
                  <span className='text-muted-foreground ml-2 shrink-0 text-xs'>
                    {p.quantity} uds · {formatCurrency(p.revenue, currency)}
                  </span>
                </div>
                <div className='bg-muted h-2 overflow-hidden rounded-full'>
                  <div
                    className='h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all'
                    style={{ width: `${(p.quantity / maxQty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
