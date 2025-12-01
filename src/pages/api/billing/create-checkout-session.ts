import { Polar } from '@polar-sh/sdk';
import { withAuth } from '../../../lib/api-auth';

const polar = new Polar({
  ...(process.env.POLAR_SANDBOX === 'true' && { server: 'sandbox' }),
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

export const POST = withAuth(async ({ url }, session) => {
  try {
    // Get the base URL from the request
    const baseUrl = `${url.protocol}//${url.host}`;
    // Create Polar Checkout Session
    const checkoutSession = await polar.checkouts.create({
      products: [process.env.POLAR_PRODUCT_ID!],
      successUrl: `${baseUrl}/billing?success=true`,
      ...(session.email && { customerEmail: session.email }),
      metadata: {
        githubUserId: session.githubUserId,
        username: session.username,
      },
    });

    return new Response(
      JSON.stringify({ url: checkoutSession.url }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
