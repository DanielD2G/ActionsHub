import { h } from 'preact';
import DropdownButton from './DropdownButton';
import type { WorkflowRun } from '../types/workflow';

interface RetryButtonProps {
  workflow: WorkflowRun;
  isRetrying: boolean;
  onRerun: (workflow: WorkflowRun, type: 'all' | 'failed') => void;
  size?: 'mobile' | 'desktop';
}

export default function RetryButton({ workflow, isRetrying, onRerun, size = 'desktop' }: RetryButtonProps) {
  const canRetry = workflow.status === 'completed';

  if (!canRetry) return null;

  const isMobile = size === 'mobile';

  // For failed or cancelled workflows, show dropdown with options
  if (workflow.conclusion === 'failure' || workflow.conclusion === 'cancelled') {
    return (
      <div class="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <DropdownButton
          label="Retry"
          loading={isRetrying}
          icon={
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          onMainClick={() => onRerun(workflow, 'failed')}
          options={[
            {
              label: 'Re-run failed jobs',
              icon: (
                <svg class="w-4 h-4 text-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ),
              onClick: () => onRerun(workflow, 'failed'),
            },
            {
              label: 'Re-run all jobs',
              icon: (
                <svg class="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ),
              onClick: () => onRerun(workflow, 'all'),
            },
          ]}
        />
      </div>
    );
  }

  // For successful workflows, show simple retry button
  return (
    <div class="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onRerun(workflow, 'all')}
        disabled={isRetrying}
        class={`inline-flex items-center justify-center gap-2 px-${isMobile ? '3' : '4'} h-10 ${isMobile ? 'min-w-[90px]' : 'min-w-[120px]'} text-sm font-medium bg-surface-primary text-text-secondary border border-default hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap`}
      >
        {isRetrying ? (
          <>
            <div class="w-4 h-4 border-2 border-spinner-track border-t-transparent rounded-full animate-spin"></div>
            {isMobile ? (
              <span class="hidden xs:inline">Retrying...</span>
            ) : (
              <span>Retrying...</span>
            )}
          </>
        ) : (
          <>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </>
        )}
      </button>
    </div>
  );
}
