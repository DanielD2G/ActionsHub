import { useState, useEffect } from 'preact/hooks';
import { PAGINATION } from '../lib/constants';
import type { WorkflowRun } from '../types/workflow';

export function useWorkflowFilters(workflows: WorkflowRun[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = PAGINATION.ITEMS_PER_PAGE;

  // Get filtered workflows for calculating available options
  const getFilteredWorkflowsForOptions = () => {
    return workflows.filter(workflow => {
      const matchesOwner = selectedOwner === '' || workflow.repository.owner === selectedOwner;
      const matchesRepo = selectedRepo === '' || workflow.repository.fullName === selectedRepo;
      return matchesOwner && matchesRepo;
    });
  };

  const filteredForOptions = getFilteredWorkflowsForOptions();

  // Get unique values for filters based on current selections
  const uniqueRepos = selectedOwner !== ''
    ? Array.from(new Set(
        workflows
          .filter(w => w.repository.owner === selectedOwner)
          .map(w => w.repository.fullName)
      )).sort()
    : Array.from(new Set(workflows.map(w => w.repository.fullName))).sort();

  const uniqueOwners = selectedRepo !== ''
    ? Array.from(new Set(
        workflows
          .filter(w => w.repository.fullName === selectedRepo)
          .map(w => w.repository.owner)
      )).sort()
    : Array.from(new Set(workflows.map(w => w.repository.owner))).sort();

  // Get branches only for the selected repository
  const uniqueBranches = selectedRepo !== ''
    ? Array.from(new Set(
        workflows
          .filter(w => w.repository.fullName === selectedRepo)
          .map(w => w.branch)
      )).sort()
    : [];

  // Filter workflows based on search and filters
  const filteredWorkflows = workflows.filter(workflow => {
    // Search filter (searches in name, repo, and commit SHA)
    const matchesSearch = searchQuery === '' ||
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.repository.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workflow.headSha && workflow.headSha.toLowerCase().includes(searchQuery.toLowerCase()));

    // Repo filter
    const matchesRepo = selectedRepo === '' || workflow.repository.fullName === selectedRepo;

    // Branch filter
    const matchesBranch = selectedBranch === '' || workflow.branch === selectedBranch;

    // Owner filter
    const matchesOwner = selectedOwner === '' || workflow.repository.owner === selectedOwner;

    return matchesSearch && matchesRepo && matchesBranch && matchesOwner;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRepo, selectedBranch, selectedOwner]);

  // Clear branch selection when repository changes
  useEffect(() => {
    if (selectedRepo === '') {
      setSelectedBranch('');
    }
  }, [selectedRepo]);

  // Auto-adjust filters when they become incompatible
  useEffect(() => {
    // If owner is selected and repo doesn't belong to that owner, clear repo
    if (selectedOwner !== '' && selectedRepo !== '') {
      const repoOwner = workflows.find(w => w.repository.fullName === selectedRepo)?.repository.owner;
      if (repoOwner && repoOwner !== selectedOwner) {
        setSelectedRepo('');
        setSelectedBranch('');
      }
    }
  }, [selectedOwner, selectedRepo, workflows]);

  // Auto-adjust owner when repo is selected
  useEffect(() => {
    // If repo is selected, auto-set the owner if not already set
    if (selectedRepo !== '' && selectedOwner === '') {
      const repoOwner = workflows.find(w => w.repository.fullName === selectedRepo)?.repository.owner;
      if (repoOwner) {
        setSelectedOwner(repoOwner);
      }
    }
  }, [selectedRepo, workflows]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRepo('');
    setSelectedBranch('');
    setSelectedOwner('');
  };

  const hasActiveFilters = searchQuery !== '' || selectedRepo !== '' || selectedBranch !== '' || selectedOwner !== '';

  // Calculate pagination
  const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWorkflows = filteredWorkflows.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to the workflow list container
    const workflowListElement = document.getElementById('workflow-list-container');
    if (workflowListElement) {
      workflowListElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return {
    // Search and filters
    searchQuery,
    setSearchQuery,
    selectedRepo,
    setSelectedRepo,
    selectedBranch,
    setSelectedBranch,
    selectedOwner,
    setSelectedOwner,

    // Filter options
    uniqueRepos,
    uniqueOwners,
    uniqueBranches,

    // Filtered results
    filteredWorkflows,
    currentWorkflows,
    hasActiveFilters,
    clearFilters,

    // Pagination
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
  };
}
