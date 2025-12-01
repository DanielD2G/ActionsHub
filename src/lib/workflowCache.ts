import { CACHE, getWorkflowsCacheKey } from './constants';
import type { WorkflowRun, BatchMetadata, WorkflowCache } from '../types/workflow';

const CACHE_VERSION = CACHE.VERSION;

export const saveToCache = (username: string, data: WorkflowRun[], batches: { [batchId: string]: BatchMetadata }) => {
  const cache: WorkflowCache = {
    version: CACHE_VERSION,
    data,
    timestamp: Date.now(),
    batches,
  };
  try {
    const cacheKey = getWorkflowsCacheKey(username);
    localStorage.setItem(cacheKey, JSON.stringify(cache));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('workflowsUpdated'));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

export const loadFromCache = (username: string): WorkflowCache | null => {
  try {
    const cacheKey = getWorkflowsCacheKey(username);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const cache: WorkflowCache = JSON.parse(cached);

    // Check cache version
    if (cache.version !== CACHE_VERSION) {
      console.log('Cache version mismatch, clearing cache');
      localStorage.removeItem(cacheKey);
      return null;
    }

    return cache;
  } catch (error) {
    console.error('Error loading from cache:', error);
    return null;
  }
};

export const clearCache = (username: string) => {
  try {
    const cacheKey = getWorkflowsCacheKey(username);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
