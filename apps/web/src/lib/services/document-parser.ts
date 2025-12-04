/**
 * Document Parser Service
 *
 * Parses uploaded documents (PDF, DOCX, MD) and extracts text content.
 * For MVP, uses simple text extraction without OCR.
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

/**
 * Parse PDF file to extract text
 * Note: For MVP, this is a placeholder that returns basic info.
 * In production, use pdf-parse or similar library.
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  // MVP: Return placeholder text indicating PDF parsing needed
  // Production: Use pdf-parse library
  try {
    // Basic text extraction - in production use pdf-parse
    const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 5000))

    // Check if it's a valid PDF
    if (!text.startsWith('%PDF')) {
      throw new Error('Invalid PDF file')
    }

    return `[PDF Document - ${Math.round(buffer.length / 1024)}KB]\n\nNote: For MVP, full PDF text extraction is not implemented. Please use DOCX or MD format for best results, or manually enter your business information.\n\nDocument appears to be a valid PDF file ready for processing.`
  } catch (error) {
    throw new Error('Failed to parse PDF file')
  }
}

/**
 * Parse DOCX file to extract text
 * Note: For MVP, this is a placeholder.
 * In production, use mammoth or similar library.
 */
async function parseDocx(buffer: Buffer): Promise<string> {
  // MVP: Return placeholder text indicating DOCX parsing needed
  // Production: Use mammoth library
  try {
    // Check for DOCX signature (PK zip file)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      throw new Error('Invalid DOCX file')
    }

    return `[DOCX Document - ${Math.round(buffer.length / 1024)}KB]\n\nNote: For MVP, full DOCX text extraction is not implemented. Please use MD format for best results, or manually enter your business information.\n\nDocument appears to be a valid DOCX file ready for processing.`
  } catch (error) {
    throw new Error('Failed to parse DOCX file')
  }
}

/**
 * Parse Markdown file to extract text
 */
async function parseMarkdown(buffer: Buffer): Promise<string> {
  try {
    const text = buffer.toString('utf-8')

    if (!text || text.trim().length === 0) {
      throw new Error('Empty markdown file')
    }

    return text
  } catch (error) {
    throw new Error('Failed to parse markdown file')
  }
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
      return await parseMarkdown(buffer)

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
