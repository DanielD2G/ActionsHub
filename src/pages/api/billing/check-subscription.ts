import { withAuth } from '../../../lib/api-auth';
import { getUserTier } from '../../../lib/policies';

export const GET = withAuth(async (_, session) => {
  try {
    // Get user tier from database
    const userTier = await getUserTier(session.githubUserId);

    return new Response(
      JSON.stringify({
        hasActiveSubscription: userTier === 'paid',
        userTier,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error checking subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check subscription', hasActiveSubscription: false }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
