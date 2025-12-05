/**
 * Document Parser Tests
 *
 * Unit tests for document parsing and type inference.
 */

import { describe, it, expect } from 'vitest'
import { parseDocument, inferDocumentType } from './document-parser'

describe('parseDocument', () => {
  describe('PDF parsing', () => {
    it('should recognize valid PDF files', async () => {
      // Create a minimal PDF-like buffer
      const pdfBuffer = Buffer.from('%PDF-1.4 test content here')

      const result = await parseDocument(pdfBuffer, 'application/pdf')

      expect(result).toContain('[PDF Document')
      expect(result).toContain('valid PDF file')
    })

    it('should throw error for invalid PDF files', async () => {
      const invalidBuffer = Buffer.from('not a pdf file')

      await expect(
        parseDocument(invalidBuffer, 'application/pdf')
      ).rejects.toThrow('Failed to parse PDF file')
    })
  })

  describe('DOCX parsing', () => {
    it('should recognize valid DOCX files', async () => {
      // DOCX files start with PK (zip signature)
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Array(100).fill(0)])

      const result = await parseDocument(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

      expect(result).toContain('[DOCX Document')
      expect(result).toContain('valid DOCX file')
    })

    it('should throw error for invalid DOCX files', async () => {
      const invalidBuffer = Buffer.from('not a docx file')

      await expect(
        parseDocument(invalidBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ).rejects.toThrow('Failed to parse DOCX file')
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

    it('should throw error for empty markdown files', async () => {
      const emptyBuffer = Buffer.from('')

      await expect(
        parseDocument(emptyBuffer, 'text/markdown')
      ).rejects.toThrow('Failed to parse markdown file')
    })

    it('should throw error for whitespace-only markdown files', async () => {
      const whitespaceBuffer = Buffer.from('   \n\n   ')

      await expect(
        parseDocument(whitespaceBuffer, 'text/markdown')
      ).rejects.toThrow('Failed to parse markdown file')
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
