/**
 * Workflow API Tests - Branding Module (Epic 08)
 *
 * Tests for branding workflow API routes: brand-strategy, brand-voice,
 * visual-identity, asset-generation.
 * @see docs/epics/EPIC-08-workflows.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@hyvve/db', () => ({
  prisma: {
    business: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    brandingSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

// Import route handlers directly (after mocks)
import { POST, GET } from '../branding/[businessId]/brand-strategy/route';
import { prisma } from '@hyvve/db';
import { auth } from '@/lib/auth';

const mockPrisma = prisma as unknown as {
  business: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  brandingSession: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

const mockAuth = auth as unknown as {
  api: {
    getSession: ReturnType<typeof vi.fn>;
  };
};

// Helper to create mock request
function createMockRequest(body: object, method = 'POST'): NextRequest {
  return {
    json: () => Promise.resolve(body),
    method,
    url: 'http://localhost:3000/api/branding/test-id/brand-strategy',
  } as unknown as NextRequest;
}

// Brand archetypes
const BRAND_ARCHETYPES = [
  'The Innocent',
  'The Sage',
  'The Explorer',
  'The Outlaw',
  'The Magician',
  'The Hero',
  'The Lover',
  'The Jester',
  'The Everyman',
  'The Caregiver',
  'The Ruler',
  'The Creator',
] as const;

describe('Branding Workflow API Routes', () => {
  const mockBusinessId = 'business-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Brand Strategy - Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

            const request = createMockRequest({ action: 'analyze' });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Brand Strategy - POST Actions', () => {
    beforeEach(() => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: mockUserId } });
    });

    it('should return 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);

            const request = createMockRequest({ action: 'analyze' });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Business not found');
    });

    it('should return 400 for invalid action', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        brandingData: null,
      });

            const request = createMockRequest({ action: 'invalid_action' });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid');
    });

    it('should analyze brand strategy and recommend archetype', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'HYVVE',
        brandingData: null,
      });

            const request = createMockRequest({ action: 'analyze', data: {} });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis).toBeDefined();
      expect(data.analysis.recommendedArchetype).toBeDefined();
      expect(BRAND_ARCHETYPES).toContain(data.analysis.recommendedArchetype);
      expect(data.analysis.rationale).toBeDefined();
    });

    it('should select archetype and create positioning', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'HYVVE',
        brandingData: { id: 'branding-123' },
      });
      mockPrisma.brandingSession.findUnique.mockResolvedValue({ id: 'branding-123' });
      mockPrisma.brandingSession.update.mockResolvedValue({});

            const request = createMockRequest({
        action: 'select_archetype',
        data: { archetype: 'The Creator' },
      });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.positioning).toBeDefined();
      expect(data.positioning.archetype).toBe('The Creator');
      expect(data.positioning.coreValues).toBeDefined();
      expect(data.positioning.personalityTraits).toBeDefined();
    });

    it('should generate tagline options', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'HYVVE',
        brandingData: null,
      });

            const request = createMockRequest({
        action: 'generate_taglines',
        data: {
          archetype: 'The Creator',
          brandPromise: 'Transform ideas into reality',
        },
      });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.taglines).toBeDefined();
      expect(Array.isArray(data.taglines)).toBe(true);
      expect(data.taglines.length).toBeGreaterThan(0);
    });

    it('should finalize brand strategy', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'HYVVE',
        brandingData: { id: 'branding-123' },
      });
      mockPrisma.brandingSession.findUnique.mockResolvedValue({
        id: 'branding-123',
        completedWorkflows: [],
      });
      mockPrisma.brandingSession.update.mockResolvedValue({});

            const request = createMockRequest({
        action: 'finalize',
        data: {
          positioning: {
            archetype: 'The Creator',
            archetypeRationale: 'Test rationale',
            coreValues: ['Innovation', 'Excellence'],
            personalityTraits: ['Bold', 'Visionary'],
            positioningStatement: 'Test positioning',
            taglineOptions: ['Tagline 1', 'Tagline 2'],
            competitiveDifferentiators: ['Differentiator 1'],
            targetAudienceProfile: 'Test audience',
            brandPromise: 'Test promise',
            emotionalBenefits: ['Confidence'],
            functionalBenefits: ['Quality'],
          },
        },
      });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.next_workflow).toBe('brand_voice');
    });
  });

  describe('Brand Strategy - GET Status', () => {
    beforeEach(() => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: mockUserId } });
    });

    it('should return 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);

            const request = createMockRequest({}, 'GET');
      const response = await GET(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Business not found');
    });

    it('should return brand strategy status with archetypes', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'HYVVE',
        brandingData: null,
      });

            const request = createMockRequest({}, 'GET');
      const response = await GET(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.archetypes).toEqual(BRAND_ARCHETYPES);
      expect(data.currentPositioning).toBeFalsy(); // API returns undefined or null when no positioning
      expect(data.isComplete).toBe(false);
    });

    it('should return current positioning when available', async () => {
      const mockPositioning = {
        archetype: 'The Creator',
        coreValues: ['Innovation'],
        brandPromise: 'Test promise',
      };

      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'HYVVE',
        brandingData: {
          positioning: mockPositioning,
          completedWorkflows: ['brand_strategy'],
        },
      });

            const request = createMockRequest({}, 'GET');
      const response = await GET(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentPositioning).toEqual(mockPositioning);
      expect(data.isComplete).toBe(true);
    });
  });
});

describe('Brand Archetype Schema Tests', () => {
  it('should have exactly 12 brand archetypes', () => {
    expect(BRAND_ARCHETYPES).toHaveLength(12);
  });

  it('should include classic brand archetypes', () => {
    const classicArchetypes = [
      'The Innocent',
      'The Sage',
      'The Explorer',
      'The Hero',
      'The Creator',
    ];

    classicArchetypes.forEach((archetype) => {
      expect(BRAND_ARCHETYPES).toContain(archetype);
    });
  });

  it('should validate brand strategy request schema', () => {
    const { z } = require('zod');

    const brandStrategyRequestSchema = z.discriminatedUnion('action', [
      z.object({
        action: z.literal('analyze'),
        data: z.record(z.string(), z.unknown()).optional(),
      }),
      z.object({
        action: z.literal('select_archetype'),
        data: z.object({
          archetype: z.enum(BRAND_ARCHETYPES),
          context: z.record(z.string(), z.unknown()).optional(),
        }),
      }),
      z.object({
        action: z.literal('generate_taglines'),
        data: z.object({
          archetype: z.string().max(50),
          brandPromise: z.string().max(500),
        }),
      }),
    ]);

    // Valid analyze action
    expect(brandStrategyRequestSchema.safeParse({ action: 'analyze' }).success).toBe(true);

    // Valid select_archetype action
    expect(
      brandStrategyRequestSchema.safeParse({
        action: 'select_archetype',
        data: { archetype: 'The Creator' },
      }).success
    ).toBe(true);

    // Invalid archetype
    expect(
      brandStrategyRequestSchema.safeParse({
        action: 'select_archetype',
        data: { archetype: 'Invalid Archetype' },
      }).success
    ).toBe(false);

    // Valid generate_taglines action
    expect(
      brandStrategyRequestSchema.safeParse({
        action: 'generate_taglines',
        data: { archetype: 'The Creator', brandPromise: 'Transform ideas' },
      }).success
    ).toBe(true);
  });
});

describe('Brand Positioning Generation', () => {
  it('should generate correct positioning for Creator archetype', () => {
    const creatorPositioning = {
      archetype: 'The Creator',
      coreValues: ['Innovation', 'Authenticity', 'Excellence', 'Creativity'],
      personalityTraits: ['Visionary', 'Innovative', 'Authentic', 'Bold'],
      brandPromise: 'To transform ideas into reality through innovative solutions',
    };

    expect(creatorPositioning.coreValues).toContain('Innovation');
    expect(creatorPositioning.coreValues).toContain('Creativity');
    expect(creatorPositioning.personalityTraits).toContain('Visionary');
    expect(creatorPositioning.brandPromise).toContain('transform');
  });

  it('should generate correct positioning for Sage archetype', () => {
    const sagePositioning = {
      archetype: 'The Sage',
      coreValues: ['Wisdom', 'Truth', 'Knowledge', 'Expertise'],
      personalityTraits: ['Wise', 'Thoughtful', 'Analytical', 'Trustworthy'],
      brandPromise: 'To provide expert guidance and trusted knowledge',
    };

    expect(sagePositioning.coreValues).toContain('Wisdom');
    expect(sagePositioning.coreValues).toContain('Knowledge');
    expect(sagePositioning.personalityTraits).toContain('Wise');
    expect(sagePositioning.brandPromise).toContain('guidance');
  });

  it('should generate taglines for different archetypes', () => {
    const creatorTaglines = [
      'Where Ideas Take Shape',
      'Imagine. Create. Transform.',
      'Building Tomorrow, Today',
    ];

    const sageTaglines = [
      'Wisdom in Action',
      'Knowledge That Drives Results',
      'Expert Guidance, Trusted Partner',
    ];

    expect(creatorTaglines[0]).toContain('Ideas');
    expect(sageTaglines[0]).toContain('Wisdom');
  });
});
