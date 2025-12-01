import { Octokit } from '@octokit/rest';
import { API_LIMITS } from './constants';

/**
 * Creates an authenticated Octokit client
 */
export function createGitHubClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  });
}

/**
 * Gets the authenticated user's information
 */
export async function getAuthenticatedUser(accessToken: string) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

/**
 * Gets all repositories for the authenticated user
 */
export async function getUserRepositories(accessToken: string, only_user: boolean = false) {
  const octokit = createGitHubClient(accessToken);

  const params: any = {
    sort: 'updated',
    per_page: API_LIMITS.MAX_REPOS_PER_PAGE,
  };

  if (only_user) {
    params.affiliation = 'owner';
  }
  const { data } = await octokit.repos.listForAuthenticatedUser(params);
  return data;
}

/**
 * Gets all repositories for a specific organization
 */
export async function getOrganizationRepositories(
  accessToken: string,
  org: string
) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.repos.listForOrg({
    org,
    sort: 'updated',
    per_page: API_LIMITS.MAX_REPOS_PER_PAGE,
  });
  return data;
}