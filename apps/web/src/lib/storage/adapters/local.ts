/**
 * Local File Storage Adapter
 *
 * Stores files on the local filesystem.
 * Suitable for development and single-server deployments.
 *
 * ⚠️ Limitations:
 * - Not suitable for serverless/edge deployments
 * - Files lost on container restart (unless volume mounted)
 * - No built-in CDN or geographic distribution
 *
 * @module storage/adapters/local
 */

import { writeFile, mkdir, readFile, unlink, readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname, basename } from 'path'
import type {
  FileStorageAdapter,
  StoredFile,
  UploadOptions,
  DeleteOptions,
  ListOptions,
  ListResult,
} from '../types'

/**
 * Allowed file extensions for security
 */
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.md', '.png', '.jpg', '.jpeg', '.svg'] as const

/**
 * Local storage adapter configuration
 */
interface LocalStorageConfig {
  /** Base directory for uploads (relative to cwd) */
  uploadDir: string
  /** Public URL path prefix */
  publicPath: string
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LocalStorageConfig = {
  uploadDir: join(process.cwd(), 'public', 'uploads'),
  publicPath: '/uploads',
}

/**
 * Local File Storage Adapter Implementation
 */
export class LocalStorageAdapter implements FileStorageAdapter {
  readonly provider = 'local' as const
  private config: LocalStorageConfig

  constructor(config?: Partial<LocalStorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureDir(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }

  /**
   * Validate file extension for security
   */
  private validateExtension(filename: string): string {
    const ext = extname(filename).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
      throw new Error(`Invalid file extension: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
    }
    return ext
  }

  /**
   * Generate unique, safe filename
   */
  private generateFilename(businessId: string, originalName: string): string {
    const timestamp = Date.now()
    const ext = this.validateExtension(originalName)
    const baseFilename = basename(originalName, ext)

    // Sanitize for filesystem safety
    const sanitizedBase = baseFilename
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 100)
    const sanitizedBusinessId = businessId.replace(/[^a-zA-Z0-9_-]/g, '_')

    return `${sanitizedBusinessId}-${timestamp}-${sanitizedBase}${ext}`
  }

  async store(
    file: Buffer | Uint8Array,
    originalName: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<StoredFile> {
    const directory = options.directory || 'business-documents'
    const uploadDir = join(this.config.uploadDir, directory)

    await this.ensureDir(uploadDir)

    const filename = this.generateFilename(options.businessId, originalName)

    // Safety check: no path separators in filename
    if (filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename generated')
    }

    const filepath = join(uploadDir, filename)
    const key = `${directory}/${filename}`
    const url = `${this.config.publicPath}/${key}`

    await writeFile(filepath, file)

    return {
      url,
      key,
      originalName,
      mimeType,
      size: file.length,
      filename,
      provider: 'local',
    }
  }

  async delete(key: string, options?: DeleteOptions): Promise<void> {
    const filepath = join(this.config.uploadDir, key)

    try {
      await unlink(filepath)
    } catch (error) {
      if (options?.ignoreNotFound && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return
      }
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    const filepath = join(this.config.uploadDir, key)
    return existsSync(filepath)
  }

  async getSignedUrl(key: string): Promise<string> {
    // Local storage doesn't support signed URLs
    // Return the public URL instead
    return `${this.config.publicPath}/${key}`
  }

  async list(options?: ListOptions): Promise<ListResult> {
    const prefix = options?.prefix || ''
    const limit = options?.limit || 100
    const baseDir = prefix
      ? join(this.config.uploadDir, prefix)
      : this.config.uploadDir

    if (!existsSync(baseDir)) {
      return { files: [] }
    }

    const entries = await readdir(baseDir, { withFileTypes: true })
    const files: ListResult['files'] = []

    for (const entry of entries) {
      if (entry.isFile() && files.length < limit) {
        const key = prefix ? `${prefix}/${entry.name}` : entry.name
        const filepath = join(baseDir, entry.name)
        const stats = await stat(filepath)

        files.push({
          key,
          size: stats.size,
          lastModified: stats.mtime,
          url: `${this.config.publicPath}/${key}`,
        })
      }
    }

    return { files }
  }

  async get(key: string): Promise<Buffer> {
    const filepath = join(this.config.uploadDir, key)
    return readFile(filepath)
  }
}
