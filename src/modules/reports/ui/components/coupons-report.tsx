'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Tag, Percent, ShoppingCart, TicketPercent } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { exportToPdf } from '@/modules/reports/lib/export-pdf';
import { exportToExcel } from '@/modules/reports/lib/export-excel';
import { ReportEmpty, ReportKpiCard, ReportSection, ReportLoading } from './report-card';
import { fmtDate, fmtNumber, fmtCurrency } from '@/modules/reports/lib/report-formatters';
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from '@/components/ui/table';
import { getCouponsReport, type CouponsReportData } from '@/modules/reports/server/queries/get-reports-data';
import { formatDateRange, type ReportTimeframe, getReportTimeframeMeta } from '@/modules/reports/lib/report-timeframe';

interface CouponsReportProps {
  businessId: string;
  businessName: string;
  timeframe: ReportTimeframe;
  exportType: 'excel' | 'pdf' | null;
}

export function CouponsReport({ businessId, businessName, timeframe, exportType }: CouponsReportProps) {
  const [data, setData] = useState<CouponsReportData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getCouponsReport(businessId, timeframe);
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
              ['Total de cupones', data.summary.totalCoupons],
              ['Cupones activos', data.summary.activeCoupons],
              ['Descuento total otorgado', fmtCurrency(data.summary.totalDiscountGiven, data.currency)],
              ['Pedidos con cupón', data.summary.totalOrdersWithCoupon],
            ],
          },
          {
            name: 'Cupones',
            headers: [
              'Código',
              'Descripción',
              'Tipo Descuento',
              'Valor',
              'Usos',
              'Límite',
              'Descuento Otorgado',
              'Pedidos',
              'Estado',
              'Vencimiento',
            ],
            rows: data.coupons.map((c) => [
              c.code,
              c.description ?? '-',
              c.discountType === 'percentage' ? 'Porcentaje' : 'Fijo',
              c.discountType === 'percentage'
                ? `${c.discountValue}%`
                : fmtCurrency(parseFloat(c.discountValue), data.currency),
              c.usageCount,
              c.usageLimit ?? 'Sin límite',
              fmtCurrency(c.totalDiscountGiven, data.currency),
              c.ordersUsed,
              c.isActive ? 'Activo' : 'Inactivo',
              c.expiresAt ? fmtDate(c.expiresAt) : 'Sin vencimiento',
            ]),
          },
        ],
        `Reporte_Cupones_${dateRange}`
      );
    } else {
      exportToPdf({
        title: 'Reporte de Cupones',
        subtitle: `Período: ${meta.label}`,
        businessName,
        dateRange,
        summaryCards: [
          { label: 'Total Cupones', value: fmtNumber(data.summary.totalCoupons) },
          { label: 'Activos', value: fmtNumber(data.summary.activeCoupons) },
          { label: 'Descuento Total', value: fmtCurrency(data.summary.totalDiscountGiven, data.currency) },
          { label: 'Pedidos con Cupón', value: fmtNumber(data.summary.totalOrdersWithCoupon) },
        ],
        sections: [
          {
            title: 'Detalle de Cupones',
            headers: ['Código', 'Tipo', 'Valor', 'Usos', 'Descuento', 'Pedidos', 'Estado'],
            rows: data.coupons.map((c) => [
              c.code,
              c.discountType === 'percentage' ? '%' : '$',
              c.discountType === 'percentage'
                ? `${c.discountValue}%`
                : fmtCurrency(parseFloat(c.discountValue), data.currency),
              `${c.usageCount}${c.usageLimit ? `/${c.usageLimit}` : ''}`,
              fmtCurrency(c.totalDiscountGiven, data.currency),
              c.ordersUsed,
              c.isActive ? 'Activo' : 'Inactivo',
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
  if (!data) return <ReportEmpty message='No se pudo cargar el reporte de cupones.' />;

  return (
    <div className='space-y-6'>
      {/* KPIs */}
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <ReportKpiCard
          label='Total Cupones'
          value={fmtNumber(data.summary.totalCoupons)}
          icon={<TicketPercent className='size-5' />}
        />
        <ReportKpiCard
          label='Activos'
          value={fmtNumber(data.summary.activeCoupons)}
          icon={<Tag className='size-5' />}
        />
        <ReportKpiCard
          label='Descuento Total'
          value={fmtCurrency(data.summary.totalDiscountGiven, data.currency)}
          icon={<Percent className='size-5' />}
        />
        <ReportKpiCard
          label='Pedidos con Cupón'
          value={fmtNumber(data.summary.totalOrdersWithCoupon)}
          icon={<ShoppingCart className='size-5' />}
        />
      </div>

      {/* Coupons table */}
      <ReportSection title='Detalle de Cupones'>
        {data.coupons.length === 0 ? (
          <p className='text-muted-foreground p-4 text-sm'>No hay cupones creados.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className='text-right'>Usos</TableHead>
                <TableHead className='text-right'>Desc. Otorgado</TableHead>
                <TableHead className='text-right'>Pedidos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.coupons.map((c) => (
                <TableRow key={c.code}>
                  <TableCell>
                    <code className='bg-muted rounded px-1.5 py-0.5 text-xs font-semibold'>{c.code}</code>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-sm'>
                    {c.discountType === 'percentage' ? 'Porcentaje' : 'Fijo'}
                  </TableCell>
                  <TableCell className='font-medium'>
                    {c.discountType === 'percentage'
                      ? `${c.discountValue}%`
                      : fmtCurrency(parseFloat(c.discountValue), data.currency)}
                  </TableCell>
                  <TableCell className='text-right'>
                    {c.usageCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </TableCell>
                  <TableCell className='text-right'>{fmtCurrency(c.totalDiscountGiven, data.currency)}</TableCell>
                  <TableCell className='text-right'>{fmtNumber(c.ordersUsed)}</TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={
                        c.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
                      }
                    >
                      {c.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-xs'>
                    {c.expiresAt ? fmtDate(c.expiresAt) : 'Sin límite'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ReportSection>
    </div>
  );
}
