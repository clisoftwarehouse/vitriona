export const DASHBOARD_TIMEFRAME_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'last_7_days', label: 'Últimos 7 días' },
  { value: 'last_30_days', label: 'Últimos 30 días' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'previous_month', label: 'Mes anterior' },
] as const;

export type DashboardTimeframe = (typeof DASHBOARD_TIMEFRAME_OPTIONS)[number]['value'];
export type DashboardChartGranularity = 'day' | 'hour';

export const DEFAULT_DASHBOARD_TIMEFRAME: DashboardTimeframe = 'this_month';

interface DashboardTimeframeConfig {
  label: string;
  rangeDescription: string;
  ordersStatLabel: string;
  revenueChartTitle: string;
  topProductsTitle: string;
  topProductsEmptyMessage: string;
  recentOrdersTitle: string;
  recentOrdersEmptyMessage: string;
  comparisonLabel: string;
}

export interface DashboardTimeframeMeta extends DashboardTimeframeConfig {
  value: DashboardTimeframe;
  chartGranularity: DashboardChartGranularity;
  chartBuckets: string[];
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  currentDateKeys: string[];
  previousDateKeys: string[];
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function startOfUtcWeek(date: Date) {
  const currentDayStart = startOfUtcDay(date);
  const dayOfWeek = currentDayStart.getUTCDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addUtcDays(currentDayStart, -daysSinceMonday);
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getHourKey(hour: number) {
  return String(hour).padStart(2, '0');
}

function buildDateKeys(start: Date, endExclusive: Date) {
  const dateKeys: string[] = [];

  for (let currentDate = new Date(start); currentDate < endExclusive; currentDate = addUtcDays(currentDate, 1)) {
    dateKeys.push(getDateKey(currentDate));
  }

  return dateKeys;
}

function buildHourKeys(endHourInclusive: number) {
  return Array.from({ length: endHourInclusive + 1 }, (_, hour) => getHourKey(hour));
}

export function parseDashboardTimeframe(value?: string | null): DashboardTimeframe {
  return DASHBOARD_TIMEFRAME_OPTIONS.some((option) => option.value === value)
    ? (value as DashboardTimeframe)
    : DEFAULT_DASHBOARD_TIMEFRAME;
}

export function getDashboardTimeframeMeta(timeframe: DashboardTimeframe, now = new Date()): DashboardTimeframeMeta {
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = addUtcDays(todayStart, 1);
  const currentMonthStart = startOfUtcMonth(now);

  let currentStart: Date;
  let currentEnd: Date;
  let previousStart: Date;
  let previousEnd: Date;
  let config: DashboardTimeframeConfig;

  switch (timeframe) {
    case 'today': {
      currentStart = todayStart;
      currentEnd = tomorrowStart;
      previousStart = addUtcDays(todayStart, -1);
      previousEnd = todayStart;
      config = {
        label: 'Hoy',
        rangeDescription: 'hoy',
        ordersStatLabel: 'Pedidos de hoy',
        revenueChartTitle: 'Ingresos — hoy por hora',
        topProductsTitle: 'Productos más vendidos — hoy',
        topProductsEmptyMessage: 'Sin ventas hoy',
        recentOrdersTitle: 'Pedidos de hoy',
        recentOrdersEmptyMessage: 'No hay pedidos hoy.',
        comparisonLabel: 'vs ayer',
      };
      break;
    }

    case 'this_week': {
      currentStart = startOfUtcWeek(now);
      currentEnd = tomorrowStart;
      previousStart = addUtcDays(currentStart, -7);
      previousEnd = addUtcDays(previousStart, buildDateKeys(currentStart, currentEnd).length);
      config = {
        label: 'Esta semana',
        rangeDescription: 'esta semana',
        ordersStatLabel: 'Pedidos de la semana',
        revenueChartTitle: 'Ingresos — esta semana',
        topProductsTitle: 'Productos más vendidos — esta semana',
        topProductsEmptyMessage: 'Sin ventas esta semana',
        recentOrdersTitle: 'Pedidos de esta semana',
        recentOrdersEmptyMessage: 'No hay pedidos esta semana.',
        comparisonLabel: 'vs mismo tramo de la semana anterior',
      };
      break;
    }

    case 'last_7_days': {
      currentEnd = tomorrowStart;
      currentStart = addUtcDays(currentEnd, -7);
      previousEnd = currentStart;
      previousStart = addUtcDays(previousEnd, -7);
      config = {
        label: 'Últimos 7 días',
        rangeDescription: 'los últimos 7 días',
        ordersStatLabel: 'Pedidos en 7 días',
        revenueChartTitle: 'Ingresos — últimos 7 días',
        topProductsTitle: 'Productos más vendidos — últimos 7 días',
        topProductsEmptyMessage: 'Sin ventas en los últimos 7 días',
        recentOrdersTitle: 'Pedidos en los últimos 7 días',
        recentOrdersEmptyMessage: 'No hay pedidos en los últimos 7 días.',
        comparisonLabel: 'vs 7 días previos',
      };
      break;
    }

    case 'last_30_days': {
      currentEnd = tomorrowStart;
      currentStart = addUtcDays(currentEnd, -30);
      previousEnd = currentStart;
      previousStart = addUtcDays(previousEnd, -30);
      config = {
        label: 'Últimos 30 días',
        rangeDescription: 'los últimos 30 días',
        ordersStatLabel: 'Pedidos en 30 días',
        revenueChartTitle: 'Ingresos — últimos 30 días',
        topProductsTitle: 'Productos más vendidos — últimos 30 días',
        topProductsEmptyMessage: 'Sin ventas en los últimos 30 días',
        recentOrdersTitle: 'Pedidos en los últimos 30 días',
        recentOrdersEmptyMessage: 'No hay pedidos en los últimos 30 días.',
        comparisonLabel: 'vs 30 días previos',
      };
      break;
    }

    case 'previous_month': {
      currentStart = addUtcMonths(currentMonthStart, -1);
      currentEnd = currentMonthStart;
      previousStart = addUtcMonths(currentMonthStart, -2);
      previousEnd = currentStart;
      config = {
        label: 'Mes anterior',
        rangeDescription: 'el mes anterior',
        ordersStatLabel: 'Pedidos del mes anterior',
        revenueChartTitle: 'Ingresos — mes anterior',
        topProductsTitle: 'Productos más vendidos — mes anterior',
        topProductsEmptyMessage: 'Sin ventas en el mes anterior',
        recentOrdersTitle: 'Pedidos del mes anterior',
        recentOrdersEmptyMessage: 'No hubo pedidos en el mes anterior.',
        comparisonLabel: 'vs el mes previo',
      };
      break;
    }

    case 'this_month':
    default: {
      currentStart = currentMonthStart;
      currentEnd = tomorrowStart;
      previousStart = addUtcMonths(currentMonthStart, -1);
      previousEnd = new Date(
        Math.min(
          addUtcDays(previousStart, buildDateKeys(currentStart, currentEnd).length).getTime(),
          currentStart.getTime()
        )
      );
      config = {
        label: 'Este mes',
        rangeDescription: 'este mes',
        ordersStatLabel: 'Pedidos del mes',
        revenueChartTitle: 'Ingresos — este mes',
        topProductsTitle: 'Productos más vendidos — este mes',
        topProductsEmptyMessage: 'Sin ventas este mes',
        recentOrdersTitle: 'Pedidos de este mes',
        recentOrdersEmptyMessage: 'No hay pedidos este mes.',
        comparisonLabel: 'vs mismo tramo del mes anterior',
      };
      break;
    }
  }

  const currentDateKeys = buildDateKeys(currentStart, currentEnd);
  const previousDateKeys = buildDateKeys(previousStart, previousEnd);
  const chartGranularity: DashboardChartGranularity = timeframe === 'today' ? 'hour' : 'day';
  const chartBuckets = chartGranularity === 'hour' ? buildHourKeys(now.getUTCHours()) : currentDateKeys;

  return {
    value: timeframe,
    chartGranularity,
    chartBuckets,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    currentDateKeys,
    previousDateKeys,
    ...config,
  };
}
