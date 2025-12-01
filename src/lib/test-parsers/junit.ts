import type { TestParser, TestResult, TestFailure } from './types';

export const junitParser: TestParser = {
  detect(logs: string): boolean {
    return (
      logs.includes('[INFO] BUILD SUCCESS') ||
      logs.includes('[INFO] BUILD FAILURE') ||
      logs.includes('Tests run:') ||
      logs.includes('[ERROR] Tests run:') ||
      /\[INFO\] Running .+Test/.test(logs)
    );
  },

  parse(logs: string): TestResult | null {
    const lines = logs.split('\n');

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let duration: string | undefined;
    const failures: TestFailure[] = [];

    // Parse Maven/JUnit summary: "[INFO] Tests run: 8, Failures: 1, Errors: 0, Skipped: 0"
    const summaryPattern = /Tests run:\s*(\d+)[,\s]+Failures:\s*(\d+)[,\s]+Errors:\s*(\d+)[,\s]+Skipped:\s*(\d+)/;

    // Parse time: "[INFO] Total time:  2.345 s"
    const timePattern = /Total time:\s+([\d.]+\s*[a-z]+)/i;

    let currentFailure: Partial<TestFailure> | null = null;
    let collectingError = false;
    let errorLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Parse summary
      const summaryMatch = line.match(summaryPattern);
      if (summaryMatch) {
        const total = parseInt(summaryMatch[1]);
        failed = parseInt(summaryMatch[2]) + parseInt(summaryMatch[3]); // Failures + Errors
        skipped = parseInt(summaryMatch[4]);
        passed = total - failed - skipped;
      }

      // Parse duration
      const timeMatch = line.match(timePattern);
      if (timeMatch) {
        duration = timeMatch[1];
      }

      // Detect test failure: "[ERROR] testMethod(com.example.TestClass)  Time elapsed: 0.001 s  <<< FAILURE!"
      const failurePattern = /\[ERROR\]\s+(\w+)\(([^)]+)\)/;
      const failureMatch = line.match(failurePattern);
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
          testName: failureMatch[1],
          testFile: failureMatch[2].replace(/\./g, '/') + '.java',
        };
        errorLines = [];
        collectingError = true;
        continue;
      }

      // Collect error details
      if (collectingError) {
        // Stop at next test or end marker
        if (line.includes('[ERROR]') || line.includes('[INFO]')) {
          collectingError = false;
          continue;
        }

        if (line.trim()) {
          errorLines.push(line.trim());

          // Capture assertion errors
          if (line.includes('AssertionError') || line.includes('Expected') || line.includes('but was')) {
            if (currentFailure && !currentFailure.errorMessage) {
              currentFailure.errorMessage = line.trim();
            }
          }

          // Parse stack trace line: "at com.example.TestClass.testMethod(TestClass.java:42)"
          const stackPattern = /at\s+[\w.]+\(([\w.]+\.java):(\d+)\)/;
          const stackMatch = line.match(stackPattern);
          if (stackMatch && currentFailure) {
            currentFailure.testFile = stackMatch[1];
            currentFailure.line = parseInt(stackMatch[2]);
          }
        }
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
      framework: 'junit',
      passed,
      failed,
      skipped,
      total,
      duration,
      failures,
    };
  },
};
