import { getValidAccessToken } from './googleAuth';

const BASE_URL = 'https://www.googleapis.com/calendar/v3';

async function googleFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Google not connected');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Calendar API error: ${response.status} ${errorBody}`);
  }

  // DELETE returns no content
  if (response.status === 204) return null;
  return response.json();
}

/** List all calendars */
export async function listCalendars() {
  const result = await googleFetch('/users/me/calendarList');
  return result.items || [];
}

/** Get events for a specific calendar in a time range */
export async function getEvents(calendarId: string, timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });
  const result = await googleFetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  return result.items || [];
}

/** Create a calendar event */
export async function createEvent(calendarId: string, event: {
  summary: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  description?: string;
  location?: string;
}) {
  return googleFetch(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

/** Delete a calendar event */
export async function deleteEvent(calendarId: string, eventId: string) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Google not connected');

  await fetch(`${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

/** Trey's calendar IDs */
export const CALENDAR_IDS = {
  primary: 'primary', // Trey Rhyne
  ashleyTrey: 'c_a0ad72e3873b8266f26b90d812463f78a85bac676891014f77148512e08f6bdd@group.calendar.google.com',
  cerenos: 'trey.cerenos@gmail.com',
};

/** Get events from ALL calendars for a time range */
export async function getAllCalendarEvents(timeMin: string, timeMax: string) {
  const calendarIds = [CALENDAR_IDS.primary, CALENDAR_IDS.ashleyTrey, CALENDAR_IDS.cerenos];
  const allEvents: any[] = [];

  for (const calId of calendarIds) {
    try {
      const events = await getEvents(calId, timeMin, timeMax);
      allEvents.push(...events.map((e: any) => ({
        eventId: e.id,
        title: e.summary || '(No title)',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        location: e.location,
        description: e.description,
        calendarId: calId,
        htmlLink: e.htmlLink,
      })));
    } catch (err) {
      console.warn(`Could not fetch calendar ${calId}:`, err);
    }
  }

  // Sort by start time
  allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return allEvents;
}

/** Check all calendars for conflicts before scheduling */
export async function checkForConflicts(timeMin: string, timeMax: string) {
  const events = await getAllCalendarEvents(timeMin, timeMax);
  return events.filter(e => {
    const eStart = new Date(e.start).getTime();
    const eEnd = new Date(e.end).getTime();
    const reqStart = new Date(timeMin).getTime();
    const reqEnd = new Date(timeMax).getTime();
    return eStart < reqEnd && eEnd > reqStart;
  });
}
