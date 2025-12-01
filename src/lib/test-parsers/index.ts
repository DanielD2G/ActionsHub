import type { TestParser, TestResult } from './types';
import { pytestParser } from './pytest';
import { jestParser } from './jest';
import { junitParser } from './junit';

export * from './types';

const parsers: TestParser[] = [pytestParser, jestParser, junitParser];

export function parseTestResults(logs: string): TestResult | null {
  for (const parser of parsers) {
    if (parser.detect(logs)) {
      const result = parser.parse(logs);
      if (result) {
        return result;
      }
    }
  }
  return null;
}
