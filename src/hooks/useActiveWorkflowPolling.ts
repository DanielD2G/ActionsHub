import { useEffect, useState } from 'preact/hooks';
import type { WorkflowRun } from '../types/workflow';
import { TIME } from '../lib/constants';

/**
 * Custom hook to poll active workflows (in_progress or queued) for status updates
 *
 * This hook:
 * - Filters workflows to find only active ones (in_progress or queued)
 * - Polls for status updates every 5 seconds
 * - Uses ETag headers to minimize bandwidth and detect changes
 * - Handles 304 Not Modified responses efficiently
 * - Only calls onUpdate when workflow status/conclusion actually changes
 *
 * @param workflows - Array of all workflow runs
 * @param onUpdate - Callback invoked with array of changed workflows
 */
export function useActiveWorkflowPolling(
  workflows: WorkflowRun[],
  onUpdate: (changedWorkflows: WorkflowRun[]) => void
): void {
  // Store ETags for each workflow to enable conditional requests
  const [workflowETags, setWorkflowETags] = useState<{ [runId: number]: string }>({});

  useEffect(() => {
    // Filter to only workflows that are currently active
    const activeWorkflows = workflows.filter(
      w => w.status === 'in_progress' || w.status === 'queued'
    );

    if (activeWorkflows.length === 0) {
      return; // No active workflows, no need to poll
    }

    const pollActiveWorkflows = async () => {
      const updates = await Promise.all(
        activeWorkflows.map(async (workflow) => {
          try {
            // Get stored ETag for this workflow
            const etag = workflowETags[workflow.id];

            const headers: HeadersInit = {
              'Content-Type': 'application/json',
            };
            if (etag) {
              headers['If-None-Match'] = etag;
            }

            const response = await fetch(
              `/api/workflows/${workflow.repository.owner}/${workflow.repository.name}/${workflow.id}/status`,
              { headers }
            );

            // Handle 304 Not Modified - data hasn't changed, reuse cached data
            if (response.status === 304) {
              return null; // No changes, don't update
            }

            if (!response.ok) return null;

            // Save new ETag
            const newETag = response.headers.get('ETag');
            if (newETag && newETag !== etag) {
              setWorkflowETags(prev => ({ ...prev, [workflow.id]: newETag }));
            }

            const updatedWorkflow: WorkflowRun = await response.json();

            // Only return if status changed
            if (updatedWorkflow.status !== workflow.status ||
                updatedWorkflow.conclusion !== workflow.conclusion) {
              return updatedWorkflow;
            }
            return null;
          } catch (error) {
            console.error(`Error polling workflow ${workflow.id}:`, error);
            return null;
          }
        })
      );

      // Filter out null values and update workflows
      const changedWorkflows = updates.filter((w): w is WorkflowRun => w !== null);

      if (changedWorkflows.length > 0) {
        onUpdate(changedWorkflows);
      }
    };

    // Poll immediately, then every 5 seconds
    pollActiveWorkflows();
    const interval = setInterval(pollActiveWorkflows, TIME.WORKFLOW_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [workflows, onUpdate, workflowETags]);
}
