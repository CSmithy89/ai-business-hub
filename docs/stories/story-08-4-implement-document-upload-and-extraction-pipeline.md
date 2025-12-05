# Story 08.4: Implement Document Upload and Extraction Pipeline

**Story ID:** 08.4
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 5
**Priority:** P1
**Dependencies:** Story 08.3 (Onboarding Wizard UI)

---

## User Story

**As a** user
**I want** to upload existing business documents
**So that** the system can extract relevant data and identify gaps

---

## Description

This story implements the document upload and AI-powered extraction pipeline that allows users to upload existing business documents (business plans, market research, brand guides, pitch decks) during the onboarding wizard. The system parses these documents, extracts key business information using AI, maps the extracted data to validation/planning/branding fields, and identifies what information is missing.

This feature enables users with existing documentation to accelerate their onboarding by pre-populating validation, planning, and branding data, while also highlighting gaps that need to be filled through the AI agent workflows.

---

## Acceptance Criteria

### File Upload Component
- [ ] Create file upload component with drag-and-drop functionality
- [ ] Support PDF, DOCX, MD file types
- [ ] Implement file validation:
  - Maximum size: 10MB per file
  - File type validation
  - Clear error messages for invalid files
- [ ] Display upload progress indicator
- [ ] Allow multiple file uploads (up to 5 files)
- [ ] Show preview of uploaded files with filename, size, type

### Document Extraction Endpoint
- [ ] Create `/api/businesses/:id/documents` POST endpoint
- [ ] Parse uploaded documents by file type:
  - PDF: Extract text and structure
  - DOCX: Extract text and structure
  - MD: Parse markdown structure
- [ ] Use AI agent to extract key business information:
  - Business model elements
  - Financial data (revenue, costs, projections)
  - Market analysis (TAM/SAM/SOM, competitors)
  - Customer profiles (target audience, personas)
  - Brand elements (positioning, values, visual identity)
- [ ] Map extracted data to appropriate fields:
  - ValidationSession fields (idea, market sizing, competitors, ICPs)
  - PlanningSession fields (canvas, financials)
  - BrandingSession fields (positioning, voice, visual identity)
- [ ] Identify missing sections and gaps
- [ ] Store raw file in storage (Supabase Storage or local for MVP)
- [ ] Create OnboardingDocument record with extraction results

### Extraction Results Display
- [ ] Display extraction results in structured format
- [ ] Show confidence scores for each extracted section:
  - High (>85%): Auto-populated
  - Medium (60-85%): Flagged for review
  - Low (<60%): Marked as incomplete
- [ ] Display gap analysis showing what's missing:
  - Required fields not found in documents
  - Incomplete sections
  - Suggested next steps
- [ ] Allow manual correction of extracted data before accepting
- [ ] Provide side-by-side view: extracted data vs. source document sections

### Data Integration
- [ ] Pre-populate ValidationSession with extracted validation data
- [ ] Pre-populate PlanningSession with extracted planning data
- [ ] Pre-populate BrandingSession with extracted branding data
- [ ] Mark extracted fields with `source: "document"` metadata
- [ ] Allow user to review and approve pre-populated data
- [ ] Update OnboardingDocument.extractionStatus to "complete" on success

---

## Technical Implementation Details

### File Upload Component (`react-dropzone`)

```typescript
// apps/web/src/components/business/document-upload.tsx
'use client';

import { useDropzone } from 'react-dropzone';
import { useState } from 'react';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/markdown': ['.md'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUpload({ businessId }: { businessId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [extractionResults, setExtractionResults] = useState<any>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 5,
    onDrop: async (acceptedFiles) => {
      setFiles(acceptedFiles);
      await uploadFiles(acceptedFiles);
    },
  });

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(`/api/businesses/${businessId}/documents`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    setExtractionResults(data);
    setUploading(false);
  };

  return (
    <div>
      <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-8">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop files here...</p>
        ) : (
          <p>Drag & drop files here, or click to select (PDF, DOCX, MD)</p>
        )}
      </div>
      {/* File list, progress, extraction results display */}
    </div>
  );
}
```

### Upload API Endpoint

```typescript
// apps/api/src/business/business.controller.ts
import { Controller, Post, UseInterceptors, UploadedFiles, Param } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DocumentExtractionService } from './document-extraction.service';

@Controller('businesses/:id/documents')
export class BusinessDocumentController {
  constructor(private readonly extractionService: DocumentExtractionService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadDocuments(
    @Param('id') businessId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Validate files
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`File ${file.originalname} exceeds 10MB limit`);
      }
    }

    // Store files (Supabase Storage or local)
    const uploadedFiles = await this.storeFiles(businessId, files);

    // Extract data from documents
    const extractionResults = await Promise.all(
      uploadedFiles.map((file) =>
        this.extractionService.extractDocument(businessId, file),
      ),
    );

    return {
      data: extractionResults,
      summary: this.extractionService.generateSummary(extractionResults),
    };
  }

  private async storeFiles(businessId: string, files: Express.Multer.File[]) {
    // Store in Supabase Storage or local file system
    // Return file URLs
  }
}
```

### Document Extraction Service

```typescript
// apps/api/src/business/document-extraction.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hyvve/db';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { marked } from 'marked';

@Injectable()
export class DocumentExtractionService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService, // Uses BYOAI provider
  ) {}

  async extractDocument(businessId: string, fileInfo: any) {
    // Create OnboardingDocument record
    const document = await this.prisma.onboardingDocument.create({
      data: {
        businessId,
        fileName: fileInfo.originalName,
        fileUrl: fileInfo.url,
        fileType: fileInfo.type,
        fileSize: fileInfo.size,
        extractionStatus: 'pending',
      },
    });

    try {
      // Parse document by type
      const text = await this.parseDocument(fileInfo);

      // Use AI to extract structured data
      const extractedData = await this.aiService.extractBusinessData(text, {
        documentType: this.inferDocumentType(fileInfo.originalName, text),
      });

      // Calculate confidence scores
      const withConfidence = this.calculateConfidenceScores(extractedData);

      // Update document record
      await this.prisma.onboardingDocument.update({
        where: { id: document.id },
        data: {
          extractedData: withConfidence,
          extractionStatus: 'complete',
        },
      });

      return withConfidence;
    } catch (error) {
      await this.prisma.onboardingDocument.update({
        where: { id: document.id },
        data: {
          extractionStatus: 'error',
          extractionError: error.message,
        },
      });
      throw error;
    }
  }

  private async parseDocument(fileInfo: any): Promise<string> {
    switch (fileInfo.type) {
      case 'pdf':
        const pdfData = await pdf(fileInfo.buffer);
        return pdfData.text;
      case 'docx':
        const docxData = await mammoth.extractRawText({ buffer: fileInfo.buffer });
        return docxData.value;
      case 'md':
        return fileInfo.buffer.toString('utf-8');
      default:
        throw new Error(`Unsupported file type: ${fileInfo.type}`);
    }
  }

  private inferDocumentType(filename: string, text: string): string {
    const lowerText = text.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    if (
      lowerFilename.includes('business plan') ||
      lowerText.includes('executive summary')
    ) {
      return 'business_plan';
    }
    if (
      lowerFilename.includes('market') ||
      lowerText.includes('market analysis')
    ) {
      return 'market_research';
    }
    if (
      lowerFilename.includes('brand') ||
      lowerText.includes('brand guidelines')
    ) {
      return 'brand_guide';
    }
    if (
      lowerFilename.includes('pitch') ||
      lowerFilename.includes('deck')
    ) {
      return 'pitch_deck';
    }
    return 'unknown';
  }

  private calculateConfidenceScores(extractedData: any) {
    // Calculate confidence based on:
    // - Presence of expected fields
    // - Data completeness
    // - Format consistency
    // Returns data with confidence: 'high' | 'medium' | 'low' for each section
  }

  generateSummary(results: any[]) {
    // Aggregate extraction results
    // Identify gaps
    // Return summary with gap analysis
    return {
      totalSections: 0,
      extractedSections: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      gaps: [],
    };
  }
}
```

### Extraction Mapping

| Document Type | Extracted Fields | Target Model |
|---------------|------------------|--------------|
| Business Plan | Business model, financials, market analysis, team, operations | ValidationSession, PlanningSession |
| Market Research | TAM/SAM/SOM, competitors, customer profiles, trends | ValidationSession |
| Brand Guide | Colors, typography, voice, positioning, values, logo | BrandingSession |
| Pitch Deck | Value proposition, target market, team, financials, traction | ValidationSession, PlanningSession |

### AI Extraction Prompt Structure

```typescript
const EXTRACTION_PROMPT = `
You are analyzing a business document to extract structured information.

Document Type: {documentType}
Document Text: {documentText}

Extract the following information if present:

BUSINESS MODEL:
- Value proposition
- Customer segments
- Revenue streams
- Cost structure

MARKET ANALYSIS:
- TAM (Total Addressable Market)
- SAM (Serviceable Available Market)
- SOM (Serviceable Obtainable Market)
- Competitors
- Customer profiles/personas

FINANCIAL DATA:
- Revenue projections
- Cost projections
- Unit economics
- Funding requirements

BRAND ELEMENTS:
- Brand positioning
- Core values
- Voice/tone
- Visual identity (colors, typography)

For each extracted section, provide:
1. The extracted data
2. Confidence score (high/medium/low)
3. Source location (section/page reference)

If information is not found, mark as "not_found".

Return JSON format:
{
  "business_model": { "data": {...}, "confidence": "high", "source": "Page 3" },
  "market_analysis": { "data": {...}, "confidence": "medium", "source": "Pages 5-8" },
  ...
}
`;
```

### Storage Strategy

**MVP Approach (Local Storage):**
```typescript
// Store files locally during development
import { writeFile } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = './uploads/business-documents';

async function storeFileLocally(businessId: string, file: Express.Multer.File) {
  const filename = `${businessId}-${Date.now()}-${file.originalname}`;
  const filepath = join(UPLOAD_DIR, filename);
  await writeFile(filepath, file.buffer);
  return {
    url: `/uploads/${filename}`,
    originalName: file.originalname,
    type: file.mimetype,
    size: file.size,
  };
}
```

**Production Approach (Supabase Storage):**
```typescript
// Store files in Supabase Storage
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function storeFileSupabase(businessId: string, file: Express.Multer.File) {
  const filename = `${businessId}/${Date.now()}-${file.originalname}`;
  const { data, error } = await supabase.storage
    .from('business-documents')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('business-documents')
    .getPublicUrl(filename);

  return {
    url: urlData.publicUrl,
    originalName: file.originalname,
    type: file.mimetype,
    size: file.size,
  };
}
```

---

## Testing Requirements

### Unit Tests
- [ ] File validation logic (size, type)
- [ ] Document parsing (PDF, DOCX, MD)
- [ ] Confidence score calculation
- [ ] Gap analysis generation
- [ ] OnboardingDocument CRUD operations

### Integration Tests
- [ ] Upload endpoint with valid files
- [ ] Upload endpoint with invalid files (too large, wrong type)
- [ ] Extraction pipeline end-to-end
- [ ] Data mapping to ValidationSession/PlanningSession/BrandingSession
- [ ] Error handling (parsing errors, AI extraction errors)

### E2E Tests
- [ ] User uploads business plan PDF
- [ ] System extracts and displays results
- [ ] User reviews and approves extracted data
- [ ] Data pre-populates validation/planning/branding forms
- [ ] User uploads multiple documents
- [ ] User corrects extracted data

### Edge Cases
- [ ] Document with no extractable data
- [ ] Document with mixed content (partial business plan)
- [ ] Very large document (near 10MB limit)
- [ ] Corrupted file
- [ ] Duplicate file upload
- [ ] User uploads then abandons wizard

---

## Definition of Done

- [ ] File upload component with drag-and-drop works on all browsers
- [ ] File validation prevents invalid uploads
- [ ] Upload progress indicator displays accurately
- [ ] Documents stored in Supabase Storage (or local for MVP)
- [ ] OnboardingDocument records created successfully
- [ ] Document extraction parses PDF, DOCX, MD correctly
- [ ] AI extraction returns structured data with confidence scores
- [ ] Gap analysis identifies missing sections
- [ ] Extraction results display in UI with confidence indicators
- [ ] User can manually correct extracted data
- [ ] Extracted data pre-populates session models correctly
- [ ] All acceptance criteria met
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E test passing (upload → extract → review → accept)
- [ ] Code reviewed and approved
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation updated (API docs, component docs)
- [ ] Deployed to development environment
- [ ] Tested with real business documents (3+ different types)

---

## Notes

### Anti-Hallucination Strategy
- All extracted market data must include source references (page/section)
- Claims without sources marked as "unverified"
- User review required before accepting extracted data
- Confidence scores prevent auto-population of low-confidence data

### User Experience Considerations
- Show upload progress for large files
- Provide clear error messages for invalid files
- Allow editing extracted data before accepting
- Highlight gaps prominently to guide user
- Support resuming extraction if page is refreshed

### Future Enhancements (Out of Scope)
- OCR for scanned PDFs
- Multi-language document support
- Document version comparison
- Batch extraction for multiple businesses
- Integration with cloud storage (Google Drive, Dropbox)
- Real-time collaborative document editing

---

## Related Documentation

- [Epic 08: Business Onboarding](../epics/EPIC-08-business-onboarding.md)
- [Tech Spec: Epic 08](../sprint-artifacts/tech-spec-epic-08.md)
- [Architecture: Business Onboarding](../architecture/business-onboarding-architecture.md)
- [Wireframe: BO-02 - Wizard Step 1 - Documents](../design/wireframes/WIREFRAME-INDEX.md)

---

_Story created: 2025-12-04_
_Last updated: 2025-12-04_
