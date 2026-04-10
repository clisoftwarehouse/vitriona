'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { ArrowUp, ArrowDown, RefreshCw, ShoppingCart } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { exportToPdf } from '@/modules/reports/lib/export-pdf';
import { exportToExcel } from '@/modules/reports/lib/export-excel';
import { ReportEmpty, ReportKpiCard, ReportSection, ReportLoading } from './report-card';
import { fmtDate, fmtNumber, fmtMovementType } from '@/modules/reports/lib/report-formatters';
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from '@/components/ui/table';
import { getInventoryReport, type InventoryReportData } from '@/modules/reports/server/queries/get-reports-data';
import { formatDateRange, type ReportTimeframe, getReportTimeframeMeta } from '@/modules/reports/lib/report-timeframe';

interface InventoryReportProps {
  businessId: string;
  businessName: string;
  timeframe: ReportTimeframe;
  exportType: 'excel' | 'pdf' | null;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  in: ArrowDown,
  out: ArrowUp,
  adjustment: RefreshCw,
  order: ShoppingCart,
};

const TYPE_COLORS: Record<string, string> = {
  in: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  out: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400',
  adjustment:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400',
  order: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-400',
};

export function InventoryReport({ businessId, businessName, timeframe, exportType }: InventoryReportProps) {
  const [data, setData] = useState<InventoryReportData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getInventoryReport(businessId, timeframe);
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
            headers: ['Tipo', 'Movimientos', 'Cantidad Total'],
            rows: data.movementSummary.map((s) => [fmtMovementType(s.type), s.count, s.totalQty]),
          },
          {
            name: 'Movimientos',
            headers: ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Razón'],
            rows: data.movements.map((m) => [
              fmtDate(m.createdAt),
              m.productName,
              fmtMovementType(m.type),
              m.quantity,
              m.previousStock,
              m.newStock,
              m.reason ?? '-',
            ]),
          },
        ],
        `Reporte_Inventario_${dateRange}`
      );
    } else {
      exportToPdf({
        title: 'Reporte de Inventario',
        subtitle: `Período: ${meta.label}`,
        businessName,
        dateRange,
        summaryCards: data.movementSummary.map((s) => ({
          label: fmtMovementType(s.type),
          value: `${fmtNumber(s.count)} mov. / ${fmtNumber(s.totalQty)} uds.`,
        })),
        sections: [
          {
            title: 'Movimientos de Inventario',
            headers: ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Anterior', 'Nuevo', 'Razón'],
            rows: data.movements.map((m) => [
              fmtDate(m.createdAt),
              m.productName,
              fmtMovementType(m.type),
              m.quantity,
              m.previousStock,
              m.newStock,
              m.reason ?? '-',
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
  if (!data) return <ReportEmpty message='No se pudo cargar el reporte de inventario.' />;

  return (
    <div className='space-y-6'>
      {/* KPIs */}
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {data.movementSummary.map((s) => {
          const Icon = TYPE_ICONS[s.type] ?? RefreshCw;
          return (
            <ReportKpiCard
              key={s.type}
              label={fmtMovementType(s.type)}
              value={`${fmtNumber(s.count)} mov. · ${fmtNumber(s.totalQty)} uds.`}
              icon={<Icon className='size-5' />}
            />
          );
        })}
        {data.movementSummary.length === 0 && (
          <div className='col-span-full'>
            <ReportEmpty message='No hay movimientos de inventario en este período.' />
          </div>
        )}
      </div>

      {/* Movements table */}
      {data.movements.length > 0 && (
        <ReportSection title={`Movimientos de Inventario (${fmtNumber(data.movements.length)})`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className='text-right'>Cant.</TableHead>
                <TableHead className='text-right'>Anterior</TableHead>
                <TableHead className='text-right'>Nuevo</TableHead>
                <TableHead>Razón</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className='text-muted-foreground text-xs'>{fmtDate(m.createdAt)}</TableCell>
                  <TableCell className='max-w-45 truncate font-medium'>{m.productName}</TableCell>
                  <TableCell>
                    <Badge variant='outline' className={TYPE_COLORS[m.type] ?? ''}>
                      {fmtMovementType(m.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right font-mono'>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </TableCell>
                  <TableCell className='text-muted-foreground text-right font-mono'>{m.previousStock}</TableCell>
                  <TableCell className='text-right font-mono'>{m.newStock}</TableCell>
                  <TableCell className='text-muted-foreground max-w-40 truncate text-xs'>{m.reason ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ReportSection>
      )}
    </div>
  );
}
