import { useState } from 'preact/hooks';
import { TIME, getWorkflowsCacheKey } from '../lib/constants';
import type { WorkflowRun } from '../types/workflow';

interface UseWorkflowRerunOptions {
  username: string;
  onWorkflowsUpdate?: () => void;
  updateLocalState?: (updatedWorkflow: WorkflowRun) => void;
}

export function useWorkflowRerun({ username, onWorkflowsUpdate, updateLocalState }: UseWorkflowRerunOptions) {
  const [retryingWorkflows, setRetryingWorkflows] = useState<Set<number>>(new Set());

  const handleRerun = async (workflow: WorkflowRun, type: 'all' | 'failed') => {
    setRetryingWorkflows(prev => new Set(prev).add(workflow.id));

    try {
      const response = await fetch(
        `/api/workflows/${workflow.repository.owner}/${workflow.repository.name}/${workflow.id}/rerun`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        }
      );

      if (!response.ok) throw new Error('Failed to re-run workflow');

      // Fetch updated workflow status after a short delay to allow GitHub to process the re-run
      setTimeout(async () => {
        try {
          // Fetch the updated workflow status
          const statusResponse = await fetch(
            `/api/workflows/${workflow.repository.owner}/${workflow.repository.name}/${workflow.id}/status`
          );

          if (statusResponse.ok) {
            const updatedWorkflow: WorkflowRun = await statusResponse.json();

            // Update localStorage cache if username is provided
            if (username) {
              try {
                const cacheKey = getWorkflowsCacheKey(username);
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                  const cache = JSON.parse(cached);
                  const workflowMap = new Map(cache.data.map((w: WorkflowRun) => [w.id, w]));
                  workflowMap.set(updatedWorkflow.id, updatedWorkflow);
                  cache.data = (Array.from(workflowMap.values()) as WorkflowRun[]).sort((a: WorkflowRun, b: WorkflowRun) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                  );
                  localStorage.setItem(cacheKey, JSON.stringify(cache));
                  window.dispatchEvent(new Event('workflowsUpdated'));
                }
              } catch (error) {
                console.error('Error updating cache with re-run workflow:', error);
              }
            }

            // Update local state if callback provided
            if (updateLocalState) {
              updateLocalState(updatedWorkflow);
            }

            // Call onWorkflowsUpdate callback if provided
            if (onWorkflowsUpdate) {
              onWorkflowsUpdate();
            }
          }
        } catch (error) {
          console.error('Error fetching updated workflow status:', error);
        } finally {
          setRetryingWorkflows(prev => {
            const next = new Set(prev);
            next.delete(workflow.id);
            return next;
          });
        }
      }, TIME.RERUN_REFRESH_DELAY);
    } catch (error) {
      console.error('Error re-running workflow:', error);
      setRetryingWorkflows(prev => {
        const next = new Set(prev);
        next.delete(workflow.id);
        return next;
      });
      alert('Failed to re-run workflow. Please try again.');
    }
  };

  return {
    retryingWorkflows,
    handleRerun,
  };
}
