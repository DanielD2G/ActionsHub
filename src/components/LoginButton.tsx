import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { clearUserCache, fetchAndCacheUser, type UserInfo } from '../lib/constants';

export default function LoginButton() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication status (uses cache to avoid duplicate requests)
    fetchAndCacheUser().then((userInfo) => {
      setUser(userInfo);
      setLoading(false);
    }).catch(() => {
      setUser({ authenticated: false });
      setLoading(false);
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    // Clear all storage to prevent data leakage between users
    localStorage.clear();
    clearUserCache(); // Clear sessionStorage user cache
    window.location.href = '/api/auth/logout';
  };

  if (loading) {
    return (
      <div class="flex items-center gap-2">
        <div class="animate-spin h-5 w-5 border-2 border-spinner-track border-t-spinner-indicator rounded-full"></div>
      </div>
    );
  }

  if (user?.authenticated) {
    // Generate GitHub profile URL from username
    const githubProfileUrl = user.profileUrl || `https://github.com/${user.username}`;

    return (
      <div class="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          class="flex items-center gap-2 bg-surface-secondary hover:bg-surface-hover rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
        >
          <img
            src={user.avatarUrl}
            alt={user.username}
            class="w-6 h-6 rounded-full"
          />
          <span class="text-text-secondary text-sm font-medium">{user.username}</span>
          <svg
            class={`w-4 h-4 text-text-faint transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div class="absolute right-0 mt-2 w-72 bg-surface-primary border border-default rounded-lg shadow-lg z-50">
            {/* User Info Section */}
            <div class="p-4 border-b border-default">
              <div class="flex items-start gap-3">
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  class="w-12 h-12 rounded-full"
                />
                <div class="flex-1 min-w-0">
                  {user.name ? (
                    <>
                      <p class="text-sm font-semibold text-text-primary truncate">
                        {user.name}
                      </p>
                      <p class="text-sm text-text-muted truncate">@{user.username}</p>
                    </>
                  ) : (
                    <p class="text-sm font-semibold text-text-primary truncate">
                      @{user.username}
                    </p>
                  )}
                  {user.email && (
                    <p class="text-xs text-text-faint truncate mt-1">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div class="py-1">
              <a
                href={githubProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View GitHub Profile
              </a>
              <button
                onClick={handleLogout}
                class="flex items-center gap-2 w-full px-4 py-2 text-sm text-error-text hover:bg-error-bg transition-colors cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href="/api/auth/login"
      class="inline-flex items-center gap-2 px-4 py-2 bg-button-primary-bg text-white text-sm font-medium rounded-lg hover:bg-button-primary-hover transition-colors"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      Sign in with GitHub
    </a>
  );
}
