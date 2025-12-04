/**
 * File Storage Utility
 *
 * Handles file storage operations for document uploads.
 * For MVP, stores files locally in public/uploads directory.
 * In production, would use Supabase Storage or S3.
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'business-documents')

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * Generate unique filename with timestamp
 *
 * @param businessId - Business ID
 * @param originalName - Original filename
 * @returns Unique filename
 */
function generateFilename(businessId: string, originalName: string): string {
  const timestamp = Date.now()
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${businessId}-${timestamp}-${sanitized}`
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
 *
 * @param businessId - Business ID
 * @param file - File to store (Buffer or Uint8Array)
 * @param originalName - Original filename
 * @param mimeType - MIME type
 * @returns Stored file information
 */
export async function storeFileLocally(
  businessId: string,
  file: Buffer | Uint8Array,
  originalName: string,
  mimeType: string
): Promise<StoredFile> {
  await ensureUploadDir()

  const filename = generateFilename(businessId, originalName)
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
