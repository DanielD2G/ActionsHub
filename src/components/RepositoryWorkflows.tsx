import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import Dropdown from './Dropdown';
import WorkflowItem from './WorkflowItem';
import WorkflowPagination from './WorkflowPagination';
import { PAGINATION, getWorkflowsCacheKey, fetchAndCacheUser } from '../lib/constants';
import { useWorkflowRerun } from '../hooks/useWorkflowRerun';
import { useActiveWorkflowPolling } from '../hooks/useActiveWorkflowPolling';
import type { WorkflowRun } from '../types/workflow';

interface RepositoryWorkflowsProps {
  owner: string;
  repo: string;
}

// Load workflows from localStorage and filter by repository
const loadWorkflowsForRepository = (username: string, owner: string, repo: string): WorkflowRun[] => {
  try {
    const cacheKey = getWorkflowsCacheKey(username);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return [];

    const cache = JSON.parse(cached);
    const allWorkflows = cache.data || [];

    // Filter workflows for this specific repository
    return allWorkflows.filter((w: WorkflowRun) =>
      w.repository.owner === owner && w.repository.name === repo
    );
  } catch (error) {
    console.error('Error loading workflows from cache:', error);
    return [];
  }
};

export default function RepositoryWorkflows({ owner, repo }: RepositoryWorkflowsProps) {
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [username, setUsername] = useState<string>('');
  const itemsPerPage = PAGINATION.ITEMS_PER_PAGE;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const loadWorkflows = () => {
    if (!username) return; // Wait for username to be loaded

    try {
      const data = loadWorkflowsForRepository(username, owner, repo);
      setWorkflows(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Use shared rerun hook
  const { retryingWorkflows, handleRerun } = useWorkflowRerun({
    username,
    onWorkflowsUpdate: loadWorkflows,
  });

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

    loadWorkflows();

    // Listen for storage changes to update workflows when they change
    const handleStorageChange = () => {
      loadWorkflows();
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event from WorkflowList when data updates
    const handleCacheUpdate = () => {
      loadWorkflows();
    };
    window.addEventListener('workflowsUpdated', handleCacheUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workflowsUpdated', handleCacheUpdate);
    };
  }, [username, owner, repo]);

  // Handler for workflow polling updates
  const handleWorkflowUpdates = useCallback((changedWorkflows: WorkflowRun[]) => {
    // Update localStorage cache
    try {
      if (username) {
        const cacheKey = getWorkflowsCacheKey(username);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cache = JSON.parse(cached);
          const workflowMap = new Map(cache.data.map((w: WorkflowRun) => [w.id, w]));

          // Update changed workflows in cache
          changedWorkflows.forEach(updated => {
            workflowMap.set(updated.id, updated);
          });

          cache.data = (Array.from(workflowMap.values()) as WorkflowRun[]).sort((a: WorkflowRun, b: WorkflowRun) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          localStorage.setItem(cacheKey, JSON.stringify(cache));
          window.dispatchEvent(new Event('workflowsUpdated'));
        }
      }
    } catch (error) {
      console.error('Error updating cache with polled workflows:', error);
    }

    // Update local state
    loadWorkflows();
  }, [username, loadWorkflows]);

  // Use shared polling hook for active workflows
  useActiveWorkflowPolling(workflows, handleWorkflowUpdates);

  if (loading) {
    return (
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin h-8 w-8 border-2 border-spinner-track border-t-spinner-indicator rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="text-center py-8">
        <p class="text-error-text">Error loading workflows: {error}</p>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div class="text-center py-8">
        <p class="text-text-faint">No workflow runs found for this repository</p>
      </div>
    );
  }

  // Get unique branches
  const uniqueBranches = Array.from(new Set(workflows.map(w => w.branch))).sort();

  // Filter workflows
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = searchQuery === '' ||
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workflow.headSha && workflow.headSha.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBranch = selectedBranch === '' || workflow.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBranch]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWorkflows = filteredWorkflows.slice(startIndex, endIndex);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBranch('');
  };

  const hasActiveFilters = searchQuery !== '' || selectedBranch !== '';

  return (
    <div>
      {/* Filters Section */}
      <div class="mb-6 space-y-4">
        {/* Search Bar */}
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search workflows by name or commit..."
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            class="w-full pl-10 pr-4 py-2 border border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-surface-primary text-text-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-text-faint hover:text-text-secondary cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div class="flex flex-wrap gap-3 items-center">
          {/* Branch Filter */}
          <div class="flex-1 min-w-[200px]">
            <Dropdown
              value={selectedBranch}
              onChange={setSelectedBranch}
              options={[
                { value: '', label: 'All Branches' },
                ...uniqueBranches.map(branch => ({ value: branch, label: branch }))
              ]}
              placeholder="All Branches"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              class="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-primary border border-default rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        {hasActiveFilters && (
          <div class="text-sm text-text-muted">
            Showing {filteredWorkflows.length} of {workflows.length} workflow runs
          </div>
        )}
      </div>

      {/* Workflows List */}
      {filteredWorkflows.length === 0 ? (
        <div class="text-center py-8">
          <p class="text-text-faint">No workflows match your filters</p>
          <button
            onClick={clearFilters}
            class="mt-2 text-brand-primary hover:text-brand-primary-hover font-medium cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div class="space-y-3">
            {currentWorkflows.map((workflow) => (
              <WorkflowItem
                key={workflow.id}
                workflow={workflow}
                isRetrying={retryingWorkflows.has(workflow.id)}
                onRerun={handleRerun}
              />
            ))}
          </div>

          {/* Pagination */}
          <WorkflowPagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            totalCount={filteredWorkflows.length}
            goToPage={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
