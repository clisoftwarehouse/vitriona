'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Package, XCircle, Archive, CheckCircle, AlertTriangle } from 'lucide-react';
import { Bar, Cell, XAxis, YAxis, Tooltip, BarChart, ResponsiveContainer } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { exportToPdf } from '@/modules/reports/lib/export-pdf';
import { exportToExcel } from '@/modules/reports/lib/export-excel';
import { fmtNumber, fmtCurrency } from '@/modules/reports/lib/report-formatters';
import { ReportEmpty, ReportKpiCard, ReportSection, ReportLoading } from './report-card';
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from '@/components/ui/table';
import { getProductsReport, type ProductsReportData } from '@/modules/reports/server/queries/get-reports-data';
import { formatDateRange, type ReportTimeframe, getReportTimeframeMeta } from '@/modules/reports/lib/report-timeframe';

interface ProductsReportProps {
  businessId: string;
  businessName: string;
  timeframe: ReportTimeframe;
  exportType: 'excel' | 'pdf' | null;
}

const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444'];

export function ProductsReport({ businessId, businessName, timeframe, exportType }: ProductsReportProps) {
  const [data, setData] = useState<ProductsReportData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getProductsReport(businessId, timeframe);
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
            name: 'Top Productos',
            headers: ['Producto', 'Unidades Vendidas', 'Ingresos'],
            rows: data.topSelling.map((p) => [p.name, p.quantity, fmtCurrency(p.revenue, data.currency)]),
          },
          {
            name: 'Por Categoría',
            headers: ['Categoría', 'Productos Vendidos', 'Ingresos'],
            rows: data.byCategory.map((c) => [c.category, c.productCount, fmtCurrency(c.revenue, data.currency)]),
          },
          {
            name: 'Stock Bajo',
            headers: ['Producto', 'SKU', 'Stock Actual', 'Stock Mínimo'],
            rows: data.lowStockItems.map((i) => [i.name, i.sku ?? '-', i.stock, i.minStock]),
          },
        ],
        `Reporte_Productos_${dateRange}`
      );
    } else {
      exportToPdf({
        title: 'Reporte de Productos',
        subtitle: `Período: ${meta.label}`,
        businessName,
        dateRange,
        summaryCards: [
          { label: 'Total Productos', value: fmtNumber(data.stockSummary.totalProducts) },
          { label: 'Activos', value: fmtNumber(data.stockSummary.active) },
          { label: 'Agotados', value: fmtNumber(data.stockSummary.outOfStock) },
          { label: 'Stock Bajo', value: fmtNumber(data.stockSummary.lowStock) },
        ],
        sections: [
          {
            title: 'Top 20 Productos Más Vendidos',
            headers: ['Producto', 'Unidades', 'Ingresos'],
            rows: data.topSelling.map((p) => [p.name, p.quantity, fmtCurrency(p.revenue, data.currency)]),
          },
          {
            title: 'Ventas por Categoría',
            headers: ['Categoría', 'Productos', 'Ingresos'],
            rows: data.byCategory.map((c) => [c.category, c.productCount, fmtCurrency(c.revenue, data.currency)]),
          },
          ...(data.lowStockItems.length > 0
            ? [
                {
                  title: 'Productos con Stock Bajo',
                  headers: ['Producto', 'SKU', 'Stock Actual', 'Stock Mínimo'],
                  rows: data.lowStockItems.map((i) => [i.name, i.sku ?? '-', i.stock, i.minStock]),
                },
              ]
            : []),
        ],
      });
    }
  }, [data, exportType, timeframe, businessName]);

  useEffect(() => {
    if (exportType) handleExport();
  }, [exportType, handleExport]);

  if (isPending && !data) return <ReportLoading />;
  if (!data) return <ReportEmpty message='No se pudo cargar el reporte de productos.' />;

  return (
    <div className='space-y-6'>
      {/* KPIs */}
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
        <ReportKpiCard
          label='Total Productos'
          value={fmtNumber(data.stockSummary.totalProducts)}
          icon={<Package className='size-5' />}
        />
        <ReportKpiCard
          label='Activos'
          value={fmtNumber(data.stockSummary.active)}
          icon={<CheckCircle className='size-5' />}
        />
        <ReportKpiCard
          label='Inactivos'
          value={fmtNumber(data.stockSummary.inactive)}
          icon={<XCircle className='size-5' />}
        />
        <ReportKpiCard
          label='Agotados'
          value={fmtNumber(data.stockSummary.outOfStock)}
          icon={<Archive className='size-5' />}
        />
        <ReportKpiCard
          label='Stock Bajo'
          value={fmtNumber(data.stockSummary.lowStock)}
          icon={<AlertTriangle className='size-5' />}
          className={data.stockSummary.lowStock > 0 ? 'border-amber-200 dark:border-amber-800' : ''}
        />
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Top selling */}
        <ReportSection title='Top Productos Más Vendidos'>
          {data.topSelling.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>Sin ventas en este período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className='text-right'>Uds.</TableHead>
                  <TableHead className='text-right'>Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topSelling.map((p, i) => (
                  <TableRow key={p.name}>
                    <TableCell className='text-muted-foreground w-8'>{i + 1}</TableCell>
                    <TableCell className='max-w-50 truncate font-medium'>{p.name}</TableCell>
                    <TableCell className='text-right'>{fmtNumber(p.quantity)}</TableCell>
                    <TableCell className='text-right'>{fmtCurrency(p.revenue, data.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ReportSection>

        {/* By category */}
        <ReportSection title='Ventas por Categoría'>
          {data.byCategory.length === 0 ? (
            <p className='text-muted-foreground p-4 text-sm'>Sin datos en este período.</p>
          ) : (
            <div className='p-4'>
              <ResponsiveContainer width='100%' height={Math.max(data.byCategory.length * 36, 120)}>
                <BarChart data={data.byCategory} layout='vertical' margin={{ left: 100, right: 20 }}>
                  <XAxis
                    type='number'
                    tickFormatter={(v) => fmtCurrency(v, data.currency)}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey='category'
                    type='category'
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [fmtCurrency(Number(value), data.currency), 'Ingresos']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey='revenue' radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {data.byCategory.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ReportSection>
      </div>

      {/* Low stock */}
      {data.lowStockItems.length > 0 && (
        <ReportSection title='Productos con Stock Bajo'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className='text-right'>Stock Actual</TableHead>
                <TableHead className='text-right'>Stock Mínimo</TableHead>
                <TableHead className='text-right'>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lowStockItems.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className='font-medium'>{item.name}</TableCell>
                  <TableCell className='text-muted-foreground'>{item.sku ?? '-'}</TableCell>
                  <TableCell className='text-right'>{item.stock}</TableCell>
                  <TableCell className='text-right'>{item.minStock}</TableCell>
                  <TableCell className='text-right'>
                    <Badge
                      variant='outline'
                      className={
                        item.stock === 0
                          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
                          : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
                      }
                    >
                      {item.stock === 0 ? 'Agotado' : 'Bajo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ReportSection>
      )}
    </div>
  );
}
