/**
 * LocalStorage Quota Handler
 *
 * Provides utilities for managing localStorage quota, including:
 * - Usage calculation and reporting
 * - Quota detection and warnings
 * - Graceful degradation on quota exceeded
 * - LRU cleanup strategy for timestamped entries
 * - Safe storage operations with error handling
 *
 * @see docs/modules/bm-dm/stories/dm-09-8-localstorage-quota-tests.md
 * Epic: DM-09 | Story: DM-09.8
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum localStorage size in bytes (5MB typical limit) */
export const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

/** Warning threshold as percentage (80%) */
export const QUOTA_WARNING_THRESHOLD = 0.8;

/** Critical threshold as percentage (95%) */
export const QUOTA_CRITICAL_THRESHOLD = 0.95;

/** HYVVE storage key prefix */
export const HYVVE_PREFIX = 'hyvve-';

/** Default bytes to free during cleanup (100KB) */
export const DEFAULT_CLEANUP_TARGET = 100 * 1024;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of a storage operation
 */
export interface StorageResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Warning message if approaching quota */
  warning?: string;
  /** Error message if operation failed */
  error?: string;
  /** Current bytes used after operation */
  bytesUsed?: number;
  /** Bytes remaining until quota */
  bytesRemaining?: number;
}

/**
 * Storage usage information
 */
export interface StorageUsage {
  /** Total bytes used */
  bytesUsed: number;
  /** Bytes remaining until quota */
  bytesRemaining: number;
  /** Usage percentage (0-1) */
  percentUsed: number;
  /** Total items in storage */
  itemCount: number;
}

/**
 * Entry with timestamp for LRU cleanup
 */
interface TimestampedEntry {
  key: string;
  size: number;
  timestamp: number;
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Check if localStorage is available and accessible.
 *
 * Handles cases like:
 * - Private browsing mode
 * - Security policies blocking storage
 * - SSR/Node.js environment
 *
 * @returns true if localStorage is available and writable
 *
 * @example
 * ```typescript
 * if (isStorageAvailable()) {
 *   localStorage.setItem('key', 'value');
 * } else {
 *   // Fall back to in-memory storage
 * }
 * ```
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate the current localStorage usage in bytes.
 *
 * JavaScript strings in localStorage are stored as UTF-16,
 * so each character consumes 2 bytes.
 *
 * @returns StorageUsage object with usage details
 *
 * @example
 * ```typescript
 * const usage = getStorageUsage();
 * console.log(`Using ${usage.percentUsed * 100}% of storage`);
 * ```
 */
export function getStorageUsage(): StorageUsage {
  if (!isStorageAvailable()) {
    return {
      bytesUsed: 0,
      bytesRemaining: MAX_STORAGE_SIZE,
      percentUsed: 0,
      itemCount: 0,
    };
  }

  let bytesUsed = 0;
  const itemCount = window.localStorage.length;

  for (let i = 0; i < itemCount; i++) {
    const key = window.localStorage.key(i);
    if (key) {
      const value = window.localStorage.getItem(key);
      if (value !== null) {
        // UTF-16 encoding: 2 bytes per character
        bytesUsed += (key.length + value.length) * 2;
      }
    }
  }

  const bytesRemaining = Math.max(0, MAX_STORAGE_SIZE - bytesUsed);
  const percentUsed = bytesUsed / MAX_STORAGE_SIZE;

  return {
    bytesUsed,
    bytesRemaining,
    percentUsed,
    itemCount,
  };
}

/**
 * Check if storage usage is near the quota threshold.
 *
 * @param threshold - Usage threshold to check against (default: 0.8 = 80%)
 * @returns true if usage is at or above threshold
 *
 * @example
 * ```typescript
 * if (isNearQuota()) {
 *   toast.warning('Storage space is running low');
 * }
 * ```
 */
export function isNearQuota(threshold: number = QUOTA_WARNING_THRESHOLD): boolean {
  const usage = getStorageUsage();
  return usage.percentUsed >= threshold;
}

/**
 * Check if storage usage is at critical level.
 *
 * @returns true if usage is at or above critical threshold (95%)
 */
export function isCriticalQuota(): boolean {
  return isNearQuota(QUOTA_CRITICAL_THRESHOLD);
}

/**
 * Safely set an item in localStorage with quota handling.
 *
 * If storage is full:
 * 1. Attempts LRU cleanup of oldest entries
 * 2. Retries the write operation
 * 3. Returns error result if still failing
 *
 * @param key - Storage key
 * @param value - Value to store
 * @returns StorageResult with operation status
 *
 * @example
 * ```typescript
 * const result = safeSetItem('hyvve-preferences', JSON.stringify(prefs));
 * if (!result.success) {
 *   console.error('Failed to save:', result.error);
 * }
 * if (result.warning) {
 *   toast.warning(result.warning);
 * }
 * ```
 */
export function safeSetItem(key: string, value: string): StorageResult {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: 'localStorage is not available',
    };
  }

  try {
    window.localStorage.setItem(key, value);

    const usage = getStorageUsage();
    const result: StorageResult = {
      success: true,
      bytesUsed: usage.bytesUsed,
      bytesRemaining: usage.bytesRemaining,
    };

    // Add warning if near quota
    if (usage.percentUsed >= QUOTA_CRITICAL_THRESHOLD) {
      result.warning = 'Storage space is critically low (>95% used)';
      console.error('[StorageQuota] Critical: Storage space is critically low');
    } else if (usage.percentUsed >= QUOTA_WARNING_THRESHOLD) {
      result.warning = 'Storage space is running low (>80% used)';
      console.warn('[StorageQuota] Warning: Storage space is running low');
    }

    return result;
  } catch (e) {
    // Handle quota exceeded error
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('[StorageQuota] Quota exceeded, attempting cleanup...');

      // Calculate how much space we need
      const valueSize = (key.length + value.length) * 2;
      const targetCleanup = Math.max(valueSize * 2, DEFAULT_CLEANUP_TARGET);

      // Attempt cleanup
      const cleanedBytes = cleanupOldEntries(targetCleanup);
      console.debug(`[StorageQuota] Cleaned up ${cleanedBytes} bytes`);

      // Retry the write
      try {
        window.localStorage.setItem(key, value);

        const usage = getStorageUsage();
        return {
          success: true,
          warning: 'Storage was cleaned up to make room for new data',
          bytesUsed: usage.bytesUsed,
          bytesRemaining: usage.bytesRemaining,
        };
      } catch (retryError) {
        console.error('[StorageQuota] Write failed after cleanup:', retryError);
        return {
          success: false,
          error: 'Storage quota exceeded. Unable to save data even after cleanup.',
        };
      }
    }

    // Handle other storage errors
    const errorMessage = e instanceof Error ? e.message : 'Unknown storage error';
    console.error('[StorageQuota] Storage error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Safely get an item from localStorage with error handling.
 *
 * @param key - Storage key
 * @returns The stored value, or null if not found or on error
 */
export function safeGetItem(key: string): string | null {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    console.warn('[StorageQuota] Failed to read from localStorage:', e);
    return null;
  }
}

/**
 * Safely remove an item from localStorage with error handling.
 *
 * @param key - Storage key
 * @returns true if removal succeeded
 */
export function safeRemoveItem(key: string): boolean {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn('[StorageQuota] Failed to remove from localStorage:', e);
    return false;
  }
}

/**
 * Clean up old entries from localStorage using LRU strategy.
 *
 * Entries are evicted based on their _timestamp field (oldest first).
 * Entries without timestamps or with invalid JSON are treated as oldest.
 * Only entries with the HYVVE prefix are considered for cleanup.
 *
 * @param bytesToFree - Target bytes to free (default: 100KB)
 * @returns Number of bytes actually freed
 *
 * @example
 * ```typescript
 * const freed = cleanupOldEntries(50 * 1024); // Free 50KB
 * console.log(`Freed ${freed} bytes`);
 * ```
 */
export function cleanupOldEntries(bytesToFree: number = DEFAULT_CLEANUP_TARGET): number {
  if (!isStorageAvailable()) {
    return 0;
  }

  const entries: TimestampedEntry[] = [];

  // Collect all HYVVE entries with their timestamps
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(HYVVE_PREFIX)) {
      continue;
    }

    const value = window.localStorage.getItem(key);
    if (value === null) {
      continue;
    }

    const size = (key.length + value.length) * 2;
    let timestamp = 0; // Default to oldest

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        // Check for _timestamp or timestamp field
        if (typeof parsed._timestamp === 'number') {
          timestamp = parsed._timestamp;
        } else if (typeof parsed.timestamp === 'number') {
          timestamp = parsed.timestamp;
        }
      }
    } catch {
      // Non-JSON entries treated as oldest (timestamp = 0)
    }

    entries.push({ key, size, timestamp });
  }

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Remove entries until we've freed enough space
  let freedBytes = 0;
  const removedKeys: string[] = [];

  for (const entry of entries) {
    if (freedBytes >= bytesToFree) {
      break;
    }

    try {
      window.localStorage.removeItem(entry.key);
      freedBytes += entry.size;
      removedKeys.push(entry.key);
    } catch (e) {
      console.warn(`[StorageQuota] Failed to remove entry ${entry.key}:`, e);
    }
  }

  if (removedKeys.length > 0) {
    console.debug(`[StorageQuota] Cleaned up ${removedKeys.length} entries, freed ${freedBytes} bytes:`, removedKeys);
  }

  return freedBytes;
}

/**
 * Get all HYVVE storage keys.
 *
 * @returns Array of storage keys with HYVVE prefix
 */
export function getHyvveStorageKeys(): string[] {
  if (!isStorageAvailable()) {
    return [];
  }

  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(HYVVE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Clear all HYVVE storage entries.
 *
 * @returns Number of entries cleared
 */
export function clearHyvveStorage(): number {
  if (!isStorageAvailable()) {
    return 0;
  }

  const keys = getHyvveStorageKeys();
  let cleared = 0;

  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
      cleared++;
    } catch (e) {
      console.warn(`[StorageQuota] Failed to clear ${key}:`, e);
    }
  }

  console.debug(`[StorageQuota] Cleared ${cleared} HYVVE storage entries`);
  return cleared;
}
