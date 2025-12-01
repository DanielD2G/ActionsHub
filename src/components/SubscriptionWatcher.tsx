import { useEffect, useRef } from 'preact/hooks';

const SUBSCRIPTION_STATUS_KEY = 'subscription_status';
const USER_CACHE_KEY = 'gh_user_info';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  userTier: 'free' | 'paid';
  lastChecked: number;
}

interface UserInfo {
  authenticated: boolean;
  billingConfig?: {
    userTier: 'free' | 'paid';
    billingEnabled: boolean;
  };
}

/**
 * Component that monitors subscription status changes on mount
 * ONLY for paid users to detect cancellations
 * Free users don't need this check to save bandwidth
 */
export default function SubscriptionWatcher() {
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const checkSubscription = async () => {
      try {
        // Get user info from cache
        const userCacheStr = sessionStorage.getItem(USER_CACHE_KEY);
        if (!userCacheStr) {
          console.log('No user cache found, skipping subscription check');
          return;
        }

        const userInfo: UserInfo = JSON.parse(userCacheStr);

        // Only check subscription for PAID users
        // Free users don't need this check (saves bandwidth)
        if (userInfo.billingConfig?.userTier !== 'paid') {
          console.log('User is free tier, skipping subscription check');
          return;
        }

        // User is paid - verify subscription is still active
        const response = await fetch('/api/billing/check-subscription');
        if (!response.ok) {
          console.error('Failed to check subscription status');
          return;
        }

        const data: Omit<SubscriptionStatus, 'lastChecked'> = await response.json();

        // Get previous status from localStorage
        const previousStatusStr = localStorage.getItem(SUBSCRIPTION_STATUS_KEY);
        const previousStatus: SubscriptionStatus | null = previousStatusStr
          ? JSON.parse(previousStatusStr)
          : null;

        // Save current status
        const currentStatus: SubscriptionStatus = {
          ...data,
          lastChecked: Date.now(),
        };
        localStorage.setItem(SUBSCRIPTION_STATUS_KEY, JSON.stringify(currentStatus));

        // Check if status changed (downgrade from paid to free)
        if (
          previousStatus &&
          previousStatus.hasActiveSubscription !== currentStatus.hasActiveSubscription
        ) {
          console.log('Subscription status changed, clearing cache and reloading...');

          // Clear session storage (user info)
          sessionStorage.removeItem(USER_CACHE_KEY);

          // Clear ALL localStorage items that are workflow caches
          // They follow the pattern: workflows_cache_{username}
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('workflows_cache_')) {
              localStorage.removeItem(key);
            }
          });

          // Reload the page to apply new permissions
          window.location.reload();
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, []); // Empty dependency array - only run once on mount

  // This component doesn't render anything
  return null;
}
