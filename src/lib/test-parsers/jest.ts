import type { TestParser, TestResult, TestFailure } from './types';

export const jestParser: TestParser = {
  detect(logs: string): boolean {
    return (
      logs.includes('PASS') && logs.includes('FAIL') ||
      logs.includes('Tests:') && logs.includes('passed') ||
      logs.includes('Test Suites:') ||
      /\s+●\s+/.test(logs) // Jest failure marker
    );
  },

  parse(logs: string): TestResult | null {
    const lines = logs.split('\n');

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let duration: string | undefined;
    const failures: TestFailure[] = [];

    // Parse Jest summary: "Tests:       1 failed, 7 passed, 8 total"
    const testSummaryPattern = /Tests:\s+(?:(\d+)\s+failed[,\s]+)?(?:(\d+)\s+skipped[,\s]+)?(?:(\d+)\s+passed[,\s]+)?(\d+)\s+total/;

    // Parse time: "Time:        0.532 s"
    const timePattern = /Time:\s+([\d.]+\s*[a-z]+)/i;

    let currentFailure: Partial<TestFailure> | null = null;
    let collectingError = false;
    let errorLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Parse summary
      const summaryMatch = line.match(testSummaryPattern);
      if (summaryMatch) {
        failed = summaryMatch[1] ? parseInt(summaryMatch[1]) : 0;
        skipped = summaryMatch[2] ? parseInt(summaryMatch[2]) : 0;
        passed = summaryMatch[3] ? parseInt(summaryMatch[3]) : 0;
      }

      // Parse duration
      const timeMatch = line.match(timePattern);
      if (timeMatch) {
        duration = timeMatch[1];
      }

      // Detect test failure marker: "● TestSuite › test name"
      const failureMarkerPattern = /\s*●\s+(.+?)\s+›\s+(.+)/;
      const failureMatch = line.match(failureMarkerPattern);
      if (failureMatch) {
        // Save previous failure
        if (currentFailure && currentFailure.testName) {
          failures.push({
            testName: currentFailure.testName,
            testFile: currentFailure.testFile,
            errorMessage: currentFailure.errorMessage || 'Test failed',
            stackTrace: errorLines.join('\n'),
            line: currentFailure.line,
          });
        }

        currentFailure = {
          testName: `${failureMatch[1]} › ${failureMatch[2]}`,
        };
        errorLines = [];
        collectingError = true;
        continue;
      }

      // Collect error message (typically after the marker)
      if (collectingError && line.trim() && !line.includes('●')) {
        // Stop collecting at stack trace or next test
        if (line.trim().startsWith('at ') || line.includes('●')) {
          collectingError = false;
        } else {
          errorLines.push(line.trim());
          if (!currentFailure?.errorMessage && line.trim()) {
            if (currentFailure) {
              currentFailure.errorMessage = line.trim();
            }
          }
        }
      }

      // Parse file location from stack trace: "at Object.<anonymous> (tests/example.test.js:10:15)"
      const stackPattern = /at\s+.*?\((.+?\.test\.[jt]sx?):(\d+):\d+\)/;
      const stackMatch = line.match(stackPattern);
      if (stackMatch && currentFailure) {
        currentFailure.testFile = stackMatch[1];
        currentFailure.line = parseInt(stackMatch[2]);
      }
    }

    // Save last failure
    if (currentFailure && currentFailure.testName) {
      failures.push({
        testName: currentFailure.testName,
        testFile: currentFailure.testFile,
        errorMessage: currentFailure.errorMessage || 'Test failed',
        stackTrace: errorLines.join('\n'),
        line: currentFailure.line,
      });
    }

    const total = passed + failed + skipped;

    if (total === 0 && failures.length === 0) {
      return null;
    }

    return {
      framework: 'jest',
      passed,
      failed,
      skipped,
      total,
      duration,
      failures,
    };
  },
};
