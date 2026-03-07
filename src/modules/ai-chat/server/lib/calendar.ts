import { google } from 'googleapis';

function getServiceAccountAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const key = JSON.parse(keyJson);

  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface BookingParams {
  calendarId: string;
  timezone: string;
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendeeEmail?: string;
}

export async function getAvailableSlots(
  calendarId: string,
  date: string,
  slotDurationMinutes: number = 60
): Promise<TimeSlot[]> {
  const auth = getServiceAccountAuth();
  const calendar = google.calendar({ version: 'v3', auth });

  const dayStart = new Date(`${date}T08:00:00`);
  const dayEnd = new Date(`${date}T18:00:00`);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busySlots = response.data.calendars?.[calendarId]?.busy ?? [];

  const slots: TimeSlot[] = [];
  let current = new Date(dayStart);

  while (current < dayEnd) {
    const slotEnd = new Date(current.getTime() + slotDurationMinutes * 60 * 1000);
    if (slotEnd > dayEnd) break;

    const isBusy = busySlots.some((busy) => {
      const busyStart = new Date(busy.start!);
      const busyEnd = new Date(busy.end!);
      return current < busyEnd && slotEnd > busyStart;
    });

    if (!isBusy) {
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    current = new Date(current.getTime() + slotDurationMinutes * 60 * 1000);
  }

  return slots;
}

export async function bookAppointment(params: BookingParams) {
  const auth = getServiceAccountAuth();
  const calendar = google.calendar({ version: 'v3', auth });

  const description = params.attendeeEmail
    ? `${params.description ?? ''}\n\nContacto del cliente: ${params.attendeeEmail}`.trim()
    : params.description;

  const requestBody: Record<string, unknown> = {
    summary: params.summary,
    description,
    start: { dateTime: params.startTime, timeZone: params.timezone },
    end: { dateTime: params.endTime, timeZone: params.timezone },
  };

  // Try with attendees first so client gets the event in their calendar
  if (params.attendeeEmail) {
    try {
      const event = await calendar.events.insert({
        calendarId: params.calendarId,
        sendUpdates: 'all',
        requestBody: {
          ...requestBody,
          attendees: [{ email: params.attendeeEmail }],
        },
      });

      return {
        eventId: event.data.id,
        htmlLink: event.data.htmlLink,
        start: event.data.start?.dateTime,
        end: event.data.end?.dateTime,
      };
    } catch {
      console.warn('Could not add attendees (Domain-Wide Delegation required). Creating event without attendees.');
    }
  }

  // Fallback: create without attendees
  const event = await calendar.events.insert({
    calendarId: params.calendarId,
    requestBody,
  });

  console.log('Event created on calendar:', params.calendarId, 'Event ID:', event.data.id);

  return {
    eventId: event.data.id,
    htmlLink: event.data.htmlLink,
    start: event.data.start?.dateTime,
    end: event.data.end?.dateTime,
  };
}

export function getServiceAccountEmail(): string | null {
  try {
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!keyJson) return null;
    const key = JSON.parse(keyJson);
    return key.client_email ?? null;
  } catch {
    return null;
  }
}
