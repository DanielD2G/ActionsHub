export interface TestResult {
  framework: 'pytest' | 'jest' | 'junit' | 'vitest' | 'go' | 'unknown';
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration?: string;
  failures: TestFailure[];
}

export interface TestFailure {
  testName: string;
  testFile?: string;
  errorMessage: string;
  stackTrace?: string;
  line?: number;
}

export interface TestParser {
  detect(logs: string): boolean;
  parse(logs: string): TestResult | null;
}
