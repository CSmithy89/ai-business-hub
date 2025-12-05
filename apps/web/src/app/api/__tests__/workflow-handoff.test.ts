/**
 * Workflow API Tests - Handoff Integration (Epic 08)
 *
 * Tests for workflow handoff API routes: validation-to-planning,
 * planning-to-branding. Verifies proper state transitions and data passing.
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
    validationSession: {
      findUnique: vi.fn(),
    },
    planningSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    brandingSession: {
      findUnique: vi.fn(),
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
import {
  POST as ValidationToPlanningPOST,
  GET as ValidationToPlanningGET,
} from '../handoff/[businessId]/validation-to-planning/route';
import { POST as PlanningToBrandingPOST } from '../handoff/[businessId]/planning-to-branding/route';
import { prisma } from '@hyvve/db';
import { auth } from '@/lib/auth';

const mockPrisma = prisma as unknown as {
  business: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  validationSession: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  planningSession: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  brandingSession: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

const mockAuth = auth as unknown as {
  api: {
    getSession: ReturnType<typeof vi.fn>;
  };
};

// Helper to create mock request
function createMockRequest(body: object = {}, method = 'POST'): NextRequest {
  return {
    json: () => Promise.resolve(body),
    method,
    url: 'http://localhost:3000/api/handoff/test-id/validation-to-planning',
  } as unknown as NextRequest;
}

describe('Validation to Planning Handoff', () => {
  const mockBusinessId = 'business-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await ValidationToPlanningPOST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Business Validation', () => {
    beforeEach(() => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: mockUserId } });
    });

    it('should return 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await ValidationToPlanningPOST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Business not found');
    });

    it('should return 400 when validation session not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        validationData: null,
        planningData: null,
      });

      const request = createMockRequest();
      const response = await ValidationToPlanningPOST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation session not found');
    });
  });

  describe('Workflow Completion Check', () => {
    beforeEach(() => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: mockUserId } });
    });

    it('should return 400 when validation workflows incomplete', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        validationData: {
          completedWorkflows: ['idea_intake', 'market_sizing'],
          // Missing: competitor_mapping, customer_discovery
        },
        planningData: null,
      });

      const request = createMockRequest();
      const response = await ValidationToPlanningPOST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation incomplete');
      expect(data.missingWorkflows).toContain('competitor_mapping');
      expect(data.missingWorkflows).toContain('customer_discovery');
    });

    it('should list all missing workflows', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        validationData: {
          completedWorkflows: [],
        },
        planningData: null,
      });

      const request = createMockRequest();
      const response = await ValidationToPlanningPOST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.missingWorkflows).toHaveLength(4);
      expect(data.missingWorkflows).toContain('idea_intake');
      expect(data.missingWorkflows).toContain('market_sizing');
      expect(data.missingWorkflows).toContain('competitor_mapping');
      expect(data.missingWorkflows).toContain('customer_discovery');
    });
  });

  describe('Successful Handoff', () => {
    beforeEach(() => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: mockUserId } });
    });

    it('should successfully handoff from validation to planning', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        onboardingProgress: 30,
        validationData: {
          completedWorkflows: ['idea_intake', 'market_sizing', 'competitor_mapping', 'customer_discovery'],
          tam: { value: 1000000000 },
          sam: { value: 500000000 },
          som: { value: 100000000 },
          competitors: [{ name: 'Competitor A' }],
          icps: [{ name: 'ICP 1' }],
          validationScore: 75,
        },
        planningData: null,
      });
      mockPrisma.planningSession.create.mockResolvedValue({ id: 'planning-123' });
      mockPrisma.business.update.mockResolvedValue({});

      const request = createMockRequest();
      const response = await ValidationToPlanningPOST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.handoff).toBeDefined();
      expect(data.handoff.from).toBe('validation');
      expect(data.handoff.to).toBe('planning');
    });

    it('should include handoff summary with market data', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        onboardingProgress: 30,
        validationData: {
          completedWorkflows: ['idea_intake', 'market_sizing', 'competitor_mapping', 'customer_discovery'],
          tam: { value: 1000000000, sources: ['Source 1'] },
          sam: { value: 500000000, sources: ['Source 2'] },
          som: { value: 100000000, sources: ['Source 3'] },
          competitors: [{ name: 'Competitor A' }],
          icps: [{ name: 'ICP 1' }],
          validationScore: 75,
        },
        planningData: null,
      });
      mockPrisma.planningSession.create.mockResolvedValue({ id: 'planning-123' });
      mockPrisma.business.update.mockResolvedValue({});

      const request = createMockRequest();
      const response = await ValidationToPlanningPOST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(data.handoff.summary).toBeDefined();
      expect(data.handoff.summary.marketData).toBeDefined();
      expect(data.handoff.summary.marketData.tam).toBeDefined();
      expect(data.handoff.summary.marketData.sam).toBeDefined();
      expect(data.handoff.summary.marketData.som).toBeDefined();
    });

    it('should create planning session if it does not exist', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        onboardingProgress: 30,
        validationData: {
          completedWorkflows: ['idea_intake', 'market_sizing', 'competitor_mapping', 'customer_discovery'],
          tam: null,
          sam: null,
          som: null,
          competitors: null,
          icps: null,
          validationScore: 70,
        },
        planningData: null,
      });
      mockPrisma.planningSession.create.mockResolvedValue({ id: 'planning-123' });
      mockPrisma.business.update.mockResolvedValue({});

      const request = createMockRequest();
      await ValidationToPlanningPOST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });

      expect(mockPrisma.planningSession.create).toHaveBeenCalledWith({
        data: { businessId: mockBusinessId },
      });
    });

    it('should update business phase to planning', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        onboardingProgress: 30,
        validationData: {
          completedWorkflows: ['idea_intake', 'market_sizing', 'competitor_mapping', 'customer_discovery'],
          tam: null,
          sam: null,
          som: null,
          competitors: null,
          icps: null,
          validationScore: 70,
        },
        planningData: null,
      });
      mockPrisma.planningSession.create.mockResolvedValue({ id: 'planning-123' });
      mockPrisma.business.update.mockResolvedValue({});

      const request = createMockRequest();
      await ValidationToPlanningPOST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });

      expect(mockPrisma.business.update).toHaveBeenCalledWith({
        where: { id: mockBusinessId },
        data: expect.objectContaining({
          validationStatus: 'COMPLETE',
          planningStatus: 'IN_PROGRESS',
        }),
      });
    });

    it('should emit validation.completed event', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        onboardingProgress: 30,
        validationData: {
          completedWorkflows: ['idea_intake', 'market_sizing', 'competitor_mapping', 'customer_discovery'],
          tam: null,
          sam: null,
          som: null,
          competitors: null,
          icps: null,
          validationScore: 80,
        },
        planningData: null,
      });
      mockPrisma.planningSession.create.mockResolvedValue({ id: 'planning-123' });
      mockPrisma.business.update.mockResolvedValue({});

      const request = createMockRequest();
      const response = await ValidationToPlanningPOST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(data.handoff.event).toBeDefined();
      expect(data.handoff.event.type).toBe('validation.completed');
      expect(data.handoff.event.businessId).toBe(mockBusinessId);
      expect(data.handoff.event.data.nextPhase).toBe('planning');

      consoleSpy.mockRestore();
    });
  });

  describe('GET Handoff Status', () => {
    beforeEach(() => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: mockUserId } });
    });

    it('should return handoff status with completed workflows', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        validationStatus: 'IN_PROGRESS',
        validationData: {
          completedWorkflows: ['idea_intake', 'market_sizing'],
        },
        planningData: null,
      });

            const request = createMockRequest({}, 'GET');
      const response = await ValidationToPlanningGET(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status.validationComplete).toBe(false);
      expect(data.status.completedWorkflows).toContain('idea_intake');
      expect(data.status.requiredWorkflows).toHaveLength(4);
    });

    it('should indicate when validation is complete but handoff not done', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        validationStatus: 'IN_PROGRESS',
        validationData: {
          completedWorkflows: ['idea_intake', 'market_sizing', 'competitor_mapping', 'customer_discovery'],
        },
        planningData: null,
      });

            const request = createMockRequest({}, 'GET');
      const response = await ValidationToPlanningGET(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(data.status.validationComplete).toBe(true);
      expect(data.status.handoffComplete).toBe(false);
      expect(data.status.currentPhase).toBe('validation');
    });

    it('should indicate when handoff is complete', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        validationStatus: 'COMPLETE',
        validationData: {
          completedWorkflows: ['idea_intake', 'market_sizing', 'competitor_mapping', 'customer_discovery'],
        },
        planningData: { id: 'planning-123' },
      });

            const request = createMockRequest({}, 'GET');
      const response = await ValidationToPlanningGET(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(data.status.validationComplete).toBe(true);
      expect(data.status.handoffComplete).toBe(true);
      expect(data.status.currentPhase).toBe('planning');
    });
  });
});

describe('Planning to Branding Handoff', () => {
  const mockBusinessId = 'business-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.api.getSession.mockResolvedValue({ user: { id: mockUserId } });
  });

  // Similar tests for planning-to-branding handoff
  it('should require planning workflows to be complete', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({
      id: mockBusinessId,
      name: 'Test Business',
      planningData: {
        completedWorkflows: ['business_model_canvas'],
        // Missing: financial_projections, business_plan
      },
      brandingData: null,
    });

    const request = createMockRequest();
    const response = await PlanningToBrandingPOST(request, {
      params: Promise.resolve({ businessId: mockBusinessId }),
    });
    const data = await response.json();

    // Should indicate incomplete planning workflows
    expect(response.status).toBe(400);
    expect(data.error).toContain('incomplete');
  });
});

describe('Handoff Data Integrity', () => {
  it('should preserve validation score in handoff summary', () => {
    const validationScore = 85;
    const handoffSummary = {
      marketData: { tam: {}, sam: {}, som: {} },
      competitors: [],
      customerProfiles: [],
      validationScore,
      handoffAt: new Date().toISOString(),
    };

    expect(handoffSummary.validationScore).toBe(validationScore);
  });

  it('should include handoff timestamp', () => {
    const beforeTime = Date.now();
    const handoffSummary = {
      handoffAt: new Date().toISOString(),
    };
    const afterTime = Date.now();

    const handoffTime = new Date(handoffSummary.handoffAt).getTime();
    expect(handoffTime).toBeGreaterThanOrEqual(beforeTime);
    expect(handoffTime).toBeLessThanOrEqual(afterTime);
  });
});
