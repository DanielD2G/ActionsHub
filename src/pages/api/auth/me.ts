import { withAuth } from '../../../lib/api-auth';
import { getBillingConfig, isBillingEnabled, getUserTier } from '../../../lib/policies';

export const GET = withAuth(async (_, session) => {
  // Get user tier from database using GitHub user ID
  const userTier = await getUserTier(session.githubUserId);

  // Get billing configuration for the user
  const billingConfig = getBillingConfig(isBillingEnabled(), userTier);

  return new Response(
    JSON.stringify({
      authenticated: true,
      username: session.username,
      githubUserId: session.githubUserId,
      avatarUrl: session.avatarUrl,
      email: session.email,
      profileUrl: session.profileUrl,
      name: session.name,
      billingConfig,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
});
