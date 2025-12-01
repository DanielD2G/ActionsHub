/**
 * Shared mappers for transforming GitHub API responses into our application's data structures.
 * This module centralizes transformation logic to maintain consistency and reduce code duplication.
 */

/**
 * Maps a GitHub workflow run API response to our WorkflowRun format
 *
 * @param run - Raw workflow run object from GitHub API
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Normalized workflow run object
 */
export function mapWorkflowRun(run: any, owner: string, repo: string) {
  return {
    id: run.id,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    repository: {
      name: repo,
      owner: owner,
      fullName: `${owner}/${repo}`,
    },
    branch: run.head_branch,
    event: run.event,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    runStartedAt: run.run_started_at,
    htmlUrl: run.html_url,
    runNumber: run.run_number,
    workflowId: run.workflow_id,
    headSha: run.head_sha,
  };
}

/**
 * Maps a GitHub job step to our Step format
 *
 * @param step - Raw step object from GitHub API
 * @returns Normalized step object
 */
export function mapJobStep(step: any) {
  return {
    name: step.name,
    status: step.status,
    conclusion: step.conclusion,
    number: step.number,
    startedAt: step.started_at,
    completedAt: step.completed_at,
  };
}

/**
 * Maps a GitHub job to our Job format
 *
 * @param job - Raw job object from GitHub API
 * @returns Normalized job object
 */
export function mapJob(job: any) {
  return {
    id: job.id,
    name: job.name,
    status: job.status,
    conclusion: job.conclusion,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    htmlUrl: job.html_url,
    steps: job.steps?.map(mapJobStep) || [],
  };
}

/**
 * Maps a GitHub commit to our Commit format
 *
 * @param commit - Raw commit object from GitHub API
 * @returns Normalized commit object
 */
export function mapCommit(commit: any) {
  return {
    sha: commit.sha,
    message: commit.commit.message,
    author: {
      name: commit.commit.author?.name || 'Unknown',
      email: commit.commit.author?.email || '',
      avatar: commit.author?.avatar_url || '',
    },
    url: commit.html_url,
  };
}

/**
 * Calculates workflow duration and attempt start time from job data
 *
 * @param jobs - Array of jobs for the workflow run
 * @param fallbackCreatedAt - Fallback created_at timestamp from workflow
 * @param fallbackUpdatedAt - Fallback updated_at timestamp from workflow
 * @returns Object containing duration (ms) and attemptStartedAt (ISO string)
 */
export function calculateWorkflowDuration(
  jobs: any[],
  fallbackCreatedAt?: string,
  fallbackUpdatedAt?: string
): { duration: number | null; attemptStartedAt: string | null } {
  // Get jobs with valid start and completion times
  const completedJobs = jobs.filter(job => job.started_at && job.completed_at);

  if (completedJobs.length > 0) {
    // Use the earliest job start time and latest job completion time
    const jobStartTimes = completedJobs.map(job => new Date(job.started_at!).getTime());
    const jobEndTimes = completedJobs.map(job => new Date(job.completed_at!).getTime());

    const actualStart = Math.min(...jobStartTimes);
    const actualEnd = Math.max(...jobEndTimes);

    return {
      duration: actualEnd - actualStart,
      attemptStartedAt: new Date(actualStart).toISOString(),
    };
  }

  // Fallback for workflows that haven't completed yet or have no jobs
  const jobStartTimes = jobs
    .filter(job => job.started_at)
    .map(job => new Date(job.started_at!).getTime());

  if (jobStartTimes.length > 0 && fallbackUpdatedAt) {
    // Use earliest job start and workflow updated_at
    const actualStart = Math.min(...jobStartTimes);
    const end = new Date(fallbackUpdatedAt).getTime();
    return {
      duration: end - actualStart,
      attemptStartedAt: new Date(actualStart).toISOString(),
    };
  }

  if (fallbackCreatedAt && fallbackUpdatedAt) {
    // Final fallback to created_at
    const start = new Date(fallbackCreatedAt).getTime();
    const end = new Date(fallbackUpdatedAt).getTime();
    return {
      duration: end - start,
      attemptStartedAt: fallbackCreatedAt,
    };
  }

  return {
    duration: null,
    attemptStartedAt: null,
  };
}

/**
 * Calculates the overall status and conclusion for a workflow attempt based on its jobs
 *
 * @param jobs - Array of jobs for the workflow run
 * @param fallbackConclusion - Fallback conclusion from workflow run
 * @returns Object containing status and conclusion
 */
export function calculateWorkflowStatus(
  jobs: any[],
  fallbackConclusion?: string | null
): { status: string; conclusion: string | null } {
  // Check if any jobs are still running or queued
  const hasInProgressJobs = jobs.some(job => job.status === 'in_progress');
  const hasQueuedJobs = jobs.some(job => job.status === 'queued' || job.status === 'pending');

  if (hasInProgressJobs) {
    return { status: 'in_progress', conclusion: null };
  }

  if (hasQueuedJobs) {
    return { status: 'queued', conclusion: null };
  }

  // All jobs are completed
  const status = 'completed';

  // Determine the overall conclusion
  const hasFailedJobs = jobs.some(job => job.conclusion === 'failure');
  const hasCancelledJobs = jobs.some(job => job.conclusion === 'cancelled');
  const allSuccessful = jobs.every(job =>
    job.conclusion === 'success' || job.conclusion === 'skipped'
  );

  let conclusion: string | null;

  if (hasFailedJobs) {
    conclusion = 'failure';
  } else if (hasCancelledJobs) {
    conclusion = 'cancelled';
  } else if (allSuccessful) {
    conclusion = 'success';
  } else {
    // Fallback to the workflow's conclusion
    conclusion = fallbackConclusion || null;
  }

  return { status, conclusion };
}

/**
 * Maps a complete workflow run with all details (jobs, commit, etc.)
 *
 * @param workflowRun - Raw workflow run from GitHub API
 * @param jobs - Array of jobs for the workflow run
 * @param commit - Raw commit object from GitHub API
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param attemptNumber - Current attempt number being viewed
 * @returns Complete workflow details object
 */
export function mapWorkflowDetails(
  workflowRun: any,
  jobs: any[],
  commit: any,
  owner: string,
  repo: string,
  attemptNumber: number
) {
  const { duration, attemptStartedAt } = calculateWorkflowDuration(
    jobs,
    workflowRun.created_at,
    workflowRun.updated_at
  );

  const { status: attemptStatus, conclusion: attemptConclusion } = calculateWorkflowStatus(
    jobs,
    workflowRun.conclusion
  );

  return {
    id: workflowRun.id,
    name: workflowRun.name,
    runNumber: workflowRun.run_number,
    status: attemptStatus,
    conclusion: attemptConclusion,
    event: workflowRun.event,
    branch: workflowRun.head_branch,
    htmlUrl: workflowRun.html_url,
    createdAt: workflowRun.created_at,
    updatedAt: workflowRun.updated_at,
    attemptStartedAt,
    duration,
    runAttempt: workflowRun.run_attempt,
    currentAttempt: attemptNumber,
    repository: {
      name: repo,
      owner: owner,
      fullName: `${owner}/${repo}`,
    },
    commit: mapCommit(commit),
    jobs: jobs.map(mapJob),
  };
}
