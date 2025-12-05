/**
 * AWS S3 Storage Adapter (Stub)
 *
 * Stores files in Amazon S3 or S3-compatible services.
 * Suitable for production deployments with scalability needs.
 *
 * TODO: Implement when ready for production
 * - Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
 * - Implement all adapter methods
 *
 * @module storage/adapters/s3
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
 * S3 storage adapter configuration
 */
interface S3StorageConfig {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string // For S3-compatible services (MinIO, DigitalOcean Spaces, etc.)
}

/**
 * AWS S3 File Storage Adapter Implementation
 *
 * @example
 * ```typescript
 * const s3 = new S3StorageAdapter({
 *   bucket: 'my-bucket',
 *   region: 'us-east-1',
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
 * })
 * ```
 */
export class S3StorageAdapter implements FileStorageAdapter {
  readonly provider = 's3' as const
  // @ts-expect-error - Config stored for future implementation
  private _config: S3StorageConfig

  constructor(config: S3StorageConfig) {
    this._config = config
  }

  async store(
    _file: Buffer | Uint8Array,
    _originalName: string,
    _mimeType: string,
    _options: UploadOptions
  ): Promise<StoredFile> {
    // TODO: Implement S3 upload
    // 1. Generate unique key with businessId prefix
    // 2. Upload to S3 with PutObjectCommand
    // 3. Return StoredFile with S3 URL

    throw new Error(
      'S3StorageAdapter not implemented. ' +
      'Install @aws-sdk/client-s3 and implement this method for production use.'
    )
  }

  async delete(_key: string, _options?: DeleteOptions): Promise<void> {
    // TODO: Implement S3 delete with DeleteObjectCommand
    throw new Error('S3StorageAdapter.delete not implemented')
  }

  async exists(_key: string): Promise<boolean> {
    // TODO: Implement with HeadObjectCommand
    throw new Error('S3StorageAdapter.exists not implemented')
  }

  async getSignedUrl(_key: string, _expiresIn: number = 3600): Promise<string> {
    // TODO: Implement with getSignedUrl from @aws-sdk/s3-request-presigner
    throw new Error('S3StorageAdapter.getSignedUrl not implemented')
  }

  async list(_options?: ListOptions): Promise<ListResult> {
    // TODO: Implement with ListObjectsV2Command
    throw new Error('S3StorageAdapter.list not implemented')
  }

  async get(_key: string): Promise<Buffer> {
    // TODO: Implement with GetObjectCommand
    throw new Error('S3StorageAdapter.get not implemented')
  }
}
