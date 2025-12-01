import { withAuth } from '../../../lib/api-auth';
import { createGitHubClient, getUserRepositories, getOrganizationRepositories } from '../../../lib/github';
import { API_LIMITS } from '../../../lib/constants';
import { getBillingConfig, isBillingEnabled, getUserTier } from '../../../lib/policies';
import { mapWorkflowRun } from '../../../lib/workflowMappers';

export const GET = withAuth(async ({ url }, session) => {
  try {
    const octokit = createGitHubClient(session.accessToken);

    // Get user tier and billing configuration
    const userTier = await getUserTier(session.githubUserId);
    const billingConfig = getBillingConfig(isBillingEnabled(), userTier);

    // Get date range parameters
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const batchId = url.searchParams.get('batchId') || 'unknown';

    if (!dateFrom || !dateTo) {
      return new Response(
        JSON.stringify({ error: 'Missing dateFrom or dateTo parameters' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate date range doesn't exceed allowed days
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > billingConfig.maxDays) {
      return new Response(
        JSON.stringify({
          error: `Date range exceeds allowed limit of ${billingConfig.maxDays} days for ${billingConfig.userTier} tier`,
          maxDays: billingConfig.maxDays,
          userTier: billingConfig.userTier,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if organization mode is enabled (for deploy configurations)
    const orgMode = process.env.GITHUB_ORG;

    // Get repositories based on organization mode
    let repos;
    if (orgMode) {
      // Fetch only organization repositories
      repos = await getOrganizationRepositories(session.accessToken, orgMode);
    } else {
      // Fetch user repositories
      // If user is free tier, only fetch personal repos (affiliation: 'owner')
      // If user is paid or self-hosted, fetch all repos (personal + org)
      const onlyPersonalRepos = !billingConfig.canViewOrgWorkflows;
      repos = await getUserRepositories(session.accessToken, onlyPersonalRepos);
    }

    // Fetch workflow runs from repositories IN PARALLEL
    // Use date range filter to get ALL workflows in the range (no per_page limit)
    const workflowPromises = repos.map(async (repo) => {
      try {
        const requestParams: any = {
          owner: repo.owner.login,
          repo: repo.name,
          per_page: API_LIMITS.MAX_WORKFLOWS_PER_PAGE, // GitHub API max per page
          created: `${dateFrom}..${dateTo}`, // Date range filter
        };

        const { data: workflowRuns } = await octokit.actions.listWorkflowRunsForRepo(
          requestParams
        );

        return workflowRuns.workflow_runs.map(run =>
          mapWorkflowRun(run, repo.owner.login, repo.name)
        );
      } catch (repoError) {
        // Skip repos that don't have actions or we don't have access to
        console.error(`Error fetching workflows for ${repo.full_name}:`, repoError);
        return [];
      }
    });

    // Wait for all requests to complete
    const workflowResults = await Promise.all(workflowPromises);
    const allRuns = workflowResults.flat();

    // Sort by update date (most recently updated first - keeps running workflows at top)
    const sortedRuns = allRuns.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return new Response(
      JSON.stringify({
        batchId,
        dateFrom,
        dateTo,
        workflowCount: sortedRuns.length,
        workflows: sortedRuns,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching workflow batch:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch workflow batch' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
