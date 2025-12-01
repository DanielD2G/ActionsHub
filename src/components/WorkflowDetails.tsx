import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import DropdownButton from './DropdownButton';
import Dropdown from './Dropdown';
import TestSummaryCard from './TestSummaryCard';
import { TIME, DISPLAY } from '../lib/constants';
import { parseTestResults } from '../lib/test-parsers';
import type { TestResult } from '../lib/test-parsers';
import { getStatusIcon, getStatusBadge } from '../lib/workflowUtils';

interface WorkflowDetailsProps {
  owner: string;
  repo: string;
  runId: string;
}

interface Step {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface Job {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  htmlUrl: string;
  steps: Step[];
}

interface WorkflowData {
  id: number;
  name: string;
  runNumber: number;
  status: string;
  conclusion: string | null;
  event: string;
  branch: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  attemptStartedAt: string | null;
  duration: number | null;
  runAttempt: number;
  currentAttempt: number;
  repository: {
    name: string;
    owner: string;
    fullName: string;
  };
  commit: {
    sha: string;
    message: string;
    author: {
      name: string;
      email: string;
      avatar: string;
    };
    url: string;
  };
  jobs: Job[];
}

function formatDuration(ms: number | null): string {
  if (!ms) return 'N/A';
  const seconds = Math.floor(ms / TIME.MS_PER_SECOND);
  const minutes = Math.floor(seconds / TIME.SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / TIME.SECONDS_PER_MINUTE);

  if (hours > 0) {
    return `${hours}h ${minutes % TIME.SECONDS_PER_MINUTE}m ${seconds % TIME.SECONDS_PER_MINUTE}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % TIME.SECONDS_PER_MINUTE}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatJobDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return formatDuration(ms);
}


function JobPanel({ job, owner, repo, runId }: { job: Job; owner: string; repo: string; runId: string }) {
  const [expanded, setExpanded] = useState(false);

  const duration = formatJobDuration(job.startedAt, job.completedAt);

  const navigateToLogs = () => {
    // Navigate to the logs page with job information
    const logsUrl = `/logs/${owner}/${repo}/${job.id}?runId=${runId}&jobName=${encodeURIComponent(job.name)}`;
    window.location.href = logsUrl;
  };

  return (
    <>
      <div class="border border-default rounded-lg overflow-hidden bg-surface-primary">
        {/* Job Header */}
        <div class={`border-b border-default px-4 py-3 cursor-pointer hover:bg-surface-tertiary transition-colors ${expanded ? 'bg-surface-secondary' : 'bg-surface-primary'}`} onClick={() => setExpanded(!expanded)}>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1">
              <div class="text-text-muted">
                <svg
                  class={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {getStatusIcon(job.status, job.conclusion, { size: 'sm', variant: 'circular' })}

              <div class="flex-1">
                <h3 class="font-semibold text-text-primary">{job.name}</h3>
                {duration && (
                  <p class="text-sm text-text-secondary mt-0.5">{duration}</p>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToLogs();
              }}
              class="px-3 py-1.5 text-sm font-medium text-button-secondary-text bg-button-secondary-bg border border-button-secondary-border rounded-lg hover:bg-button-secondary-bg-hover transition-colors flex items-center gap-2 cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View logs
            </button>
          </div>
        </div>

        {/* Steps */}
        {expanded && job.steps.length > 0 && (
          <div class="divide-y divide-gray-100">
            {job.steps.map((step) => (
              <div key={step.number} class="px-4 py-3 hover:bg-surface-hover transition-colors">
                <div class="flex items-start gap-3">
                  {getStatusIcon(step.status, step.conclusion, { size: 'sm', variant: 'circular' })}

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-sm font-medium text-text-primary">{step.name}</span>
                      {step.startedAt && step.completedAt && (
                        <span class="text-xs text-text-muted flex-shrink-0">
                          {formatJobDuration(step.startedAt, step.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function WorkflowDetails({ owner, repo, runId }: WorkflowDetailsProps) {
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  // ETag tracking for workflow polling optimization
  const [workflowETag, setWorkflowETag] = useState<string>('');

  const fetchWorkflow = (showLoading = true, attempt: number | null = null, bypassCache = false) => {
    if (showLoading) {
      setLoading(true);
    }

    // Build URL with query parameters
    const params = new URLSearchParams();
    if (attempt) {
      params.append('attempt', String(attempt));
    }
    if (bypassCache) {
      params.append('noCache', 'true');
    }
    const queryString = params.toString();
    const url = `/api/workflows/${owner}/${repo}/${runId}${queryString ? `?${queryString}` : ''}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store', // Prevent browser caching
    };

    // Add ETag ONLY for automatic polling (showLoading=false), not for initial load or manual refresh
    // This ensures we always get fresh data on initial load and only optimize during polling
    // Also skip ETag if bypassCache is true
    if (!showLoading && !attempt && workflowETag && !bypassCache) {
      headers['If-None-Match'] = workflowETag;
    }

    fetch(url, { headers })
      .then((res) => {
        // Handle 304 Not Modified - data hasn't changed, reuse cached data
        if (res.status === 304) {
          setLoading(false);
          return null;
        }

        if (!res.ok) throw new Error('Failed to fetch workflow details');

        // Save new ETag ONLY during polling (showLoading=false), not on initial load
        // This prevents stale ETags from persisting
        const newETag = res.headers.get('ETag');
        if (!showLoading && newETag && !attempt) {
          setWorkflowETag(newETag);
        }

        return res.json();
      })
      .then((data) => {
        if (data) {
          // Check if we received an empty object (can happen with stale ETags)
          const isEmptyResponse = Object.keys(data).length === 0;

          if (isEmptyResponse && !workflow && !bypassCache) {
            // Empty response on initial load - retry with cache bypass
            console.warn('Received empty response, retrying with cache bypass...');
            setWorkflowETag(''); // Clear stale ETag
            fetchWorkflow(showLoading, attempt, true);
            return;
          }

          if (isEmptyResponse && bypassCache) {
            // Even with cache bypass, still getting empty response
            // This indicates the workflow doesn't exist or there's a persistent issue
            setError('Unable to load workflow data. The workflow may not exist or there may be a caching issue. Please refresh the page.');
            setLoading(false);
            return;
          }

          if (!isEmptyResponse) {
            setWorkflow(data);
            setLoading(false);
            // Set selected attempt if not already set
            if (selectedAttempt === null) {
              setSelectedAttempt(data.currentAttempt);
            }
          }
        } else {
          // data is null or undefined
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching workflow:', err);
        // Clear ETag on error to prevent cache issues
        setWorkflowETag('');
        setError(err.message);
        setLoading(false);
      });
  };

  // Reset ETag when workflow changes (new owner/repo/runId)
  useEffect(() => {
    setWorkflowETag(''); // Clear ETag for fresh load
    fetchWorkflow();
  }, [owner, repo, runId]);

  // Fetch data when selected attempt changes
  useEffect(() => {
    if (selectedAttempt !== null && workflow && selectedAttempt !== workflow.currentAttempt) {
      fetchWorkflow(true, selectedAttempt);
    }
  }, [selectedAttempt]);

  // Polling effect for in-progress workflows
  useEffect(() => {
    if (!workflow) return;

    // Check if workflow or any job is in progress
    const isWorkflowInProgress = workflow.status === 'in_progress' || workflow.status === 'queued';
    const hasJobInProgress = workflow.jobs.some(
      job => job.status === 'in_progress' || job.status === 'queued'
    );

    if (isWorkflowInProgress || hasJobInProgress) {
      // Poll every 5 seconds
      const intervalId = setInterval(() => {
        fetchWorkflow(false); // Don't show loading spinner on refresh
      }, TIME.WORKFLOW_POLL_INTERVAL);

      return () => clearInterval(intervalId);
    }
  }, [workflow, owner, repo, runId]);

  const handleRerunWorkflow = async (type: 'all' | 'failed') => {
    setRerunning(true);
    try {
      const response = await fetch(`/api/workflows/${owner}/${repo}/${runId}/rerun`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) throw new Error('Failed to re-run workflow');

      setTimeout(() => {
        fetchWorkflow();
        setRerunning(false);
      }, TIME.RERUN_REFRESH_DELAY);
    } catch (error) {
      console.error('Error re-running workflow:', error);
      setRerunning(false);
      alert('Failed to re-run workflow. Please try again.');
    }
  };

  // Helper function to check if a name contains 'test'
  const hasTestInName = (name: string): boolean => {
    return name.toLowerCase().includes('test');
  };

  // Fetch test results for jobs that have 'test' in their name
  const fetchTestResults = async () => {
    if (!workflow) return;

    // Check if workflow, any job, or any step has 'test' in the name
    const workflowHasTest = hasTestInName(workflow.name);
    const testJobs = workflow.jobs.filter(job => {
      const jobHasTest = hasTestInName(job.name);
      const hasTestStep = job.steps.some(step => hasTestInName(step.name));
      return jobHasTest || hasTestStep;
    });

    if (!workflowHasTest && testJobs.length === 0) {
      return;
    }

    setLoadingTests(true);
    const results: TestResult[] = [];

    // Fetch logs for each test-related job
    for (const job of testJobs) {
      try {
        const response = await fetch(`/api/workflows/${owner}/${repo}/jobs/${job.id}/logs`);
        if (response.ok) {
          const data = await response.json();
          const testResult = parseTestResults(data.logs || '');
          if (testResult) {
            results.push(testResult);
          }
        }
      } catch (error) {
        console.error(`Error fetching logs for job ${job.id}:`, error);
      }
    }

    setTestResults(results);
    setLoadingTests(false);
  };

  // Fetch test results when workflow changes
  useEffect(() => {
    if (workflow && workflow.status === 'completed') {
      fetchTestResults();
    }
  }, [workflow?.id, workflow?.status]);

  if (loading) {
    return (
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin h-8 w-8 border-2 border-spinner-track border-t-spinner-indicator rounded-full"></div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div class="bg-error-bg border border-error-border rounded-lg p-6">
        <p class="text-error-text">Error: {error || 'Workflow not found'}</p>
      </div>
    );
  }

  // Build the correct GitHub URL for the current attempt
  const githubUrl = workflow.currentAttempt === workflow.runAttempt
    ? workflow.htmlUrl
    : `${workflow.htmlUrl}/attempts/${workflow.currentAttempt}`;

  return (
    <div class="space-y-6">
      {/* Workflow Header */}
      <div class="bg-surface-primary rounded-xl shadow-sm border border-default p-6">
        <div class="flex items-start justify-between mb-6 flex-col sm:flex-row gap-4">
          <div class="flex items-start gap-4">
            {getStatusIcon(workflow.status, workflow.conclusion)}
            <div>
              <h1 class="text-2xl font-bold text-text-primary mb-2">{workflow.name}</h1>
              <div class="flex items-center gap-3 flex-wrap">
                {getStatusBadge(workflow.status, workflow.conclusion, { size: 'md', showIcon: true })}
                <span class="text-sm text-text-secondary">#{workflow.runNumber}</span>
              </div>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto order-last sm:order-none">
            {/* View on GitHub - First on mobile */}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 bg-button-dark-bg text-button-dark-text text-sm font-medium rounded-lg hover:bg-button-dark-bg-hover transition-colors flex items-center justify-center gap-2 order-1"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>

            {/* Retry Button - Second on mobile */}
            {workflow.status === 'completed' && (
              <>
                {workflow.conclusion === 'failure' || workflow.conclusion === 'cancelled' ? (
                  <div class="order-2 w-full sm:w-auto">
                    <DropdownButton
                      label="Retry"
                      loading={rerunning}
                      icon={
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      }
                      onMainClick={() => handleRerunWorkflow('failed')}
                      options={[
                        {
                          label: 'Re-run failed jobs',
                          icon: (
                            <svg class="w-4 h-4 text-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ),
                          onClick: () => handleRerunWorkflow('failed'),
                        },
                        {
                          label: 'Re-run all jobs',
                          icon: (
                            <svg class="w-4 h-4 text-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ),
                          onClick: () => handleRerunWorkflow('all'),
                        },
                      ]}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => handleRerunWorkflow('all')}
                    disabled={rerunning}
                    class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-button-secondary-bg text-button-secondary-text border border-button-secondary-border hover:bg-button-secondary-bg-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer order-2"
                  >
                    {rerunning ? (
                      <>
                        <div class="w-4 h-4 border-2 border-text-faint border-t-transparent rounded-full animate-spin"></div>
                        Retrying...
                      </>
                    ) : (
                      <>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            {/* Attempt Selector - Third on mobile, only show if there are multiple attempts */}
            {workflow.runAttempt > 1 && (
              <div class="order-3 w-full sm:w-auto">
                <Dropdown
                  value={String(selectedAttempt || workflow.currentAttempt)}
                  onChange={(value) => setSelectedAttempt(parseInt(value))}
                  options={Array.from({ length: workflow.runAttempt }, (_, i) => i + 1)
                    .reverse()
                    .map((attemptNum) => ({
                      value: String(attemptNum),
                      label: `Attempt ${attemptNum}${attemptNum === workflow.runAttempt ? ' (latest)' : ''}`,
                    }))}
                  placeholder="Select attempt"
                  variant="button"
                />
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-default">
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Repository</div>
            <div class="text-sm font-medium text-text-primary">{workflow.repository.fullName}</div>
          </div>
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Branch</div>
            <div class="text-sm font-medium text-text-primary flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {workflow.branch}
            </div>
          </div>
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Event</div>
            <div class="text-sm font-medium text-text-primary">{workflow.event}</div>
          </div>
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Started at</div>
            <div class="text-sm font-medium text-text-primary">{formatDateTime(workflow.attemptStartedAt)}</div>
          </div>
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Total duration</div>
            <div class="text-sm font-medium text-text-primary">{formatDuration(workflow.duration)}</div>
          </div>
        </div>
      </div>

      {/* Commit Info */}
      <div class="bg-surface-primary rounded-xl shadow-sm border border-default p-6">
        <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">Triggered by commit</h2>
        <div class="flex items-start gap-4">
          <img
            src={workflow.commit.author.avatar}
            alt={workflow.commit.author.name}
            class="w-10 h-10 rounded-full flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-text-primary">{workflow.commit.author.name}</span>
              <a
                href={workflow.commit.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs font-mono text-brand-primary hover:text-brand-primary-hover bg-brand-primary-light px-2 py-0.5 rounded"
              >
                {workflow.commit.sha.substring(0, DISPLAY.COMMIT_SHA_LENGTH)}
              </a>
            </div>
            <p class="text-text-secondary text-sm break-words">{workflow.commit.message}</p>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">
            Test Results
          </h2>
          {testResults.map((result, index) => (
            <TestSummaryCard key={index} testResult={result} />
          ))}
        </div>
      )}

      {/* Loading indicator for tests */}
      {loadingTests && (
        <div class="bg-surface-primary rounded-xl shadow-sm border border-default p-6">
          <div class="flex items-center justify-center gap-3">
            <div class="animate-spin h-5 w-5 border-2 border-spinner-track border-t-spinner-indicator rounded-full"></div>
            <span class="text-sm text-text-secondary">Loading test results...</span>
          </div>
        </div>
      )}

      {/* Jobs */}
      <div>
        <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">
          Jobs ({workflow.jobs.length})
        </h2>
        <div class="space-y-3">
          {workflow.jobs.map((job) => (
            <JobPanel key={job.id} job={job} owner={owner} repo={repo} runId={runId} />
          ))}
        </div>
      </div>
    </div>
  );
}
