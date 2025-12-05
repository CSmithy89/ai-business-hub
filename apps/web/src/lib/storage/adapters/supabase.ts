/**
 * Supabase Storage Adapter (Stub)
 *
 * Stores files in Supabase Storage.
 * Good option for projects already using Supabase.
 *
 * TODO: Implement when ready for production
 * - Install @supabase/supabase-js
 * - Implement all adapter methods
 *
 * @module storage/adapters/supabase
 */

import type {
  FileStorageAdapter,
  StoredFile,
  UploadOptions,
  DeleteOptions,
  ListOptions,
  ListResult,
} from '../types'

/**
 * Supabase storage adapter configuration
 */
interface SupabaseStorageConfig {
  url: string
  key: string
  bucket: string
}

/**
 * Supabase File Storage Adapter Implementation
 *
 * @example
 * ```typescript
 * const supabase = new SupabaseStorageAdapter({
 *   url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
 *   bucket: 'business-documents',
 * })
 * ```
 */
export class SupabaseStorageAdapter implements FileStorageAdapter {
  readonly provider = 'supabase' as const
  // @ts-expect-error - Config stored for future implementation
  private _config: SupabaseStorageConfig

  constructor(config: SupabaseStorageConfig) {
    this._config = config
  }

  async store(
    _file: Buffer | Uint8Array,
    _originalName: string,
    _mimeType: string,
    _options: UploadOptions
  ): Promise<StoredFile> {
    // TODO: Implement Supabase upload
    // 1. Create Supabase client
    // 2. Generate unique path with businessId prefix
    // 3. Upload with storage.from(bucket).upload()
    // 4. Return StoredFile with public URL

    throw new Error(
      'SupabaseStorageAdapter not implemented. ' +
      'Install @supabase/supabase-js and implement this method for production use.'
    )
  }

  async delete(_key: string, _options?: DeleteOptions): Promise<void> {
    // TODO: Implement with storage.from(bucket).remove()
    throw new Error('SupabaseStorageAdapter.delete not implemented')
  }

  async exists(_key: string): Promise<boolean> {
    // TODO: Implement by listing with specific path
    throw new Error('SupabaseStorageAdapter.exists not implemented')
  }

  async getSignedUrl(_key: string, _expiresIn: number = 3600): Promise<string> {
    // TODO: Implement with storage.from(bucket).createSignedUrl()
    throw new Error('SupabaseStorageAdapter.getSignedUrl not implemented')
  }

  async list(_options?: ListOptions): Promise<ListResult> {
    // TODO: Implement with storage.from(bucket).list()
    throw new Error('SupabaseStorageAdapter.list not implemented')
  }

  async get(_key: string): Promise<Buffer> {
    // TODO: Implement with storage.from(bucket).download()
    throw new Error('SupabaseStorageAdapter.get not implemented')
  }
}
