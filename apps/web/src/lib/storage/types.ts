/**
 * File Storage Types
 *
 * Defines interfaces for the file storage abstraction layer.
 * Supports multiple storage backends via adapter pattern.
 *
 * @module storage/types
 */

/**
 * Stored file information returned after upload
 */
export interface StoredFile {
  /** Public URL to access the file */
  url: string
  /** Storage key/path for the file */
  key: string
  /** Original filename as uploaded */
  originalName: string
  /** MIME type of the file */
  mimeType: string
  /** File size in bytes */
  size: number
  /** Generated unique filename */
  filename: string
  /** Storage provider that stored the file */
  provider: FileStorageProvider
}

/**
 * Supported file storage providers
 */
export type FileStorageProvider = 'local' | 's3' | 'gcs' | 'azure' | 'supabase'

/**
 * Configuration for file storage adapters
 */
export interface FileStorageConfig {
  provider: FileStorageProvider

  // Local storage config
  local?: {
    uploadDir: string
    publicPath: string
  }

  // AWS S3 config
  s3?: {
    bucket: string
    region: string
    accessKeyId: string
    secretAccessKey: string
    endpoint?: string // For S3-compatible services
  }

  // Google Cloud Storage config
  gcs?: {
    bucket: string
    projectId: string
    credentials: string // JSON credentials
  }

  // Azure Blob Storage config
  azure?: {
    connectionString: string
    containerName: string
  }

  // Supabase Storage config
  supabase?: {
    url: string
    key: string
    bucket: string
  }
}

/**
 * File upload options
 */
export interface UploadOptions {
  /** Business ID for organizing files */
  businessId: string
  /** Directory prefix within storage */
  directory?: string
  /** Custom metadata to store with file */
  metadata?: Record<string, string>
  /** Content disposition (inline/attachment) */
  contentDisposition?: 'inline' | 'attachment'
  /** Cache control header value */
  cacheControl?: string
}

/**
 * File deletion options
 */
export interface DeleteOptions {
  /** Whether to ignore errors if file doesn't exist */
  ignoreNotFound?: boolean
}

/**
 * List files options
 */
export interface ListOptions {
  /** Prefix to filter files */
  prefix?: string
  /** Maximum number of files to return */
  limit?: number
  /** Continuation token for pagination */
  cursor?: string
}

/**
 * List files result
 */
export interface ListResult {
  files: Array<{
    key: string
    size: number
    lastModified: Date
    url: string
  }>
  /** Cursor for next page, undefined if no more */
  nextCursor?: string
}

/**
 * File Storage Adapter Interface
 *
 * All storage implementations must implement this interface.
 */
export interface FileStorageAdapter {
  /** Storage provider name */
  readonly provider: FileStorageProvider

  /**
   * Store a file in the storage backend
   *
   * @param file - File content as Buffer or Uint8Array
   * @param originalName - Original filename
   * @param mimeType - MIME type of the file
   * @param options - Upload options
   * @returns Stored file information
   */
  store(
    file: Buffer | Uint8Array,
    originalName: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<StoredFile>

  /**
   * Delete a file from storage
   *
   * @param key - Storage key/path of the file
   * @param options - Deletion options
   */
  delete(key: string, options?: DeleteOptions): Promise<void>

  /**
   * Check if a file exists
   *
   * @param key - Storage key/path of the file
   * @returns True if file exists
   */
  exists(key: string): Promise<boolean>

  /**
   * Get a signed URL for temporary access (if supported)
   *
   * @param key - Storage key/path of the file
   * @param expiresIn - Expiration time in seconds
   * @returns Signed URL or regular URL if signing not supported
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>

  /**
   * List files in storage
   *
   * @param options - List options
   * @returns List of files with optional pagination cursor
   */
  list(options?: ListOptions): Promise<ListResult>

  /**
   * Get file content
   *
   * @param key - Storage key/path of the file
   * @returns File content as Buffer
   */
  get(key: string): Promise<Buffer>
}
