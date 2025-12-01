import { Polar } from '@polar-sh/sdk';
import { withAuth } from '../../../lib/api-auth';
import { prisma } from '../../../lib/db';

const polar = new Polar({
  ...(process.env.POLAR_SANDBOX === 'true' && { server: 'sandbox' }),
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

export const POST = withAuth(async ({ url }, session) => {
  try {
    // Get user's subscription from database
    const subscription = await prisma.subscription.findUnique({
      where: { githubUserId: session.githubUserId },
      select: { polarCustomerId: true },
    });

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Polar Customer Portal Session with return URL
    // This will show a back button in the portal to return to the billing page
    const returnUrl = `${url.origin}/billing`;
    const portalSession = await polar.customerSessions.create({
      customerId: subscription.polarCustomerId,
      returnUrl: returnUrl,
    });

    return new Response(
      JSON.stringify({ url: portalSession.customerPortalUrl }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating portal session:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create portal session' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
