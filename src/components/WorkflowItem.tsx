import { h } from 'preact';
import { getStatusIcon, getStatusBadge, formatTimeAgo } from '../lib/workflowUtils';
import RetryButton from './RetryButton';
import type { WorkflowRun } from '../types/workflow';

interface WorkflowItemProps {
  workflow: WorkflowRun;
  isRetrying: boolean;
  onRerun: (workflow: WorkflowRun, type: 'all' | 'failed') => void;
}

export default function WorkflowItem({ workflow, isRetrying, onRerun }: WorkflowItemProps) {
  return (
    <div
      key={workflow.id}
      class="bg-surface-secondary hover:bg-surface-tertiary rounded-lg p-3 sm:p-4 transition-colors border border-default"
    >
      {/* Mobile Layout */}
      <div class="flex md:hidden flex-col gap-3">
        {/* Top row: Icon and Status Badge */}
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            {getStatusIcon(workflow.status, workflow.conclusion)}
            {getStatusBadge(workflow.status, workflow.conclusion)}
          </div>
          {/* Retry Button - Mobile */}
          <RetryButton
            workflow={workflow}
            isRetrying={isRetrying}
            onRerun={onRerun}
            size="mobile"
          />
        </div>

        {/* Workflow Name */}
        <a
          href={`/workflow/${workflow.repository.owner}/${workflow.repository.name}/${workflow.id}`}
          class="block"
        >
          <h4 class="font-medium text-text-primary mb-2 break-words">{workflow.name}</h4>

          {/* Repository and Branch */}
          <div class="flex flex-col gap-2 text-xs text-text-secondary">
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <a
                href={`/repository/${workflow.repository.owner}/${workflow.repository.name}`}
                class="text-brand-primary hover:text-brand-primary-hover hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {workflow.repository.fullName}
              </a>
            </div>

            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span class="truncate">{workflow.branch}</span>
              </div>

              <div class="flex items-center gap-1.5 flex-shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="whitespace-nowrap">{formatTimeAgo(workflow.updatedAt)}</span>
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Desktop Layout */}
      <div class="hidden md:flex items-start gap-4">
        {getStatusIcon(workflow.status, workflow.conclusion)}

        <a
          href={`/workflow/${workflow.repository.owner}/${workflow.repository.name}/${workflow.id}`}
          class="flex-1 min-w-0"
        >
          <div class="flex items-center gap-2 mb-1">
            <h4 class="font-medium text-text-primary truncate">{workflow.name}</h4>
            {getStatusBadge(workflow.status, workflow.conclusion)}
          </div>

          <div class="flex items-center gap-4 text-sm text-text-secondary">
            <div class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <a
                href={`/repository/${workflow.repository.owner}/${workflow.repository.name}`}
                class="truncate text-brand-primary hover:text-brand-primary-hover hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {workflow.repository.fullName}
              </a>
            </div>

            <div class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>{workflow.branch}</span>
            </div>

            <div class="flex items-center gap-1 ml-auto">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTimeAgo(workflow.updatedAt)}</span>
            </div>
          </div>
        </a>

        {/* Retry Button - Desktop */}
        <RetryButton
          workflow={workflow}
          isRetrying={isRetrying}
          onRerun={onRerun}
          size="desktop"
        />
      </div>
    </div>
  );
}
