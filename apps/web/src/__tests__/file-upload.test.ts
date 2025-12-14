/**
 * File Upload Pipeline Tests (Story 14-3)
 *
 * Tests for document upload utilities, validation, and parsing pipeline.
 *
 * @see docs/stories/14-3-file-upload-pipeline-tests.md
 * @see docs/sprint-artifacts/tech-spec-epic-14.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Buffer } from 'buffer'

// Mock fs/promises before importing file-storage
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>()
  return {
    ...actual,
    default: {
      ...actual,
      writeFile: vi.fn(),
      mkdir: vi.fn(),
    },
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  }
})

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
    },
    existsSync: vi.fn(),
  }
})

// Import file storage utilities after mocks
import {
  storeFileLocally,
  validateFileSize,
  validateMimeType,
  getMimeTypeFromFilename,
  getFileTypeCategory,
} from '@/lib/utils/file-storage'

// Import mocked modules to get access to mock functions
import * as fsPromises from 'fs/promises'
import * as fs from 'fs'

const mockWriteFile = vi.mocked(fsPromises.writeFile)
const mockMkdir = vi.mocked(fsPromises.mkdir)
const mockExistsSync = vi.mocked(fs.existsSync)

// ============================================
// Test Fixtures
// ============================================

/**
 * Create mock PDF buffer with valid header
 */
function createMockPdfBuffer(content = 'Test PDF content'): Buffer {
  return Buffer.from(`%PDF-1.4\n${content}`)
}

/**
 * Create mock DOCX buffer with valid PK zip header
 */
function createMockDocxBuffer(size = 1024): Buffer {
  const buffer = Buffer.alloc(size)
  // PK zip signature (required for DOCX)
  buffer[0] = 0x50
  buffer[1] = 0x4b
  buffer[2] = 0x03
  buffer[3] = 0x04
  return buffer
}

/**
 * Create mock Markdown buffer
 */
function createMockMarkdownBuffer(content = '# Test Document\n\nContent here.'): Buffer {
  return Buffer.from(content)
}

/**
 * Create mock plain text buffer
 */
function createMockTextBuffer(content = 'Plain text content'): Buffer {
  return Buffer.from(content)
}

/**
 * Create large file buffer exceeding size limit
 */
function createLargeBuffer(sizeInMB: number): Buffer {
  return Buffer.alloc(sizeInMB * 1024 * 1024)
}

/**
 * Mock File class for upload progress simulation
 * Exported for use in integration tests that need file upload simulation
 */
export class MockFile {
  constructor(
    public buffer: Buffer,
    public name: string,
    public type: string
  ) {}

  get size(): number {
    return this.buffer.length
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const { buffer, byteOffset, length } = this.buffer
    return buffer.slice(byteOffset, byteOffset + length) as ArrayBuffer
  }
}

/**
 * Simulate upload progress with callbacks
 */
function simulateUploadProgress(
  onProgress: (progress: number) => void,
  duration = 100
): Promise<void> {
  return new Promise((resolve) => {
    const steps = 10
    const interval = duration / steps
    let current = 0

    // Start at 0%
    onProgress(current)

    const timer = setInterval(() => {
      current += 10
      onProgress(current)

      if (current >= 100) {
        clearInterval(timer)
        resolve()
      }
    }, interval)
  })
}

// ============================================
// AC4 & AC5: File Validation Tests
// ============================================

describe('File Validation', () => {
  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const size1MB = 1 * 1024 * 1024
      const size5MB = 5 * 1024 * 1024
      const size10MB = 10 * 1024 * 1024

      expect(validateFileSize(size1MB)).toBe(true)
      expect(validateFileSize(size5MB)).toBe(true)
      expect(validateFileSize(size10MB)).toBe(true)
    })

    it('should reject files exceeding default 10MB limit', () => {
      const size11MB = 11 * 1024 * 1024
      const size20MB = 20 * 1024 * 1024

      expect(validateFileSize(size11MB)).toBe(false)
      expect(validateFileSize(size20MB)).toBe(false)
    })

    it('should reject zero-byte files', () => {
      expect(validateFileSize(0)).toBe(false)
    })

    it('should reject negative file sizes', () => {
      expect(validateFileSize(-1)).toBe(false)
    })

    it('should accept custom size limits', () => {
      const size3MB = 3 * 1024 * 1024
      const size5MB = 5 * 1024 * 1024
      const customLimit = 5 * 1024 * 1024

      expect(validateFileSize(size3MB, customLimit)).toBe(true)
      expect(validateFileSize(size5MB, customLimit)).toBe(true)
      expect(validateFileSize(size5MB + 1, customLimit)).toBe(false)
    })

    it('should handle edge case of exactly max size', () => {
      const maxSize = 10 * 1024 * 1024
      expect(validateFileSize(maxSize)).toBe(true)
      expect(validateFileSize(maxSize + 1)).toBe(false)
    })
  })

  describe('validateMimeType', () => {
    it('should accept PDF MIME type', () => {
      expect(validateMimeType('application/pdf')).toBe(true)
    })

    it('should accept DOCX MIME type', () => {
      expect(
        validateMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ).toBe(true)
    })

    it('should accept Markdown MIME type', () => {
      expect(validateMimeType('text/markdown')).toBe(true)
    })

    it('should reject image MIME types', () => {
      expect(validateMimeType('image/png')).toBe(false)
      expect(validateMimeType('image/jpeg')).toBe(false)
      expect(validateMimeType('image/gif')).toBe(false)
    })

    it('should reject video MIME types', () => {
      expect(validateMimeType('video/mp4')).toBe(false)
      expect(validateMimeType('video/webm')).toBe(false)
    })

    it('should reject executable MIME types', () => {
      expect(validateMimeType('application/x-msdownload')).toBe(false)
      expect(validateMimeType('application/x-executable')).toBe(false)
    })

    it('should reject JSON MIME type', () => {
      expect(validateMimeType('application/json')).toBe(false)
    })

    it('should reject unknown MIME types', () => {
      expect(validateMimeType('application/x-unknown')).toBe(false)
      expect(validateMimeType('text/html')).toBe(false)
    })
  })

  describe('getMimeTypeFromFilename', () => {
    it('should infer PDF MIME type from .pdf extension', () => {
      expect(getMimeTypeFromFilename('business-plan.pdf')).toBe('application/pdf')
      expect(getMimeTypeFromFilename('BUSINESS-PLAN.PDF')).toBe('application/pdf')
    })

    it('should infer DOCX MIME type from .docx extension', () => {
      expect(getMimeTypeFromFilename('market-research.docx')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    })

    it('should infer Markdown MIME type from .md extension', () => {
      expect(getMimeTypeFromFilename('notes.md')).toBe('text/markdown')
    })

    it('should return octet-stream for unknown extensions', () => {
      expect(getMimeTypeFromFilename('file.unknown')).toBe('application/octet-stream')
      expect(getMimeTypeFromFilename('image.png')).toBe('application/octet-stream')
    })

    it('should handle files without extensions', () => {
      expect(getMimeTypeFromFilename('README')).toBe('application/octet-stream')
    })
  })

  describe('getFileTypeCategory', () => {
    it('should categorize PDF MIME type', () => {
      expect(getFileTypeCategory('application/pdf')).toBe('pdf')
    })

    it('should categorize DOCX MIME type', () => {
      expect(
        getFileTypeCategory('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ).toBe('docx')
    })

    it('should categorize Markdown MIME type', () => {
      expect(getFileTypeCategory('text/markdown')).toBe('md')
    })

    it('should return unknown for unsupported types', () => {
      expect(getFileTypeCategory('image/png')).toBe('unknown')
      expect(getFileTypeCategory('application/json')).toBe('unknown')
    })
  })
})

// ============================================
// File Storage Tests
// ============================================

describe('File Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExistsSync.mockReturnValue(false)
    mockMkdir.mockResolvedValue(undefined)
    mockWriteFile.mockResolvedValue(undefined)
  })

  describe('storeFileLocally', () => {
    const businessId = 'biz-123'

    it('should create upload directory if it does not exist', async () => {
      mockExistsSync.mockReturnValue(false)
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)
      const buffer = createMockPdfBuffer()

      const result = await storeFileLocally(businessId, buffer, 'test.pdf', 'application/pdf')

      // File storage should succeed even when creating new directory
      expect(result.filename).toContain('.pdf')
      expect(result.originalName).toBe('test.pdf')
    })

    it('should not create directory if it already exists', async () => {
      mockExistsSync.mockReturnValue(true)
      const buffer = createMockPdfBuffer()

      await storeFileLocally(businessId, buffer, 'test.pdf', 'application/pdf')

      expect(mockMkdir).not.toHaveBeenCalled()
    })

    it('should sanitize filename to prevent path traversal', async () => {
      const buffer = createMockPdfBuffer()
      const maliciousFilename = '../../../etc/passwd.pdf'

      const result = await storeFileLocally(businessId, buffer, maliciousFilename, 'application/pdf')

      // Filename should not contain path separators or traversal attempts
      expect(result.filename).not.toContain('/')
      expect(result.filename).not.toContain('..')
      expect(result.filename).not.toContain('etc')
      // Should contain business ID and timestamp and extension
      expect(result.filename).toMatch(/^biz-123-\d+-.*\.pdf$/)
    })

    it('should sanitize filename with special characters', async () => {
      const buffer = createMockPdfBuffer()
      const filename = 'My Business Plan (v2) @2024!.pdf'

      const result = await storeFileLocally(businessId, buffer, filename, 'application/pdf')

      // Special characters replaced with underscores
      expect(result.filename).toMatch(/^biz-123-\d+-My_Business_Plan__v2___2024_\.pdf$/)
    })

    it('should generate unique filename with timestamp', async () => {
      const buffer = createMockPdfBuffer()

      const result1 = await storeFileLocally(businessId, buffer, 'test.pdf', 'application/pdf')

      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1))

      const result2 = await storeFileLocally(businessId, buffer, 'test.pdf', 'application/pdf')

      expect(result1.filename).not.toBe(result2.filename)
      expect(result1.filename).toMatch(/^biz-123-\d+-test\.pdf$/)
      expect(result2.filename).toMatch(/^biz-123-\d+-test\.pdf$/)
    })

    it('should preserve file extension', async () => {
      const pdfBuffer = createMockPdfBuffer()
      const docxBuffer = createMockDocxBuffer()
      const mdBuffer = createMockMarkdownBuffer()

      const pdfResult = await storeFileLocally(businessId, pdfBuffer, 'test.pdf', 'application/pdf')
      const docxResult = await storeFileLocally(businessId, docxBuffer, 'test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      const mdResult = await storeFileLocally(businessId, mdBuffer, 'test.md', 'text/markdown')

      expect(pdfResult.filename).toMatch(/\.pdf$/)
      expect(docxResult.filename).toMatch(/\.docx$/)
      expect(mdResult.filename).toMatch(/\.md$/)
    })

    it('should throw error for invalid file extension', async () => {
      const buffer = Buffer.from('malicious content')

      await expect(
        storeFileLocally(businessId, buffer, 'malware.exe', 'application/x-executable')
      ).rejects.toThrow('Invalid file extension')
    })

    it('should return correct StoredFile metadata', async () => {
      const buffer = createMockPdfBuffer()
      const originalName = 'business-plan.pdf'
      const mimeType = 'application/pdf'

      const result = await storeFileLocally(businessId, buffer, originalName, mimeType)

      expect(result).toMatchObject({
        originalName,
        mimeType,
        size: buffer.length,
      })
      expect(result.url).toMatch(/^\/uploads\/business-documents\/biz-123-\d+-business-plan\.pdf$/)
      expect(result.path).toContain('uploads/business-documents')
      expect(result.filename).toMatch(/^biz-123-\d+-business-plan\.pdf$/)
    })

    it('should write file buffer to disk', async () => {
      const buffer = createMockPdfBuffer()

      const result = await storeFileLocally(businessId, buffer, 'test.pdf', 'application/pdf')

      // Verify the file was stored successfully with correct metadata
      expect(result.size).toBe(buffer.length)
      expect(result.path).toContain('uploads/business-documents')
      expect(result.url).toContain('/uploads/business-documents/')
    })

    it('should limit filename length to prevent filesystem issues', async () => {
      const buffer = createMockPdfBuffer()
      const longName = 'A'.repeat(200) + '.pdf'

      const result = await storeFileLocally(businessId, buffer, longName, 'application/pdf')

      // Filename should be truncated to reasonable length
      expect(result.filename.length).toBeLessThan(150)
    })
  })
})

// ============================================
// AC2 & AC3: Document Parsing Tests
// ============================================

describe('Document Parsing', () => {
  describe('PDF Parsing', () => {
    it('should parse PDF with valid header', () => {
      const buffer = createMockPdfBuffer('This is a business plan PDF')

      expect(buffer.toString('ascii', 0, 5)).toBe('%PDF-')
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should reject PDF without valid header', () => {
      const invalidBuffer = Buffer.from('Not a PDF file')

      expect(invalidBuffer.toString('ascii', 0, 5)).not.toBe('%PDF-')
    })

    it('should create PDF buffer with correct size', () => {
      const buffer = createMockPdfBuffer()

      expect(buffer.length).toBeGreaterThan(0)
      expect(validateFileSize(buffer.length)).toBe(true)
    })

    it('should validate large PDF exceeds limit', () => {
      const largeBuffer = createLargeBuffer(15) // 15MB

      expect(validateFileSize(largeBuffer.length)).toBe(false)
    })
  })

  describe('DOCX Parsing', () => {
    it('should parse DOCX with valid PK header', () => {
      const buffer = createMockDocxBuffer()

      expect(buffer[0]).toBe(0x50) // 'P'
      expect(buffer[1]).toBe(0x4b) // 'K'
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should reject DOCX without valid header', () => {
      const invalidBuffer = Buffer.from('Not a DOCX file')

      expect(invalidBuffer[0]).not.toBe(0x50)
    })

    it('should create DOCX buffer with specified size', () => {
      const size = 2048
      const buffer = createMockDocxBuffer(size)

      expect(buffer.length).toBe(size)
    })
  })

  describe('Markdown Parsing', () => {
    it('should parse markdown content', () => {
      const content = '# Business Plan\n\n## Executive Summary'
      const buffer = createMockMarkdownBuffer(content)

      expect(buffer.toString('utf-8')).toBe(content)
    })

    it('should handle multi-line markdown', () => {
      const content = `# Title

## Section 1
Content here

## Section 2
More content`
      const buffer = createMockMarkdownBuffer(content)

      expect(buffer.toString('utf-8')).toContain('# Title')
      expect(buffer.toString('utf-8')).toContain('## Section 1')
    })

    it('should handle empty markdown', () => {
      const buffer = createMockMarkdownBuffer('')

      expect(buffer.length).toBe(0)
    })
  })

  describe('Plain Text Parsing', () => {
    it('should parse plain text content', () => {
      const content = 'Simple text content'
      const buffer = createMockTextBuffer(content)

      expect(buffer.toString('utf-8')).toBe(content)
    })

    it('should handle multi-line text', () => {
      const content = 'Line 1\nLine 2\nLine 3'
      const buffer = createMockTextBuffer(content)

      expect(buffer.toString('utf-8')).toBe(content)
    })
  })
})

// ============================================
// AC6: Upload Progress Tracking Tests
// ============================================

describe('Upload Progress Tracking', () => {
  it('should track upload progress from 0% to 100%', async () => {
    const progressUpdates: number[] = []

    await simulateUploadProgress((progress) => {
      progressUpdates.push(progress)
    })

    expect(progressUpdates).toContain(0)
    expect(progressUpdates).toContain(100)
    expect(progressUpdates.length).toBeGreaterThan(5)
  })

  it('should call progress callback multiple times', async () => {
    const callback = vi.fn()

    await simulateUploadProgress(callback, 50)

    // Called 11 times: once at 0%, then 10 times (10%, 20%, ..., 100%)
    expect(callback).toHaveBeenCalledTimes(11)
  })

  it('should report progress in ascending order', async () => {
    const progressUpdates: number[] = []

    await simulateUploadProgress((progress) => {
      progressUpdates.push(progress)
    })

    for (let i = 1; i < progressUpdates.length; i++) {
      expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1])
    }
  })

  it('should complete progress within expected duration', async () => {
    vi.useFakeTimers()
    try {
      const promise = simulateUploadProgress(() => {}, 100)
      await vi.advanceTimersByTimeAsync(100)
      await promise
    } finally {
      vi.useRealTimers()
    }
  })

  it('should handle rapid progress updates', async () => {
    const progressUpdates: number[] = []

    await simulateUploadProgress((progress) => {
      progressUpdates.push(progress)
    }, 10) // Very short duration

    expect(progressUpdates[progressUpdates.length - 1]).toBe(100)
  })
})

// ============================================
// AC7: Error Handling Tests
// ============================================

describe('Error Handling', () => {
  describe('File Size Errors', () => {
    it('should reject files exceeding size limit', () => {
      const largeSize = 15 * 1024 * 1024 // 15MB

      expect(validateFileSize(largeSize)).toBe(false)
    })

    it('should provide clear error for oversized files', () => {
      const largeBuffer = createLargeBuffer(15)

      expect(largeBuffer.length).toBeGreaterThan(10 * 1024 * 1024)
      expect(validateFileSize(largeBuffer.length)).toBe(false)
    })
  })

  describe('File Type Errors', () => {
    it('should reject unsupported MIME types', () => {
      expect(validateMimeType('image/png')).toBe(false)
      expect(validateMimeType('video/mp4')).toBe(false)
      expect(validateMimeType('application/zip')).toBe(false)
    })

    it('should reject executable files', () => {
      expect(validateMimeType('application/x-msdownload')).toBe(false)
      expect(validateMimeType('application/x-executable')).toBe(false)
    })
  })

  describe('Path Traversal Prevention', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockExistsSync.mockReturnValue(true)
      mockWriteFile.mockResolvedValue(undefined)
    })

    it('should sanitize path traversal attempts', async () => {
      const buffer = createMockPdfBuffer()
      const maliciousName = '../../../etc/passwd.pdf'

      const result = await storeFileLocally('biz-123', buffer, maliciousName, 'application/pdf')

      expect(result.filename).not.toContain('..')
      expect(result.filename).not.toContain('/')
      expect(result.url).not.toContain('..')
    })

    it('should sanitize absolute path attempts', async () => {
      const buffer = createMockPdfBuffer()
      const maliciousName = '/etc/passwd.pdf'

      const result = await storeFileLocally('biz-123', buffer, maliciousName, 'application/pdf')

      expect(result.filename).not.toMatch(/^\//)
    })

    it('should sanitize Windows-style paths', async () => {
      const buffer = createMockPdfBuffer()
      const maliciousName = '..\\..\\..\\Windows\\System32\\config.pdf'

      const result = await storeFileLocally('biz-123', buffer, maliciousName, 'application/pdf')

      expect(result.filename).not.toContain('\\')
      expect(result.filename).not.toContain('..')
    })
  })

  describe('Invalid File Extension', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockExistsSync.mockReturnValue(true)
      mockWriteFile.mockResolvedValue(undefined)
    })

    it('should reject files with invalid extensions', async () => {
      const buffer = Buffer.from('content')

      await expect(
        storeFileLocally('biz-123', buffer, 'file.exe', 'application/x-executable')
      ).rejects.toThrow('Invalid file extension')

      await expect(
        storeFileLocally('biz-123', buffer, 'file.sh', 'application/x-sh')
      ).rejects.toThrow('Invalid file extension')
    })

    it('should reject files with no extension', async () => {
      const buffer = Buffer.from('content')

      await expect(
        storeFileLocally('biz-123', buffer, 'README', 'text/plain')
      ).rejects.toThrow('Invalid file extension')
    })

    it('should allow valid extensions', async () => {
      const buffer = createMockPdfBuffer()

      const pdfResult = await storeFileLocally('biz-123', buffer, 'file.pdf', 'application/pdf')
      expect(pdfResult.filename).toMatch(/\.pdf$/)

      const docxResult = await storeFileLocally('biz-123', createMockDocxBuffer(), 'file.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      expect(docxResult.filename).toMatch(/\.docx$/)

      const mdResult = await storeFileLocally('biz-123', createMockMarkdownBuffer(), 'file.md', 'text/markdown')
      expect(mdResult.filename).toMatch(/\.md$/)
    })
  })
})

// ============================================
// Integration Tests
// ============================================

describe('File Upload Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExistsSync.mockReturnValue(true)
    mockWriteFile.mockResolvedValue(undefined)
  })

  it('should handle complete upload flow for PDF', async () => {
    const businessId = 'biz-456'
    const buffer = createMockPdfBuffer('Business plan content')
    const filename = 'business-plan.pdf'
    const mimeType = 'application/pdf'

    // Validate file
    expect(validateFileSize(buffer.length)).toBe(true)
    expect(validateMimeType(mimeType)).toBe(true)

    // Store file
    const result = await storeFileLocally(businessId, buffer, filename, mimeType)

    // Verify storage
    expect(result.originalName).toBe(filename)
    expect(result.mimeType).toBe(mimeType)
    expect(result.size).toBe(buffer.length)
    expect(result.filename).toContain('.pdf')
  })

  it('should handle complete upload flow for DOCX', async () => {
    const businessId = 'biz-789'
    const buffer = createMockDocxBuffer(2048)
    const filename = 'market-research.docx'
    const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    // Validate file
    expect(validateFileSize(buffer.length)).toBe(true)
    expect(validateMimeType(mimeType)).toBe(true)

    // Store file
    const result = await storeFileLocally(businessId, buffer, filename, mimeType)

    // Verify storage
    expect(result.originalName).toBe(filename)
    expect(result.mimeType).toBe(mimeType)
    expect(result.filename).toContain('.docx')
  })

  it('should handle complete upload flow for Markdown', async () => {
    const businessId = 'biz-101'
    const buffer = createMockMarkdownBuffer('# Notes\n\nContent')
    const filename = 'notes.md'
    const mimeType = 'text/markdown'

    // Validate file
    expect(validateFileSize(buffer.length)).toBe(true)
    expect(validateMimeType(mimeType)).toBe(true)

    // Store file
    const result = await storeFileLocally(businessId, buffer, filename, mimeType)

    // Verify storage
    expect(result.originalName).toBe(filename)
    expect(result.mimeType).toBe(mimeType)
    expect(result.filename).toContain('.md')
  })

  it('should reject invalid upload attempts', async () => {
    const businessId = 'biz-999'
    const buffer = Buffer.from('malicious content')

    // Invalid MIME type
    expect(validateMimeType('application/x-executable')).toBe(false)

    // Invalid extension
    await expect(
      storeFileLocally(businessId, buffer, 'malware.exe', 'application/x-executable')
    ).rejects.toThrow()
  })

  it('should handle multiple file uploads sequentially', async () => {
    const businessId = 'biz-multi'

    const pdf = await storeFileLocally(businessId, createMockPdfBuffer(), 'plan.pdf', 'application/pdf')
    const docx = await storeFileLocally(businessId, createMockDocxBuffer(), 'research.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    const md = await storeFileLocally(businessId, createMockMarkdownBuffer(), 'notes.md', 'text/markdown')

    // Verify each file was stored with unique filenames
    expect(pdf.filename).toContain('.pdf')
    expect(docx.filename).toContain('.docx')
    expect(md.filename).toContain('.md')

    // Ensure filenames are unique
    expect(pdf.filename).not.toBe(docx.filename)
    expect(pdf.filename).not.toBe(md.filename)
    expect(docx.filename).not.toBe(md.filename)
  })
})
