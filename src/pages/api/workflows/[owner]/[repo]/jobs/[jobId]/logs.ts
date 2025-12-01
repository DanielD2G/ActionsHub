import { withAuth } from '../../../../../../../lib/api-auth';
import { createGitHubClient } from '../../../../../../../lib/github';

export const GET = withAuth(async ({ params }, session) => {
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

    // Get job logs (returns plain text)
    const { data: logs } = await octokit.actions.downloadJobLogsForWorkflowRun({
      owner,
      repo,
      job_id: jobIdNum,
    });

    return new Response(
      JSON.stringify({ logs: logs as string }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching job logs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch job logs' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
