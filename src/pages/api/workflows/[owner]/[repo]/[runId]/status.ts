import { withAuth } from '../../../../../../lib/api-auth';
import { mapWorkflowRun } from '../../../../../../lib/workflowMappers';

export const GET = withAuth(async ({ params, request }, session) => {
  const { owner, repo, runId } = params;

  if (!owner || !repo || !runId) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get conditional request headers
    const ifNoneMatch = request.headers.get('If-None-Match');

    // Use direct fetch to GitHub API for ETag support
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;

    const requestHeaders: HeadersInit = {
      'Authorization': `Bearer ${session.accessToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (ifNoneMatch) {
      requestHeaders['If-None-Match'] = ifNoneMatch;
    }

    const githubResponse = await fetch(apiUrl, {
      headers: requestHeaders,
    });

    // Get ETag from response
    const etag = githubResponse.headers.get('ETag') || '';

    // If 304 Not Modified, return 304 directly to frontend
    // Frontend will handle this by reusing cached data
    if (githubResponse.status === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          'Cache-Control': 'no-cache',
          ...(etag && { 'ETag': etag }),
        },
      });
    }

    if (!githubResponse.ok) {
      throw new Error(`GitHub API error: ${githubResponse.status}`);
    }

    const run = await githubResponse.json();

    const responseData = mapWorkflowRun(run, owner, repo);

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...(etag && { 'ETag': etag }),
        },
      }
    );
  } catch (error) {
    console.error('Error fetching workflow run status:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch workflow run status' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
