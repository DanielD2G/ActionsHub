/**
 * Centralized Configuration Constants
 *
 * This file contains all magic numbers, configuration values, and constants
 * used throughout the Actions Hub application.
 *
 * Organized by category for easy maintenance and updates.
 */

// ============================================================================
// SELF HOST
// ============================================================================
export const SELF_HOST = {
    SHOW_BADGE: true,
    LIVE_URL: "https://actions-hub.dev/"
};

// ============================================================================
// AUTHENTICATION & SESSION
// ============================================================================

/**
 * Authentication and session management constants
 *
 * IMPORTANT: The SESSION_SECRET should be set via the SESSION_SECRET
 * environment variable. The DEVELOPMENT_SECRET is only used as a fallback
 * in development and will trigger a warning.
 */
export const AUTH = {
  /** Name of the session cookie */
  COOKIE_NAME: 'gh_session',

  /** Session duration in seconds (7 days) */
  SESSION_MAX_AGE: 60 * 60 * 24 * 7,

  /** Number of random bytes for OAuth state generation */
  OAUTH_STATE_BYTES: 32,

  /**
   * Fallback secret for development only
   * SECURITY: Never use this in production! Set SESSION_SECRET env var instead.
   * Generate with: openssl rand -base64 32
   */
  DEVELOPMENT_SECRET: 'development_secret',
} as const;

// ============================================================================
// TIME & DELAYS
// ============================================================================

/**
 * Time-related constants (in milliseconds unless noted)
 */
export const TIME = {
  /** Polling interval for active workflows status updates (5 seconds) */
  WORKFLOW_POLL_INTERVAL: 5000,

  /** Unified sync polling interval with ETag support (10 seconds) */
  SYNC_POLL_INTERVAL: 15000,

  /** Delay before refreshing after workflow rerun (2 seconds) */
  RERUN_REFRESH_DELAY: 2000,

  /** Delay between workflow batches (3 seconds) */
  BATCH_DELAY: 3000,

  /** Milliseconds in one second (conversion factor) */
  MS_PER_SECOND: 1000,

  /** Seconds in one minute (conversion factor) */
  SECONDS_PER_MINUTE: 60,

  /** Seconds in one hour (conversion factor) */
  SECONDS_PER_HOUR: 3600,
} as const;

// ============================================================================
// PAGINATION & DATA LIMITS
// ============================================================================

/**
 * Pagination and data fetching limits
 */
export const PAGINATION = {
  /** Default items per page for workflow lists */
  ITEMS_PER_PAGE: 10,

  /** Range around current page for pagination display */
  PAGE_RANGE: 1,

  /** Offset for ellipsis display in pagination */
  ELLIPSIS_OFFSET: 2,

  /** Threshold for showing ellipsis before current page */
  ELLIPSIS_THRESHOLD: 3,
} as const;

/**
 * GitHub API limits and data fetching constants
 */
export const API_LIMITS = {
  /** Number of repositories to fetch per request */
  REPOS_PER_PAGE: 30,

  /** Number of top repositories to process */
  TOP_REPOS_LIMIT: 20,

  /** Workflows per repository */
  WORKFLOWS_PER_REPO: 25,

  /** Maximum repositories per page (GitHub API limit) */
  MAX_REPOS_PER_PAGE: 100,

  /** Maximum workflows per page (GitHub API limit) */
  MAX_WORKFLOWS_PER_PAGE: 100,

  /** Default workflow runs per page */
  DEFAULT_WORKFLOW_RUNS: 30,
} as const;

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Statistics and analytics configuration
 */
export const STATS = {
  /** Number of days to look back for statistics (one week) */
  STATS_DAYS: 7,

  /** Total days to cover for workflow batch data */
  BATCH_TOTAL_DAYS: 31,

  /** Number of batches to split workflow data into */
  NUMBER_OF_BATCHES: 8,

  /** Success rate threshold for green color (percentage) */
  SUCCESS_THRESHOLD_HIGH: 80,

  /** Success rate threshold for yellow color (percentage) */
  SUCCESS_THRESHOLD_MEDIUM: 50,

  /** Multiplier for percentage calculations */
  PERCENTAGE_MULTIPLIER: 100,

  /** Multiplier for rounding to 1 decimal place */
  DECIMAL_PRECISION_MULTIPLIER: 10,

  /** Number of top workflows to display in charts */
  TOP_WORKFLOWS_LIMIT: 10,

  /** Initial number of workflows to show when collapsed */
  INITIAL_WORKFLOWS_SHOWN: 2,
} as const;

// ============================================================================
// BILLING & FREEMIUM
// ============================================================================

/**
 * Billing and freemium tier configuration
 */
export const BILLING = {
  /** Days of workflow history for free tier users */
  FREE_DAYS_LIMIT: 7,

  /** Days of workflow history for paid tier users */
  PAID_DAYS_LIMIT: 31,

  /** Number of batches for free tier (proportional to days) */
  FREE_NUMBER_OF_BATCHES: 2,

  /** Number of batches for paid tier */
  PAID_NUMBER_OF_BATCHES: 8,

  /** Price for paid plan (monthly, in USD) */
  PAID_PLAN_PRICE: 4.99,
} as const;

// ============================================================================
// UI DIMENSIONS & SIZES
// ============================================================================

/**
 * Icon sizes (in Tailwind units)
 */
export const ICON_SIZES = {
  /** Extra small icon (4x4) */
  XS: 4,

  /** Small icon (5x5) */
  SM: 5,

  /** Medium icon (6x6) */
  MD: 6,

  /** Large icon (8x8) */
  LG: 8,

  /** Extra large icon (10x10) */
  XL: 10,

  /** 2XL icon (12x12) */
  XXL: 12,

  /** 3XL icon (20x20) */
  XXXL: 20,

  /** 4XL icon (24x24) */
  XXXXL: 24,
} as const;

/**
 * SVG stroke widths and styling
 */
export const SVG = {
  /** Standard stroke width */
  STROKE_WIDTH: 2,

  /** Thick stroke width */
  STROKE_WIDTH_THICK: 3,
} as const;

/**
 * Component dimensions
 */
export const DIMENSIONS = {
  /** Background opacity percentage */
  OVERLAY_OPACITY: 50,

  /** Disabled state opacity */
  DISABLED_OPACITY: 50,

  /** Dropdown menu width */
  DROPDOWN_WIDTH: 56,

  /** Large dropdown width */
  DROPDOWN_WIDTH_LARGE: 72,

  /** Dropdown menu max height */
  DROPDOWN_MAX_HEIGHT: 60,

  /** Filter dropdown minimum width */
  FILTER_MIN_WIDTH: 200,

  /** Line number column width */
  LINE_NUMBER_WIDTH: 12,

  /** Timestamp column width */
  TIMESTAMP_WIDTH: 20,

  /** Progress bar height */
  PROGRESS_BAR_HEIGHT: 3,
} as const;

/**
 * Grid layout columns
 */
export const GRID = {
  /** Columns for large screens in stats/details */
  LG_COLUMNS: 4,

  /** Columns for workflow chart */
  CHART_COLUMNS: 2,
} as const;

// ============================================================================
// CACHE & STORAGE
// ============================================================================

/**
 * LocalStorage and caching configuration
 */
export const CACHE = {
  /** LocalStorage cache key prefix for workflows (user-scoped) */
  WORKFLOWS_KEY_PREFIX: 'workflows_cache',

  /** Cache version identifier */
  VERSION: '2.0',
} as const;

/**
 * Get user-scoped cache key for workflows
 * @param username - GitHub username for cache isolation
 * @returns User-specific cache key
 */
export function getWorkflowsCacheKey(username: string): string {
  return `${CACHE.WORKFLOWS_KEY_PREFIX}_${username}`;
}

// ============================================================================
// USER AUTHENTICATION CACHE
// ============================================================================

/**
 * User info structure returned by /api/auth/me
 */
export interface UserInfo {
  authenticated: boolean;
  username?: string;
  githubUserId?: string;
  avatarUrl?: string;
  email?: string;
  profileUrl?: string;
  name?: string;
  billingConfig?: {
    maxDays: number;
    maxBatches: number;
    canViewOrgWorkflows: boolean;
    billingEnabled: boolean;
    userTier: 'free' | 'paid';
  };
}

const USER_CACHE_KEY = 'gh_user_info';

/**
 * Get cached user info from sessionStorage
 * @returns Cached user info or null if not found or expired
 */
export function getUserFromCache(): UserInfo | null {
  try {
    const cached = sessionStorage.getItem(USER_CACHE_KEY);
    if (!cached) return null;

    const userInfo: UserInfo = JSON.parse(cached);
    return userInfo;
  } catch (error) {
    console.error('Error loading user from cache:', error);
    return null;
  }
}

/**
 * Save user info to sessionStorage
 * @param userInfo - User information to cache
 */
export function saveUserToCache(userInfo: UserInfo): void {
  try {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(userInfo));
  } catch (error) {
    console.error('Error saving user to cache:', error);
  }
}

/**
 * Clear cached user info from sessionStorage
 */
export function clearUserCache(): void {
  try {
    sessionStorage.removeItem(USER_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
}

/**
 * Fetch and cache user info from /api/auth/me
 * @returns Promise with user info
 */
export async function fetchAndCacheUser(): Promise<UserInfo> {
  // Check cache first
  const cached = getUserFromCache();
  if (cached && cached.authenticated) {
    return cached;
  }

  // Fetch from API
  try {
    const response = await fetch('/api/auth/me');
    const userInfo: UserInfo = await response.json();

    if (userInfo.authenticated) {
      saveUserToCache(userInfo);
    }

    return userInfo;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return { authenticated: false };
  }
}

// ============================================================================
// DISPLAY & FORMATTING
// ============================================================================

/**
 * Display and formatting constants
 */
export const DISPLAY = {
  /** Number of characters to show from commit SHA */
  COMMIT_SHA_LENGTH: 7,

  /** Indentation spaces for log detection */
  INDENTATION_SPACES: 2,

  /** String padding character for date formatting */
  DATE_PADDING_CHAR: '0',

  /** Padding length for month/day in dates */
  DATE_PADDING_LENGTH: 2,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type-safe access to all constants
 */
export type AuthConstants = typeof AUTH;
export type TimeConstants = typeof TIME;
export type PaginationConstants = typeof PAGINATION;
export type ApiLimitsConstants = typeof API_LIMITS;
export type StatsConstants = typeof STATS;
export type BillingConstants = typeof BILLING;
export type IconSizesConstants = typeof ICON_SIZES;
export type SvgConstants = typeof SVG;
export type DimensionsConstants = typeof DIMENSIONS;
export type GridConstants = typeof GRID;
export type CacheConstants = typeof CACHE;
export type DisplayConstants = typeof DISPLAY;

/**
 * All constants combined
 */
export const CONSTANTS = {
  AUTH,
  TIME,
  PAGINATION,
  API_LIMITS,
  STATS,
  BILLING,
  ICON_SIZES,
  SVG,
  DIMENSIONS,
  GRID,
  CACHE,
  DISPLAY,
  SELF_HOST
} as const;

export default CONSTANTS;
