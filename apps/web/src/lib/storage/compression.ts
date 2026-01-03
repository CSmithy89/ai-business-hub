/**
 * State Compression Module
 *
 * Provides transparent LZ-String compression for localStorage state persistence.
 * Compression is applied when state exceeds a configurable threshold (50KB),
 * with automatic decompression on load.
 *
 * Uses LZ-String compressToUTF16/decompressFromUTF16 for optimal localStorage
 * efficiency (JavaScript strings are UTF-16, so this avoids encoding overhead).
 *
 * @module storage/compression
 *
 * Features:
 * - Threshold-based compression (only compress large data)
 * - Graceful fallback on compression failure
 * - Compression metrics for monitoring
 * - Development logging for debugging
 *
 * @see docs/modules/bm-dm/stories/dm-11-9-state-compression.md
 * Epic: DM-11 | Story: DM-11.9
 */

import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { trackCompressionMetrics } from '@/lib/telemetry';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Size threshold for compression in bytes (50KB) */
export const COMPRESSION_THRESHOLD = 50 * 1024;

/** Suffix for storage keys that indicate compressed data */
export const COMPRESSED_MARKER_SUFFIX = ':compressed';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Metrics collected during compression operations.
 */
export interface CompressionMetrics {
  /** Size of original data in characters */
  originalSize: number;
  /** Size of compressed data in characters */
  compressedSize: number;
  /** Compression ratio (original / compressed) */
  compressionRatio: number;
  /** Whether compression was actually applied */
  wasCompressed: boolean;
  /** Timestamp when compression occurred */
  timestamp: number;
}

// =============================================================================
// ERRORS
// =============================================================================

/**
 * Custom error for compression-related failures.
 * Includes the original data for debugging purposes.
 */
export class CompressionError extends Error {
  constructor(
    message: string,
    public readonly originalData?: string
  ) {
    super(message);
    this.name = 'CompressionError';
  }
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Compresses data if it exceeds the threshold.
 *
 * Uses LZ-String's UTF-16 compression for optimal localStorage storage.
 * If compression fails, returns the original data with wasCompressed = false.
 *
 * @param data - The string data to potentially compress
 * @returns Object containing the (possibly compressed) data and metrics
 *
 * @example
 * ```typescript
 * const { data, metrics } = compressIfNeeded(largeJsonString);
 * if (metrics.wasCompressed) {
 *   console.log(`Compressed by ${metrics.compressionRatio}x`);
 * }
 * localStorage.setItem('my-key', data);
 * localStorage.setItem('my-key:compressed', metrics.wasCompressed ? 'true' : '');
 * ```
 */
export function compressIfNeeded(data: string): {
  data: string;
  compressed: boolean;
  metrics: CompressionMetrics;
} {
  const originalSize = data.length;
  const timestamp = Date.now();

  // Below threshold - no compression needed
  if (originalSize <= COMPRESSION_THRESHOLD) {
    const metrics: CompressionMetrics = {
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false,
      timestamp,
    };

    // Track skipped compression (CR-08)
    trackCompressionMetrics({
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false,
      savingsBytes: 0,
      savingsPercent: 0,
    }, 'compress');

    return {
      data,
      compressed: false,
      metrics,
    };
  }

  try {
    const compressed = compressToUTF16(data);

    // compressToUTF16 returns null on failure
    if (compressed === null) {
      throw new Error('compressToUTF16 returned null');
    }

    const compressedSize = compressed.length;
    const compressionRatio = originalSize / compressedSize;

    const metrics: CompressionMetrics = {
      originalSize,
      compressedSize,
      compressionRatio,
      wasCompressed: true,
      timestamp,
    };

    // Log in development mode
    logCompressionMetrics('compress', metrics);

    // Track compression metrics to analytics (CR-08)
    trackCompressionMetrics({
      originalSize,
      compressedSize,
      compressionRatio,
      wasCompressed: true,
      savingsBytes: originalSize - compressedSize,
      savingsPercent: ((1 - compressedSize / originalSize) * 100),
    }, 'compress');

    return {
      data: compressed,
      compressed: true,
      metrics,
    };
  } catch (error) {
    // Compression failed - fallback to original data
    console.error('[State Compression] Compression failed:', error);

    const metrics: CompressionMetrics = {
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false,
      timestamp,
    };

    return {
      data,
      compressed: false,
      metrics,
    };
  }
}

/**
 * Decompresses data if it was previously compressed.
 *
 * @param data - The (possibly compressed) data to decompress
 * @param isCompressed - Whether the data is compressed
 * @returns The decompressed string data
 * @throws {CompressionError} If decompression fails on compressed data
 *
 * @example
 * ```typescript
 * const stored = localStorage.getItem('my-key');
 * const isCompressed = localStorage.getItem('my-key:compressed') === 'true';
 * const original = decompressIfNeeded(stored, isCompressed);
 * const parsed = JSON.parse(original);
 * ```
 */
export function decompressIfNeeded(data: string, isCompressed: boolean): string {
  // Not compressed - return as-is
  if (!isCompressed) {
    return data;
  }

  try {
    const decompressed = decompressFromUTF16(data);

    // decompressFromUTF16 returns null on failure or corrupted data
    if (decompressed === null) {
      throw new CompressionError(
        'Decompression returned null - data may be corrupted',
        data
      );
    }

    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[State Compression] Decompressed:', {
        compressedSize: data.length,
        decompressedSize: decompressed.length,
        ratio: (decompressed.length / data.length).toFixed(2),
      });
    }

    return decompressed;
  } catch (error) {
    // If it's already a CompressionError, re-throw it
    if (error instanceof CompressionError) {
      throw error;
    }

    // Wrap other errors in CompressionError
    console.error('[State Compression] Decompression failed:', error);
    throw new CompressionError(
      `Failed to decompress state data: ${error instanceof Error ? error.message : String(error)}`,
      data
    );
  }
}

/**
 * Calculates compression metrics for given original and compressed data.
 *
 * Useful for reporting/monitoring without actually performing compression.
 *
 * @param original - Original uncompressed data
 * @param compressed - Compressed data
 * @returns Compression metrics
 *
 * @example
 * ```typescript
 * const metrics = getCompressionMetrics(originalJson, compressedData);
 * analytics.track('compression_metrics', metrics);
 * ```
 */
export function getCompressionMetrics(
  original: string,
  compressed: string
): CompressionMetrics {
  const originalSize = original.length;
  const compressedSize = compressed.length;
  const wasCompressed = compressed !== original;

  return {
    originalSize,
    compressedSize,
    compressionRatio: wasCompressed ? originalSize / compressedSize : 1,
    wasCompressed,
    timestamp: Date.now(),
  };
}

/**
 * Gets the compression threshold (exported for testing).
 *
 * @returns The threshold in bytes above which compression is applied
 */
export function getCompressionThreshold(): number {
  return COMPRESSION_THRESHOLD;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Logs compression metrics in development mode.
 *
 * @param operation - 'compress' or 'decompress'
 * @param metrics - The compression metrics to log
 */
function logCompressionMetrics(
  operation: 'compress' | 'decompress',
  metrics: CompressionMetrics
): void {
  if (process.env.NODE_ENV === 'development') {
    const savings =
      metrics.wasCompressed
        ? `${((1 - 1 / metrics.compressionRatio) * 100).toFixed(1)}%`
        : 'N/A';

    console.log(`[State Compression] ${operation}:`, {
      originalSize: `${(metrics.originalSize / 1024).toFixed(2)} KB`,
      compressedSize: `${(metrics.compressedSize / 1024).toFixed(2)} KB`,
      compressionRatio: metrics.compressionRatio.toFixed(2),
      savings,
      wasCompressed: metrics.wasCompressed,
    });
  }
}
