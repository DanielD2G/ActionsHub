import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CACHE, STATS, getWorkflowsCacheKey, fetchAndCacheUser } from '../lib/constants';

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  runStartedAt?: string | null;
}

interface StatsData {
  totalWorkflows: number;
  successRate: number;
  activeRuns: number;
  failedToday: number;
}

// Load workflows from localStorage
const loadWorkflowsFromCache = (username: string): WorkflowRun[] => {
  try {
    const cacheKey = getWorkflowsCacheKey(username);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return [];

    const cache = JSON.parse(cached);
    return cache.data || [];
  } catch (error) {
    console.error('Error loading workflows from cache:', error);
    return [];
  }
};

export default function DashboardStats() {
  const [stats, setStats] = useState<StatsData>({
    totalWorkflows: 0,
    successRate: 0,
    activeRuns: 0,
    failedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>('');

  // Fetch username on mount (uses cache to avoid duplicate requests)
  useEffect(() => {
    fetchAndCacheUser().then((userInfo) => {
      if (userInfo.authenticated && userInfo.username) {
        setUsername(userInfo.username);
      }
    });
  }, []);

  useEffect(() => {
    if (!username) return; // Wait for username

    calculateStats();

    // Listen for storage changes to update stats when workflows change
    const handleStorageChange = () => {
      calculateStats();
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event from WorkflowList when data updates
    const handleCacheUpdate = () => {
      calculateStats();
    };
    window.addEventListener('workflowsUpdated', handleCacheUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workflowsUpdated', handleCacheUpdate);
    };
  }, [username]);

  const calculateStats = () => {
    if (!username) return; // Wait for username

    try {
      const workflows = loadWorkflowsFromCache(username);

      // Calculate total workflows
      const totalWorkflows = workflows.length;

      // Calculate active runs (in_progress or queued)
      const activeRuns = workflows.filter(
        w => w.status === 'in_progress' || w.status === 'queued'
      ).length;

      // Calculate success rate for the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - STATS.STATS_DAYS);

      const workflowsLastWeek = workflows.filter(w => {
        const updatedDate = new Date(w.updatedAt);
        return updatedDate >= oneWeekAgo && w.status === 'completed';
      });

      const successfulLastWeek = workflowsLastWeek.filter(
        w => w.conclusion === 'success'
      ).length;

      const successRate = workflowsLastWeek.length > 0
        ? (successfulLastWeek / workflowsLastWeek.length) * STATS.PERCENTAGE_MULTIPLIER
        : 0;

      // Calculate failed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const failedToday = workflows.filter(w => {
        const updatedDate = new Date(w.updatedAt);
        return updatedDate >= today &&
               w.status === 'completed' &&
               (w.conclusion === 'failure' || w.conclusion === 'cancelled');
      }).length;

      setStats({
        totalWorkflows,
        successRate: Math.round(successRate * STATS.DECIMAL_PRECISION_MULTIPLIER) / STATS.DECIMAL_PRECISION_MULTIPLIER, // Round to 1 decimal
        activeRuns,
        failedToday,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Workflows */}
      <div class="bg-surface-primary rounded-xl shadow-sm border border-default p-6">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-medium text-text-muted">Total Workflows</span>
          <div class="w-10 h-10 bg-brand-primary-light rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div class="text-2xl font-bold text-text-primary mb-1">
          {loading ? (
            <div class="w-16 h-8 bg-surface-tertiary animate-pulse rounded"></div>
          ) : (
            stats.totalWorkflows
          )}
        </div>
        <div class="flex items-center gap-1 text-sm">
          <span class="text-text-muted">Recent runs</span>
        </div>
      </div>

      {/* Success Rate */}
      <div class="bg-surface-primary rounded-xl shadow-sm border border-default p-6">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-medium text-text-muted">Success Rate</span>
          <div class="w-10 h-10 bg-success-bg rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="text-2xl font-bold text-text-primary mb-1">
          {loading ? (
            <div class="w-20 h-8 bg-surface-tertiary animate-pulse rounded"></div>
          ) : (
            `${stats.successRate}%`
          )}
        </div>
        <div class="flex items-center gap-1 text-sm">
          <span class="text-text-muted">Last 7 days</span>
        </div>
      </div>

      {/* Active Runs */}
      <div class="bg-surface-primary rounded-xl shadow-sm border border-default p-6">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-medium text-text-muted">Active Runs</span>
          <div class="w-10 h-10 bg-warning-bg rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="text-2xl font-bold text-text-primary mb-1">
          {loading ? (
            <div class="w-12 h-8 bg-surface-tertiary animate-pulse rounded"></div>
          ) : (
            stats.activeRuns
          )}
        </div>
        <div class="flex items-center gap-1 text-sm">
          <span class="text-text-muted">Currently running</span>
        </div>
      </div>

      {/* Failed Today */}
      <div class="bg-surface-primary rounded-xl shadow-sm border border-default p-6">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-medium text-text-muted">Failed Today</span>
          <div class="w-10 h-10 bg-error-bg rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="text-2xl font-bold text-text-primary mb-1">
          {loading ? (
            <div class="w-12 h-8 bg-surface-tertiary animate-pulse rounded"></div>
          ) : (
            stats.failedToday
          )}
        </div>
        <div class="flex items-center gap-1 text-sm">
          <span class="text-text-muted">Since midnight</span>
        </div>
      </div>
    </div>
  );
}
