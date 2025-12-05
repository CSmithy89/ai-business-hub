/**
 * Document Upload API Tests (Epic 08)
 *
 * Tests for document upload and extraction pipeline API routes.
 * @see docs/epics/EPIC-08-workflows.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@hyvve/db', () => ({
  prisma: {
    business: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    onboardingDocument: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth-server', () => ({
  getSession: vi.fn(),
}));

// Mock file storage
vi.mock('@/lib/utils/file-storage', () => ({
  storeFileLocally: vi.fn(),
  validateFileSize: vi.fn(),
  validateMimeType: vi.fn(),
}));

// Mock document parser
vi.mock('@/lib/services/document-parser', () => ({
  parseDocument: vi.fn(),
  inferDocumentType: vi.fn(),
}));

// Mock document extraction
vi.mock('@/lib/services/document-extraction', () => ({
  extractBusinessData: vi.fn(),
  generateExtractionSummary: vi.fn(),
}));

// Import route handlers directly (after mocks)
import { POST, GET } from '../businesses/[id]/documents/route';
import { prisma } from '@hyvve/db';
import { getSession } from '@/lib/auth-server';
import { storeFileLocally, validateFileSize, validateMimeType } from '@/lib/utils/file-storage';
import { parseDocument, inferDocumentType } from '@/lib/services/document-parser';
import { extractBusinessData, generateExtractionSummary } from '@/lib/services/document-extraction';

const mockPrisma = prisma as unknown as {
  business: {
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  onboardingDocument: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

const mockGetSession = getSession as ReturnType<typeof vi.fn>;
const mockStoreFileLocally = storeFileLocally as ReturnType<typeof vi.fn>;
const mockValidateFileSize = validateFileSize as ReturnType<typeof vi.fn>;
const mockValidateMimeType = validateMimeType as ReturnType<typeof vi.fn>;
const mockParseDocument = parseDocument as ReturnType<typeof vi.fn>;
const mockInferDocumentType = inferDocumentType as ReturnType<typeof vi.fn>;
const mockExtractBusinessData = extractBusinessData as ReturnType<typeof vi.fn>;
const mockGenerateExtractionSummary = generateExtractionSummary as ReturnType<typeof vi.fn>;

// Helper to create mock FormData
function createMockFormData(files: Array<{ name: string; type: string; content: string }>): FormData {
  const formData = new FormData();
  files.forEach((file) => {
    const blob = new Blob([file.content], { type: file.type });
    formData.append('files', blob, file.name);
  });
  return formData;
}

// Helper to create mock request
function createMockRequest(formData: FormData | null = null): NextRequest {
  return {
    formData: () => Promise.resolve(formData || new FormData()),
    method: 'POST',
    url: 'http://localhost:3000/api/businesses/test-id/documents',
  } as unknown as NextRequest;
}

describe('Documents Upload API', () => {
  const mockBusinessId = 'business-123';
  const mockUserId = 'user-456';
  const mockWorkspaceId = 'workspace-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ id: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when no active workspace', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: mockUserId },
        session: { activeWorkspaceId: null },
      });

      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ id: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('NO_WORKSPACE');
    });
  });

  describe('Business Validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        user: { id: mockUserId },
        session: { activeWorkspaceId: mockWorkspaceId },
      });
    });

    it('should return 404 when business not found', async () => {
      mockPrisma.business.findFirst.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ id: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
    });
  });

  describe('File Validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        user: { id: mockUserId },
        session: { activeWorkspaceId: mockWorkspaceId },
      });
      mockPrisma.business.findFirst.mockResolvedValue({
        id: mockBusinessId,
        workspaceId: mockWorkspaceId,
        onboardingProgress: 0,
      });
    });

    it('should return 400 when no files provided', async () => {
            const request = createMockRequest(new FormData());
      const response = await POST(request, { params: Promise.resolve({ id: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('NO_FILES');
    });

    it('should return 400 when too many files provided', async () => {
      const files = Array(6)
        .fill(null)
        .map((_, i) => ({ name: `file${i}.pdf`, type: 'application/pdf', content: 'content' }));
      const formData = createMockFormData(files);

            const request = createMockRequest(formData);
      const response = await POST(request, { params: Promise.resolve({ id: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('TOO_MANY_FILES');
    });

    it('should return 400 when file size exceeds limit', async () => {
      mockValidateFileSize.mockReturnValue(false);
      mockValidateMimeType.mockReturnValue(true);

      const formData = createMockFormData([{ name: 'large.pdf', type: 'application/pdf', content: 'x' }]);

            const request = createMockRequest(formData);
      const response = await POST(request, { params: Promise.resolve({ id: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('FILE_TOO_LARGE');
    });

    it('should return 400 when file type is invalid', async () => {
      mockValidateFileSize.mockReturnValue(true);
      mockValidateMimeType.mockReturnValue(false);

      const formData = createMockFormData([{ name: 'image.png', type: 'image/png', content: 'content' }]);

            const request = createMockRequest(formData);
      const response = await POST(request, { params: Promise.resolve({ id: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_FILE_TYPE');
    });
  });

  describe('Successful Upload', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        user: { id: mockUserId },
        session: { activeWorkspaceId: mockWorkspaceId },
      });
      mockPrisma.business.findFirst.mockResolvedValue({
        id: mockBusinessId,
        workspaceId: mockWorkspaceId,
        onboardingProgress: 0,
      });
      mockValidateFileSize.mockReturnValue(true);
      mockValidateMimeType.mockReturnValue(true);
      mockStoreFileLocally.mockResolvedValue({ url: '/uploads/test.pdf' });
      mockParseDocument.mockResolvedValue('Extracted text content');
      mockInferDocumentType.mockReturnValue('business_plan');
      mockExtractBusinessData.mockResolvedValue({
        documentType: 'business_plan',
        confidence: 0.85,
        data: {},
      });
      mockGenerateExtractionSummary.mockReturnValue({
        totalDocuments: 1,
        successfulExtractions: 1,
      });
    });

    it('should successfully upload and process a single file', async () => {
      mockPrisma.onboardingDocument.create.mockResolvedValue({
        id: 'doc-123',
        businessId: mockBusinessId,
        fileName: 'business-plan.pdf',
        fileUrl: '/uploads/test.pdf',
        extractionStatus: 'processing',
      });
      mockPrisma.onboardingDocument.update.mockResolvedValue({
        id: 'doc-123',
        extractionStatus: 'complete',
      });
      mockPrisma.business.update.mockResolvedValue({});

      const formData = createMockFormData([
        { name: 'business-plan.pdf', type: 'application/pdf', content: 'PDF content' },
      ]);

            const request = createMockRequest(formData);
      const response = await POST(request, { params: Promise.resolve({ id: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.documents).toBeDefined();
      expect(data.data.summary).toBeDefined();
    });

    // Note: These tests require full File API mocking (arrayBuffer) which is complex in jsdom
    // They are marked as todo until we set up proper integration test infrastructure
    it.todo('should process multiple files');

    it.todo('should update business onboarding progress');
  });

  describe('Extraction Error Handling', () => {
    // Note: These tests require full File API mocking (arrayBuffer) which is complex in jsdom
    // They are marked as todo until we set up proper integration test infrastructure
    it.todo('should handle extraction errors gracefully');
  });
});

describe('Documents GET API', () => {
  const mockBusinessId = 'business-123';
  const mockUserId = 'user-456';
  const mockWorkspaceId = 'workspace-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

        const request = {} as unknown as NextRequest;
    const response = await GET(request, { params: Promise.resolve({ id: mockBusinessId }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('should return documents for business', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: mockUserId },
      session: { activeWorkspaceId: mockWorkspaceId },
    });
    mockPrisma.business.findFirst.mockResolvedValue({
      id: mockBusinessId,
      workspaceId: mockWorkspaceId,
    });
    mockPrisma.onboardingDocument.findMany.mockResolvedValue([
      { id: 'doc-1', fileName: 'file1.pdf', extractionStatus: 'complete' },
      { id: 'doc-2', fileName: 'file2.pdf', extractionStatus: 'complete' },
    ]);

        const request = {} as unknown as NextRequest;
    const response = await GET(request, { params: Promise.resolve({ id: mockBusinessId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });

  it('should return empty array when no documents exist', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: mockUserId },
      session: { activeWorkspaceId: mockWorkspaceId },
    });
    mockPrisma.business.findFirst.mockResolvedValue({
      id: mockBusinessId,
      workspaceId: mockWorkspaceId,
    });
    mockPrisma.onboardingDocument.findMany.mockResolvedValue([]);

        const request = {} as unknown as NextRequest;
    const response = await GET(request, { params: Promise.resolve({ id: mockBusinessId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(0);
  });
});
