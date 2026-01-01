/**
 * File Storage Module
 *
 * Provides a unified interface for file storage with multiple backend support.
 * Uses the adapter pattern for easy switching between providers.
 *
 * Environment Variables:
 * - FILE_STORAGE_PROVIDER: 'local' | 's3' | 'supabase' (default: 'local')
 * - For S3: AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * - For Supabase: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET
 *
 * @module storage
 *
 * @example
 * ```typescript
 * import { getFileStorage } from '@/lib/storage'
 *
 * const storage = getFileStorage()
 *
 * // Upload a file
 * const result = await storage.store(buffer, 'document.pdf', 'application/pdf', {
 *   businessId: 'cuid123',
 *   directory: 'business-documents',
 * })
 *
 * // Delete a file
 * await storage.delete(result.key)
 *
 * // Get signed URL (if supported)
 * const signedUrl = await storage.getSignedUrl(result.key, 3600)
 * ```
 */

import type {
  FileStorageAdapter,
  FileStorageProvider,
  StoredFile,
  UploadOptions,
  DeleteOptions,
  ListOptions,
  ListResult,
} from './types'
import { LocalStorageAdapter } from './adapters/local'
import { S3StorageAdapter } from './adapters/s3'
import { SupabaseStorageAdapter } from './adapters/supabase'

// Re-export types
export type {
  FileStorageAdapter,
  FileStorageProvider,
  StoredFile,
  UploadOptions,
  DeleteOptions,
  ListOptions,
  ListResult,
}

// Re-export adapters for direct use
export { LocalStorageAdapter } from './adapters/local'
export { S3StorageAdapter } from './adapters/s3'
export { SupabaseStorageAdapter } from './adapters/supabase'

/**
 * Singleton instance of the file storage adapter
 */
let storageInstance: FileStorageAdapter | null = null

/**
 * Get the configured file storage provider
 *
 * @returns The provider name from environment or 'local' as default
 */
export function getStorageProvider(): FileStorageProvider {
  const provider = process.env.FILE_STORAGE_PROVIDER as FileStorageProvider | undefined
  return provider || 'local'
}

/**
 * Create a file storage adapter based on configuration
 *
 * @param provider - Override the default provider from environment
 * @returns Configured file storage adapter
 */
export function createFileStorage(provider?: FileStorageProvider): FileStorageAdapter {
  const selectedProvider = provider || getStorageProvider()

  switch (selectedProvider) {
    case 'local':
      return new LocalStorageAdapter()

    case 's3': {
      const s3Bucket = process.env.AWS_S3_BUCKET
      const s3Region = process.env.AWS_REGION
      const s3AccessKey = process.env.AWS_ACCESS_KEY_ID
      const s3SecretKey = process.env.AWS_SECRET_ACCESS_KEY

      if (!s3Bucket || !s3Region || !s3AccessKey || !s3SecretKey) {
        throw new Error(
          'S3 storage requires AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables'
        )
      }

      return new S3StorageAdapter({
        bucket: s3Bucket,
        region: s3Region,
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretKey,
        endpoint: process.env.AWS_S3_ENDPOINT,
      })
    }

    case 'supabase': {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET

      if (!supabaseUrl || !supabaseKey || !supabaseBucket) {
        throw new Error(
          'Supabase storage requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET environment variables'
        )
      }

      return new SupabaseStorageAdapter({
        url: supabaseUrl,
        key: supabaseKey,
        bucket: supabaseBucket,
      })
    }

    case 'gcs':
    case 'azure':
      throw new Error(`${selectedProvider} storage adapter not yet implemented`)

    default:
      throw new Error(`Unknown storage provider: ${selectedProvider}`)
  }
}

/**
 * Get the singleton file storage instance
 *
 * Creates a new instance on first call based on environment configuration.
 * Subsequent calls return the same instance.
 *
 * @returns File storage adapter instance
 */
export function getFileStorage(): FileStorageAdapter {
  if (!storageInstance) {
    storageInstance = createFileStorage()
  }
  return storageInstance
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetFileStorage(): void {
  storageInstance = null
}

/**
 * Helper: Store a business document
 *
 * Convenience function for the common use case of storing business documents.
 *
 * @param businessId - Business ID
 * @param file - File content
 * @param originalName - Original filename
 * @param mimeType - MIME type
 * @returns Stored file information
 */
export async function storeBusinessDocument(
  businessId: string,
  file: Buffer | Uint8Array,
  originalName: string,
  mimeType: string
): Promise<StoredFile> {
  const storage = getFileStorage()
  return storage.store(file, originalName, mimeType, {
    businessId,
    directory: 'business-documents',
  })
}

/**
 * Helper: Delete a business document
 *
 * @param key - Storage key
 */
export async function deleteBusinessDocument(key: string): Promise<void> {
  const storage = getFileStorage()
  return storage.delete(key, { ignoreNotFound: true })
}

// =============================================================================
// LOCALSTORAGE QUOTA MANAGEMENT
// =============================================================================

/**
 * Re-export localStorage quota management utilities
 *
 * These utilities help manage browser localStorage quota, including:
 * - Usage calculation and reporting
 * - Quota detection and warnings
 * - Graceful degradation on quota exceeded
 * - LRU cleanup strategy
 *
 * @see quota-handler.ts for implementation details
 */
export {
  // Functions
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
  // Constants
  MAX_STORAGE_SIZE,
  QUOTA_WARNING_THRESHOLD,
  QUOTA_CRITICAL_THRESHOLD,
  HYVVE_PREFIX,
  DEFAULT_CLEANUP_TARGET,
  // Types
  type StorageResult,
  type StorageUsage,
} from './quota-handler'

// =============================================================================
// STATE MIGRATION SYSTEM (DM-11.8)
// =============================================================================

/**
 * Re-export state migration utilities
 *
 * These utilities handle dashboard state schema evolution:
 * - Version mismatch detection
 * - Sequential migration execution
 * - Data preservation through migrations
 * - Fallback to defaults on failure
 *
 * @see state-migrations.ts for implementation details
 * @see docs/modules/bm-dm/stories/dm-11-8-state-migration-system.md
 */
export {
  // Core functions
  detectVersionMismatch,
  needsMigration,
  getMigrationPath,
  migrateState,
  registerMigration,
  getRegisteredMigrations,
  clearMigrations,
  getDefaultState,
  // Constants
  STATE_VERSION,
  // Types
  type MigrationDefinition,
  type MigrationResult,
} from './state-migrations'
