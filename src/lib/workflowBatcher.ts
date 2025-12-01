// Workflow batch configuration and utilities
import { STATS, TIME, DISPLAY } from './constants';

export interface BatchConfig {
  id: string;
  daysAgo: number;
  daysBack: number;
  priority: number;
}

export interface DateRange {
  from: string; // YYYY-MM-DD format
  to: string;   // YYYY-MM-DD format
}

// Configuration constants (imported from centralized config)
export const TOTAL_DAYS = STATS.BATCH_TOTAL_DAYS;
export const NUMBER_OF_BATCHES = STATS.NUMBER_OF_BATCHES;
export const DELAY_BETWEEN_BATCHES = TIME.BATCH_DELAY;

/**
 * Generate batch configuration dynamically
 * Distributes totalDays across numberOfBatches
 *
 * @param totalDays - Total days of workflow history to fetch (defaults to STATS.BATCH_TOTAL_DAYS)
 * @param numberOfBatches - Number of batches to split the data into (defaults to STATS.NUMBER_OF_BATCHES)
 * @returns Array of batch configurations
 */
export function generateBatchConfig(
  totalDays: number = TOTAL_DAYS,
  numberOfBatches: number = NUMBER_OF_BATCHES
): BatchConfig[] {
  const batches: BatchConfig[] = [];
  const daysPerBatch = Math.ceil(totalDays / numberOfBatches);

  for (let i = 0; i < numberOfBatches; i++) {
    const daysAgo = i * daysPerBatch;
    const daysBack = Math.min(daysPerBatch, totalDays - daysAgo);

    // Skip if we've exceeded total days
    if (daysAgo >= totalDays) break;

    batches.push({
      id: `batch-${i + 1}`,
      daysAgo,
      daysBack,
      priority: i + 1,
    });
  }

  return batches;
}

// Dynamic batch configuration (default values)
export const BATCH_CONFIG: BatchConfig[] = generateBatchConfig();

/**
 * Calculate date range for a batch
 * @param daysAgo - How many days ago the range ends
 * @param daysBack - How many days the range spans
 * @returns DateRange in YYYY-MM-DD format
 */
export function calculateDateRange(daysAgo: number, daysBack: number): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day

  // End date (e.g., 7 days ago)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - daysAgo);

  // Start date (e.g., 14 days ago for a 7-day span)
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - daysBack);

  return {
    from: formatDate(startDate),
    to: formatDate(endDate)
  };
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(DISPLAY.DATE_PADDING_LENGTH, DISPLAY.DATE_PADDING_CHAR);
  const day = String(date.getDate()).padStart(DISPLAY.DATE_PADDING_LENGTH, DISPLAY.DATE_PADDING_CHAR);
  return `${year}-${month}-${day}`;
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format batch date range for display
 */
export function formatBatchRange(batch: BatchConfig): string {
  const { from, to } = calculateDateRange(batch.daysAgo, batch.daysBack);
  return `${from} to ${to}`;
}
