import { useState, useEffect } from 'preact/hooks';
import { fetchAndCacheUser, type UserInfo } from '../lib/constants';
import { useWorkflowBatches } from '../hooks/useWorkflowBatches';
import { useWorkflowSync } from '../hooks/useWorkflowSync';
import { useWorkflowFilters } from '../hooks/useWorkflowFilters';
import { useWorkflowRerun } from '../hooks/useWorkflowRerun';
import WorkflowFilters from './WorkflowFilters';
import WorkflowItem from './WorkflowItem';
import WorkflowPagination from './WorkflowPagination';
import type { WorkflowRun } from '../types/workflow';

export default function WorkflowList() {
  const [username, setUsername] = useState<string>('');
  const [billingConfig, setBillingConfig] = useState<UserInfo['billingConfig']>();

  // Fetch username and billing config on mount (uses cache to avoid duplicate requests)
  useEffect(() => {
    fetchAndCacheUser().then((userInfo) => {
      if (userInfo.authenticated && userInfo.username) {
        setUsername(userInfo.username);
        setBillingConfig(userInfo.billingConfig);
      }
    });
  }, []);

  // Use custom hooks
  const {
    workflows,
    setWorkflows,
    loading,
    error,
    loadedBatches,
    loadingBatches,
    isFullRefresh,
    isLoadingBatches,
    handleForceFullRefresh,
  } = useWorkflowBatches(username, billingConfig);

  const { syncWorkflows, setRepoETags, setRepoLastModified } = useWorkflowSync(
    workflows,
    setWorkflows,
    loading
  );

  const {
    searchQuery,
    setSearchQuery,
    selectedRepo,
    setSelectedRepo,
    selectedBranch,
    setSelectedBranch,
    selectedOwner,
    setSelectedOwner,
    uniqueRepos,
    uniqueOwners,
    uniqueBranches,
    filteredWorkflows,
    currentWorkflows,
    hasActiveFilters,
    clearFilters,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
  } = useWorkflowFilters(workflows);

  // Use shared rerun hook
  const { retryingWorkflows, handleRerun } = useWorkflowRerun({
    username,
    updateLocalState: (updatedWorkflow) => {
      setWorkflows(prevWorkflows => {
        const workflowMap = new Map(prevWorkflows.map(w => [w.id, w]));
        workflowMap.set(updatedWorkflow.id, updatedWorkflow);
        return Array.from(workflowMap.values()).sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    },
  });

  // Enhanced force refresh that clears ETags
  const handleEnhancedForceRefresh = async () => {
    setRepoETags({});
    setRepoLastModified({});
    await handleForceFullRefresh();
  };

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
        <p class="text-text-muted">No workflow runs found</p>
      </div>
    );
  }

  return (
    <div id="workflow-list-container">
      {/* Filters Section */}
      <WorkflowFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedOwner={selectedOwner}
        setSelectedOwner={setSelectedOwner}
        selectedRepo={selectedRepo}
        setSelectedRepo={setSelectedRepo}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        uniqueOwners={uniqueOwners}
        uniqueRepos={uniqueRepos}
        uniqueBranches={uniqueBranches}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        filteredCount={filteredWorkflows.length}
        totalCount={workflows.length}
        isFullRefresh={isFullRefresh}
        loadingBatches={loadingBatches}
        onSync={syncWorkflows}
        onForceRefresh={handleEnhancedForceRefresh}
      />

      {/* Loading Batches Indicator */}
      {isLoadingBatches && !isFullRefresh && (
        <div class="mb-4 p-3 bg-info-bg border border-info-border rounded-lg">
          <div class="flex items-center gap-2 text-sm text-info-text">
            <svg class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Loading older workflows in background...</span>
          </div>
        </div>
      )}

      {/* Workflows List */}
      {filteredWorkflows.length === 0 ? (
        <div class="text-center py-8">
          <p class="text-text-muted">No workflows match your filters</p>
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
            goToPage={goToPage}
          />
        </>
      )}
    </div>
  );
}
