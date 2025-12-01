import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { fetchAndCacheUser, type UserInfo } from '../lib/constants';

export default function BillingButton() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status and billing config
    fetchAndCacheUser().then((userInfo) => {
      setUser(userInfo);
      setLoading(false);
    }).catch(() => {
      setUser({ authenticated: false });
      setLoading(false);
    });
  }, []);

  // Don't render if loading, not authenticated, or billing is not enabled
  if (loading || !user?.authenticated || !user?.billingConfig?.billingEnabled) {
    return null;
  }

  const isPaidUser = user.billingConfig.userTier === 'paid';

  return (
    <a
      href="/billing"
      class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
    >
      {isPaidUser ? (
        <>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Manage Subscription
        </>
      ) : (
        <>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Upgrade
        </>
      )}
    </a>
  );
}
