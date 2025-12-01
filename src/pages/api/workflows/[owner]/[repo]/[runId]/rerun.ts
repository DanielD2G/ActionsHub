import { withAuth } from '../../../../../../lib/api-auth';
import { createGitHubClient } from '../../../../../../lib/github';

export const POST = withAuth(async ({ params, request }, session) => {
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
    const runIdNum = parseInt(runId);
    if (isNaN(runIdNum) || runIdNum < 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid run ID (must be a positive integer)' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    const { type } = body; // 'all' or 'failed'

    const octokit = createGitHubClient(session.accessToken);

    let response;

    if (type === 'failed') {
      // Re-run only failed jobs
      response = await octokit.actions.reRunWorkflowFailedJobs({
        owner,
        repo,
        run_id: runIdNum,
      });
    } else {
      // Re-run all jobs
      response = await octokit.actions.reRunWorkflow({
        owner,
        repo,
        run_id: runIdNum,
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Workflow re-run initiated' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error re-running workflow:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to re-run workflow',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
