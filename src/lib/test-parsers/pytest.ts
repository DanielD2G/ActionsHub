import type { TestParser, TestResult, TestFailure } from './types';

export const pytestParser: TestParser = {
  detect(logs: string): boolean {
    return (
      logs.includes('pytest') ||
      logs.includes('=== FAILURES ===') ||
      logs.includes('=== short test summary info ===') ||
      /\d+ failed.*\d+ passed/.test(logs) ||
      /\.py::\w+::\w+/.test(logs)
    );
  },

  parse(logs: string): TestResult | null {
    const lines = logs.split('\n');

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let duration: string | undefined;
    const failures: TestFailure[] = [];

    // Parse summary line: "=== 1 failed, 7 passed in 0.03s ==="
    // More flexible pattern that handles any order
    for (const line of lines) {
      if (line.includes('===') && (line.includes('failed') || line.includes('passed') || line.includes('skipped'))) {
        // Extract failed count
        const failedMatch = line.match(/(\d+)\s+failed/);
        if (failedMatch) failed = parseInt(failedMatch[1]);

        // Extract passed count
        const passedMatch = line.match(/(\d+)\s+passed/);
        if (passedMatch) passed = parseInt(passedMatch[1]);

        // Extract skipped count
        const skippedMatch = line.match(/(\d+)\s+skipped/);
        if (skippedMatch) skipped = parseInt(skippedMatch[1]);

        // Extract duration
        const durationMatch = line.match(/in\s+([\d.]+\s*[a-z]+)/i);
        if (durationMatch) duration = durationMatch[1];
      }
    }

    // Parse failed tests: "FAILED Tests/test_math.py::TestMathOperations::test_add_other - assert 10 == 5"
    const failedTestPattern = /FAILED\s+([\w\/.]+\.py)::([\w:]+)\s*-?\s*(.*)/;

    let currentFailure: Partial<TestFailure> | null = null;
    let inFailureSection = false;
    let errorLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect failure section
      if (line.includes('=== FAILURES ===')) {
        inFailureSection = true;
        continue;
      }

      if (line.includes('=== short test summary info ===')) {
        inFailureSection = false;
        // Save current failure if exists
        if (currentFailure && currentFailure.testName) {
          failures.push({
            testName: currentFailure.testName,
            testFile: currentFailure.testFile,
            errorMessage: currentFailure.errorMessage || 'Test failed',
            stackTrace: errorLines.join('\n'),
            line: currentFailure.line,
          });
        }
        currentFailure = null;
        errorLines = [];
        continue;
      }

      // Parse FAILED line with test info
      const failedMatch = line.match(failedTestPattern);
      if (failedMatch) {
        // Save previous failure if exists
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
          testFile: failedMatch[1],
          testName: failedMatch[2],
          errorMessage: failedMatch[3] || 'Test failed',
        };
        errorLines = [];
        continue;
      }

      // Parse test file location with line number: "Tests/test_math.py:51: in test_add_other"
      const locationPattern = /([\w\/.]+\.py):(\d+):\s*in\s+(\w+)/;
      const locationMatch = line.match(locationPattern);
      if (locationMatch && currentFailure) {
        currentFailure.testFile = locationMatch[1];
        currentFailure.line = parseInt(locationMatch[2]);
        currentFailure.testName = locationMatch[3];
        continue;
      }

      // Collect assertion errors (lines starting with 'E   ')
      if (line.trim().startsWith('E   ') && inFailureSection) {
        errorLines.push(line.trim().substring(4));
        continue;
      }

      // Collect assertion line (assert statement)
      if (line.trim().startsWith('assert ') && inFailureSection) {
        if (currentFailure) {
          currentFailure.errorMessage = line.trim();
        }
        errorLines.push(line.trim());
      }
    }

    // Save last failure if exists
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
      framework: 'pytest',
      passed,
      failed,
      skipped,
      total,
      duration,
      failures,
    };
  },
};
