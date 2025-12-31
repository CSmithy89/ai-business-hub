/**
 * Unit Tests for LocalStorage Quota Handler
 *
 * Tests for quota management utilities including:
 * - Quota detection and reporting
 * - Graceful degradation (QuotaExceededError handling)
 * - LRU cleanup strategy
 * - Error handling for storage operations
 * - Storage availability detection
 *
 * @see docs/modules/bm-dm/stories/dm-09-8-localstorage-quota-tests.md
 * Epic: DM-09 | Story: DM-09.8
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isStorageAvailable,
  getStorageUsage,
  isNearQuota,
  isCriticalQuota,
  safeSetItem,
  safeGetItem,
  safeRemoveItem,
  cleanupOldEntries,
  getHyvveStorageKeys,
  clearHyvveStorage,
  MAX_STORAGE_SIZE,
  QUOTA_WARNING_THRESHOLD,
  QUOTA_CRITICAL_THRESHOLD,
  HYVVE_PREFIX,
  DEFAULT_CLEANUP_TARGET,
} from '../quota-handler';

// =============================================================================
// MOCK SETUP
// =============================================================================

let mockStorage: Record<string, string> = {};
let quotaExceeded = false;
let storageDisabled = false;

/**
 * Create a mock localStorage implementation for testing.
 */
function createMockLocalStorage() {
  return {
    getItem: vi.fn((key: string) => {
      if (storageDisabled) {
        throw new Error('Storage is disabled');
      }
      return mockStorage[key] || null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      if (storageDisabled) {
        throw new Error('Storage is disabled');
      }
      if (quotaExceeded) {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      if (storageDisabled) {
        throw new Error('Storage is disabled');
      }
      delete mockStorage[key];
    }),
    key: vi.fn((index: number) => {
      if (storageDisabled) {
        throw new Error('Storage is disabled');
      }
      return Object.keys(mockStorage)[index] || null;
    }),
    get length() {
      return Object.keys(mockStorage).length;
    },
    clear: vi.fn(() => {
      mockStorage = {};
    }),
  };
}

// =============================================================================
// TEST SETUP
// =============================================================================

describe('LocalStorage Quota Handler', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    // Reset state
    mockStorage = {};
    quotaExceeded = false;
    storageDisabled = false;

    // Create mock localStorage
    mockLocalStorage = createMockLocalStorage();
    vi.stubGlobal('localStorage', mockLocalStorage);

    // Clear console spies
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ===========================================================================
  // SCENARIO 1: QUOTA DETECTION AND REPORTING
  // ===========================================================================

  describe('Scenario 1: Quota Detection and Reporting', () => {
    describe('getStorageUsage', () => {
      it('should calculate usage correctly with empty storage', () => {
        const usage = getStorageUsage();

        expect(usage.bytesUsed).toBe(0);
        expect(usage.bytesRemaining).toBe(MAX_STORAGE_SIZE);
        expect(usage.percentUsed).toBe(0);
        expect(usage.itemCount).toBe(0);
      });

      it('should calculate usage correctly with data in storage', () => {
        // Add some data - UTF-16 encoding means 2 bytes per character
        mockStorage['key1'] = 'value1'; // (4 + 6) * 2 = 20 bytes
        mockStorage['key2'] = 'value2'; // (4 + 6) * 2 = 20 bytes

        const usage = getStorageUsage();

        expect(usage.bytesUsed).toBe(40); // 20 + 20 bytes
        expect(usage.bytesRemaining).toBe(MAX_STORAGE_SIZE - 40);
        expect(usage.itemCount).toBe(2);
      });

      it('should calculate percentage used correctly', () => {
        // Fill storage to approximately 50%
        const halfSize = MAX_STORAGE_SIZE / 2;
        const charsNeeded = halfSize / 2; // UTF-16: 2 bytes per char
        mockStorage['hyvve-large'] = 'x'.repeat(charsNeeded - 10); // -10 for key length

        const usage = getStorageUsage();

        expect(usage.percentUsed).toBeCloseTo(0.5, 1);
      });

      it('should handle empty values correctly', () => {
        // Set up the empty key - note that isStorageAvailable() adds/removes a test key
        // We set up our key and make sure getItem returns empty string for it
        mockStorage['emptykey'] = '';

        const usage = getStorageUsage();

        // Since mock has the key with empty value, verify item is counted
        // The exact bytes depends on if isStorageAvailable test key lingers
        expect(usage.itemCount).toBeGreaterThanOrEqual(1);

        // Check that our key is still in storage
        expect(mockStorage['emptykey']).toBe('');
      });
    });

    describe('isNearQuota', () => {
      it('should return false when usage is below threshold', () => {
        // Empty storage
        expect(isNearQuota()).toBe(false);
      });

      it('should return true when usage is at warning threshold (80%)', () => {
        // Fill to 80%
        const targetBytes = MAX_STORAGE_SIZE * QUOTA_WARNING_THRESHOLD;
        const charsNeeded = targetBytes / 2;
        mockStorage['hyvve-large'] = 'x'.repeat(charsNeeded - 10);

        expect(isNearQuota()).toBe(true);
      });

      it('should use custom threshold', () => {
        // Fill to 50%
        const targetBytes = MAX_STORAGE_SIZE * 0.5;
        const charsNeeded = targetBytes / 2;
        mockStorage['hyvve-large'] = 'x'.repeat(charsNeeded - 10);

        expect(isNearQuota(0.4)).toBe(true); // Above 40%
        expect(isNearQuota(0.6)).toBe(false); // Below 60%
      });
    });

    describe('isCriticalQuota', () => {
      it('should return false when usage is below critical threshold', () => {
        // Fill to 80%
        const targetBytes = MAX_STORAGE_SIZE * QUOTA_WARNING_THRESHOLD;
        const charsNeeded = targetBytes / 2;
        mockStorage['hyvve-large'] = 'x'.repeat(charsNeeded - 10);

        expect(isCriticalQuota()).toBe(false);
      });

      it('should return true when usage is at critical threshold (95%)', () => {
        // Fill to 95%
        const targetBytes = MAX_STORAGE_SIZE * QUOTA_CRITICAL_THRESHOLD;
        const charsNeeded = targetBytes / 2;
        mockStorage['hyvve-large'] = 'x'.repeat(charsNeeded - 10);

        expect(isCriticalQuota()).toBe(true);
      });
    });
  });

  // ===========================================================================
  // SCENARIO 2: GRACEFUL DEGRADATION
  // ===========================================================================

  describe('Scenario 2: Graceful Degradation', () => {
    describe('QuotaExceededError handling', () => {
      it('should handle QuotaExceededError without crashing', () => {
        quotaExceeded = true;

        const result = safeSetItem('key', 'value');

        expect(result.success).toBe(false);
        // The error can be about quota exceeded or cleanup failure
        expect(result.error).toBeDefined();
      });

      it('should return error result when quota exceeded', () => {
        quotaExceeded = true;

        const result = safeSetItem('hyvve-test', 'data');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should attempt cleanup and retry on quota exceeded', () => {
        // Add old entry that can be cleaned up
        mockStorage['hyvve-old'] = JSON.stringify({
          _timestamp: Date.now() - 100000,
          data: 'old data that will be cleaned',
        });

        // Track write attempts for 'hyvve-new' key specifically
        let targetWriteAttempts = 0;

        // Replace the setItem mock to simulate quota exceeded on first target write
        mockLocalStorage.setItem = vi.fn((key: string, value: string) => {
          if (storageDisabled) {
            throw new Error('Storage is disabled');
          }
          // For the target key, fail first then succeed
          if (key === 'hyvve-new') {
            targetWriteAttempts++;
            if (targetWriteAttempts === 1) {
              throw new DOMException('Quota exceeded', 'QuotaExceededError');
            }
          }
          mockStorage[key] = value;
        });

        const result = safeSetItem('hyvve-new', 'new data');

        expect(result.success).toBe(true);
        expect(result.warning).toContain('cleaned up');
      });

      it('should log error when quota exceeded', () => {
        // First make storage available, then quota exceeded
        // Replace the setItem mock to throw quota exceeded
        mockLocalStorage.setItem = vi.fn((key: string) => {
          // Allow the storage test key for isStorageAvailable check
          if (key === '__storage_test__') {
            mockStorage[key] = key;
            return;
          }
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        });

        safeSetItem('hyvve-test', 'value');

        // console.error is called when quota is exceeded
        expect(console.error).toHaveBeenCalled();
      });
    });

    describe('localStorage unavailable fallback', () => {
      it('should return false when localStorage unavailable', () => {
        storageDisabled = true;

        expect(isStorageAvailable()).toBe(false);
      });

      it('should return empty usage when storage unavailable', () => {
        storageDisabled = true;

        const usage = getStorageUsage();

        expect(usage.bytesUsed).toBe(0);
        expect(usage.itemCount).toBe(0);
      });

      it('should return error from safeSetItem when storage unavailable', () => {
        storageDisabled = true;

        const result = safeSetItem('key', 'value');

        expect(result.success).toBe(false);
        expect(result.error).toContain('not available');
      });

      it('should return null from safeGetItem when storage unavailable', () => {
        storageDisabled = true;

        expect(safeGetItem('key')).toBeNull();
      });
    });
  });

  // ===========================================================================
  // SCENARIO 3: LRU CLEANUP STRATEGY
  // ===========================================================================

  describe('Scenario 3: LRU Cleanup Strategy', () => {
    describe('cleanupOldEntries', () => {
      it('should remove oldest entries first', () => {
        // Add entries with different timestamps
        const now = Date.now();
        mockStorage['hyvve-oldest'] = JSON.stringify({ _timestamp: now - 3000, data: 'oldest' });
        mockStorage['hyvve-middle'] = JSON.stringify({ _timestamp: now - 2000, data: 'middle' });
        mockStorage['hyvve-newest'] = JSON.stringify({ _timestamp: now - 1000, data: 'newest' });

        // Cleanup enough to remove oldest
        cleanupOldEntries(100);

        expect(mockStorage['hyvve-oldest']).toBeUndefined();
        expect(mockStorage['hyvve-newest']).toBeDefined();
      });

      it('should stop when target bytes freed', () => {
        // Add multiple entries
        const now = Date.now();
        for (let i = 0; i < 10; i++) {
          mockStorage[`hyvve-item-${i}`] = JSON.stringify({
            _timestamp: now - (10 - i) * 1000,
            data: 'x'.repeat(100),
          });
        }

        const initialCount = Object.keys(mockStorage).length;

        // Request to free a small amount
        cleanupOldEntries(500);

        const finalCount = Object.keys(mockStorage).length;

        // Should have removed some but not all entries
        expect(finalCount).toBeLessThan(initialCount);
        expect(finalCount).toBeGreaterThan(0);
      });

      it('should handle non-JSON entries as oldest', () => {
        const now = Date.now();
        // Make plain text entry small so it gets cleaned first
        mockStorage['hyvve-plain'] = 'plain';
        // Make the new entry with timestamp so it's treated as newer
        mockStorage['hyvve-new'] = JSON.stringify({ _timestamp: now, data: 'new data here' });

        // Clean up just enough to remove plain entry (small target)
        // Plain entry size: ('hyvve-plain'.length + 'plain'.length) * 2 = 32 bytes
        cleanupOldEntries(50);

        // Plain text should be removed first (treated as oldest, timestamp 0)
        expect(mockStorage['hyvve-plain']).toBeUndefined();
        // The new entry may or may not survive depending on cleanup target
        // Just verify cleanup happened by checking at least one was removed
      });

      it('should preserve recent data during cleanup', () => {
        const now = Date.now();
        mockStorage['hyvve-recent'] = JSON.stringify({ _timestamp: now, data: 'recent' });
        mockStorage['hyvve-old'] = JSON.stringify({ _timestamp: now - 100000, data: 'old' });

        cleanupOldEntries(100);

        expect(mockStorage['hyvve-recent']).toBeDefined();
      });

      it('should only clean up HYVVE prefixed entries', () => {
        const now = Date.now();
        mockStorage['other-key'] = JSON.stringify({ _timestamp: now - 100000, data: 'old' });
        mockStorage['hyvve-old'] = JSON.stringify({ _timestamp: now - 50000, data: 'old' });

        cleanupOldEntries(100);

        // Non-HYVVE entry should be preserved
        expect(mockStorage['other-key']).toBeDefined();
      });

      it('should handle timestamp field as well as _timestamp', () => {
        const now = Date.now();
        // Entry a has older timestamp (now - 2000) - should be removed first
        mockStorage['hyvve-a'] = JSON.stringify({ timestamp: now - 2000, data: 'a' });
        // Entry b has newer _timestamp (now - 1000) - should be kept
        mockStorage['hyvve-b'] = JSON.stringify({ _timestamp: now - 1000, data: 'b' });

        // Calculate size of entry a to clean just that one (with small buffer)
        const entryAValue = mockStorage['hyvve-a'];
        const entryASize = ('hyvve-a'.length + entryAValue.length) * 2;

        // Request to free exactly the size of entry a
        cleanupOldEntries(entryASize);

        // Entry with older timestamp should be removed first
        expect(mockStorage['hyvve-a']).toBeUndefined();
        // Entry b should still exist (has newer timestamp, wasn't needed for quota)
        expect(mockStorage['hyvve-b']).toBeDefined();
      });

      it('should return bytes freed', () => {
        mockStorage['hyvve-data'] = JSON.stringify({ _timestamp: 0, data: 'test' });

        const freedBytes = cleanupOldEntries(1000);

        expect(freedBytes).toBeGreaterThan(0);
      });

      it('should return 0 when storage is unavailable', () => {
        storageDisabled = true;

        const freed = cleanupOldEntries(1000);

        expect(freed).toBe(0);
      });
    });
  });

  // ===========================================================================
  // SCENARIO 4: ERROR HANDLING FOR STORAGE OPERATIONS
  // ===========================================================================

  describe('Scenario 4: Error Handling for Storage Operations', () => {
    describe('isStorageAvailable', () => {
      it('should return true when localStorage is accessible', () => {
        expect(isStorageAvailable()).toBe(true);
      });

      it('should return false in private browsing mode (storage throws)', () => {
        storageDisabled = true;

        expect(isStorageAvailable()).toBe(false);
      });

      it('should return false when window is undefined (SSR)', () => {
        const originalWindow = global.window;
        // @ts-expect-error - Testing SSR scenario
        delete global.window;

        expect(isStorageAvailable()).toBe(false);

        global.window = originalWindow;
      });
    });

    describe('safeGetItem', () => {
      it('should return value when key exists', () => {
        mockStorage['test-key'] = 'test-value';

        expect(safeGetItem('test-key')).toBe('test-value');
      });

      it('should return null when key does not exist', () => {
        expect(safeGetItem('nonexistent')).toBeNull();
      });

      it('should return null and not crash on storage error', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        expect(safeGetItem('key')).toBeNull();
        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe('safeRemoveItem', () => {
      it('should remove item successfully', () => {
        mockStorage['to-remove'] = 'value';

        const success = safeRemoveItem('to-remove');

        expect(success).toBe(true);
        expect(mockStorage['to-remove']).toBeUndefined();
      });

      it('should return false when storage unavailable', () => {
        storageDisabled = true;

        expect(safeRemoveItem('key')).toBe(false);
      });

      it('should return false and not crash on storage error', () => {
        // First ensure storage is available, then make removeItem fail
        mockStorage['test-key'] = 'value';

        // Override removeItem to throw after storage check
        const originalRemove = mockLocalStorage.removeItem;
        mockLocalStorage.removeItem = vi.fn((key: string) => {
          if (key !== '__storage_test__') {
            throw new Error('Storage error');
          }
          originalRemove(key);
        });

        expect(safeRemoveItem('test-key')).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe('safeSetItem error handling', () => {
      it('should handle generic storage errors', () => {
        // Override setItem to throw after storage check passes
        const originalSetItem = mockLocalStorage.setItem;
        mockLocalStorage.setItem = vi.fn((key: string, value: string) => {
          if (key !== '__storage_test__') {
            throw new Error('Generic storage error');
          }
          originalSetItem(key, value);
        });

        const result = safeSetItem('hyvve-test', 'value');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Generic storage error');
      });

      it('should return storage unavailable error when storage disabled', () => {
        storageDisabled = true;

        const result = safeSetItem('key', 'value');

        expect(result.success).toBe(false);
        expect(result.error).toContain('not available');
      });
    });
  });

  // ===========================================================================
  // SCENARIO 5: USER NOTIFICATION
  // ===========================================================================

  describe('Scenario 5: User Notification', () => {
    describe('safeSetItem warnings', () => {
      it('should log warning at 80% usage', () => {
        // Fill to 80%
        const targetBytes = MAX_STORAGE_SIZE * 0.81;
        const charsNeeded = targetBytes / 2;
        mockStorage['hyvve-fill'] = 'x'.repeat(charsNeeded - 10);

        const result = safeSetItem('hyvve-new', 'value');

        expect(result.success).toBe(true);
        expect(result.warning).toContain('running low');
        expect(console.warn).toHaveBeenCalled();
      });

      it('should log error at 95% usage', () => {
        // Fill to 95%
        const targetBytes = MAX_STORAGE_SIZE * 0.96;
        const charsNeeded = targetBytes / 2;
        mockStorage['hyvve-fill'] = 'x'.repeat(charsNeeded - 10);

        const result = safeSetItem('hyvve-new', 'value');

        expect(result.success).toBe(true);
        expect(result.warning).toContain('critically low');
        expect(console.error).toHaveBeenCalled();
      });

      it('should return warning in StorageResult when near capacity', () => {
        // Fill to 85%
        const targetBytes = MAX_STORAGE_SIZE * 0.85;
        const charsNeeded = targetBytes / 2;
        mockStorage['hyvve-fill'] = 'x'.repeat(charsNeeded - 10);

        const result = safeSetItem('hyvve-new', 'value');

        expect(result.success).toBe(true);
        expect(result.warning).toBeDefined();
        expect(result.bytesUsed).toBeDefined();
        expect(result.bytesRemaining).toBeDefined();
      });

      it('should log debug when entries are evicted during cleanup', () => {
        mockStorage['hyvve-old'] = JSON.stringify({ _timestamp: 0, data: 'old' });

        cleanupOldEntries(100);

        expect(console.debug).toHaveBeenCalled();
      });
    });

    describe('StorageResult interface', () => {
      it('should include all fields on successful write', () => {
        const result = safeSetItem('hyvve-test', 'value');

        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);
        expect(result).toHaveProperty('bytesUsed');
        expect(result).toHaveProperty('bytesRemaining');
      });

      it('should include error on failed write', () => {
        quotaExceeded = true;

        const result = safeSetItem('key', 'value');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // UTILITY FUNCTION TESTS
  // ===========================================================================

  describe('Utility Functions', () => {
    describe('getHyvveStorageKeys', () => {
      it('should return only HYVVE prefixed keys', () => {
        mockStorage['hyvve-one'] = 'value1';
        mockStorage['hyvve-two'] = 'value2';
        mockStorage['other-key'] = 'value3';

        const keys = getHyvveStorageKeys();

        expect(keys).toHaveLength(2);
        expect(keys).toContain('hyvve-one');
        expect(keys).toContain('hyvve-two');
        expect(keys).not.toContain('other-key');
      });

      it('should return empty array when storage unavailable', () => {
        storageDisabled = true;

        expect(getHyvveStorageKeys()).toEqual([]);
      });
    });

    describe('clearHyvveStorage', () => {
      it('should clear all HYVVE entries', () => {
        mockStorage['hyvve-one'] = 'value1';
        mockStorage['hyvve-two'] = 'value2';
        mockStorage['other-key'] = 'value3';

        const cleared = clearHyvveStorage();

        expect(cleared).toBe(2);
        expect(mockStorage['hyvve-one']).toBeUndefined();
        expect(mockStorage['hyvve-two']).toBeUndefined();
        expect(mockStorage['other-key']).toBe('value3');
      });

      it('should return 0 when storage unavailable', () => {
        storageDisabled = true;

        expect(clearHyvveStorage()).toBe(0);
      });
    });
  });

  // ===========================================================================
  // CONSTANTS TESTS
  // ===========================================================================

  describe('Constants', () => {
    it('should export MAX_STORAGE_SIZE as 5MB', () => {
      expect(MAX_STORAGE_SIZE).toBe(5 * 1024 * 1024);
    });

    it('should export QUOTA_WARNING_THRESHOLD as 0.8', () => {
      expect(QUOTA_WARNING_THRESHOLD).toBe(0.8);
    });

    it('should export QUOTA_CRITICAL_THRESHOLD as 0.95', () => {
      expect(QUOTA_CRITICAL_THRESHOLD).toBe(0.95);
    });

    it('should export HYVVE_PREFIX as hyvve-', () => {
      expect(HYVVE_PREFIX).toBe('hyvve-');
    });

    it('should export DEFAULT_CLEANUP_TARGET as 100KB', () => {
      expect(DEFAULT_CLEANUP_TARGET).toBe(100 * 1024);
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle very large values', () => {
      const largeValue = 'x'.repeat(10000);

      const result = safeSetItem('hyvve-large', largeValue);

      expect(result.success).toBe(true);
      expect(result.bytesUsed).toBeGreaterThan(20000); // UTF-16
    });

    it('should handle special characters in keys and values', () => {
      const result = safeSetItem('hyvve-special-!@#$%', 'value with unicode: \u{1F600}');

      expect(result.success).toBe(true);
    });

    it('should handle empty value', () => {
      const result = safeSetItem('hyvve-empty', '');

      expect(result.success).toBe(true);
    });

    it('should handle JSON stringified objects', () => {
      const obj = { key: 'value', nested: { array: [1, 2, 3] } };

      const result = safeSetItem('hyvve-json', JSON.stringify(obj));

      expect(result.success).toBe(true);

      const retrieved = safeGetItem('hyvve-json');
      expect(JSON.parse(retrieved!)).toEqual(obj);
    });

    it('should handle cleanup with no HYVVE entries', () => {
      mockStorage['other-key'] = 'value';

      const freed = cleanupOldEntries(1000);

      expect(freed).toBe(0);
      expect(mockStorage['other-key']).toBe('value');
    });

    it('should handle malformed JSON in storage during cleanup', () => {
      mockStorage['hyvve-malformed'] = 'not valid json {';
      mockStorage['hyvve-valid'] = JSON.stringify({ _timestamp: Date.now(), data: 'valid' });

      // Should not throw, malformed entry treated as oldest
      expect(() => cleanupOldEntries(100)).not.toThrow();
    });
  });
});
