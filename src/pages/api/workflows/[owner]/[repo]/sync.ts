import { withAuth } from '../../../../../lib/api-auth';
import { createGitHubClient } from '../../../../../lib/github';
import { mapWorkflowRun } from '../../../../../lib/workflowMappers';

export const GET = withAuth(async ({ params, request }, session) => {
  const { owner, repo } = params;

  if (!owner || !repo) {
    return new Response(
      JSON.stringify({ error: 'Owner and repo are required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get conditional request headers
    const ifNoneMatch = request.headers.get('If-None-Match');
    const ifModifiedSince = request.headers.get('If-Modified-Since');

    // Use direct fetch to GitHub API for full HTTP control (including 304 handling)
    // Octokit doesn't properly expose 304 responses
    // Sort by 'updated' to catch reruns (they update the updated_at timestamp)
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=100&sort=updated&direction=desc`;

    const requestHeaders: HeadersInit = {
      'Authorization': `Bearer ${session.accessToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (ifNoneMatch) {
      requestHeaders['If-None-Match'] = ifNoneMatch;
    }
    if (ifModifiedSince) {
      requestHeaders['If-Modified-Since'] = ifModifiedSince;
    }

    const githubResponse = await fetch(apiUrl, {
      headers: requestHeaders,
    });

    // Get ETag and Last-Modified from response headers (if available)
    const etag = githubResponse.headers.get('ETag') || '';
    const lastModified = githubResponse.headers.get('Last-Modified') || '';

    // If 304 Not Modified, return 304 directly to frontend
    // Frontend will handle this by reusing cached data
    if (githubResponse.status === 304) {
      const responseHeadersMap: { [key: string]: string } = {
        'Cache-Control': 'no-store',
      };

      if (etag) {
        responseHeadersMap['ETag'] = etag;
      }
      if (lastModified) {
        responseHeadersMap['Last-Modified'] = lastModified;
      }

      return new Response(null, {
        status: 304,
        headers: responseHeadersMap,
      });
    }

    if (!githubResponse.ok) {
      if (githubResponse.status === 404) {
        return new Response(
          JSON.stringify([]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      throw new Error(`GitHub API error: ${githubResponse.status}`);
    }

    const data = await githubResponse.json();
    const workflowRuns = data.workflow_runs || [];

    // Map all workflows to our format (no status filtering)
    const runs = workflowRuns.map((run: any) =>
      mapWorkflowRun(run, owner, repo)
    );

    const responseHeadersMap: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store', // Prevent browser caching
    };

    if (etag) {
      responseHeadersMap['ETag'] = etag;
    }
    if (lastModified) {
      responseHeadersMap['Last-Modified'] = lastModified;
    }

    return new Response(
      JSON.stringify(runs),
      {
        status: 200,
        headers: responseHeadersMap,
      }
    );
  } catch (error: any) {
    console.error('Error syncing workflows:', error);

    // If it's a 404, the repo might not have actions enabled
    if (error.status === 404) {
      return new Response(
        JSON.stringify([]), // Return empty array for repos without actions
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to sync workflows' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
