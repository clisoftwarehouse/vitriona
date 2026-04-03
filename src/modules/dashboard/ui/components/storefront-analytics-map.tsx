'use client';

import { Globe2 } from 'lucide-react';
import WorldMap, { type ISOCode } from 'react-svg-worldmap';

import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface StorefrontAnalyticsMapProps {
  countries: { code: string; name: string; visits: number }[];
}

function formatCount(value: number) {
  return new Intl.NumberFormat('es').format(value);
}

export function StorefrontAnalyticsMap({ countries }: StorefrontAnalyticsMapProps) {
  const mapData = countries
    .filter((country) => country.code.length === 2)
    .map((country) => ({ country: country.code.toUpperCase() as ISOCode, value: country.visits }));

  return (
    <Card className='gap-4 py-5'>
      <CardHeader className='px-5 pb-0'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>Mapa de procedencia</p>
            <div className='mt-1 flex items-baseline gap-2'>
              <span className='text-2xl font-bold tracking-tight'>{formatCount(countries.length)}</span>
              <span className='text-muted-foreground text-sm'>países con visitas registradas</span>
            </div>
          </div>
          <div className='bg-muted flex size-8 items-center justify-center rounded-lg'>
            <Globe2 className='text-muted-foreground size-4' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-5 px-5'>
        {mapData.length === 0 ? (
          <div className='text-muted-foreground flex min-h-72 items-center justify-center rounded-2xl border border-dashed text-sm'>
            Aún no hay suficientes datos geográficos para dibujar el mapa.
          </div>
        ) : (
          <div className='bg-muted/10 overflow-hidden rounded-2xl border p-3'>
            <WorldMap
              color='var(--color-primary, #6366f1)'
              data={mapData}
              size='responsive'
              backgroundColor='transparent'
              borderColor='rgba(148, 163, 184, 0.35)'
              tooltipBgColor='#ffffff'
              tooltipTextColor='#0f172a'
              frame={false}
              richInteraction
              tooltipTextFunction={(context) =>
                `${context.countryName}: ${formatCount(Number(context.countryValue ?? 0))} visitas`
              }
            />
          </div>
        )}

        {countries.length > 0 && (
          <div className='grid gap-2 sm:grid-cols-2'>
            {countries.slice(0, 6).map((country) => (
              <div key={country.code} className='bg-muted/40 flex items-center justify-between rounded-xl px-3 py-2'>
                <div>
                  <p className='text-sm font-medium'>{country.name}</p>
                  <p className='text-muted-foreground text-xs'>{country.code}</p>
                </div>
                <span className='text-sm font-semibold'>{formatCount(country.visits)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
