import { useState, useEffect, useCallback } from 'preact/hooks';
import { TIME } from '../lib/constants';
import { useActiveWorkflowPolling } from './useActiveWorkflowPolling';
import type { WorkflowRun } from '../types/workflow';

export function useWorkflowSync(
  workflows: WorkflowRun[],
  setWorkflows: (updater: (prev: WorkflowRun[]) => WorkflowRun[]) => void,
  loading: boolean
) {
  // ETag tracking for sync polling (per repository)
  const [repoETags, setRepoETags] = useState<{ [repoKey: string]: string }>({});

  // Last-Modified tracking for sync polling (per repository)
  const [repoLastModified, setRepoLastModified] = useState<{ [repoKey: string]: string }>({});

  // Unified sync: poll all repositories for workflow updates using ETags + Last-Modified
  const syncWorkflows = async () => {
    // Get unique repositories from current workflows (using state updater to avoid stale closure)
    let uniqueRepos: string[] = [];
    let currentETags: { [key: string]: string } = {};
    let currentLastModified: { [key: string]: string } = {};

    setWorkflows(prev => {
      uniqueRepos = Array.from(new Set(
        prev.map(w => `${w.repository.owner}/${w.repository.name}`)
      ));
      return prev; // Don't modify state
    });

    setRepoETags(prev => {
      currentETags = { ...prev };
      return prev; // Don't modify state
    });

    setRepoLastModified(prev => {
      currentLastModified = { ...prev };
      return prev; // Don't modify state
    });

    if (uniqueRepos.length === 0) return;

    // Poll each repository
    const pollPromises = uniqueRepos.map(async (repoFullName) => {
      const [owner, repo] = repoFullName.split('/');
      const repoKey = `${owner}/${repo}`;

      try {
        // Get ETag and Last-Modified for this repository
        const etag = currentETags[repoKey];
        const lastModified = currentLastModified[repoKey];

        // Prepare headers with ETag and If-Modified-Since if available
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (etag) {
          headers['If-None-Match'] = etag;
        }
        if (lastModified) {
          headers['If-Modified-Since'] = lastModified;
        }


        const response = await fetch(
          `/api/workflows/${owner}/${repo}/sync`,
          { headers }
        );


        // Handle 304 Not Modified - data hasn't changed, reuse cached data
        if (response.status === 304) {
          return null;
        }

        // If not OK, check if it's an error
        if (!response.ok) {
          if (response.status === 404) {
            // Repo doesn't have actions, skip silently
            return null;
          }
          console.warn(`Failed to sync workflows for ${repoKey}: ${response.status}`);
          return null;
        }

        // Get new ETag and Last-Modified, update if changed
        const newETag = response.headers.get('ETag');
        const newLastModified = response.headers.get('Last-Modified');

        if (newETag && newETag !== etag) {
          setRepoETags(prev => ({ ...prev, [repoKey]: newETag }));
        }
        if (newLastModified && newLastModified !== lastModified) {
          setRepoLastModified(prev => ({ ...prev, [repoKey]: newLastModified }));
        }

        const syncedWorkflows: WorkflowRun[] = await response.json();

        if (syncedWorkflows.length > 0) {
          return syncedWorkflows;
        }

        return null;
      } catch (error) {
        console.error(`Error syncing workflows for ${repoKey}:`, error);
        return null;
      }
    });

    const results = await Promise.all(pollPromises);
    const allSyncedWorkflows = results.filter((r): r is WorkflowRun[] => r !== null).flat();

    if (allSyncedWorkflows.length > 0) {
      // Update workflows with synced data (merge/update)
      setWorkflows(prevWorkflows => {
        const workflowMap = new Map(prevWorkflows.map(w => [w.id, w]));

        // Add or update all synced workflows
        allSyncedWorkflows.forEach(workflow => {
          workflowMap.set(workflow.id, workflow);
        });

        return Array.from(workflowMap.values()).sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    }
  };

  // Unified sync polling: poll all repositories using ETags
  // This detects new workflow runs, reruns, and status updates
  useEffect(() => {
    // Only start polling after initial load
    if (loading || workflows.length === 0) return;

    // Poll immediately on mount, then every 10 seconds
    syncWorkflows();

    const syncInterval = setInterval(() => {
      syncWorkflows();
    }, TIME.SYNC_POLL_INTERVAL);

    return () => clearInterval(syncInterval);
  }, [loading]); // Only restart when loading state changes

  // Handler for active workflow polling updates
  const handleActiveWorkflowUpdates = useCallback((changedWorkflows: WorkflowRun[]) => {
    setWorkflows(prevWorkflows => {
      const workflowMap = new Map(prevWorkflows.map(w => [w.id, w]));

      // Update changed workflows
      changedWorkflows.forEach(updated => {
        workflowMap.set(updated.id, updated);
      });

      return Array.from(workflowMap.values()).sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  }, [setWorkflows]);

  // Use shared polling hook for active workflows
  useActiveWorkflowPolling(workflows, handleActiveWorkflowUpdates);

  return {
    syncWorkflows,
    repoETags,
    repoLastModified,
    setRepoETags,
    setRepoLastModified,
  };
}
