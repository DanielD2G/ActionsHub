import type { APIRoute } from 'astro';
import { OAuthApp } from '@octokit/oauth-app';
import { createSession } from '../../../lib/auth';
import { getAuthenticatedUser } from '../../../lib/github';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('oauth_state');

  // Validate state parameter for CSRF protection
  if (!state || !storedState || state !== storedState.value) {
    return new Response('Invalid state parameter', { status: 400 });
  }

  // Clear the state cookie
  cookies.delete('oauth_state', { path: '/' });

  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth not configured', { status: 500 });
  }

  try {
    // Exchange code for access token
    const app = new OAuthApp({
      clientType: 'oauth-app',
      clientId,
      clientSecret,
    });

    const { authentication } = await app.createToken({
      code,
    });

    const accessToken = authentication.token;

    // Get user information
    const user = await getAuthenticatedUser(accessToken);

    // Create session
    createSession(cookies, {
      accessToken,
      username: user.login,
      githubUserId: String(user.id),
      avatarUrl: user.avatar_url,
      email: user.email,
      profileUrl: user.html_url,
      name: user.name,
    });

    return redirect('/');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
};
