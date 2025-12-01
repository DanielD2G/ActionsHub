import { withAuth } from '../../../../../../../lib/api-auth';
import { createGitHubClient } from '../../../../../../../lib/github';

export const POST = withAuth(async ({ params }, session) => {
  const { owner, repo, jobId } = params;

  if (!owner || !repo || !jobId) {
    return new Response(
      JSON.stringify({ error: 'Missing parameters' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const jobIdNum = parseInt(jobId);
    if (isNaN(jobIdNum) || jobIdNum < 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid job ID (must be a positive integer)' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const octokit = createGitHubClient(session.accessToken);

    // Re-run a specific job
    await octokit.actions.reRunJobForWorkflowRun({
      owner,
      repo,
      job_id: jobIdNum,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Job re-run initiated' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error re-running job:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to re-run job',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
