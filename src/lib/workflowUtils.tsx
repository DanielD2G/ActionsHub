import { h } from 'preact';

export interface StatusIconOptions {
  size?: 'sm' | 'md';
  variant?: 'rounded' | 'circular';
}

export interface StatusBadgeOptions {
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function getStatusIcon(
  status: string,
  conclusion: string | null,
  options: StatusIconOptions = {}
) {
  const { size = 'md', variant = 'rounded' } = options;

  // Container size classes
  const containerSize = variant === 'circular'
    ? (size === 'sm' ? 'w-5 h-5' : 'w-6 h-6')
    : 'w-8 h-8';

  // Icon size classes
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  // Shape classes
  const shapeClass = variant === 'circular' ? 'rounded-full' : 'rounded-lg';

  // Status-specific rendering
  if (status === 'completed') {
    if (conclusion === 'success') {
      const bgClass = variant === 'circular' ? 'bg-success-bg-solid' : 'bg-success-bg-muted';
      const iconColor = variant === 'circular' ? 'text-text-inverted' : 'text-success-icon';
      const strokeWidth = variant === 'circular' ? '3' : '2';
      return (
        <div class={`${containerSize} ${bgClass} ${shapeClass} flex items-center justify-center flex-shrink-0`}>
          <svg class={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={strokeWidth} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (conclusion === 'failure') {
      const bgClass = variant === 'circular' ? 'bg-error-bg-solid' : 'bg-error-bg-muted';
      const iconColor = variant === 'circular' ? 'text-text-inverted' : 'text-error-icon';
      const strokeWidth = variant === 'circular' ? '3' : '2';
      return (
        <div class={`${containerSize} ${bgClass} ${shapeClass} flex items-center justify-center flex-shrink-0`}>
          <svg class={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={strokeWidth} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    } else if (conclusion === 'cancelled') {
      const bgClass = variant === 'circular' ? 'bg-neutral-bg-solid' : 'bg-neutral-bg';
      const iconColor = variant === 'circular' ? 'text-text-inverted' : 'text-neutral-icon';
      return (
        <div class={`${containerSize} ${bgClass} ${shapeClass} flex items-center justify-center flex-shrink-0`}>
          <svg class={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
      );
    } else if (conclusion === 'skipped') {
      const bgClass = variant === 'circular' ? 'bg-neutral-bg-solid' : 'bg-neutral-bg';
      const iconColor = variant === 'circular' ? 'text-text-inverted' : 'text-neutral-icon';
      return (
        <div class={`${containerSize} ${bgClass} ${shapeClass} flex items-center justify-center flex-shrink-0`}>
          <svg class={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      );
    }
  } else if (status === 'in_progress') {
    const bgClass = variant === 'circular' ? 'bg-warning-bg-solid' : 'bg-warning-bg-muted';
    const spinnerSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

    if (variant === 'circular') {
      return (
        <div class={`${containerSize} ${bgClass} ${shapeClass} flex items-center justify-center flex-shrink-0`}>
          <div class={`${spinnerSize} border-2 border-text-inverted border-t-transparent rounded-full animate-spin`}></div>
        </div>
      );
    } else {
      return (
        <div class={`${containerSize} ${bgClass} ${shapeClass} flex items-center justify-center flex-shrink-0`}>
          <svg class={`${iconSize} text-warning-icon animate-spin`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      );
    }
  } else if (status === 'queued' || status === 'pending') {
    const bgClass = variant === 'circular' ? 'bg-neutral-bg-solid' : 'bg-warning-bg-muted';
    const iconColor = variant === 'circular' ? 'text-neutral-icon' : 'text-warning-icon';

    if (variant === 'circular') {
      return (
        <div class={`${containerSize} ${bgClass} ${shapeClass} flex items-center justify-center flex-shrink-0`}>
          <svg class={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div class={`${containerSize} ${bgClass} ${shapeClass} flex items-center justify-center flex-shrink-0`}>
          <svg class={`${iconSize} ${iconColor} animate-spin`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      );
    }
  }

  // Default/unknown status
  const bgClass = variant === 'circular' ? 'bg-neutral-bg-solid' : 'bg-neutral-bg';
  const iconColor = 'text-neutral-icon';
  return (
    <div class={`${containerSize} ${bgClass} ${shapeClass} flex items-center justify-center flex-shrink-0`}>
      <svg class={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

export function getStatusBadge(
  status: string,
  conclusion: string | null,
  options: StatusBadgeOptions = {}
) {
  const { size = 'sm', showIcon = false } = options;

  // Size classes
  const sizeClasses = size === 'sm'
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-1.5 text-sm';

  // Base classes
  const baseClasses = `${sizeClasses} font-medium rounded-full`;

  if (status === 'completed') {
    if (conclusion === 'success') {
      const content = showIcon ? (
        <>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Success
        </>
      ) : 'Success';
      return <span class={`${baseClasses} text-success-text-emphasis bg-success-bg-muted ${showIcon ? 'flex items-center gap-2' : ''}`}>{content}</span>;
    } else if (conclusion === 'failure') {
      const content = showIcon ? (
        <>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Failed
        </>
      ) : 'Failed';
      return <span class={`${baseClasses} text-error-text-emphasis bg-error-bg-muted ${showIcon ? 'flex items-center gap-2' : ''}`}>{content}</span>;
    } else if (conclusion === 'cancelled') {
      return <span class={`${baseClasses} text-neutral-text-emphasis bg-neutral-bg`}>Cancelled</span>;
    }
  } else if (status === 'in_progress') {
    const content = showIcon ? (
      <>
        <div class="w-3 h-3 border-2 border-warning-text-emphasis border-t-transparent rounded-full animate-spin"></div>
        In progress
      </>
    ) : 'Running';
    return <span class={`${baseClasses} text-warning-text-emphasis bg-warning-bg-muted ${showIcon ? 'flex items-center gap-2' : ''}`}>{content}</span>;
  } else if (status === 'queued') {
    return <span class={`${baseClasses} text-info-text-emphasis bg-info-bg-muted`}>Queued</span>;
  }

  return <span class={`${baseClasses} text-neutral-text-emphasis bg-neutral-bg`}>{status}</span>;
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
