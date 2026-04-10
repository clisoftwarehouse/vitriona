'use client';

import { useState, useTransition } from 'react';
import { Users, Package, FileText, Warehouse, DollarSign, TicketPercent, FileSpreadsheet } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SalesReport } from './sales-report';
import { Button } from '@/components/ui/button';
import { CouponsReport } from './coupons-report';
import { ProductsReport } from './products-report';
import { InventoryReport } from './inventory-report';
import { CustomersReport } from './customers-report';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import {
  type ReportTimeframe,
  REPORT_TIMEFRAME_OPTIONS,
  DEFAULT_REPORT_TIMEFRAME,
} from '@/modules/reports/lib/report-timeframe';

const REPORT_TABS = [
  { id: 'sales', label: 'Ventas', icon: DollarSign },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'inventory', label: 'Inventario', icon: Warehouse },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'coupons', label: 'Cupones', icon: TicketPercent },
] as const;

type ReportTab = (typeof REPORT_TABS)[number]['id'];

interface ReportsContainerProps {
  businessId: string;
  businessName: string;
}

export function ReportsContainer({ businessId, businessName }: ReportsContainerProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [timeframe, setTimeframe] = useState<ReportTimeframe>(DEFAULT_REPORT_TIMEFRAME);
  const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null);
  const [, startTransition] = useTransition();

  const handleExport = (type: 'excel' | 'pdf') => {
    setExportType(type);
    // Reset after a tick so child can pick it up
    setTimeout(() => setExportType(null), 100);
  };

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Reportes</h1>
          <p className='text-muted-foreground text-sm'>Analiza el rendimiento de tu negocio con reportes detallados.</p>
        </div>

        <div className='flex items-center gap-2'>
          <Select value={timeframe} onValueChange={(v) => startTransition(() => setTimeframe(v as ReportTimeframe))}>
            <SelectTrigger className='w-44'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TIMEFRAME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant='outline' size='sm' className='gap-1.5' onClick={() => handleExport('excel')}>
            <FileSpreadsheet className='size-4' />
            <span className='hidden sm:inline'>Excel</span>
          </Button>
          <Button variant='outline' size='sm' className='gap-1.5' onClick={() => handleExport('pdf')}>
            <FileText className='size-4' />
            <span className='hidden sm:inline'>PDF</span>
          </Button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className='border-b'>
        <nav className='-mb-px flex gap-1 overflow-x-auto'>
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground border-transparent'
                )}
              >
                <Icon className='size-4' />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Report content */}
      <div className='min-h-[400px]'>
        {activeTab === 'sales' && (
          <SalesReport
            businessId={businessId}
            businessName={businessName}
            timeframe={timeframe}
            exportType={exportType}
          />
        )}
        {activeTab === 'products' && (
          <ProductsReport
            businessId={businessId}
            businessName={businessName}
            timeframe={timeframe}
            exportType={exportType}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryReport
            businessId={businessId}
            businessName={businessName}
            timeframe={timeframe}
            exportType={exportType}
          />
        )}
        {activeTab === 'customers' && (
          <CustomersReport
            businessId={businessId}
            businessName={businessName}
            timeframe={timeframe}
            exportType={exportType}
          />
        )}
        {activeTab === 'coupons' && (
          <CouponsReport
            businessId={businessId}
            businessName={businessName}
            timeframe={timeframe}
            exportType={exportType}
          />
        )}
      </div>
    </div>
  );
}
