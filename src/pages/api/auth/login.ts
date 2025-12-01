import type { APIRoute } from 'astro';
import { generateState } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;

  if (!clientId || !callbackUrl) {
    return new Response('GitHub OAuth not configured', { status: 500 });
  }

  // Generate and store state for CSRF protection
  const state = generateState();
  cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  // GitHub OAuth authorization URL
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('scope', 'repo workflow');
  authUrl.searchParams.set('state', state);

  return redirect(authUrl.toString());
};
