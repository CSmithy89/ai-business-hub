# Story 14-3: File Upload Pipeline Tests

**Epic:** EPIC-14 - Testing & Observability
**Status:** In Review
**Points:** 3
**Priority:** P2 Medium
**Created:** 2025-12-06

---

## User Story

As a developer, I want tests for document upload and extraction so that file processing is verified.

---

## Acceptance Criteria

- [x] AC1: Create test file `apps/web/src/__tests__/file-upload.test.ts`
- [x] AC2: Test PDF upload and text extraction
- [x] AC3: Test DOCX upload and text extraction
- [x] AC4: Test file size limits enforcement
- [x] AC5: Test file type validation
- [x] AC6: Test upload progress tracking
- [x] AC7: Create test fixtures with sample documents

---

## Technical Context

### Existing Implementation

The file upload pipeline consists of several services:

1. **File Storage** (`lib/utils/file-storage.ts`)
   - Local file storage to `public/uploads/business-documents/`
   - File size validation (max 10MB)
   - MIME type validation (PDF, DOCX, MD)
   - Filename sanitization

2. **Document Parser** (`lib/services/document-parser.ts`)
   - PDF parsing with `pdf-parse`
   - DOCX parsing with `mammoth`
   - Markdown and plain text parsing
   - Document type inference

3. **Document Extraction** (`lib/services/document-extraction.ts`)
   - AI-powered extraction (mock for MVP)
   - Pattern matching for business model, market analysis, financials, brand
   - Confidence scoring
   - Gap analysis

4. **API Route** (`app/api/businesses/[id]/documents/route.ts`)
   - Already has comprehensive tests in `app/api/__tests__/documents-upload.test.ts`

### Testing Strategy

Based on the tech spec (ADR-14.1: Vitest for Frontend Tests), we use:
- **Vitest** for unit and integration tests
- **Mock approach** for file processing (avoid real PDF/DOCX binary creation)
- **Integration with existing test patterns** from `document-parser.test.ts`

### Test Scope

This story focuses on **unit tests** for the file upload utilities and document processing pipeline:
1. File validation (size, type, extension)
2. File storage operations (sanitization, path safety)
3. Document parsing (PDF, DOCX, MD)
4. Upload progress simulation
5. Error handling

The API route tests already exist in `documents-upload.test.ts` and cover:
- Authentication
- Business validation
- File count limits
- End-to-end upload flow

---

## Implementation Details

### Test File Structure

```typescript
// apps/web/src/__tests__/file-upload.test.ts

describe('File Upload Pipeline', () => {
  describe('File Validation', () => {
    // AC4: File size limits
    // AC5: File type validation
  })

  describe('File Storage', () => {
    // File sanitization
    // Path safety
  })

  describe('Document Parsing', () => {
    // AC2: PDF extraction
    // AC3: DOCX extraction
    // MD and TXT parsing
  })

  describe('Upload Progress', () => {
    // AC6: Progress tracking simulation
  })

  describe('Error Handling', () => {
    // Invalid files
    // Corrupted files
    // Size limit exceeded
  })
})
```

### Test Fixtures

Mock file buffers with proper headers:
- **PDF**: `%PDF-1.4...` header
- **DOCX**: PK zip signature (0x50, 0x4B)
- **MD**: Plain text markdown
- **TXT**: Plain text

### Dependencies

Existing mocks from `document-parser.test.ts`:
- `pdf-parse` → MockPDFParse
- `mammoth` → mock extractRawText

New mocks needed:
- File system operations (fs/promises)
- Upload progress events

---

## Testing Approach

### Unit Tests (apps/web/src/__tests__/file-upload.test.ts)

1. **File Validation Tests**
   ```typescript
   - validateFileSize(size, maxSize) → true/false
   - validateMimeType(mimeType) → true/false
   - validateExtension(filename) → ext | throws
   - generateFilename(businessId, filename) → sanitized name
   ```

2. **File Storage Tests**
   ```typescript
   - storeFileLocally(businessId, buffer, name, type) → StoredFile
   - Path sanitization (prevent ../, absolute paths)
   - Extension validation
   ```

3. **Document Parsing Tests** (extend existing)
   ```typescript
   - parsePdf(buffer) → text
   - parseDocx(buffer) → text
   - parseMarkdown(buffer) → text
   - Error handling (encrypted, corrupted, empty)
   ```

4. **Upload Progress Tests**
   ```typescript
   - Simulate progress events (0% → 100%)
   - Handle progress callbacks
   - Cancel upload simulation
   ```

### Integration with Existing Tests

The API route tests (`documents-upload.test.ts`) already cover:
- Full upload flow with FormData
- Multi-file upload
- Extraction pipeline integration
- Business onboarding progress updates

Our tests focus on **individual service functions** rather than duplicating the API route tests.

---

## File Changes

### New Files
- `apps/web/src/__tests__/file-upload.test.ts` (NEW) - Main test file

### Modified Files
- None (existing services already have good test coverage)

---

## Definition of Done

- [x] Test file created with comprehensive coverage
- [x] All 7 acceptance criteria tested
- [x] Tests pass locally
- [x] Mock fixtures created (PDF, DOCX, MD headers)
- [x] Error handling tested (size, type, corruption)
- [x] Upload progress simulation tested
- [x] Integration with existing test patterns
- [x] Documentation of test approach

---

## Notes

### Deferred to Integration Tests
- Real PDF/DOCX binary creation (complex, low value for unit tests)
- Full end-to-end upload with FormData (covered by API route tests)
- Database integration (covered by API route tests)
- Agent extraction flow (covered by API route tests)

### Test Coverage

This story complements existing test coverage:
- `document-parser.test.ts` → Document parsing with real mock data
- `documents-upload.test.ts` → API route integration tests
- `file-upload.test.ts` (NEW) → File upload utilities and validation

Together, these provide comprehensive coverage of the file upload pipeline from client validation to document extraction.

---

## References

- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-14.md`
- Existing Tests: `apps/web/src/lib/services/document-parser.test.ts`
- API Tests: `apps/web/src/app/api/__tests__/documents-upload.test.ts`
- File Storage: `apps/web/src/lib/utils/file-storage.ts`
- Document Parser: `apps/web/src/lib/services/document-parser.ts`
- Document Extraction: `apps/web/src/lib/services/document-extraction.ts`
