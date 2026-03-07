import { supabase } from './supabase';

// Store Google tokens in memory + localStorage for persistence across page loads
// (Supabase only provides provider_token immediately after OAuth, not on refresh)
let cachedToken: string | null = null;
let cachedRefreshToken: string | null = null;

// Initialize from localStorage on load
if (typeof window !== 'undefined') {
  cachedToken = localStorage.getItem('google_access_token');
  cachedRefreshToken = localStorage.getItem('google_refresh_token');
}

// Listen for auth state changes to capture Google tokens
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.provider_token) {
      cachedToken = session.provider_token;
      localStorage.setItem('google_access_token', session.provider_token);
    }
    if ((session as any)?.provider_refresh_token) {
      cachedRefreshToken = (session as any).provider_refresh_token;
      localStorage.setItem('google_refresh_token', (session as any).provider_refresh_token);
    }
  });
}

// === Core auth functions ===

export async function isGoogleConnected(): Promise<boolean> {
  if (cachedToken) return true;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.provider_token) {
    cachedToken = session.provider_token;
    localStorage.setItem('google_access_token', session.provider_token);
    return true;
  }
  // Check localStorage as fallback
  return !!localStorage.getItem('google_access_token');
}

export async function getGoogleToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.provider_token) {
    cachedToken = session.provider_token;
    localStorage.setItem('google_access_token', session.provider_token);
    return session.provider_token;
  }
  return localStorage.getItem('google_access_token');
}

// Backward compatibility alias used by googleCalendar.ts and googleTasks.ts
export const getValidAccessToken = getGoogleToken;

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

// Backward compatibility alias used by GoogleConnect.tsx and CalendarView.tsx
export const initiateGoogleAuth = connectGoogle;

// Backward compatibility - called by App.tsx after OAuth redirect
// With Supabase auth, the callback is handled automatically via onAuthStateChange
export async function handleAuthCallback(_code?: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.provider_token) {
    cachedToken = session.provider_token;
    localStorage.setItem('google_access_token', session.provider_token);
    if ((session as any)?.provider_refresh_token) {
      cachedRefreshToken = (session as any).provider_refresh_token;
      localStorage.setItem('google_refresh_token', (session as any).provider_refresh_token);
    }
    return true;
  }
  return !!localStorage.getItem('google_access_token');
}

export async function disconnectGoogle(): Promise<void> {
  cachedToken = null;
  cachedRefreshToken = null;
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_refresh_token');
  await supabase.auth.signOut();
}
