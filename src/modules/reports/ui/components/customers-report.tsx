'use client';

import { Users, Repeat, UserCheck, DollarSign } from 'lucide-react';
import { useState, useEffect, useCallback, useTransition } from 'react';

import { exportToPdf } from '@/modules/reports/lib/export-pdf';
import { exportToExcel } from '@/modules/reports/lib/export-excel';
import { ReportEmpty, ReportKpiCard, ReportSection, ReportLoading } from './report-card';
import { fmtNumber, fmtPercent, fmtCurrency } from '@/modules/reports/lib/report-formatters';
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from '@/components/ui/table';
import { getCustomersReport, type CustomersReportData } from '@/modules/reports/server/queries/get-reports-data';
import { formatDateRange, type ReportTimeframe, getReportTimeframeMeta } from '@/modules/reports/lib/report-timeframe';

interface CustomersReportProps {
  businessId: string;
  businessName: string;
  timeframe: ReportTimeframe;
  exportType: 'excel' | 'pdf' | null;
}

export function CustomersReport({ businessId, businessName, timeframe, exportType }: CustomersReportProps) {
  const [data, setData] = useState<CustomersReportData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getCustomersReport(businessId, timeframe);
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
              ['Clientes únicos', data.summary.uniqueCustomers],
              ['Clientes recurrentes', data.summary.repeatCustomers],
              ['Tasa de recurrencia', fmtPercent(data.summary.repeatRate)],
              ['Gasto promedio por cliente', fmtCurrency(data.summary.averageSpendPerCustomer, data.currency)],
            ],
          },
          {
            name: 'Top Clientes',
            headers: ['Cliente', 'Email', 'Teléfono', 'Pedidos', 'Total Gastado'],
            rows: data.topCustomers.map((c) => [
              c.name,
              c.email ?? '-',
              c.phone ?? '-',
              c.orderCount,
              fmtCurrency(c.totalSpent, data.currency),
            ]),
          },
        ],
        `Reporte_Clientes_${dateRange}`
      );
    } else {
      exportToPdf({
        title: 'Reporte de Clientes',
        subtitle: `Período: ${meta.label}`,
        businessName,
        dateRange,
        summaryCards: [
          { label: 'Clientes Únicos', value: fmtNumber(data.summary.uniqueCustomers) },
          { label: 'Recurrentes', value: fmtNumber(data.summary.repeatCustomers) },
          { label: 'Tasa Recurrencia', value: fmtPercent(data.summary.repeatRate) },
          { label: 'Gasto Promedio', value: fmtCurrency(data.summary.averageSpendPerCustomer, data.currency) },
        ],
        sections: [
          {
            title: 'Top 20 Clientes por Gasto',
            headers: ['Cliente', 'Email', 'Pedidos', 'Total Gastado'],
            rows: data.topCustomers.map((c) => [
              c.name,
              c.email ?? '-',
              c.orderCount,
              fmtCurrency(c.totalSpent, data.currency),
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
  if (!data) return <ReportEmpty message='No se pudo cargar el reporte de clientes.' />;

  return (
    <div className='space-y-6'>
      {/* KPIs */}
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <ReportKpiCard
          label='Clientes Únicos'
          value={fmtNumber(data.summary.uniqueCustomers)}
          icon={<Users className='size-5' />}
        />
        <ReportKpiCard
          label='Recurrentes'
          value={fmtNumber(data.summary.repeatCustomers)}
          icon={<Repeat className='size-5' />}
        />
        <ReportKpiCard
          label='Tasa Recurrencia'
          value={fmtPercent(data.summary.repeatRate)}
          icon={<UserCheck className='size-5' />}
        />
        <ReportKpiCard
          label='Gasto Promedio'
          value={fmtCurrency(data.summary.averageSpendPerCustomer, data.currency)}
          icon={<DollarSign className='size-5' />}
        />
      </div>

      {/* Top customers */}
      <ReportSection title='Top Clientes por Gasto'>
        {data.topCustomers.length === 0 ? (
          <p className='text-muted-foreground p-4 text-sm'>Sin clientes en este período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className='text-right'>Pedidos</TableHead>
                <TableHead className='text-right'>Total Gastado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topCustomers.map((c, i) => (
                <TableRow key={`${c.name}-${c.email}`}>
                  <TableCell className='text-muted-foreground w-8'>{i + 1}</TableCell>
                  <TableCell className='font-medium'>{c.name}</TableCell>
                  <TableCell className='text-muted-foreground text-sm'>{c.email ?? '-'}</TableCell>
                  <TableCell className='text-muted-foreground text-sm'>{c.phone ?? '-'}</TableCell>
                  <TableCell className='text-right'>{fmtNumber(c.orderCount)}</TableCell>
                  <TableCell className='text-right font-medium'>{fmtCurrency(c.totalSpent, data.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ReportSection>
    </div>
  );
}
