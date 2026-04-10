export const REPORT_TIMEFRAME_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'last_7_days', label: 'Últimos 7 días' },
  { value: 'last_30_days', label: 'Últimos 30 días' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'previous_month', label: 'Mes anterior' },
  { value: 'last_90_days', label: 'Últimos 90 días' },
  { value: 'this_year', label: 'Este año' },
] as const;

export type ReportTimeframe = (typeof REPORT_TIMEFRAME_OPTIONS)[number]['value'];

export const DEFAULT_REPORT_TIMEFRAME: ReportTimeframe = 'this_month';

export interface ReportTimeframeMeta {
  value: ReportTimeframe;
  label: string;
  start: Date;
  end: Date;
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function startOfUtcWeek(date: Date) {
  const d = startOfUtcDay(date);
  const dow = d.getUTCDay();
  return addUtcDays(d, -(dow === 0 ? 6 : dow - 1));
}

function startOfUtcYear(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

export function parseReportTimeframe(value?: string | null): ReportTimeframe {
  return REPORT_TIMEFRAME_OPTIONS.some((o) => o.value === value)
    ? (value as ReportTimeframe)
    : DEFAULT_REPORT_TIMEFRAME;
}

export function getReportTimeframeMeta(timeframe: ReportTimeframe, now = new Date()): ReportTimeframeMeta {
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = addUtcDays(todayStart, 1);

  const option = REPORT_TIMEFRAME_OPTIONS.find((o) => o.value === timeframe)!;

  switch (timeframe) {
    case 'today':
      return { value: timeframe, label: option.label, start: todayStart, end: tomorrowStart };
    case 'this_week':
      return { value: timeframe, label: option.label, start: startOfUtcWeek(now), end: tomorrowStart };
    case 'last_7_days':
      return { value: timeframe, label: option.label, start: addUtcDays(tomorrowStart, -7), end: tomorrowStart };
    case 'last_30_days':
      return { value: timeframe, label: option.label, start: addUtcDays(tomorrowStart, -30), end: tomorrowStart };
    case 'this_month':
      return { value: timeframe, label: option.label, start: startOfUtcMonth(now), end: tomorrowStart };
    case 'previous_month': {
      const monthStart = startOfUtcMonth(now);
      return { value: timeframe, label: option.label, start: addUtcMonths(monthStart, -1), end: monthStart };
    }
    case 'last_90_days':
      return { value: timeframe, label: option.label, start: addUtcDays(tomorrowStart, -90), end: tomorrowStart };
    case 'this_year':
      return { value: timeframe, label: option.label, start: startOfUtcYear(now), end: tomorrowStart };
    default:
      return { value: timeframe, label: option.label, start: startOfUtcMonth(now), end: tomorrowStart };
  }
}

export function formatDateRange(meta: ReportTimeframeMeta): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${fmt(meta.start)} — ${fmt(new Date(meta.end.getTime() - 1))}`;
}
