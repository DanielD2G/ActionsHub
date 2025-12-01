import { withAuth } from '../../../../../lib/api-auth';
import { mapWorkflowDetails } from '../../../../../lib/workflowMappers';

interface GitHubStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
}

interface GitHubJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  html_url: string;
  steps?: GitHubStep[];
}

interface GitHubJobsResponse {
  jobs: GitHubJob[];
}

export const GET = withAuth(async ({ params, request }, session) => {
  const { owner, repo, runId } = params;

  if (!owner || !repo || !runId) {
    return new Response(
      JSON.stringify({ error: 'Missing parameters' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get conditional request headers
    const ifNoneMatch = request.headers.get('If-None-Match');

    const url = new URL(request.url);
    const attemptParam = url.searchParams.get('attempt');
    const noCacheParam = url.searchParams.get('noCache');

    // Use direct fetch to GitHub API for ETag support
    const workflowApiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;

    const requestHeaders: HeadersInit = {
      'Authorization': `Bearer ${session.accessToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // Only add If-None-Match if noCache is not true
    // This allows bypassing ETag cache when needed
    if (ifNoneMatch && noCacheParam !== 'true') {
      requestHeaders['If-None-Match'] = ifNoneMatch;
    }

    const workflowResponse = await fetch(workflowApiUrl, {
      headers: requestHeaders,
    });

    // Get ETag from response
    const etag = workflowResponse.headers.get('ETag') || '';

    // If 304 Not Modified, return 304 directly to frontend
    // Frontend will handle this by reusing cached data
    if (workflowResponse.status === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          'Cache-Control': 'no-store',
          ...(etag && { 'ETag': etag }),
        },
      });
    }

    if (!workflowResponse.ok) {
      throw new Error(`GitHub API error: ${workflowResponse.status}`);
    }

    const workflowRun = await workflowResponse.json();

    // Get the attempt number from query params (defaults to latest attempt)
    let attemptNumber = workflowRun.run_attempt;
    if (attemptParam) {
      attemptNumber = parseInt(attemptParam);
      if (isNaN(attemptNumber) || attemptNumber < 1) {
        return new Response(
          JSON.stringify({ error: 'Invalid attempt parameter (must be a positive integer)' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Get jobs for this workflow run and specific attempt using direct fetch
    let jobsApiUrl;
    if (attemptNumber && attemptNumber !== workflowRun.run_attempt) {
      // Get jobs for a specific attempt
      jobsApiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/attempts/${attemptNumber}/jobs`;
    } else {
      // Get jobs for the latest attempt
      jobsApiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`;
    }

    const jobsResponse = await fetch(jobsApiUrl, {
      headers: requestHeaders,
    });

    if (!jobsResponse.ok) {
      throw new Error(`GitHub API error fetching jobs: ${jobsResponse.status}`);
    }

    const jobsData: GitHubJobsResponse = await jobsResponse.json();

    // Get commit details using direct fetch
    const commitApiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${workflowRun.head_sha}`;
    const commitResponse = await fetch(commitApiUrl, {
      headers: requestHeaders,
    });

    if (!commitResponse.ok) {
      throw new Error(`GitHub API error fetching commit: ${commitResponse.status}`);
    }

    const commit = await commitResponse.json();

    // Use the shared mapper to build the response
    const response = mapWorkflowDetails(
      workflowRun,
      jobsData.jobs,
      commit,
      owner,
      repo,
      attemptNumber
    );

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store', // Prevent browser caching
          ...(etag && { 'ETag': etag }),
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching workflow details:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch workflow details',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
