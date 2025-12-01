import type { APIRoute, APIContext } from 'astro';
import { getSession } from './auth';
import type { SessionData } from './auth';

/**
 * Handler type for authenticated API routes.
 * The session parameter is guaranteed to exist.
 */
type AuthenticatedHandler = (
  context: APIContext,
  session: SessionData
) => Response | Promise<Response>;

/**
 * Higher Order Function that wraps API routes with authentication.
 *
 * Usage:
 * ```typescript
 * export const GET = withAuth(async ({ params, url }, session) => {
 *   // session is guaranteed to exist here
 *   const octokit = createGitHubClient(session.accessToken);
 *   // ... endpoint logic
 * });
 * ```
 *
 * @param handler - The API route handler that requires authentication
 * @returns An APIRoute that validates authentication before calling the handler
 */
export function withAuth(handler: AuthenticatedHandler): APIRoute {
  return async (context) => {
    const session = getSession(context.cookies);

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(context, session);
  };
}
