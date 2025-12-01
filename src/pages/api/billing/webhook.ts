import type { APIRoute } from 'astro';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { prisma } from '../../../lib/db';

const webhookSecret = process.env.POLAR_WEBHOOK_SECRET!;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();

    // Convert Headers object to plain object for validateEvent
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Validate webhook event using Polar SDK
    let event;
    try {
      event = validateEvent(body, headers, webhookSecret);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        console.error('Webhook verification failed:', error);
        return new Response('Invalid signature', { status: 403 });
      }
      throw error;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.created':
      case 'checkout.updated': {
        const checkout = event.data;

        // Only process if checkout has a subscription
        if (checkout.product?.isRecurring && checkout.subscriptionId) {
          const githubUserIdRaw = checkout.metadata?.githubUserId;
          const githubUserId = typeof githubUserIdRaw === 'string' ? githubUserIdRaw : String(githubUserIdRaw);

          if (!githubUserId) {
            console.error('Missing githubUserId in checkout metadata');
            break;
          }

          // Create or update subscription in database
          await prisma.subscription.upsert({
            where: { githubUserId },
            create: {
              githubUserId,
              polarCustomerId: checkout.customerId || '',
              polarSubscriptionId: checkout.subscriptionId,
              polarPriceId: checkout.productPriceId || '',
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(),
              cancelAtPeriodEnd: false,
            },
            update: {
              polarCustomerId: checkout.customerId || '',
              polarSubscriptionId: checkout.subscriptionId,
              polarPriceId: checkout.productPriceId || '',
            },
          });

          console.log(`Subscription created/updated for user ${githubUserId}`);
        }
        break;
      }

      case 'subscription.created':
      case 'subscription.updated': {
        const subscription = event.data;
        const githubUserIdRaw = subscription.metadata?.githubUserId;
        const githubUserId = typeof githubUserIdRaw === 'string' ? githubUserIdRaw : String(githubUserIdRaw);

        if (!githubUserId) {
          console.error('Missing githubUserId in subscription metadata');
          break;
        }

        // Validate dates
        if (!subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
          console.error('Missing period dates in subscription');
          break;
        }

        // Get the first price ID from the prices array
        const priceId = subscription.prices.length > 0 ? subscription.prices[0].id : 'N/A';

        // Create or update subscription in database
        await prisma.subscription.upsert({
          where: { githubUserId },
          create: {
            githubUserId,
            polarCustomerId: subscription.customerId,
            polarSubscriptionId: subscription.id,
            polarPriceId: priceId,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.currentPeriodStart),
            currentPeriodEnd: new Date(subscription.currentPeriodEnd),
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
          },
          update: {
            status: subscription.status,
            polarPriceId: priceId,
            currentPeriodStart: new Date(subscription.currentPeriodStart),
            currentPeriodEnd: new Date(subscription.currentPeriodEnd),
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
          },
        });

        console.log(`Subscription ${event.type === 'subscription.created' ? 'created' : 'updated'} for user ${githubUserId}`);
        break;
      }

      case 'subscription.canceled': {
        const subscription = event.data;
        const githubUserIdRaw = subscription.metadata?.githubUserId;
        const githubUserId = typeof githubUserIdRaw === 'string' ? githubUserIdRaw : String(githubUserIdRaw);

        if (!githubUserId) {
          console.error('Missing githubUserId in subscription metadata');
          break;
        }

        // When subscription is canceled, it's still active until the end of the period
        // Just update the cancelAtPeriodEnd flag - DO NOT delete
        await prisma.subscription.update({
          where: { githubUserId },
          data: {
            cancelAtPeriodEnd: true,
            status: subscription.status,
          },
        });

        console.log(`Subscription marked as canceled (still active until period end) for user ${githubUserId}`);
        break;
      }

      case 'subscription.revoked': {
        const subscription = event.data;
        const githubUserIdRaw = subscription.metadata?.githubUserId;
        const githubUserId = typeof githubUserIdRaw === 'string' ? githubUserIdRaw : String(githubUserIdRaw);

        if (!githubUserId) {
          console.error('Missing githubUserId in subscription metadata');
          break;
        }

        // Only delete when subscription is actually revoked (end of period or immediate revocation)
        try {
          await prisma.subscription.delete({
            where: { githubUserId },
          });
          console.log(`Subscription revoked and deleted for user ${githubUserId}`);
        } catch (error: any) {
          if (error.code === 'P2025') {
            console.log(`Subscription already deleted for user ${githubUserId}`);
          } else {
            throw error;
          }
        }
        break;
      }

      case 'subscription.active': {
        const subscription = event.data;
        const githubUserIdRaw = subscription.metadata?.githubUserId;
        const githubUserId = typeof githubUserIdRaw === 'string' ? githubUserIdRaw : String(githubUserIdRaw);

        if (!githubUserId) {
          console.error('Missing githubUserId in subscription metadata');
          break;
        }

        // Update subscription status to active
        await prisma.subscription.update({
          where: { githubUserId },
          data: {
            status: 'active',
          },
        });

        console.log(`Subscription activated for user ${githubUserId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
};
