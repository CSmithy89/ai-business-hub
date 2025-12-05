/**
 * File Storage Utility
 *
 * Handles file storage operations for document uploads.
 *
 * ⚠️ MVP ONLY - For production:
 * - Replace fs operations with cloud storage (Supabase/S3)
 * - This won't work in edge runtime or serverless environments
 * - Add rate limiting middleware to prevent DOS attacks
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname, basename } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'business-documents')

/**
 * Allowed file extensions for upload
 * Security: Only these extensions are permitted
 */
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.md'] as const

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * Validate and extract file extension
 * Security: Prevents path traversal and validates extension
 *
 * @param filename - Original filename
 * @returns Validated extension or throws error
 */
function validateExtension(filename: string): string {
  const ext = extname(filename).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    throw new Error(`Invalid file extension: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
  }
  return ext
}

/**
 * Generate unique filename with timestamp
 * Security: Properly sanitizes to prevent path traversal
 *
 * @param businessId - Business ID (must be CUID format)
 * @param originalName - Original filename
 * @returns Unique filename with preserved extension
 * @throws Error if extension is not allowed
 */
function generateFilename(businessId: string, originalName: string): string {
  const timestamp = Date.now()

  // Validate and extract extension first (throws if invalid)
  const ext = validateExtension(originalName)

  // Extract basename without extension
  const baseFilename = basename(originalName, ext)

  // Sanitize basename only (alphanumeric, underscore, hyphen)
  // Limit length to prevent filesystem issues
  const sanitizedBasename = baseFilename
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 100)

  // Sanitize businessId (should be CUID, but sanitize anyway)
  const sanitizedBusinessId = businessId.replace(/[^a-zA-Z0-9_-]/g, '_')

  return `${sanitizedBusinessId}-${timestamp}-${sanitizedBasename}${ext}`
}

/**
 * Get file extension from filename
 *
 * @param filename - Filename
 * @returns File extension
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * Determine MIME type from file extension
 *
 * @param filename - Filename
 * @returns MIME type
 */
export function getMimeTypeFromFilename(filename: string): string {
  const ext = getFileExtension(filename)

  switch (ext) {
    case 'pdf':
      return 'application/pdf'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'md':
      return 'text/markdown'
    default:
      return 'application/octet-stream'
  }
}

export interface StoredFile {
  url: string
  path: string
  originalName: string
  mimeType: string
  size: number
  filename: string
}

/**
 * Store file locally in uploads directory
 * Security: Validates extension and sanitizes all path components
 *
 * @param businessId - Business ID
 * @param file - File to store (Buffer or Uint8Array)
 * @param originalName - Original filename
 * @param mimeType - MIME type
 * @returns Stored file information
 * @throws Error if file extension is not allowed
 */
export async function storeFileLocally(
  businessId: string,
  file: Buffer | Uint8Array,
  originalName: string,
  mimeType: string
): Promise<StoredFile> {
  await ensureUploadDir()

  // generateFilename now handles all sanitization and validation
  // Throws if extension is invalid
  const filename = generateFilename(businessId, originalName)

  // Final safety check: ensure no path separators in generated filename
  if (filename.includes('/') || filename.includes('\\')) {
    throw new Error('Invalid filename generated')
  }

  const filepath = join(UPLOAD_DIR, filename)

  // Write file to disk
  await writeFile(filepath, file)

  return {
    url: `/uploads/business-documents/${filename}`,
    path: filepath,
    originalName,
    mimeType,
    size: file.length,
    filename,
  }
}

/**
 * Get file type category from MIME type
 *
 * @param mimeType - MIME type
 * @returns File type category
 */
export function getFileTypeCategory(mimeType: string): 'pdf' | 'docx' | 'md' | 'unknown' {
  switch (mimeType) {
    case 'application/pdf':
      return 'pdf'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx'
    case 'text/markdown':
      return 'md'
    default:
      return 'unknown'
  }
}

/**
 * Validate file size
 *
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes (default 10MB)
 * @returns True if valid
 */
export function validateFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return size > 0 && size <= maxSize
}

/**
 * Validate MIME type
 *
 * @param mimeType - MIME type to validate
 * @returns True if valid
 */
export function validateMimeType(mimeType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
  ]
  return allowedTypes.includes(mimeType)
}
