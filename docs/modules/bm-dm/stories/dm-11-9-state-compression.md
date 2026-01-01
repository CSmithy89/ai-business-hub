# Story DM-11.9: State Compression

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** done
**Points:** 3
**Priority:** Low

---

## Problem Statement

Large dashboard state may exceed localStorage quota (typically 5-10MB depending on browser). As users accumulate widget configurations, layouts, preferences, and cached data, the serialized state can grow beyond manageable sizes. Without compression, users may encounter silent failures when attempting to persist state, leading to lost configurations and poor user experience.

## Gap Addressed

**REC-20:** Large state may exceed localStorage quota

## Implementation Plan

### 1. Compression Module

Create a dedicated compression module that handles transparent compression/decompression:

```typescript
// apps/web/src/lib/storage/compression.ts
import LZString from 'lz-string';

const COMPRESSION_THRESHOLD = 50 * 1024; // 50KB
const COMPRESSION_MARKER_KEY_SUFFIX = ':compressed';

export interface CompressionMetrics {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
  timestamp: string;
}

/**
 * Compresses data if it exceeds the threshold.
 * Returns the data (compressed or original) and metadata about the operation.
 */
export function compressIfNeeded(
  key: string,
  data: string
): { data: string; metrics: CompressionMetrics } {
  const originalSize = data.length;
  const timestamp = new Date().toISOString();

  if (originalSize <= COMPRESSION_THRESHOLD) {
    return {
      data,
      metrics: {
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        wasCompressed: false,
        timestamp,
      },
    };
  }

  try {
    const compressed = LZString.compressToUTF16(data);
    const compressedSize = compressed.length;
    const compressionRatio = originalSize / compressedSize;

    logCompressionEvent(key, {
      originalSize,
      compressedSize,
      compressionRatio,
      wasCompressed: true,
      timestamp,
    });

    return {
      data: compressed,
      metrics: {
        originalSize,
        compressedSize,
        compressionRatio,
        wasCompressed: true,
        timestamp,
      },
    };
  } catch (error) {
    // Compression failed, return original data
    console.error('[State Compression] Compression failed:', error);
    return {
      data,
      metrics: {
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        wasCompressed: false,
        timestamp,
      },
    };
  }
}

/**
 * Decompresses data if it was previously compressed.
 */
export function decompressIfNeeded(
  data: string,
  isCompressed: boolean
): string {
  if (!isCompressed) {
    return data;
  }

  try {
    const decompressed = LZString.decompressFromUTF16(data);

    if (decompressed === null) {
      throw new Error('Decompression returned null - data may be corrupted');
    }

    return decompressed;
  } catch (error) {
    console.error('[State Compression] Decompression failed:', error);
    throw new CompressionError('Failed to decompress state data', { cause: error });
  }
}

/**
 * Custom error for compression-related failures.
 */
export class CompressionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'CompressionError';
  }
}

/**
 * Logs compression events for monitoring.
 */
function logCompressionEvent(key: string, metrics: CompressionMetrics): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[State Compression]', {
      key,
      ...metrics,
      savings: `${((1 - 1 / metrics.compressionRatio) * 100).toFixed(1)}%`,
    });
  }
}

/**
 * Gets the compression threshold (exported for testing).
 */
export function getCompressionThreshold(): number {
  return COMPRESSION_THRESHOLD;
}
```

### 2. Storage Utilities Integration

Update the storage utilities to use compression:

```typescript
// apps/web/src/lib/storage/state-storage.ts

import {
  compressIfNeeded,
  decompressIfNeeded,
  CompressionError,
  type CompressionMetrics,
} from './compression';

const STATE_KEY = 'dashboard-state';
const COMPRESSED_MARKER = `${STATE_KEY}:compressed`;

/**
 * Saves state to localStorage with automatic compression.
 */
export function saveState<T>(state: T): CompressionMetrics | null {
  try {
    const json = JSON.stringify(state);
    const { data, metrics } = compressIfNeeded(STATE_KEY, json);

    localStorage.setItem(STATE_KEY, data);

    if (metrics.wasCompressed) {
      localStorage.setItem(COMPRESSED_MARKER, 'true');
    } else {
      localStorage.removeItem(COMPRESSED_MARKER);
    }

    return metrics;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[State Storage] localStorage quota exceeded even after compression');
    }
    console.error('[State Storage] Failed to save state:', error);
    return null;
  }
}

/**
 * Loads state from localStorage with automatic decompression.
 */
export function loadState<T>(): T | null {
  try {
    const data = localStorage.getItem(STATE_KEY);

    if (!data) {
      return null;
    }

    const isCompressed = localStorage.getItem(COMPRESSED_MARKER) === 'true';
    const json = decompressIfNeeded(data, isCompressed);

    return JSON.parse(json) as T;
  } catch (error) {
    if (error instanceof CompressionError) {
      console.error('[State Storage] Corrupted compressed data, clearing state');
      clearState();
    }
    console.error('[State Storage] Failed to load state:', error);
    return null;
  }
}

/**
 * Clears stored state.
 */
export function clearState(): void {
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(COMPRESSED_MARKER);
}

/**
 * Gets current storage usage metrics.
 */
export function getStorageMetrics(): {
  stateSize: number;
  isCompressed: boolean;
  estimatedUncompressedSize: number;
} {
  const data = localStorage.getItem(STATE_KEY);
  const isCompressed = localStorage.getItem(COMPRESSED_MARKER) === 'true';

  if (!data) {
    return {
      stateSize: 0,
      isCompressed: false,
      estimatedUncompressedSize: 0,
    };
  }

  let estimatedUncompressedSize = data.length;

  if (isCompressed) {
    try {
      const decompressed = decompressIfNeeded(data, true);
      estimatedUncompressedSize = decompressed.length;
    } catch {
      // Keep estimated as compressed size if decompression fails
    }
  }

  return {
    stateSize: data.length,
    isCompressed,
    estimatedUncompressedSize,
  };
}
```

### 3. Dashboard Store Integration

Update the dashboard store to use compressed storage:

```typescript
// In dashboard-state-store.ts persist middleware config

import { saveState, loadState } from '@/lib/storage/state-storage';

// Replace direct localStorage access with compressed storage
const persistConfig = {
  name: 'dashboard-state',
  storage: {
    getItem: (name: string) => {
      const state = loadState();
      return state ? JSON.stringify({ state }) : null;
    },
    setItem: (name: string, value: string) => {
      const { state } = JSON.parse(value);
      saveState(state);
    },
    removeItem: (name: string) => {
      clearState();
    },
  },
};
```

## Files to Create

| File | Description |
|------|-------------|
| `apps/web/src/lib/storage/compression.ts` | Core compression utilities with LZ-String |
| `apps/web/src/lib/storage/__tests__/compression.test.ts` | Unit tests for compression module |

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/package.json` | Add `lz-string` dependency |
| `apps/web/src/lib/storage/index.ts` | Export compression utilities |
| `apps/web/src/stores/dashboard-state-store.ts` | Integrate compressed storage |

## Acceptance Criteria

- [x] AC1: State compressed when > threshold (50KB)
- [x] AC2: Decompression transparent on load
- [x] AC3: Compression ratio logged in development
- [x] AC4: No data corruption through compress/decompress cycle
- [x] AC5: Fallback to original data if compression fails

## Test Requirements

### Unit Tests

1. **Compression Threshold Tests**
   - Data below threshold is not compressed
   - Data above threshold is compressed
   - Threshold boundary conditions (exactly at threshold)
   - Empty data handling

2. **Compression/Decompression Cycle Tests**
   - Simple string roundtrip
   - Complex JSON object roundtrip
   - Nested objects with arrays
   - Unicode content preservation
   - Special characters preservation

3. **Metrics Tests**
   - Correct original size reported
   - Correct compressed size reported
   - Compression ratio calculation
   - Timestamp included in metrics
   - wasCompressed flag accuracy

4. **Error Handling Tests**
   - Graceful fallback on compression failure
   - CompressionError thrown on decompression failure
   - Corrupted data detection
   - Null decompression result handling

5. **Storage Integration Tests**
   - saveState with small data (no compression)
   - saveState with large data (with compression)
   - loadState with compressed data
   - loadState with uncompressed data
   - Compressed marker flag persistence
   - clearState removes all related keys

### Integration Tests

1. **Dashboard Store Integration**
   - Store persists with compression
   - Store hydrates from compressed data
   - Store actions work after hydration
   - Migration + compression combined

2. **Quota Handling**
   - Graceful handling of quota exceeded
   - Error logging on quota failure
   - State not corrupted on quota error

## Technical Notes

### LZ-String Selection

Using `lz-string` because:
- Browser-compatible (no WASM or native dependencies)
- UTF-16 encoding for efficient localStorage storage
- Well-maintained with TypeScript types
- Good compression ratios for JSON data (typically 50-70% reduction)

### Compression Threshold Rationale

50KB threshold chosen because:
- Below this, compression overhead may not provide meaningful savings
- Most dashboard states are under 50KB initially
- Allows for significant growth before compression kicks in
- Keeps normal operations fast

### Performance Considerations

- Compression is synchronous but fast (<10ms for typical state sizes)
- Decompression happens once on initial load
- Subsequent reads use in-memory state
- Only persists on state changes (debounced by Zustand persist)

### Future Enhancements

- **Web Workers** - Move compression to background thread for very large states
- **Streaming compression** - For incremental state updates
- **Compression analytics** - Track compression stats across users
- **Alternative algorithms** - Evaluate brotli/zstd when browser support improves

## Dependencies

- **DM-04.5** (State Persistence) - Original persistence implementation
- **DM-11.8** (State Migration) - Migration system that may affect state size
- **lz-string** - npm package for compression

## References

- [Epic DM-11 Tech Spec](../epics/epic-dm-11-tech-spec.md#dm-119-state-compression-3-pts) - Technical specification
- [DM-04.5 State Persistence](./dm-04-5-state-persistence.md) - Original persistence story
- [Tech Debt Consolidated](../tech-debt-consolidated.md) - REC-20
- [LZ-String Documentation](https://github.com/pieroxy/lz-string) - Compression library
- [localStorage Quota](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - Browser storage limits

---

*Story Created: 2026-01-01*
*Epic: DM-11 | Story: 9 of 15 | Points: 3*

---

## Code Review Notes

**Reviewer:** Senior Developer (AI)
**Review Date:** 2026-01-01
**Status:** APPROVED

### Files Reviewed

| File | Purpose | Status |
|------|---------|--------|
| `apps/web/src/lib/storage/compression.ts` | Core compression module with LZ-String | PASS |
| `apps/web/src/lib/storage/__tests__/compression.test.ts` | Unit tests (732 lines) | PASS |
| `apps/web/src/hooks/use-state-persistence.ts` | Persistence integration | PASS |
| `apps/web/src/lib/storage/index.ts` | Module exports | PASS |
| `apps/web/src/lib/storage-keys.ts` | Storage key constant | PASS |
| `apps/web/package.json` | lz-string dependency | PASS |

### Acceptance Criteria Verification

| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | State compressed when > threshold | PASS | `compression.ts:104-146` - Threshold check and compression logic |
| AC2 | Decompression transparent on load | PASS | `use-state-persistence.ts:309-328` - Auto-detects and decompresses |
| AC3 | Compression ratio logged in dev | PASS | `compression.ts:139-140, 276-294` - Dev-only logging with metrics |
| AC4 | No data corruption | PASS | Tests verify roundtrip for JSON, Unicode, special chars |
| AC5 | Fallback on failure | PASS | `compression.ts:147-164` - Returns original data on error |

### Code Quality Assessment

**Strengths:**
- Excellent documentation with JSDoc comments
- Clean API design with `compressIfNeeded`/`decompressIfNeeded`
- Proper TypeScript types with exported interfaces
- Custom `CompressionError` class with original data for debugging
- Environment-aware logging (development only)
- Comprehensive test coverage (732 lines, 45+ test cases)
- Seamless integration with existing persistence hook

**Test Coverage:**
- Constants and threshold tests
- Roundtrip integrity (simple, complex JSON, Unicode, special chars)
- Metrics calculation accuracy
- Error handling and fallback behavior
- Logging behavior verification
- Integration-like tests with realistic dashboard state

**No Issues Found:** Implementation is clean, well-structured, and follows project conventions.

### Summary

The state compression implementation fully meets all acceptance criteria. The LZ-String UTF-16 compression is correctly used for optimal localStorage efficiency. Error handling is robust with graceful fallback to uncompressed data. Test coverage is comprehensive with edge cases properly handled. The integration with the existing persistence hook is seamless with proper marker management for compressed/uncompressed state detection.
