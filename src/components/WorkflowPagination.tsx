import { h } from 'preact';
import { PAGINATION } from '../lib/constants';

interface WorkflowPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalCount: number;
  goToPage: (page: number) => void;
}

export default function WorkflowPagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalCount,
  goToPage,
}: WorkflowPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div class="mt-6 flex items-center justify-between border-t border-default pt-4">
      <div class="text-sm text-text-faint">
        Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} workflow runs
      </div>

      <div class="flex items-center gap-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          class="px-3 py-1.5 text-sm font-medium bg-surface-primary text-text-secondary border border-default hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Previous
        </button>

        <div class="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Show first page, last page, current page, and pages around current page
            const showPage =
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - PAGINATION.PAGE_RANGE && page <= currentPage + PAGINATION.PAGE_RANGE);

            const showEllipsis =
              (page === currentPage - PAGINATION.ELLIPSIS_OFFSET && currentPage > PAGINATION.ELLIPSIS_THRESHOLD) ||
              (page === currentPage + PAGINATION.ELLIPSIS_OFFSET && currentPage < totalPages - PAGINATION.ELLIPSIS_OFFSET);

            if (showEllipsis) {
              return (
                <span key={page} class="px-2 text-text-faint">
                  ...
                </span>
              );
            }

            if (!showPage) return null;

            return (
              <button
                key={page}
                onClick={() => goToPage(page)}
                class={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-button-primary-bg text-white'
                    : 'bg-surface-primary text-text-secondary border border-default hover:bg-surface-hover'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          class="px-3 py-1.5 text-sm font-medium bg-surface-primary text-text-secondary border border-default hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}
