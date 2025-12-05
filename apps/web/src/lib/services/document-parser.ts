/**
 * Document Parser Service
 *
 * Parses uploaded documents (PDF, DOCX, MD) and extracts text content.
 * Uses pdf-parse for PDFs and mammoth for DOCX files.
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

/**
 * Maximum file size for document parsing (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Parse PDF file to extract text
 *
 * Uses pdf-parse library for text extraction.
 * Handles multi-page documents and returns plain text.
 *
 * @param buffer - PDF file buffer
 * @returns Extracted text content
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('PDF file exceeds maximum size of 10MB')
  }

  // Verify PDF signature
  const header = buffer.slice(0, 5).toString('ascii')
  if (!header.startsWith('%PDF')) {
    throw new Error('Invalid PDF file: missing PDF header')
  }

  let parser: PDFParse | null = null
  try {
    // Create parser with buffer data
    parser = new PDFParse({ data: buffer })

    // Get document info for page count
    const info = await parser.getInfo()
    const numPages = info.pages?.length ?? 0

    // Extract text from all pages (first 100 pages for performance)
    const textResult = await parser.getText({
      first: 100, // Limit to first 100 pages for performance
    })

    const text = textResult.text?.trim()

    if (!text || text.length === 0) {
      return `[PDF Document - ${Math.round(buffer.length / 1024)}KB, ${numPages} pages]\n\nNote: This PDF contains no extractable text. It may be a scanned document or image-based PDF. Please use a text-based document or manually enter your business information.`
    }

    return text
  } catch (error) {
    // Handle pdf-parse specific errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('encrypted') || errorMessage.includes('password')) {
      throw new Error('Cannot parse password-protected PDF. Please remove password protection and try again.')
    }

    if (errorMessage.includes('Invalid') || errorMessage.includes('corrupt')) {
      throw new Error('Invalid or corrupted PDF file. Please try a different file.')
    }

    throw new Error(`Failed to parse PDF: ${errorMessage}`)
  } finally {
    // Clean up parser resources
    if (parser) {
      await parser.destroy().catch(() => {})
    }
  }
}

/**
 * Parse DOCX file to extract text
 *
 * Uses mammoth library for DOCX parsing.
 * Extracts plain text, preserving paragraph structure.
 *
 * @param buffer - DOCX file buffer
 * @returns Extracted text content
 */
async function parseDocx(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('DOCX file exceeds maximum size of 10MB')
  }

  // Verify DOCX signature (PK zip file header)
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error('Invalid DOCX file: not a valid Office document')
  }

  try {
    const result = await mammoth.extractRawText({ buffer })

    const text = result.value?.trim()

    // Log any conversion warnings
    if (result.messages?.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages)
    }

    if (!text || text.length === 0) {
      return `[DOCX Document - ${Math.round(buffer.length / 1024)}KB]\n\nNote: This document contains no extractable text. Please ensure the document has text content and try again.`
    }

    return text
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('encrypted') || errorMessage.includes('password')) {
      throw new Error('Cannot parse password-protected document. Please remove password protection and try again.')
    }

    if (errorMessage.includes('Could not find')) {
      throw new Error('Invalid DOCX file: corrupted or missing content.')
    }

    throw new Error(`Failed to parse DOCX: ${errorMessage}`)
  }
}

/**
 * Parse Markdown file to extract text
 *
 * Returns raw markdown content as-is.
 *
 * @param buffer - Markdown file buffer
 * @returns Markdown text content
 */
async function parseMarkdown(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('Markdown file exceeds maximum size of 10MB')
  }

  try {
    const text = buffer.toString('utf-8')

    if (!text || text.trim().length === 0) {
      throw new Error('Empty markdown file')
    }

    return text
  } catch (error) {
    if (error instanceof Error && error.message === 'Empty markdown file') {
      throw error
    }
    throw new Error('Failed to parse markdown file: invalid encoding')
  }
}

/**
 * Parse plain text file
 *
 * @param buffer - Text file buffer
 * @returns Text content
 */
async function parseText(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('Text file exceeds maximum size of 10MB')
  }

  const text = buffer.toString('utf-8')

  if (!text || text.trim().length === 0) {
    throw new Error('Empty text file')
  }

  return text
}

/**
 * Parse document based on file type
 *
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file
 * @returns Extracted text content
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return await parsePdf(buffer)

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await parseDocx(buffer)

    case 'text/markdown':
    case 'text/x-markdown':
      return await parseMarkdown(buffer)

    case 'text/plain':
      return await parseText(buffer)

    default:
      throw new Error(`Unsupported file type: ${mimeType}`)
  }
}

/**
 * Infer document type from filename and content
 *
 * @param filename - Original filename
 * @param content - Extracted text content
 * @returns Document type classification
 */
export function inferDocumentType(
  filename: string,
  content: string
): 'business_plan' | 'market_research' | 'brand_guide' | 'pitch_deck' | 'unknown' {
  const lowerFilename = filename.toLowerCase()
  const lowerContent = content.toLowerCase()

  // Check filename first
  if (lowerFilename.includes('business') && lowerFilename.includes('plan')) {
    return 'business_plan'
  }
  if (
    lowerFilename.includes('market') ||
    lowerFilename.includes('research') ||
    lowerFilename.includes('analysis')
  ) {
    return 'market_research'
  }
  if (lowerFilename.includes('brand') || lowerFilename.includes('style')) {
    return 'brand_guide'
  }
  if (lowerFilename.includes('pitch') || lowerFilename.includes('deck')) {
    return 'pitch_deck'
  }

  // Check content patterns
  if (
    lowerContent.includes('executive summary') &&
    (lowerContent.includes('business model') || lowerContent.includes('financial projections'))
  ) {
    return 'business_plan'
  }
  if (
    (lowerContent.includes('market size') || lowerContent.includes('tam')) &&
    (lowerContent.includes('competitor') || lowerContent.includes('market share'))
  ) {
    return 'market_research'
  }
  if (
    lowerContent.includes('brand') &&
    (lowerContent.includes('color') ||
      lowerContent.includes('typography') ||
      lowerContent.includes('logo'))
  ) {
    return 'brand_guide'
  }
  if (
    lowerContent.includes('problem') &&
    lowerContent.includes('solution') &&
    (lowerContent.includes('market opportunity') || lowerContent.includes('traction'))
  ) {
    return 'pitch_deck'
  }

  return 'unknown'
}

/**
 * Get supported MIME types for document upload
 */
export function getSupportedMimeTypes(): string[] {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/x-markdown',
    'text/plain',
  ]
}

/**
 * Check if a MIME type is supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
  return getSupportedMimeTypes().includes(mimeType)
}
