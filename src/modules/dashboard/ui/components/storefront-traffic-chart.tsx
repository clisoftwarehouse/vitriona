'use client';

import { Area, Line, XAxis, YAxis, Tooltip, AreaChart, CartesianGrid, ResponsiveContainer } from 'recharts';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { type DashboardChartGranularity } from '@/modules/dashboard/lib/dashboard-timeframe';

interface StorefrontTrafficChartProps {
  data: { date: string; visits: number; uniqueVisitors: number; productViews: number }[];
  granularity: DashboardChartGranularity;
  rangeDescription: string;
}

function formatBucketLabel(value: string, granularity: DashboardChartGranularity) {
  if (granularity === 'hour') {
    return `${value}:00`;
  }

  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function formatCount(value: number) {
  return new Intl.NumberFormat('es').format(value);
}

export function StorefrontTrafficChart({ data, granularity, rangeDescription }: StorefrontTrafficChartProps) {
  const totalVisits = data.reduce((sum, entry) => sum + entry.visits, 0);
  const totalUniqueVisitors = data.reduce((sum, entry) => sum + entry.uniqueVisitors, 0);

  return (
    <Card className='gap-4 py-5'>
      <CardHeader className='px-5 pb-0'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>
              Tráfico del storefront
            </p>
            <div className='mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1'>
              <span className='text-2xl font-bold tracking-tight'>{formatCount(totalVisits)} visitas</span>
              <span className='text-muted-foreground text-sm'>
                {formatCount(totalUniqueVisitors)} visitantes aprox. en {rangeDescription}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-2'>
        <ResponsiveContainer width='100%' height={240}>
          <AreaChart data={data} margin={{ top: 6, right: 12, left: 12, bottom: 0 }}>
            <defs>
              <linearGradient id='storefrontTrafficGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-primary, #6366f1)' stopOpacity={0.22} />
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
              tickFormatter={formatCount}
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground, #6b7280)' }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid var(--color-border, #e5e7eb)',
                background: 'var(--color-card, #fff)',
              }}
              labelFormatter={(label) => formatBucketLabel(String(label), granularity)}
              formatter={(value, name) => {
                if (name === 'visits') {
                  return [formatCount(Number(value)), 'Visitas'];
                }

                if (name === 'productViews') {
                  return [formatCount(Number(value)), 'Vistas de producto'];
                }

                return [formatCount(Number(value)), 'Visitantes únicos'];
              }}
            />
            <Area
              type='monotone'
              dataKey='visits'
              stroke='var(--color-primary, #6366f1)'
              strokeWidth={2}
              fill='url(#storefrontTrafficGradient)'
            />
            <Line
              type='monotone'
              dataKey='productViews'
              stroke='#0ea5e9'
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
