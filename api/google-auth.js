// Vercel Serverless Function — handles Google OAuth token exchange & refresh
// The client secret stays here on the server and never reaches the browser

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, code, refreshToken, redirectUri } = req.body;

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Google credentials not configured on server' });
  }

  try {
    if (action === 'exchange') {
      // Exchange authorization code for tokens
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri || 'https://weekly-todo-standalone.vercel.app/auth/callback',
          grant_type: 'authorization_code',
        }),
      });
      const tokens = await response.json();
      return res.status(200).json(tokens);
    }

    if (action === 'refresh') {
      // Refresh an expired access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        }),
      });
      const tokens = await response.json();
      return res.status(200).json(tokens);
    }

    return res.status(400).json({ error: 'Invalid action. Use "exchange" or "refresh".' });
  } catch (err) {
    console.error('Google auth API error:', err);
    return res.status(500).json({ error: 'Server error during Google authentication' });
  }
}
