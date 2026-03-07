import { supabase } from './supabase';

// Google API base URLs
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const TASKS_API = 'https://www.googleapis.com/tasks/v1';

// Check if user has Google connected
export async function isGoogleConnected(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.provider_token;
}

// Get the Google access token from Supabase session
export async function getGoogleToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.provider_token || null;
}

// Sign in with Google via Supabase (requests calendar + tasks scopes)
export async function connectGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks',
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

// Disconnect Google
export async function disconnectGoogle(): Promise<void> {
  await supabase.auth.signOut();
}

// --- Google Calendar API ---

export async function fetchCalendarEvents(
  timeMin: string,
  timeMax: string,
  calendarId: string = 'primary'
): Promise<any[]> {
  const token = await getGoogleToken();
  if (!token) return [];

  try {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    });

    const res = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      console.error('Calendar API error:', res.status);
      return [];
    }

    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Failed to fetch calendar events:', err);
    return [];
  }
}

export async function createCalendarEvent(
  title: string,
  start: string,
  end: string,
  calendarId: string = 'primary'
): Promise<any> {
  const token = await getGoogleToken();
  if (!token) throw new Error('Not connected to Google');

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: title,
        start: { dateTime: start },
        end: { dateTime: end },
      }),
    }
  );

  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
  return res.json();
}

// --- Google Tasks API ---

export async function fetchTaskLists(): Promise<any[]> {
  const token = await getGoogleToken();
  if (!token) return [];

  try {
    const res = await fetch(`${TASKS_API}/users/@me/lists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Failed to fetch task lists:', err);
    return [];
  }
}

export async function fetchGoogleTasks(taskListId: string): Promise<any[]> {
  const token = await getGoogleToken();
  if (!token) return [];

  try {
    const res = await fetch(
      `${TASKS_API}/lists/${taskListId}/tasks?showCompleted=false&maxResults=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Failed to fetch tasks:', err);
    return [];
  }
}

export async function createGoogleTask(
  taskListId: string,
  title: string,
  notes?: string,
  due?: string
): Promise<any> {
  const token = await getGoogleToken();
  if (!token) throw new Error('Not connected to Google');

  const body: any = { title };
  if (notes) body.notes = notes;
  if (due) body.due = due;

  const res = await fetch(`${TASKS_API}/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Tasks API error: ${res.status}`);
  return res.json();
}

export async function deleteGoogleTask(
  taskListId: string,
  taskId: string
): Promise<void> {
  const token = await getGoogleToken();
  if (!token) throw new Error('Not connected to Google');

  const res = await fetch(`${TASKS_API}/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Tasks API error: ${res.status}`);
}
