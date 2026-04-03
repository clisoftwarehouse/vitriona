import Link from 'next/link';
import { Eye, Users, Globe2, MapPinned, TrendingUp, ArrowUpRight, TrendingDown, MousePointerClick } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { type DashboardChartGranularity } from '@/modules/dashboard/lib/dashboard-timeframe';
import { StorefrontAnalyticsMap } from '@/modules/dashboard/ui/components/storefront-analytics-map';
import { StorefrontTrafficChart } from '@/modules/dashboard/ui/components/storefront-traffic-chart';
import { type StorefrontAnalyticsResult } from '@/modules/dashboard/server/queries/get-storefront-analytics';

interface StorefrontAnalyticsOverviewProps {
  chartGranularity: DashboardChartGranularity;
  data: StorefrontAnalyticsResult;
  timeframeDescription: string;
  comparisonLabel: string;
}

function formatCount(value: number) {
  return new Intl.NumberFormat('es').format(value);
}

function pctChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }

  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}

export function StorefrontAnalyticsOverview({
  chartGranularity,
  data,
  timeframeDescription,
  comparisonLabel,
}: StorefrontAnalyticsOverviewProps) {
  const hasAnalytics = data.summary.totalVisits > 0 || data.summary.productViews > 0;
  const maxProductViews = Math.max(...data.topViewedProducts.map((product) => product.views), 1);

  const summaryCards = [
    {
      label: 'Visitas al storefront',
      value: formatCount(data.summary.totalVisits),
      change: pctChange(data.summary.totalVisits, data.summary.previousVisits),
      up: data.summary.totalVisits >= data.summary.previousVisits,
      sub: comparisonLabel,
      icon: Eye,
    },
    {
      label: 'Visitantes únicos aprox.',
      value: formatCount(data.summary.uniqueVisitors),
      change: pctChange(data.summary.uniqueVisitors, data.summary.previousUniqueVisitors),
      up: data.summary.uniqueVisitors >= data.summary.previousUniqueVisitors,
      sub: `sesiones únicas en ${timeframeDescription}`,
      icon: Users,
    },
    {
      label: 'Vistas de producto',
      value: formatCount(data.summary.productViews),
      change: pctChange(data.summary.productViews, data.summary.previousProductViews),
      up: data.summary.productViews >= data.summary.previousProductViews,
      sub: `interacciones en ${timeframeDescription}`,
      icon: MousePointerClick,
    },
    {
      label: 'Países alcanzados',
      value: formatCount(data.summary.countryCount),
      change: null,
      up: true,
      sub: data.summary.topCountry
        ? `${formatCount(data.summary.topCountry.visits)} visitas desde ${data.summary.topCountry.name}`
        : 'sin procedencia geográfica disponible aún',
      icon: Globe2,
    },
  ];

  if (!hasAnalytics) {
    return (
      <Card className='mt-2 gap-4 py-10'>
        <CardContent className='flex flex-col items-center justify-center px-6 text-center'>
          <div className='bg-primary/10 mb-4 flex size-14 items-center justify-center rounded-2xl'>
            <MapPinned className='text-primary size-6' />
          </div>
          <h3 className='text-lg font-semibold'>Todavía no hay analítica suficiente del storefront</h3>
          <p className='text-muted-foreground mt-2 max-w-2xl text-sm'>
            Cuando tus clientes empiecen a navegar el storefront verás aquí visitas por país, localidades destacadas y
            productos con más vistas para {timeframeDescription}.
          </p>
          <Link
            href={`/${data.businessSlug}`}
            target='_blank'
            className='text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium'
          >
            Abrir storefront público
            <ArrowUpRight className='size-3.5' />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='mt-2 space-y-2'>
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4'>
        {summaryCards.map(({ label, value, change, up, sub, icon: Icon }) => (
          <Card key={label} className='gap-4 py-5'>
            <CardHeader className='px-5 pb-0'>
              <div className='flex items-start justify-between'>
                <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>{label}</p>
                <div className='bg-muted flex size-8 items-center justify-center rounded-lg'>
                  <Icon className='text-muted-foreground size-4' />
                </div>
              </div>
            </CardHeader>
            <CardContent className='px-5'>
              <div className='flex items-baseline gap-2'>
                <span className='text-2xl font-bold tracking-tight'>{value}</span>
                {change && (
                  <span
                    className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
                  >
                    {up ? <TrendingUp className='size-3' /> : <TrendingDown className='size-3' />}
                    {change}
                  </span>
                )}
              </div>
              <p className='text-muted-foreground mt-1 text-xs'>{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-2 xl:grid-cols-3'>
        <div className='xl:col-span-2'>
          <StorefrontTrafficChart
            data={data.dailyTraffic}
            granularity={chartGranularity}
            rangeDescription={timeframeDescription}
          />
        </div>

        <Card className='gap-4 py-5'>
          <CardHeader className='px-5 pb-0'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>
                  Páginas con más tráfico
                </p>
                <p className='text-muted-foreground mt-1 text-sm'>Qué rutas consultan más dentro del storefront.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-5'>
            {data.topPages.length === 0 ? (
              <p className='text-muted-foreground py-6 text-center text-sm'>Sin páginas registradas todavía.</p>
            ) : (
              <div className='space-y-3'>
                {data.topPages.map((page) => (
                  <Link
                    key={page.path}
                    href={page.path}
                    target='_blank'
                    className='hover:bg-muted/50 flex items-start justify-between gap-3 rounded-xl px-3 py-2 transition-colors'
                  >
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{page.label}</p>
                      <p className='text-muted-foreground truncate text-xs'>{page.path}</p>
                    </div>
                    <Badge variant='outline'>{formatCount(page.visits)}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-2 xl:grid-cols-3'>
        <div className='xl:col-span-2'>
          <StorefrontAnalyticsMap countries={data.countries} />
        </div>

        <Card className='gap-4 py-5'>
          <CardHeader className='px-5 pb-0'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>
                  Localidades destacadas
                </p>
                <p className='text-muted-foreground mt-1 text-sm'>Ciudades y regiones desde donde más te visitan.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-5'>
            {data.localities.length === 0 ? (
              <p className='text-muted-foreground py-6 text-center text-sm'>
                La ubicación fina depende de los headers del proveedor de hosting.
              </p>
            ) : (
              <div className='space-y-3'>
                {data.localities.map((location) => (
                  <div
                    key={`${location.label}-${location.visits}`}
                    className='bg-muted/40 flex items-center justify-between rounded-xl px-3 py-2'
                  >
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{location.label}</p>
                    </div>
                    <span className='text-sm font-semibold'>{formatCount(location.visits)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='gap-4 py-5'>
        <CardHeader className='px-5 pb-0'>
          <div className='flex items-start justify-between'>
            <div>
              <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>
                Productos más vistos
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>
                Qué productos generan más interés dentro del storefront.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='px-5'>
          {data.topViewedProducts.length === 0 ? (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Todavía no hay vistas de producto registradas.
            </p>
          ) : (
            <div className='space-y-4'>
              {data.topViewedProducts.map((product) => (
                <div key={product.productId}>
                  <div className='mb-1 flex items-center justify-between gap-3 text-sm'>
                    <div className='min-w-0'>
                      {product.slug ? (
                        <Link
                          href={`/${data.businessSlug}/producto/${product.slug}`}
                          target='_blank'
                          className='truncate font-medium hover:underline'
                        >
                          {product.name}
                        </Link>
                      ) : (
                        <span className='truncate font-medium'>{product.name}</span>
                      )}
                    </div>
                    <span className='text-muted-foreground shrink-0 text-xs'>{formatCount(product.views)} vistas</span>
                  </div>
                  <div className='bg-muted h-2 overflow-hidden rounded-full'>
                    <div
                      className='h-full rounded-full bg-linear-to-r from-sky-500 to-cyan-500 transition-all'
                      style={{ width: `${(product.views / maxProductViews) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
