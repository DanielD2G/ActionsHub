import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { TestResult } from '../lib/test-parsers';

interface TestSummaryCardProps {
  testResult: TestResult;
  defaultCollapsed?: boolean;
}

export default function TestSummaryCard({ testResult, defaultCollapsed = false }: TestSummaryCardProps) {
  const [showFailures, setShowFailures] = useState(false);
  const [showStats, setShowStats] = useState(!defaultCollapsed);

  const getFrameworkIcon = (framework: string) => {
    switch (framework) {
      case 'pytest':
        return '🐍';
      case 'jest':
        return '🃏';
      case 'junit':
        return '☕';
      case 'vitest':
        return '⚡';
      case 'go':
        return '🐹';
      default:
        return '🧪';
    }
  };

  const getFrameworkName = (framework: string) => {
    switch (framework) {
      case 'pytest':
        return 'PyTest';
      case 'jest':
        return 'Jest';
      case 'junit':
        return 'JUnit';
      case 'vitest':
        return 'Vitest';
      case 'go':
        return 'Go Test';
      default:
        return 'Tests';
    }
  };

  const passRate = testResult.total > 0
    ? Math.round((testResult.passed / testResult.total) * 100)
    : 0;

  return (
    <div class="bg-surface-primary rounded-xl shadow-sm border border-default overflow-hidden mb-6">
      {/* Header */}
      <div
        class="bg-info-bg px-6 py-4 border-b border-default cursor-pointer hover:bg-info-bg-muted transition-colors"
        onClick={() => setShowStats(!showStats)}
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg
              class={`w-5 h-5 text-text-muted transition-transform ${showStats ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span class="text-3xl">{getFrameworkIcon(testResult.framework)}</span>
            <div>
              <h3 class="text-lg font-semibold text-text-primary">
                {getFrameworkName(testResult.framework)} Results
              </h3>
              {testResult.duration && (
                <p class="text-sm text-text-muted">Duration: {testResult.duration}</p>
              )}
            </div>
          </div>

          {/* Overall status badge */}
          {testResult.failed === 0 ? (
            <div class="flex items-center gap-2 px-4 py-2 bg-success-bg text-success-text rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="font-semibold">All Tests Passed</span>
            </div>
          ) : (
            <div class="flex items-center gap-2 px-4 py-2 bg-error-bg text-error-text rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span class="font-semibold">Tests Failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {showStats && (
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-surface-secondary">
        {/* Total Tests */}
        <div class="bg-surface-primary rounded-lg p-4 border border-default">
          <div class="text-sm text-text-muted mb-1">Total</div>
          <div class="text-2xl font-bold text-text-primary">{testResult.total}</div>
        </div>

        {/* Passed */}
        <div class="bg-surface-primary rounded-lg p-4 border border-success-border">
          <div class="text-sm text-text-muted mb-1">Passed</div>
          <div class="text-2xl font-bold text-success-text">{testResult.passed}</div>
        </div>

        {/* Failed */}
        <div class="bg-surface-primary rounded-lg p-4 border border-error-border">
          <div class="text-sm text-text-muted mb-1">Failed</div>
          <div class="text-2xl font-bold text-error-text">{testResult.failed}</div>
        </div>

        {/* Skipped */}
        <div class="bg-surface-primary rounded-lg p-4 border border-warning-border">
          <div class="text-sm text-text-muted mb-1">Skipped</div>
          <div class="text-2xl font-bold text-warning-text">{testResult.skipped}</div>
        </div>
      </div>
      )}

      {/* Pass Rate Bar */}
      {showStats && (
      <div class="px-6 py-4 bg-surface-primary border-t border-default">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-text-secondary">Pass Rate</span>
          <span class="text-sm font-bold text-text-primary">{passRate}%</span>
        </div>
        <div class="w-full bg-surface-tertiary rounded-full h-3 overflow-hidden">
          <div
            class={`h-full rounded-full transition-all ${
              passRate === 100 ? 'bg-success-icon' : passRate >= 80 ? 'bg-warning-icon' : 'bg-error-icon'
            }`}
            style={{ width: `${passRate}%` }}
          ></div>
        </div>
      </div>
      )}

      {/* Failures Section */}
      {testResult.failures.length > 0 && (
        <div class="border-t border-default">
          <button
            onClick={() => setShowFailures(!showFailures)}
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-semibold text-text-primary">
                Failed Tests ({testResult.failures.length})
              </span>
            </div>
            <svg
              class={`w-5 h-5 text-text-faint transition-transform ${showFailures ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFailures && (
            <div class="px-6 pb-6 space-y-4 max-h-96 overflow-y-auto">
              {testResult.failures.map((failure, index) => (
                <div key={index} class="bg-error-bg border border-error-border rounded-lg p-4">
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-6 h-6 bg-error-icon text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-error-text mb-1 break-words">
                        {failure.testName}
                      </h4>
                      {failure.testFile && (
                        <div class="text-xs text-text-muted mb-2 font-mono">
                          {failure.testFile}
                          {failure.line && `:${failure.line}`}
                        </div>
                      )}
                      <div class="text-sm text-error-text bg-surface-primary rounded p-2 border border-error-border font-mono text-xs break-words">
                        {failure.errorMessage}
                      </div>
                      {failure.stackTrace && (
                        <details class="mt-2">
                          <summary class="text-xs text-text-muted cursor-pointer hover:text-text-primary">
                            Show stack trace
                          </summary>
                          <pre class="mt-2 text-xs bg-surface-primary border border-error-border rounded p-2 overflow-x-auto">
                            {failure.stackTrace}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
