import { h } from 'preact';
import { useMemo, useState, useEffect } from 'preact/hooks';

interface LogViewerProps {
  logs: string;
  owner?: string;
  repo?: string;
  jobId?: string;
}

interface ParsedLogLine {
  timestamp: string;
  level: 'info' | 'error' | 'warning' | 'success' | 'debug' | 'normal';
  content: string;
  rawLine: string;
  isGroupHeader: boolean;
  isGroupEnd: boolean;
  indent: number;
  lineNumber: number;
}

interface LogGroup {
  title: string;
  lines: ParsedLogLine[];
  hasErrors: boolean;
  hasWarnings: boolean;
  headerLineNumber: number;
  headerTimestamp: string;
}

interface LogItem {
  type: 'line' | 'group';
  line?: ParsedLogLine;
  group?: LogGroup;
}

function parseLogLine(line: string, index: number): ParsedLogLine {
  // Detect timestamp (format: 2025-11-13T16:43:31.4120262Z or HH:MM:SS)
  const timestampRegexISO = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s*/;
  const timestampRegexSimple = /^(\d{2}:\d{2}:\d{2})\s*/;
  const timestampMatchISO = line.match(timestampRegexISO);
  const timestampMatchSimple = line.match(timestampRegexSimple);

  let timestamp = '';
  let content = line;

  if (timestampMatchISO) {
    timestamp = timestampMatchISO[1];
    content = line.substring(timestampMatchISO[0].length);
  } else if (timestampMatchSimple) {
    timestamp = timestampMatchSimple[1];
    content = line.substring(timestampMatchSimple[0].length);
  }

  // Detect level and formatting
  let level: ParsedLogLine['level'] = 'normal';
  let isGroupHeader = false;
  let isGroupEnd = false;
  let indent = 0;

  // Group markers
  if (content.includes('##[group]')) {
    isGroupHeader = true;
    level = 'info';
    content = content.replace('##[group]', '').trim();
  } else if (content.includes('##[endgroup]')) {
    isGroupEnd = true;
    return { timestamp, level, content: '', isGroupHeader, isGroupEnd, indent, rawLine: line, lineNumber: index };
  }

  // Error detection
  if (
    content.toLowerCase().includes('error') ||
    content.toLowerCase().includes('failed') ||
    content.toLowerCase().includes('failure')
  ) {
    level = 'error';
  }
  // Warning detection
  else if (
    content.toLowerCase().includes('warning') ||
    content.toLowerCase().includes('warn')
  ) {
    level = 'warning';
  }
  // Success detection
  else if (
    content.toLowerCase().includes('success') ||
    content.toLowerCase().includes('complete') ||
    content.toLowerCase().includes('✓')
  ) {
    level = 'success';
  }
  // Debug/metadata
  else if (content.startsWith('##[') || content.includes('Metadata:') || content.includes('Contents:')) {
    level = 'debug';
  }

  // Detect indentation from content structure
  if (content.startsWith('  ')) {
    indent = 1;
    content = content.substring(2);
  }

  return { timestamp, level, content, isGroupHeader, isGroupEnd, indent, rawLine: line, lineNumber: index };
}

function formatTimestamp(timestamp: string): string {
  if (!timestamp) return '';
  // If already in HH:MM:SS format, return as is
  if (/^\d{2}:\d{2}:\d{2}$/.test(timestamp)) {
    return timestamp;
  }
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return timestamp.split('T')[1]?.split('.')[0] || '';
  }
}

// Helper to get line color based on level
function getLineColor(level: ParsedLogLine['level']) {
  switch (level) {
    case 'error':
      return 'text-log-error-indicator';
    case 'warning':
      return 'text-log-warning-indicator';
    case 'success':
      return 'text-log-success-indicator';
    case 'info':
      return 'text-brand-primary';
    case 'debug':
      return 'text-log-text-faint';
    default:
      return 'text-log-text';
  }
}

// Component to render a single log line
function LogLine({ parsed, highlight, onShare }: { parsed: ParsedLogLine; highlight?: boolean; onShare?: (lineNumber: number) => void }) {
  const [showShareButton, setShowShareButton] = useState(false);

  return (
    <div
      id={`log-line-${parsed.lineNumber}`}
      class={`flex items-start gap-3 px-4 py-1 hover:bg-log-bg-header border-l-2 relative group ${
        parsed.level === 'error'
          ? 'border-log-error-indicator/30 bg-error-bg-solid/20'
          : parsed.level === 'warning'
          ? 'border-log-warning-indicator/30'
          : parsed.level === 'success'
          ? 'border-log-success-indicator/30'
          : 'border-transparent'
      } ${highlight ? 'ring-2 ring-brand-primary bg-brand-primary/20' : ''}`}
      onMouseEnter={() => setShowShareButton(true)}
      onMouseLeave={() => setShowShareButton(false)}
    >
      {/* Line number */}
      <span class="text-log-line-number text-xs font-mono select-none flex-shrink-0 w-12 text-right">
        {parsed.lineNumber + 1}
      </span>

      {/* Timestamp */}
      {parsed.timestamp && (
        <span class="text-log-text-faint text-xs font-mono flex-shrink-0 w-20">
          {formatTimestamp(parsed.timestamp)}
        </span>
      )}

      {/* Content */}
      <div class={`flex-1 text-xs font-mono ${getLineColor(parsed.level)} break-all`}>
        <span class="whitespace-pre-wrap">{parsed.content}</span>
      </div>

      {/* Share button - appears on hover */}
      {onShare && showShareButton && (
        <button
          onClick={() => onShare(parsed.lineNumber)}
          class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs text-log-text-muted hover:text-log-text bg-log-bg-hover hover:bg-log-bg-header rounded flex items-center gap-1"
          title="Share this line"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      )}
    </div>
  );
}

// Component to render a collapsible group
function CollapsibleGroup({ group, forceExpanded, highlightedLine, onShare }: { group: LogGroup; forceExpanded?: boolean; highlightedLine?: number; onShare?: (lineNumber: number) => void }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Auto-expand if highlighted line is in this group
  const hasHighlightedLine = highlightedLine !== undefined && group.lines.some(line => line.lineNumber === highlightedLine);

  // Use effect to auto-expand when a line in this group is highlighted
  if (hasHighlightedLine && isCollapsed) {
    // Use setTimeout to avoid state update during render
    setTimeout(() => setIsCollapsed(false), 0);
  }

  const shouldShowContent = forceExpanded || !isCollapsed;

  return (
    <div class="ml-4">
      {/* Group Header */}
      <div
        class="flex items-start gap-3 px-4 py-1 hover:bg-log-bg-hover cursor-pointer border-l-2 border-transparent"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {/* Line number - use header line number */}
        <span class="text-log-line-number text-xs font-mono select-none flex-shrink-0 w-12 text-right">
          {group.headerLineNumber + 1}
        </span>

        {/* Timestamp */}
        {group.headerTimestamp && (
          <span class="text-log-text-faint text-xs font-mono flex-shrink-0 w-20">
            {formatTimestamp(group.headerTimestamp)}
          </span>
        )}

        {/* Collapsible icon and title */}
        <div class="flex-1 flex items-center gap-2">
          <svg
            class={`w-3 h-3 text-log-text-muted transition-transform flex-shrink-0 ${isCollapsed ? '' : 'rotate-90'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-xs font-mono text-log-text-muted">{group.title}</span>
          {group.hasErrors && (
            <span class="text-xs px-1.5 py-0.5 bg-log-error-bg text-log-error-text rounded">Error</span>
          )}
          {group.hasWarnings && !group.hasErrors && (
            <span class="text-xs px-1.5 py-0.5 bg-log-warning-bg text-log-warning-text rounded">Warning</span>
          )}
        </div>
      </div>

      {/* Group Content - indented */}
      {shouldShowContent && (
        <div class="ml-8">
          {group.lines.map((line, index) => (
            <LogLine key={index} parsed={line} highlight={highlightedLine === line.lineNumber} onShare={onShare} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogViewer({ logs, owner, repo, jobId }: LogViewerProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedErrors, setCopiedErrors] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | undefined>(undefined);
  const [copiedLineUrl, setCopiedLineUrl] = useState(false);



  const logItems = useMemo(() => {
    if (!logs) return [];

    const lines = logs.split('\n');
    const parsedLines = lines.map((line, index) => parseLogLine(line, index));

    const items: LogItem[] = [];
    let currentGroup: LogGroup | null = null;

    parsedLines.forEach((parsed) => {
      // Skip empty lines
      if (!parsed.content.trim() && !parsed.isGroupEnd) {
        return;
      }

      if (parsed.isGroupHeader) {
        // Start new group
        currentGroup = {
          title: parsed.content,
          lines: [],
          hasErrors: false,
          hasWarnings: false,
          headerLineNumber: parsed.lineNumber,
          headerTimestamp: parsed.timestamp,
        };
      } else if (parsed.isGroupEnd) {
        // End current group and add to items
        if (currentGroup) {
          items.push({
            type: 'group',
            group: currentGroup,
          });
          currentGroup = null;
        }
      } else if (parsed.content.trim()) {
        if (currentGroup) {
          // Add line to current group
          currentGroup.lines.push(parsed);
          if (parsed.level === 'error') {
            currentGroup.hasErrors = true;
          }
          if (parsed.level === 'warning') {
            currentGroup.hasWarnings = true;
          }
        } else {
          // Add as individual line
          items.push({
            type: 'line',
            line: parsed,
          });
        }
      }
    });

    return items;
  }, [logs]);

  const copyAllToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(logs);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyErrorsToClipboard = async () => {
    try {
      const errorParts: string[] = [];

      logItems.forEach(item => {
        if (item.type === 'group' && item.group?.hasErrors) {
          // Copy entire group if it has errors
          const header = `=== ${item.group.title} ===`;
          const errorLinesInGroup = item.group.lines.filter(line => line.level === 'error');
          const content = errorLinesInGroup.map(line => line.content).join('\n');
          errorParts.push(`${header}\n${content}`);
        } else if (item.type === 'line' && item.line?.level === 'error') {
          // Copy individual error line (without timestamp)
          errorParts.push(item.line.content);
        }
      });

      const errorText = errorParts.join('\n\n');
      await navigator.clipboard.writeText(errorText || 'No errors found');
      setCopiedErrors(true);
      setTimeout(() => setCopiedErrors(false), 2000);
    } catch (err) {
      console.error('Failed to copy errors:', err);
    }
  };

  const toggleExpandAll = () => {
    setExpandAll(!expandAll);
  };

  // Handle sharing a specific line
  const handleShareLine = async (lineNumber: number) => {
    if (!owner || !repo || !jobId) {
      // If we don't have the full URL context, just scroll to the line
      setHighlightedLine(lineNumber);
      setTimeout(() => {
        const element = document.getElementById(`log-line-${lineNumber}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    try {
      const url = new URL(window.location.href);
      url.hash = `L${lineNumber + 1}`;
      await navigator.clipboard.writeText(url.toString());
      setCopiedLineUrl(true);
      setTimeout(() => setCopiedLineUrl(false), 2000);

      // Also highlight the line
      setHighlightedLine(lineNumber);
      setTimeout(() => {
        const element = document.getElementById(`log-line-${lineNumber}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (err) {
      console.error('Failed to copy line URL:', err);
    }
  };

  // Check URL hash on mount to highlight a specific line
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#L')) {
        const lineNum = parseInt(hash.substring(2)) - 1;
        if (!isNaN(lineNum) && lineNum >= 0) {
          setHighlightedLine(lineNum);
          // Scroll to the line after a short delay to ensure DOM is ready
          setTimeout(() => {
            const element = document.getElementById(`log-line-${lineNum}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
        }
      }
    }
  }, [logItems]);

  // Find all error and warning lines
  const errorLines = useMemo(() => {
    const lines: number[] = [];
    logItems.forEach(item => {
      if (item.type === 'line' && item.line?.level === 'error') {
        lines.push(item.line.lineNumber);
      } else if (item.type === 'group' && item.group) {
        item.group.lines.forEach(line => {
          if (line.level === 'error') {
            lines.push(line.lineNumber);
          }
        });
      }
    });
    return lines.sort((a, b) => a - b);
  }, [logItems]);

  const warningLines = useMemo(() => {
    const lines: number[] = [];
    logItems.forEach(item => {
      if (item.type === 'line' && item.line?.level === 'warning') {
        lines.push(item.line.lineNumber);
      } else if (item.type === 'group' && item.group) {
        item.group.lines.forEach(line => {
          if (line.level === 'warning') {
            lines.push(line.lineNumber);
          }
        });
      }
    });
    return lines.sort((a, b) => a - b);
  }, [logItems]);

  const goToNextError = () => {
    if (errorLines.length === 0) return;

    const currentIndex = highlightedLine !== undefined
      ? errorLines.findIndex(line => line > highlightedLine)
      : 0;

    const nextLine = currentIndex === -1 ? errorLines[0] : errorLines[currentIndex];
    setHighlightedLine(nextLine);

    setTimeout(() => {
      const element = document.getElementById(`log-line-${nextLine}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedLine(undefined);
    }, 3000);
  };

  const goToNextWarning = () => {
    if (warningLines.length === 0) return;

    const currentIndex = highlightedLine !== undefined
      ? warningLines.findIndex(line => line > highlightedLine)
      : 0;

    const nextLine = currentIndex === -1 ? warningLines[0] : warningLines[currentIndex];
    setHighlightedLine(nextLine);

    setTimeout(() => {
      const element = document.getElementById(`log-line-${nextLine}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedLine(undefined);
    }, 3000);
  };

  const totalLines = useMemo(() => {
    return logItems.reduce((acc, item) => {
      if (item.type === 'line') return acc + 1;
      if (item.type === 'group' && item.group) return acc + item.group.lines.length;
      return acc;
    }, 0);
  }, [logItems]);

  const stats = useMemo(() => {
    let errors = 0;
    let warnings = 0;

    logItems.forEach(item => {
      if (item.type === 'group' && item.group) {
        if (item.group.hasErrors) errors++;
        if (item.group.hasWarnings) warnings++;
      } else if (item.type === 'line' && item.line) {
        if (item.line.level === 'error') errors++;
        if (item.line.level === 'warning') warnings++;
      }
    });

    return { errors, warnings };
  }, [logItems]);

  return (
    <div class="bg-log-bg rounded-lg overflow-hidden flex flex-col relative" style={{ height: owner && repo && jobId ? 'calc(100vh - 120px)' : 'auto', maxHeight: owner && repo && jobId ? 'calc(100vh - 120px)' : '60vh' }}>
      {/* Toast notification for copied line URL */}
      {copiedLineUrl && (
        <div class="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-log-success-bg text-log-success-text px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Line URL copied to clipboard!
        </div>
      )}

      {/* Header with action buttons - Sticky */}
      <div class="sticky top-0 z-10 border-b border-log-border bg-log-bg-header px-4 py-2 flex items-center justify-between shadow-lg flex-shrink-0">
        <span class="text-xs text-log-text-muted">{totalLines} lines</span>
        <div class="flex items-center gap-2">
          {/* Go to Next Error */}
          {errorLines.length > 0 && (
            <button
              onClick={goToNextError}
              class="px-3 py-1 text-xs text-log-error-text hover:text-log-error-text-hover bg-log-error-bg hover:bg-log-error-bg-hover rounded transition-colors flex items-center gap-1.5"
              title={`Go to next error (${errorLines.length} total)`}
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Next Error ({errorLines.length})
            </button>
          )}

          {/* Go to Next Warning */}
          {warningLines.length > 0 && (
            <button
              onClick={goToNextWarning}
              class="px-3 py-1 text-xs text-log-warning-text hover:text-log-warning-text-hover bg-log-warning-bg hover:bg-log-warning-bg-hover rounded transition-colors flex items-center gap-1.5"
              title={`Go to next warning (${warningLines.length} total)`}
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Next Warning ({warningLines.length})
            </button>
          )}

          {/* Expand/Collapse All */}
          <button
            onClick={toggleExpandAll}
            class="px-3 py-1 text-xs text-log-text hover:text-text-inverted bg-log-bg-hover hover:bg-log-bg-header rounded transition-colors flex items-center gap-1.5"
            title={expandAll ? "Collapse all groups" : "Expand all groups"}
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {expandAll ? (
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              ) : (
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              )}
            </svg>
            {expandAll ? 'Collapse' : 'Expand'}
          </button>

          {/* Copy Errors */}
          {stats.errors > 0 && (
            <button
              onClick={copyErrorsToClipboard}
              class="px-3 py-1 text-xs text-log-error-text hover:text-log-error-text-hover bg-log-error-bg-hover hover:bg-log-error-bg rounded transition-colors flex items-center gap-1.5"
              title="Copy all error sections to clipboard"
            >
              {copiedErrors ? (
                <>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Copy errors
                </>
              )}
            </button>
          )}

          {/* Copy All */}
          <button
            onClick={copyAllToClipboard}
            class="px-3 py-1 text-xs text-log-text hover:text-text-inverted bg-log-bg-hover hover:bg-log-bg-header rounded transition-colors flex items-center gap-1.5"
            title="Copy all logs to clipboard"
          >
            {copiedAll ? (
              <>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy all
              </>
            )}
          </button>
        </div>
      </div>

      {/* Log Items */}
      <div class="flex-1 overflow-y-auto">
        {logItems.map((item, index) => {
          if (item.type === 'line' && item.line) {
            return <LogLine key={index} parsed={item.line} highlight={highlightedLine === item.line.lineNumber} onShare={handleShareLine} />;
          } else if (item.type === 'group' && item.group) {
            return <CollapsibleGroup key={index} group={item.group} forceExpanded={expandAll} highlightedLine={highlightedLine} onShare={handleShareLine} />;
          }
          return null;
        })}
      </div>

      {/* Stats footer */}
      <div class="border-t border-log-border bg-log-bg-footer px-4 py-2 flex items-center justify-between text-xs text-log-text-faint flex-shrink-0">
        <span>Total: {totalLines} lines</span>
        <div class="flex items-center gap-4">
          {stats.errors > 0 && (
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 bg-log-error-indicator rounded-full"></span>
              {stats.errors} section{stats.errors > 1 ? 's' : ''} with errors
            </span>
          )}
          {stats.warnings > 0 && (
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 bg-log-warning-indicator rounded-full"></span>
              {stats.warnings} section{stats.warnings > 1 ? 's' : ''} with warnings
            </span>
          )}
          {stats.errors === 0 && stats.warnings === 0 && (
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 bg-log-success-indicator rounded-full"></span>
              No errors
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
