/**
 * Billing and Freemium Policies
 *
 * This module handles all billing-related policies and restrictions
 * for the freemium model.
 */

import { BILLING, STATS } from './constants';

/**
 * User tier type
 */
export type UserTier = 'free' | 'paid';

/**
 * Billing configuration returned by policy evaluator
 */
export interface BillingConfig {
  /** Maximum days of workflow history allowed */
  maxDays: number;

  /** Maximum number of batches for workflow fetching */
  maxBatches: number;

  /** Whether organization workflows are allowed */
  canViewOrgWorkflows: boolean;

  /** Whether billing mode is enabled */
  billingEnabled: boolean;

  /** Current user tier */
  userTier: UserTier;
}

/**
 * Get billing configuration based on environment settings and user tier
 *
 * @param enableBilling - Whether billing mode is enabled (from ENABLE_BILLING env var)
 * @param userTier - User's billing tier ('free' or 'paid'), defaults to 'free'
 * @returns Billing configuration with restrictions applied
 *
 * @example
 * // Self-hosted mode (billing disabled) - full access
 * const config = getBillingConfig(false, 'free');
 * // config.maxDays = 31, config.canViewOrgWorkflows = true
 *
 * @example
 * // Freemium mode with free user - restricted access
 * const config = getBillingConfig(true, 'free');
 * // config.maxDays = 5, config.canViewOrgWorkflows = false
 *
 * @example
 * // Freemium mode with paid user - full access
 * const config = getBillingConfig(true, 'paid');
 * // config.maxDays = 31, config.canViewOrgWorkflows = true
 */
export function getBillingConfig(
  enableBilling: boolean,
  userTier: UserTier = 'free'
): BillingConfig {
  // If billing is disabled (self-hosted mode), grant full access
  if (!enableBilling) {
    return {
      maxDays: BILLING.PAID_DAYS_LIMIT,
      maxBatches: STATS.NUMBER_OF_BATCHES,
      canViewOrgWorkflows: true,
      billingEnabled: false,
      userTier,
    };
  }

  // Billing is enabled - apply tier-based restrictions
  if (userTier === 'paid') {
    // Paid users get full access
    return {
      maxDays: BILLING.PAID_DAYS_LIMIT,
      maxBatches: BILLING.PAID_NUMBER_OF_BATCHES,
      canViewOrgWorkflows: true,
      billingEnabled: true,
      userTier,
    };
  }

  // Free users get restricted access
  return {
    maxDays: BILLING.FREE_DAYS_LIMIT,
    maxBatches: BILLING.FREE_NUMBER_OF_BATCHES,
    canViewOrgWorkflows: false,
    billingEnabled: true,
    userTier,
  };
}

/**
 * Check if billing mode is enabled from environment variable
 *
 * @returns True if ENABLE_BILLING is set to 'true'
 */
export function isBillingEnabled(): boolean {
  return process.env.ENABLE_BILLING === 'true';
}

/**
 * Get user tier based on subscription status in database
 * Checks if user has an active subscription in the database
 *
 * @param githubUserId - The GitHub user ID to check
 * @returns User tier ('paid' if active subscription exists, 'free' otherwise)
 */
export async function getUserTier(githubUserId: string): Promise<UserTier> {
  // If billing is not enabled, return 'free' (full access granted via getBillingConfig)
  if (!isBillingEnabled()) {
    return 'free';
  }

  try {
    const { prisma } = await import('./db');

    // Query database for active subscription
    const subscription = await prisma.subscription.findUnique({
      where: { githubUserId },
      select: { status: true },
    });

    // Check if subscription exists and is active
    if (subscription && subscription.status === 'active') {
      return 'paid';
    }

    return 'free';
  } catch (error) {
    console.error('Error fetching user tier:', error);
    // On error, default to free tier
    return 'free';
  }
}
