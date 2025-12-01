import { h } from 'preact';
import DropdownButton from './DropdownButton';
import Dropdown from './Dropdown';
import type { WorkflowRun } from '../types/workflow';

interface WorkflowFiltersProps {
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Filters
  selectedOwner: string;
  setSelectedOwner: (owner: string) => void;
  selectedRepo: string;
  setSelectedRepo: (repo: string) => void;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;

  // Filter options
  uniqueOwners: string[];
  uniqueRepos: string[];
  uniqueBranches: string[];

  // Filter state
  hasActiveFilters: boolean;
  clearFilters: () => void;

  // Results count
  filteredCount: number;
  totalCount: number;

  // Refresh
  isFullRefresh: boolean;
  loadingBatches: Set<string>;
  onSync: () => void;
  onForceRefresh: () => void;
}

export default function WorkflowFilters({
  searchQuery,
  setSearchQuery,
  selectedOwner,
  setSelectedOwner,
  selectedRepo,
  setSelectedRepo,
  selectedBranch,
  setSelectedBranch,
  uniqueOwners,
  uniqueRepos,
  uniqueBranches,
  hasActiveFilters,
  clearFilters,
  filteredCount,
  totalCount,
  isFullRefresh,
  loadingBatches,
  onSync,
  onForceRefresh,
}: WorkflowFiltersProps) {
  return (
    <div class="mb-6 space-y-4">
      {/* Search Bar and Refresh Button */}
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search workflows..."
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

        {/* Refresh Button with Dropdown */}
        <div class="flex-shrink-0 w-full sm:w-auto">
          <DropdownButton
            label={isFullRefresh ? 'Loading All...' : (loadingBatches.size > 0 ? 'Refreshing...' : 'Refresh')}
            loading={isFullRefresh || loadingBatches.size > 0}
            variant="primary"
            icon={
              <svg
                class={`w-5 h-6 ${isFullRefresh || loadingBatches.size > 0 ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            }
            onMainClick={onSync}
            options={[
              {
                label: 'Sync Workflows',
                icon: (
                  <svg class="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ),
                onClick: onSync,
              },
              {
                label: 'Force Full Refresh (31 days)',
                icon: (
                  <svg class="w-4 h-4 text-warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ),
                onClick: onForceRefresh,
              },
            ]}
          />
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div class="flex flex-wrap gap-3 items-center">
        {/* Owner Filter */}
        <div class="flex-1 min-w-[150px] sm:min-w-[200px]">
          <Dropdown
            value={selectedOwner}
            onChange={setSelectedOwner}
            options={[
              { value: '', label: 'All Owners' },
              ...uniqueOwners.map(owner => ({ value: owner, label: owner }))
            ]}
            placeholder="All Owners"
          />
        </div>

        {/* Repository Filter */}
        <div class="flex-1 min-w-[150px] sm:min-w-[200px]">
          <Dropdown
            value={selectedRepo}
            onChange={setSelectedRepo}
            options={[
              { value: '', label: 'All Repositories' },
              ...uniqueRepos.map(repo => ({ value: repo, label: repo }))
            ]}
            placeholder="All Repositories"
          />
        </div>

        {/* Branch Filter */}
        <div class="flex-1 min-w-[150px] sm:min-w-[200px]">
          {selectedRepo === '' ? (
            <div class="relative">
              <div class="w-full px-3 py-2 bg-surface-tertiary border border-default rounded-lg text-text-faint cursor-not-allowed flex items-center justify-between text-sm">
                <span class="truncate">Select a repository first</span>
                <svg
                  class="w-5 h-5 text-text-faint flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          ) : (
            <Dropdown
              value={selectedBranch}
              onChange={setSelectedBranch}
              options={[
                { value: '', label: 'All Branches' },
                ...uniqueBranches.map(branch => ({ value: branch, label: branch }))
              ]}
              placeholder="All Branches"
            />
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            class="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-primary border border-default rounded-lg hover:bg-surface-hover transition-colors cursor-pointer whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div class="text-sm text-text-muted">
          Showing {filteredCount} of {totalCount} workflow runs
        </div>
      )}
    </div>
  );
}
