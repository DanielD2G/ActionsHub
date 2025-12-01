import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CACHE, STATS, TIME, getWorkflowsCacheKey, fetchAndCacheUser } from '../lib/constants';

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  runStartedAt?: string | null;
  repository: {
    name: string;
    owner: string;
    fullName: string;
  };
}

interface WorkflowStats {
  name: string;
  repo: string;
  displayName: string; // Format: "repo/name"
  runCount: number;
  totalDuration: number; // in seconds
  avgDuration: number; // in seconds
  successRate: number;
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

export default function WorkflowChart() {
  const [stats, setStats] = useState<WorkflowStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
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

    calculateWorkflowStats();

    // Listen for storage changes to update chart when workflows change
    const handleStorageChange = () => {
      calculateWorkflowStats();
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event from WorkflowList when data updates
    const handleCacheUpdate = () => {
      calculateWorkflowStats();
    };
    window.addEventListener('workflowsUpdated', handleCacheUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workflowsUpdated', handleCacheUpdate);
    };
  }, [username]);

  const calculateWorkflowStats = () => {
    if (!username) return; // Wait for username

    try {
      const workflows: WorkflowRun[] = loadWorkflowsFromCache(username);

      // Filter workflows from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - STATS.STATS_DAYS);

      const recentWorkflows = workflows.filter(w => {
        const updatedDate = new Date(w.updatedAt);
        return updatedDate >= sevenDaysAgo;
      });

      // Group by repository + workflow name (ignoring branch)
      const workflowMap = new Map<string, {
        repo: string;
        name: string;
        runs: WorkflowRun[];
        durations: number[];
        successCount: number;
      }>();

      recentWorkflows.forEach(workflow => {
        // Create a unique key combining repo and workflow name
        const key = `${workflow.repository.fullName}::${workflow.name}`;

        if (!workflowMap.has(key)) {
          workflowMap.set(key, {
            repo: workflow.repository.fullName,
            name: workflow.name,
            runs: [],
            durations: [],
            successCount: 0,
          });
        }

        const workflowData = workflowMap.get(key)!;
        workflowData.runs.push(workflow);

        // Calculate duration in seconds
        if (workflow.status === 'completed') {
          // Use runStartedAt if available, otherwise fallback to createdAt
          const startTime = workflow.runStartedAt
            ? new Date(workflow.runStartedAt)
            : new Date(workflow.createdAt);
          const updated = new Date(workflow.updatedAt);
          const duration = (updated.getTime() - startTime.getTime()) / TIME.MS_PER_SECOND;
          workflowData.durations.push(duration);

          if (workflow.conclusion === 'success') {
            workflowData.successCount++;
          }
        }
      });

      // Convert to stats array
      const statsArray: WorkflowStats[] = Array.from(workflowMap.entries()).map(([key, data]) => {
        const totalDuration = data.durations.reduce((sum, d) => sum + d, 0);
        const avgDuration = data.durations.length > 0 ? totalDuration / data.durations.length : 0;
        const completedRuns = data.runs.filter(r => r.status === 'completed').length;
        const successRate = completedRuns > 0 ? (data.successCount / completedRuns) * STATS.PERCENTAGE_MULTIPLIER : 0;

        return {
          name: data.name,
          repo: data.repo,
          displayName: `${data.repo} / ${data.name}`,
          runCount: data.runs.length,
          totalDuration,
          avgDuration,
          successRate,
        };
      });

      // Sort by total duration (descending) and take top 10
      statsArray.sort((a, b) => b.totalDuration - a.totalDuration);
      setStats(statsArray.slice(0, STATS.TOP_WORKFLOWS_LIMIT));
      setLoading(false);
    } catch (error) {
      console.error('Error calculating workflow stats:', error);
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < TIME.SECONDS_PER_MINUTE) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < TIME.SECONDS_PER_HOUR) {
      const mins = Math.floor(seconds / TIME.SECONDS_PER_MINUTE);
      const secs = Math.round(seconds % TIME.SECONDS_PER_MINUTE);
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / TIME.SECONDS_PER_HOUR);
      const mins = Math.floor((seconds % TIME.SECONDS_PER_HOUR) / TIME.SECONDS_PER_MINUTE);
      return `${hours}h ${mins}m`;
    }
  };

  if (loading) {
    return (
      <div class="bg-surface-primary rounded-xl shadow-sm border border-default p-6">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Top Workflows by Runtime (Last {STATS.STATS_DAYS} Days)</h3>
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin h-8 w-8 border-2 border-spinner-track border-t-spinner-indicator rounded-full"></div>
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div class="bg-surface-primary rounded-xl shadow-sm border border-default p-6">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Top Workflows by Runtime (Last {STATS.STATS_DAYS} Days)</h3>
        <div class="text-center py-8">
          <p class="text-text-muted">No workflow data available for the last {STATS.STATS_DAYS} days</p>
        </div>
      </div>
    );
  }

  const maxTotalDuration = Math.max(...stats.map(s => s.totalDuration));
  const displayedStats = showAll ? stats : stats.slice(0, STATS.INITIAL_WORKFLOWS_SHOWN);
  const hasMore = stats.length > STATS.INITIAL_WORKFLOWS_SHOWN;

  return (
    <div class="bg-surface-primary rounded-xl shadow-sm border border-default p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-text-primary">Top Workflows by Runtime (Last {STATS.STATS_DAYS} Days)</h3>
        <div class="text-sm text-text-muted">
          {stats.reduce((sum, s) => sum + s.runCount, 0)} total runs
        </div>
      </div>

      <div class="space-y-4">
        {displayedStats.map((workflow, index) => {
          const barWidth = (workflow.totalDuration / maxTotalDuration) * STATS.PERCENTAGE_MULTIPLIER;
          const successRateColor = workflow.successRate >= STATS.SUCCESS_THRESHOLD_HIGH ? 'text-success-text' :
                                   workflow.successRate >= STATS.SUCCESS_THRESHOLD_MEDIUM ? 'text-warning-text' :
                                   'text-error-text';

          return (
            <div key={workflow.displayName} class="p-4 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
              {/* Header */}
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-start gap-3 flex-1 min-w-0">
                  <span class="text-text-faint font-semibold text-sm mt-0.5">{index + 1}</span>
                  <div class="min-w-0 flex-1">
                    <a
                      href={`/repository/${workflow.repo.replace('/', '/')}`}
                      class="font-semibold text-brand-primary hover:text-brand-primary-hover truncate text-sm mb-1 block"
                      title={workflow.displayName}
                    >
                      {workflow.displayName}
                    </a>
                    <div class="flex items-center gap-3 text-xs text-text-muted">
                      <span>{workflow.runCount} executions</span>
                      <span class={`font-medium ${successRateColor}`}>
                        {Math.round(workflow.successRate)}% success
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div class="mb-3">
                <div class="h-3 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-brand-primary to-brand-primary-hover rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="bg-surface-primary rounded-md p-2 border border-default">
                  <div class="text-text-muted mb-0.5">Total Runtime</div>
                  <div class="font-semibold text-text-primary">{formatDuration(workflow.totalDuration)}</div>
                </div>
                <div class="bg-surface-primary rounded-md p-2 border border-default">
                  <div class="text-text-muted mb-0.5">Avg per Run</div>
                  <div class="font-semibold text-text-primary">{formatDuration(workflow.avgDuration)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <div class="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-info-text bg-info-bg hover:bg-info-bg-muted rounded-lg transition-colors cursor-pointer"
          >
            {showAll ? (
              <>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
                Show Less
              </>
            ) : (
              <>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                Show {stats.length - STATS.INITIAL_WORKFLOWS_SHOWN} More
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
