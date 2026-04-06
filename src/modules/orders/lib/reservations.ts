export type OrderType = 'order' | 'reservation';

interface ReservationSelection {
  orderType: OrderType;
  reservationDate?: string | null;
  reservationTime?: string | null;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

export function buildReservationDateTime(date: string, time: string): Date | null {
  if (!DATE_REGEX.test(date) || !TIME_REGEX.test(time)) return null;

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const scheduledAt = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (
    scheduledAt.getFullYear() !== year ||
    scheduledAt.getMonth() !== month - 1 ||
    scheduledAt.getDate() !== day ||
    scheduledAt.getHours() !== hours ||
    scheduledAt.getMinutes() !== minutes
  ) {
    return null;
  }

  return scheduledAt;
}

export function validateReservationSelection(selection: ReservationSelection, now = new Date()) {
  if (selection.orderType !== 'reservation') {
    return { ok: true as const };
  }

  if (!selection.reservationDate || !selection.reservationTime) {
    return { ok: false as const, error: 'Selecciona la fecha y hora de la reserva.' };
  }

  const scheduledAt = buildReservationDateTime(selection.reservationDate, selection.reservationTime);
  if (!scheduledAt) {
    return { ok: false as const, error: 'La fecha u hora de la reserva no es valida.' };
  }

  if (scheduledAt.getTime() < now.getTime()) {
    return { ok: false as const, error: 'No puedes reservar para una fecha u hora pasada.' };
  }

  return { ok: true as const, scheduledAt };
}

export function formatReservationDateTime(date: string, time: string, locale = 'es') {
  const scheduledAt = buildReservationDateTime(date, time);
  if (!scheduledAt) return `${date} ${time}`;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(scheduledAt);
}

export function formatReservationDateTimeShort(date: string, time: string, locale = 'es') {
  const scheduledAt = buildReservationDateTime(date, time);
  if (!scheduledAt) return `${date} ${time}`;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(scheduledAt);
}
