import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { fetchAndCacheUser, type UserInfo, SELF_HOST } from '../lib/constants';

export default function SelfHostBadge() {
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

  // Only show badge if:
  // 1. User is authenticated
  // 2. Billing is NOT enabled (self-hosted mode)
  // 3. SHOW_BADGE is true in constants
  if (loading || !user?.authenticated || user?.billingConfig?.billingEnabled || !SELF_HOST.SHOW_BADGE) {
    return null;
  }

  return (
    <div class="relative overflow-hidden bg-gradient-to-r from-brand-primary to-brand-primary-hover rounded-xl shadow-md">
      {/* Decorative background pattern */}
      <div class="absolute inset-0 opacity-10">
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div class="relative p-5 flex items-center gap-4">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        <div class="flex-1">
          <h3 class="text-white font-semibold text-lg mb-1 flex items-center gap-2">
            Try the Official Live Version
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
              Free
            </span>
          </h3>
          <p class="text-white/80 text-sm">
            Experience the fully managed version at{' '}
            <a
              href={SELF_HOST.LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              class="text-white hover:text-white/90 underline font-semibold transition-colors"
            >
              {SELF_HOST.LIVE_URL}
            </a>
          </p>
        </div>

        <div class="flex-shrink-0">
          <a
            href={SELF_HOST.LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-primary text-brand-primary text-sm font-semibold rounded-lg hover:bg-surface-hover transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Visit Now
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
