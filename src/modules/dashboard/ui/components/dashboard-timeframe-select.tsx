'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';
import {
  type DashboardTimeframe,
  DASHBOARD_TIMEFRAME_OPTIONS,
  DEFAULT_DASHBOARD_TIMEFRAME,
} from '@/modules/dashboard/lib/dashboard-timeframe';

interface DashboardTimeframeSelectProps {
  value: DashboardTimeframe;
}

export function DashboardTimeframeSelect({ value }: DashboardTimeframeSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleValueChange(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue === DEFAULT_DASHBOARD_TIMEFRAME) {
      params.delete('range');
    } else {
      params.set('range', nextValue);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select defaultValue={value} onValueChange={handleValueChange}>
      <SelectTrigger className='w-full md:w-56'>
        <SelectValue placeholder='Rango de tiempo' />
      </SelectTrigger>
      <SelectContent>
        {DASHBOARD_TIMEFRAME_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
