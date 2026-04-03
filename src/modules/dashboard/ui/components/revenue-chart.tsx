'use client';

import { Area, XAxis, YAxis, Tooltip, AreaChart, CartesianGrid, ResponsiveContainer } from 'recharts';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { type DashboardChartGranularity } from '@/modules/dashboard/lib/dashboard-timeframe';

interface RevenueChartProps {
  data: { date: string; revenue: number; orders: number }[];
  currency: string;
  granularity: DashboardChartGranularity;
  title: string;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function formatBucketLabel(value: string, granularity: DashboardChartGranularity) {
  if (granularity === 'hour') {
    return `${value}:00`;
  }

  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

export function RevenueChart({ data, currency, granularity, title }: RevenueChartProps) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  return (
    <Card className='gap-4 py-5'>
      <CardHeader className='px-5 pb-0'>
        <div className='flex items-start justify-between'>
          <div>
            <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>{title}</p>
            <div className='mt-1 flex items-baseline gap-3'>
              <span className='text-2xl font-bold tracking-tight'>{formatCurrency(totalRevenue, currency)}</span>
              <span className='text-muted-foreground text-sm'>{totalOrders} pedidos</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-2'>
        <ResponsiveContainer width='100%' height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 12, left: 12, bottom: 0 }}>
            <defs>
              <linearGradient id='revenueGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-primary, #6366f1)' stopOpacity={0.2} />
                <stop offset='95%' stopColor='var(--color-primary, #6366f1)' stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' stroke='var(--color-border, #e5e7eb)' vertical={false} />
            <XAxis
              dataKey='date'
              tickFormatter={(value) => formatBucketLabel(String(value), granularity)}
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground, #6b7280)' }}
              tickLine={false}
              axisLine={false}
              interval={Math.max(Math.floor(data.length / 6), 0)}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v, currency)}
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground, #6b7280)' }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid var(--color-border, #e5e7eb)',
                background: 'var(--color-card, #fff)',
              }}
              labelFormatter={(label) => formatBucketLabel(String(label), granularity)}
              formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(Number(value), currency) : value,
                name === 'revenue' ? 'Ingresos' : 'Pedidos',
              ]}
            />
            <Area
              type='monotone'
              dataKey='revenue'
              stroke='var(--color-primary, #6366f1)'
              strokeWidth={2}
              fill='url(#revenueGradient)'
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
