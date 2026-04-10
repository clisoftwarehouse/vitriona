'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Truck, Percent, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import {
  Bar,
  Area,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { exportToPdf } from '@/modules/reports/lib/export-pdf';
import { exportToExcel } from '@/modules/reports/lib/export-excel';
import { ReportEmpty, ReportKpiCard, ReportSection, ReportLoading } from './report-card';
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from '@/components/ui/table';
import { getSalesReport, type SalesReportData } from '@/modules/reports/server/queries/get-reports-data';
import { fmtNumber, fmtStatus, fmtCurrency, fmtCheckoutType } from '@/modules/reports/lib/report-formatters';
import { formatDateRange, type ReportTimeframe, getReportTimeframeMeta } from '@/modules/reports/lib/report-timeframe';

interface SalesReportProps {
  businessId: string;
  businessName: string;
  timeframe: ReportTimeframe;
  exportType: 'excel' | 'pdf' | null;
}

const STATUS_COLORS = [
  '#f59e0b', // pending_payment
  '#14b8a6', // payment_verified
  '#8b5cf6', // preparing
  '#0ea5e9', // shipped
  '#10b981', // delivered
  '#ef4444', // cancelled
];

export function SalesReport({ businessId, businessName, timeframe, exportType }: SalesReportProps) {
  const [data, setData] = useState<SalesReportData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getSalesReport(businessId, timeframe);
      setData(res);
    });
  }, [businessId, timeframe]);

  const handleExport = useCallback(() => {
    if (!data || !exportType) return;
    const meta = getReportTimeframeMeta(timeframe);
    const dateRange = formatDateRange(meta);

    if (exportType === 'excel') {
      exportToExcel(
        [
          {
            name: 'Resumen',
            headers: ['Métrica', 'Valor'],
            rows: [
              ['Ingresos totales', fmtCurrency(data.summary.totalRevenue, data.currency)],
              ['Total de pedidos', data.summary.totalOrders],
              ['Ticket promedio', fmtCurrency(data.summary.averageOrderValue, data.currency)],
              ['Descuentos otorgados', fmtCurrency(data.summary.totalDiscount, data.currency)],
              ['Costos de envío', fmtCurrency(data.summary.totalShipping, data.currency)],
            ],
          },
          {
            name: 'Por Estado',
            headers: ['Estado', 'Cantidad', 'Ingresos'],
            rows: data.byStatus.map((r) => [fmtStatus(r.status), r.count, fmtCurrency(r.revenue, data.currency)]),
          },
          {
            name: 'Por Método de Pago',
            headers: ['Método', 'Cantidad', 'Ingresos'],
            rows: data.byPaymentMethod.map((r) => [r.method, r.count, fmtCurrency(r.revenue, data.currency)]),
          },
          {
            name: 'Por Canal',
            headers: ['Canal', 'Cantidad', 'Ingresos'],
            rows: data.byCheckoutType.map((r) => [
              fmtCheckoutType(r.type),
              r.count,
              fmtCurrency(r.revenue, data.currency),
            ]),
          },
          {
            name: 'Tendencia Diaria',
            headers: ['Fecha', 'Ingresos', 'Pedidos'],
            rows: data.dailyTrend.map((r) => [r.date, fmtCurrency(r.revenue, data.currency), r.orders]),
          },
        ],
        `Reporte_Ventas_${dateRange}`
      );
    } else {
      exportToPdf({
        title: 'Reporte de Ventas',
        subtitle: `Período: ${meta.label}`,
        businessName,
        dateRange,
        summaryCards: [
          { label: 'Ingresos', value: fmtCurrency(data.summary.totalRevenue, data.currency) },
          { label: 'Pedidos', value: fmtNumber(data.summary.totalOrders) },
          { label: 'Ticket Promedio', value: fmtCurrency(data.summary.averageOrderValue, data.currency) },
          { label: 'Descuentos', value: fmtCurrency(data.summary.totalDiscount, data.currency) },
        ],
        sections: [
          {
            title: 'Pedidos por Estado',
            headers: ['Estado', 'Cantidad', 'Ingresos'],
            rows: data.byStatus.map((r) => [fmtStatus(r.status), r.count, fmtCurrency(r.revenue, data.currency)]),
          },
          {
            title: 'Por Método de Pago',
            headers: ['Método', 'Cantidad', 'Ingresos'],
            rows: data.byPaymentMethod.map((r) => [r.method, r.count, fmtCurrency(r.revenue, data.currency)]),
          },
          {
            title: 'Por Canal de Venta',
            headers: ['Canal', 'Cantidad', 'Ingresos'],
            rows: data.byCheckoutType.map((r) => [
              fmtCheckoutType(r.type),
              r.count,
              fmtCurrency(r.revenue, data.currency),
            ]),
          },
        ],
      });
    }
  }, [data, exportType, timeframe, businessName]);

  useEffect(() => {
    if (exportType) handleExport();
  }, [exportType, handleExport]);

  if (isPending && !data) return <ReportLoading />;
  if (!data) return <ReportEmpty message='No se pudo cargar el reporte de ventas.' />;

  return (
    <div className='space-y-6'>
      {/* KPIs */}
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
        <ReportKpiCard
          label='Ingresos'
          value={fmtCurrency(data.summary.totalRevenue, data.currency)}
          icon={<DollarSign className='size-5' />}
        />
        <ReportKpiCard
          label='Pedidos'
          value={fmtNumber(data.summary.totalOrders)}
          icon={<ShoppingCart className='size-5' />}
        />
        <ReportKpiCard
          label='Ticket Promedio'
          value={fmtCurrency(data.summary.averageOrderValue, data.currency)}
          icon={<TrendingUp className='size-5' />}
        />
        <ReportKpiCard
          label='Descuentos'
          value={fmtCurrency(data.summary.totalDiscount, data.currency)}
          icon={<Percent className='size-5' />}
        />
        <ReportKpiCard
          label='Envíos'
          value={fmtCurrency(data.summary.totalShipping, data.currency)}
          icon={<Truck className='size-5' />}
        />
      </div>

      {/* Revenue trend chart */}
      {data.dailyTrend.length > 0 && (
        <ReportSection title='Tendencia de Ingresos'>
          <div className='p-4'>
            <ResponsiveContainer width='100%' height={260}>
              <AreaChart data={data.dailyTrend} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id='salesGradient' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='var(--color-primary, #6366f1)' stopOpacity={0.2} />
                    <stop offset='95%' stopColor='var(--color-primary, #6366f1)' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--color-border, #e5e7eb)' vertical={false} />
                <XAxis
                  dataKey='date'
                  tickFormatter={(v) => {
                    const d = new Date(`${v}T00:00:00`);
                    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
                  }}
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground, #6b7280)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(Math.floor(data.dailyTrend.length / 7), 0)}
                />
                <YAxis
                  tickFormatter={(v) => fmtCurrency(v, data.currency)}
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    name === 'revenue' ? fmtCurrency(Number(value), data.currency) : value,
                    name === 'revenue' ? 'Ingresos' : 'Pedidos',
                  ]}
                />
                <Area
                  type='monotone'
                  dataKey='revenue'
                  stroke='var(--color-primary, #6366f1)'
                  strokeWidth={2}
                  fill='url(#salesGradient)'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ReportSection>
      )}

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* By status */}
        <ReportSection title='Pedidos por Estado'>
          {data.byStatus.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>Sin datos en este período.</p>
          ) : (
            <div className='p-4'>
              <ResponsiveContainer width='100%' height={200}>
                <BarChart data={data.byStatus} layout='vertical' margin={{ left: 80, right: 20 }}>
                  <XAxis type='number' tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey='status'
                    type='category'
                    tickFormatter={fmtStatus}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [fmtNumber(Number(value)), 'Pedidos']}
                    labelFormatter={(label) => fmtStatus(String(label))}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey='count' radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {data.byStatus.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ReportSection>

        {/* By payment method */}
        <ReportSection title='Por Método de Pago'>
          {data.byPaymentMethod.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>Sin datos en este período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Método</TableHead>
                  <TableHead className='text-right'>Pedidos</TableHead>
                  <TableHead className='text-right'>Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byPaymentMethod.map((r) => (
                  <TableRow key={r.method}>
                    <TableCell className='font-medium'>{r.method}</TableCell>
                    <TableCell className='text-right'>{fmtNumber(r.count)}</TableCell>
                    <TableCell className='text-right'>{fmtCurrency(r.revenue, data.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ReportSection>
      </div>

      {/* By checkout type */}
      {data.byCheckoutType.length > 0 && (
        <ReportSection title='Por Canal de Venta'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead className='text-right'>Pedidos</TableHead>
                <TableHead className='text-right'>Ingresos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byCheckoutType.map((r) => (
                <TableRow key={r.type}>
                  <TableCell className='font-medium'>{fmtCheckoutType(r.type)}</TableCell>
                  <TableCell className='text-right'>{fmtNumber(r.count)}</TableCell>
                  <TableCell className='text-right'>{fmtCurrency(r.revenue, data.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ReportSection>
      )}
    </div>
  );
}
