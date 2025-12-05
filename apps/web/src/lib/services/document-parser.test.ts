/**
 * Document Parser Tests
 *
 * Unit tests for document parsing and type inference.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock functions that will be used by the mock class
const mockGetInfo = vi.fn()
const mockGetText = vi.fn()
const mockDestroy = vi.fn()

// Mock pdf-parse before importing the module under test
vi.mock('pdf-parse', () => {
  return {
    PDFParse: class MockPDFParse {
      getInfo = mockGetInfo
      getText = mockGetText
      destroy = mockDestroy
    },
  }
})

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}))

// Import module under test AFTER mocks are set up
import { parseDocument, inferDocumentType, getSupportedMimeTypes, isSupportedMimeType } from './document-parser'
import mammoth from 'mammoth'

const mockMammoth = vi.mocked(mammoth)

describe('parseDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDestroy.mockResolvedValue(undefined)
  })

  describe('PDF parsing', () => {
    it('should parse valid PDF files and return text', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test content here')
      mockGetInfo.mockResolvedValue({ pages: [{}, {}, {}, {}, {}] })
      mockGetText.mockResolvedValue({ text: 'Extracted PDF text content' })

      const result = await parseDocument(pdfBuffer, 'application/pdf')

      expect(result).toBe('Extracted PDF text content')
      expect(mockGetText).toHaveBeenCalled()
    })

    it('should return info message for PDFs with no extractable text', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test content here')
      mockGetInfo.mockResolvedValue({ pages: [{}, {}, {}] })
      mockGetText.mockResolvedValue({ text: '' })

      const result = await parseDocument(pdfBuffer, 'application/pdf')

      expect(result).toContain('PDF contains no extractable text')
      expect(result).toContain('3 pages')
    })

    it('should throw error for invalid PDF header', async () => {
      const invalidBuffer = Buffer.from('not a pdf file')

      await expect(
        parseDocument(invalidBuffer, 'application/pdf')
      ).rejects.toThrow('Invalid PDF file: missing PDF header')
    })

    it('should throw error for password-protected PDFs', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test content here')
      mockGetInfo.mockRejectedValue(new Error('File is encrypted'))

      await expect(
        parseDocument(pdfBuffer, 'application/pdf')
      ).rejects.toThrow('Cannot parse password-protected PDF')
    })

    it('should throw error for corrupted PDFs', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test content here')
      mockGetInfo.mockRejectedValue(new Error('Invalid PDF structure'))

      await expect(
        parseDocument(pdfBuffer, 'application/pdf')
      ).rejects.toThrow('Invalid or corrupted PDF file')
    })
  })

  describe('DOCX parsing', () => {
    it('should parse valid DOCX files and return text', async () => {
      // DOCX files start with PK (zip signature)
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Array(100).fill(0)])
      mockMammoth.extractRawText.mockResolvedValue({
        value: 'Extracted DOCX text content',
        messages: [],
      })

      const result = await parseDocument(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

      expect(result).toBe('Extracted DOCX text content')
      expect(mockMammoth.extractRawText).toHaveBeenCalled()
    })

    it('should return info message for DOCX with no extractable text', async () => {
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Array(100).fill(0)])
      mockMammoth.extractRawText.mockResolvedValue({
        value: '',
        messages: [],
      })

      const result = await parseDocument(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

      expect(result).toContain('contains no extractable text')
    })

    it('should throw error for invalid DOCX files', async () => {
      const invalidBuffer = Buffer.from('not a docx file')

      await expect(
        parseDocument(invalidBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ).rejects.toThrow('Invalid DOCX file: not a valid Office document')
    })

    it('should throw error for password-protected DOCX', async () => {
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Array(100).fill(0)])
      mockMammoth.extractRawText.mockRejectedValue(new Error('File is encrypted'))

      await expect(
        parseDocument(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ).rejects.toThrow('Cannot parse password-protected document')
    })
  })

  describe('Markdown parsing', () => {
    it('should parse markdown files correctly', async () => {
      const mdContent = `# Business Plan

## Executive Summary

This is our business plan for ACME Corp.

## Market Analysis

The market size is $10B.`

      const mdBuffer = Buffer.from(mdContent)

      const result = await parseDocument(mdBuffer, 'text/markdown')

      expect(result).toBe(mdContent)
      expect(result).toContain('# Business Plan')
      expect(result).toContain('Executive Summary')
    })

    it('should also accept text/x-markdown MIME type', async () => {
      const mdContent = '# Test Document'
      const mdBuffer = Buffer.from(mdContent)

      const result = await parseDocument(mdBuffer, 'text/x-markdown')

      expect(result).toBe(mdContent)
    })

    it('should throw error for empty markdown files', async () => {
      const emptyBuffer = Buffer.from('')

      await expect(
        parseDocument(emptyBuffer, 'text/markdown')
      ).rejects.toThrow('Empty markdown file')
    })

    it('should throw error for whitespace-only markdown files', async () => {
      const whitespaceBuffer = Buffer.from('   \n\n   ')

      await expect(
        parseDocument(whitespaceBuffer, 'text/markdown')
      ).rejects.toThrow('Empty markdown file')
    })
  })

  describe('Plain text parsing', () => {
    it('should parse plain text files', async () => {
      const textContent = 'This is plain text content.'
      const textBuffer = Buffer.from(textContent)

      const result = await parseDocument(textBuffer, 'text/plain')

      expect(result).toBe(textContent)
    })

    it('should throw error for empty text files', async () => {
      const emptyBuffer = Buffer.from('')

      await expect(
        parseDocument(emptyBuffer, 'text/plain')
      ).rejects.toThrow('Empty text file')
    })
  })

  describe('Unsupported file types', () => {
    it('should throw error for unsupported MIME types', async () => {
      const buffer = Buffer.from('some content')

      await expect(
        parseDocument(buffer, 'application/json')
      ).rejects.toThrow('Unsupported file type: application/json')
    })

    it('should throw error for unknown MIME types', async () => {
      const buffer = Buffer.from('some content')

      await expect(
        parseDocument(buffer, 'application/x-unknown')
      ).rejects.toThrow('Unsupported file type')
    })
  })
})

describe('inferDocumentType', () => {
  describe('filename-based inference', () => {
    it('should identify business plan from filename', () => {
      expect(inferDocumentType('business-plan-v2.pdf', '')).toBe('business_plan')
      expect(inferDocumentType('BUSINESS_PLAN.docx', '')).toBe('business_plan')
      expect(inferDocumentType('My Business Plan Draft.md', '')).toBe('business_plan')
    })

    it('should identify market research from filename', () => {
      expect(inferDocumentType('market-research.pdf', '')).toBe('market_research')
      expect(inferDocumentType('competitor-analysis.docx', '')).toBe('market_research')
      expect(inferDocumentType('Market Analysis 2024.md', '')).toBe('market_research')
    })

    it('should identify brand guide from filename', () => {
      expect(inferDocumentType('brand-guidelines.pdf', '')).toBe('brand_guide')
      expect(inferDocumentType('style-guide.docx', '')).toBe('brand_guide')
      expect(inferDocumentType('Brand Book.md', '')).toBe('brand_guide')
    })

    it('should identify pitch deck from filename', () => {
      expect(inferDocumentType('pitch-deck.pdf', '')).toBe('pitch_deck')
      expect(inferDocumentType('investor-deck.pptx', '')).toBe('pitch_deck')
      expect(inferDocumentType('Startup Pitch.md', '')).toBe('pitch_deck')
    })
  })

  describe('content-based inference', () => {
    it('should identify business plan from content', () => {
      const content = `
        Executive Summary
        Our company aims to revolutionize the market.

        Business Model
        We will generate revenue through subscriptions.

        Financial Projections
        Year 1: $100K
      `
      expect(inferDocumentType('document.md', content)).toBe('business_plan')
    })

    it('should identify market research from content', () => {
      const content = `
        Market Size Analysis

        The TAM for this industry is $50B.

        Key Competitors
        Competitor A has 30% market share.
      `
      expect(inferDocumentType('document.md', content)).toBe('market_research')
    })

    it('should identify brand guide from content', () => {
      const content = `
        Brand Guidelines

        Primary Color: #FF6B6B
        Typography: Inter, sans-serif
        Logo usage guidelines
      `
      expect(inferDocumentType('document.md', content)).toBe('brand_guide')
    })

    it('should identify pitch deck from content', () => {
      const content = `
        Problem
        Businesses struggle with X.

        Solution
        Our platform solves this by Y.

        Market Opportunity
        $10B addressable market.

        Traction
        1000 active users.
      `
      expect(inferDocumentType('document.md', content)).toBe('pitch_deck')
    })
  })

  describe('unknown document type', () => {
    it('should return unknown for unrecognized documents', () => {
      expect(inferDocumentType('notes.txt', 'Some random notes')).toBe('unknown')
      expect(inferDocumentType('document.md', 'Hello world')).toBe('unknown')
    })

    it('should return unknown for empty content with generic filename', () => {
      expect(inferDocumentType('file.pdf', '')).toBe('unknown')
    })
  })

  describe('case insensitivity', () => {
    it('should be case insensitive for filenames', () => {
      expect(inferDocumentType('BUSINESS-PLAN.PDF', '')).toBe('business_plan')
      expect(inferDocumentType('Market_Research.DOCX', '')).toBe('market_research')
    })

    it('should be case insensitive for content', () => {
      const content = 'EXECUTIVE SUMMARY and BUSINESS MODEL and FINANCIAL PROJECTIONS'
      expect(inferDocumentType('doc.md', content)).toBe('business_plan')
    })
  })
})

describe('getSupportedMimeTypes', () => {
  it('should return all supported MIME types', () => {
    const types = getSupportedMimeTypes()

    expect(types).toContain('application/pdf')
    expect(types).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(types).toContain('text/markdown')
    expect(types).toContain('text/x-markdown')
    expect(types).toContain('text/plain')
  })
})

describe('isSupportedMimeType', () => {
  it('should return true for supported types', () => {
    expect(isSupportedMimeType('application/pdf')).toBe(true)
    expect(isSupportedMimeType('text/markdown')).toBe(true)
    expect(isSupportedMimeType('text/plain')).toBe(true)
  })

  it('should return false for unsupported types', () => {
    expect(isSupportedMimeType('application/json')).toBe(false)
    expect(isSupportedMimeType('image/png')).toBe(false)
    expect(isSupportedMimeType('video/mp4')).toBe(false)
  })
})
