import { useState, useEffect, useMemo } from 'preact/hooks';
import { generateBatchConfig, calculateDateRange, DELAY_BETWEEN_BATCHES, sleep, type BatchConfig } from '../lib/workflowBatcher';
import { loadFromCache, saveToCache, clearCache } from '../lib/workflowCache';
import type { WorkflowRun, BatchMetadata } from '../types/workflow';
import type { UserInfo } from '../lib/constants';

export function useWorkflowBatches(username: string, billingConfig?: UserInfo['billingConfig']) {
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedBatches, setLoadedBatches] = useState<{ [batchId: string]: BatchMetadata }>({});
  const [loadingBatches, setLoadingBatches] = useState<Set<string>>(new Set());
  const [isFullRefresh, setIsFullRefresh] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  // Generate batch configuration based on user's billing tier
  const batchConfig = useMemo(() => {
    if (!billingConfig) {
      // Default to paid tier if billing config not available yet
      return generateBatchConfig();
    }
    return generateBatchConfig(billingConfig.maxDays, billingConfig.maxBatches);
  }, [billingConfig?.maxDays, billingConfig?.maxBatches]);

  // Fetch a single batch
  const fetchBatch = async (batchConfig: BatchConfig): Promise<void> => {
    const { from, to } = calculateDateRange(batchConfig.daysAgo, batchConfig.daysBack);

    setLoadingBatches(prev => new Set(prev).add(batchConfig.id));

    try {
      const response = await fetch(
        `/api/workflows/batch?dateFrom=${from}&dateTo=${to}&batchId=${batchConfig.id}`
      );

      if (!response.ok) throw new Error(`Failed to fetch batch ${batchConfig.id}`);

      const batchData = await response.json();

      // Merge workflows with existing ones
      setWorkflows(prevWorkflows => {
        const existingIds = new Set(prevWorkflows.map(w => w.id));
        const uniqueNewWorkflows = batchData.workflows.filter(
          (w: WorkflowRun) => !existingIds.has(w.id)
        );

        const merged = [...prevWorkflows, ...uniqueNewWorkflows];

        // Sort by update date (most recently updated first - keeps running workflows at top)
        return merged.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      // Update loaded batches metadata
      setLoadedBatches(prev => ({
        ...prev,
        [batchConfig.id]: {
          dateFrom: from,
          dateTo: to,
          loadedAt: Date.now(),
          workflowCount: batchData.workflowCount,
        },
      }));

    } catch (err) {
      console.error(`Error loading batch ${batchConfig.id}:`, err);
      setError(`Failed to load workflows from ${batchConfig.id}`);
    } finally {
      setLoadingBatches(prev => {
        const next = new Set(prev);
        next.delete(batchConfig.id);
        return next;
      });
    }
  };

  // Load all batches sequentially with delays
  const loadAllBatches = async () => {
    setLoading(true);
    setError(null);
    setIsLoadingBatches(true);

    for (let i = 0; i < batchConfig.length; i++) {
      const batch = batchConfig[i];
      await fetchBatch(batch);

      // After first batch, hide the main loading indicator
      if (i === 0) {
        setLoading(false);
      }

      // Delay between batches (except after the last one)
      if (i < batchConfig.length - 1) {
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    setLoading(false);
    setIsLoadingBatches(false);
  };

  // Force full refresh (clears cache and reloads all batches)
  const handleForceFullRefresh = async () => {
    if (!username) return; // Wait for username to be loaded

    const maxDays = billingConfig?.maxDays || 31;
    if (!confirm(`This will reload all workflows from the last ${maxDays} days. Continue?`)) {
      return;
    }

    setIsFullRefresh(true);
    clearCache(username);
    setWorkflows([]);
    setLoadedBatches({});

    await loadAllBatches();

    setIsFullRefresh(false);
  };

  // Initial load: load from cache or fetch all batches
  useEffect(() => {
    if (!username) return; // Wait for username to be loaded

    const cached = loadFromCache(username);

    if (cached && cached.batches && Object.keys(cached.batches).length > 0) {
      // Load from cache
      setWorkflows(cached.data);
      setLoadedBatches(cached.batches);
      setLoading(false);

      // Load missing batches in background
      const loadMissingBatches = async () => {
        setIsLoadingBatches(true);
        for (const batch of batchConfig) {
          if (!cached.batches[batch.id]) {
            await fetchBatch(batch);
            await sleep(DELAY_BETWEEN_BATCHES);
          }
        }
        setIsLoadingBatches(false);
      };

      loadMissingBatches();
    } else {
      // No cache, load all batches
      loadAllBatches();
    }
  }, [username, batchConfig]);

  // Save to cache whenever workflows or loadedBatches change
  useEffect(() => {
    if (username && workflows.length > 0 && Object.keys(loadedBatches).length > 0) {
      saveToCache(username, workflows, loadedBatches);
    }
  }, [username, workflows, loadedBatches]);

  return {
    workflows,
    setWorkflows,
    loading,
    error,
    loadedBatches,
    loadingBatches,
    isFullRefresh,
    isLoadingBatches,
    handleForceFullRefresh,
  };
}
