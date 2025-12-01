import { withAuth } from '../../../../../lib/api-auth';
import { createGitHubClient } from '../../../../../lib/github';
import { mapWorkflowRun } from '../../../../../lib/workflowMappers';

export const GET = withAuth(async ({ params, url }, session) => {
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
    const octokit = createGitHubClient(session.accessToken);

    // Get workflow runs for this specific repository
    const perPage = parseInt(url.searchParams.get('per_page') || '50');
    if (isNaN(perPage) || perPage < 1 || perPage > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid per_page parameter (must be between 1 and 100)' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    const { data: workflowRuns } = await octokit.actions.listWorkflowRunsForRepo({
      owner: owner,
      repo: repo,
      per_page: perPage,
    });

    const runs = workflowRuns.workflow_runs.map(run =>
      mapWorkflowRun(run, owner, repo)
    );

    return new Response(
      JSON.stringify(runs),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching workflow runs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch workflow runs' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
