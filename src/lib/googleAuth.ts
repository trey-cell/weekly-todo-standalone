import { supabase } from './supabase';

// Only the Client ID is needed in the browser — it's public/safe
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
].join(' ');

/** Redirect user to Google OAuth consent screen */
export function initiateGoogleAuth() {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  window.location.href = authUrl.toString();
}

/** Exchange auth code for tokens via our secure server API */
export async function handleAuthCallback(code: string): Promise<boolean> {
  try {
    // Send the code to our Vercel API route (secret stays on server)
    const response = await fetch('/api/google-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'exchange',
        code,
        redirectUri: REDIRECT_URI,
      }),
    });

    const tokens = await response.json();
    if (tokens.error) {
      console.error('Token exchange failed:', tokens.error_description || tokens.error);
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Store tokens in Supabase
    const { error } = await supabase.from('google_tokens').upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      console.error('Failed to store tokens:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('OAuth callback error:', err);
    return false;
  }
}

/** Get a valid Google access token, refreshing if needed */
export async function getValidAccessToken(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tokenData } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!tokenData) return null;

  // Check if token is still valid (with 5-minute buffer)
  const expiresAt = new Date(tokenData.expires_at);
  const bufferMs = 5 * 60 * 1000;

  if (expiresAt.getTime() - bufferMs > Date.now()) {
    return tokenData.access_token;
  }

  // Token expired — refresh via our secure server API
  if (!tokenData.refresh_token) return null;

  try {
    const response = await fetch('/api/google-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'refresh',
        refreshToken: tokenData.refresh_token,
      }),
    });

    const newTokens = await response.json();
    if (newTokens.error) {
      console.error('Token refresh failed:', newTokens.error);
      return null;
    }

    await supabase.from('google_tokens').update({
      access_token: newTokens.access_token,
      expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    return newTokens.access_token;
  } catch (err) {
    console.error('Token refresh error:', err);
    return null;
  }
}

/** Check if Google is connected */
export async function isGoogleConnected(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('google_tokens')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return !!data;
}

/** Disconnect Google account */
export async function disconnectGoogle(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('google_tokens').delete().eq('user_id', user.id);
  }
}
