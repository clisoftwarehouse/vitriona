'use client';

import { Clock } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DAYS_OF_WEEK, DEFAULT_BUSINESS_HOURS } from '@/modules/businesses/constants';

interface BusinessHoursEditorProps {
  value?: Record<string, { open: string; close: string; closed: boolean }>;
  onChange: (hours: Record<string, { open: string; close: string; closed: boolean }>) => void;
  disabled?: boolean;
}

export function BusinessHoursEditor({ value, onChange, disabled }: BusinessHoursEditorProps) {
  const hours = value ?? DEFAULT_BUSINESS_HOURS;

  const updateDay = (key: string, field: 'open' | 'close' | 'closed', val: string | boolean) => {
    const updated = { ...hours, [key]: { ...hours[key], [field]: val } };
    onChange(updated);
  };

  return (
    <div className='space-y-3'>
      {DAYS_OF_WEEK.map(({ key, label }) => {
        const day = hours[key] ?? { open: '09:00', close: '18:00', closed: false };
        return (
          <div key={key} className='flex items-center gap-3'>
            <span className='w-24 text-sm font-medium'>{label}</span>
            <Switch
              checked={!day.closed}
              onCheckedChange={(open) => updateDay(key, 'closed', !open)}
              disabled={disabled}
            />
            {day.closed ? (
              <span className='text-muted-foreground text-sm italic'>Cerrado</span>
            ) : (
              <div className='flex items-center gap-2'>
                <Clock className='text-muted-foreground size-3.5' />
                <Input
                  type='time'
                  value={day.open}
                  onChange={(e) => updateDay(key, 'open', e.target.value)}
                  className='w-28'
                  disabled={disabled}
                />
                <span className='text-muted-foreground text-sm'>a</span>
                <Input
                  type='time'
                  value={day.close}
                  onChange={(e) => updateDay(key, 'close', e.target.value)}
                  className='w-28'
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
