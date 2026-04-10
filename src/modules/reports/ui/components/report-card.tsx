'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ReportKpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  className?: string;
}

export function ReportKpiCard({ label, value, icon, className }: ReportKpiCardProps) {
  return (
    <div className={cn('bg-card border-border flex items-center gap-4 rounded-xl border p-4 shadow-xs', className)}>
      <div className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg'>
        {icon}
      </div>
      <div className='min-w-0'>
        <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{label}</p>
        <p className='text-foreground truncate text-lg font-bold'>{value}</p>
      </div>
    </div>
  );
}

interface ReportSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ReportSection({ title, children, className }: ReportSectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className='text-sm font-semibold tracking-tight'>{title}</h3>
      <div className='bg-card border-border overflow-hidden rounded-xl border shadow-xs'>{children}</div>
    </div>
  );
}

export function ReportEmpty({ message }: { message: string }) {
  return (
    <div className='flex flex-col items-center justify-center py-16'>
      <p className='text-muted-foreground text-sm'>{message}</p>
    </div>
  );
}

export function ReportLoading() {
  return (
    <div className='flex flex-col items-center justify-center py-16'>
      <div className='border-primary size-6 animate-spin rounded-full border-2 border-t-transparent' />
      <p className='text-muted-foreground mt-3 text-sm'>Generando reporte...</p>
    </div>
  );
}
