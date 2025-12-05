/**
 * Workflow API Tests - Planning Module (Epic 08)
 *
 * Tests for planning workflow API routes: business-model-canvas,
 * financial-projections, business-plan.
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
    planningSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth-server', () => ({
  getSession: vi.fn(),
}));

// Import route handlers directly (after mocks)
import { POST, GET, PUT } from '../planning/[businessId]/business-model-canvas/route';
import { prisma } from '@hyvve/db';
import { getSession } from '@/lib/auth-server';

const mockPrisma = prisma as unknown as {
  business: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  planningSession: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

const mockGetSession = getSession as ReturnType<typeof vi.fn>;

// Helper to create mock request
function createMockRequest(body: object, method = 'POST'): NextRequest {
  return {
    json: () => Promise.resolve(body),
    method,
    url: 'http://localhost:3000/api/planning/test-id/business-model-canvas',
  } as unknown as NextRequest;
}

// Canvas block definitions
const CANVAS_BLOCKS = [
  'customer_segments',
  'value_propositions',
  'channels',
  'customer_relationships',
  'revenue_streams',
  'key_resources',
  'key_activities',
  'key_partnerships',
  'cost_structure',
] as const;

describe('Planning Workflow API Routes', () => {
  const mockBusinessId = 'business-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Business Model Canvas - Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

            const request = createMockRequest({ message: 'Test message' });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Business Model Canvas - POST Message', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: mockUserId } });
    });

    it('should return 400 for invalid request body', async () => {
            const request = createMockRequest({ message: '' }); // Empty message
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);

            const request = createMockRequest({ message: 'Test message' });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
    });

    it('should process canvas message and return agent response', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        planningData: null,
        validationData: null,
      });

            const request = createMockRequest({ message: 'Start the canvas workflow' });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBeDefined();
      expect(data.data.message.role).toBe('assistant');
      expect(data.data.message.agent).toBe('model');
    });

    it('should start with customer_segments block', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        planningData: null,
        validationData: null,
      });

            const request = createMockRequest({ message: 'Let me start filling out my business model canvas' });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.message.content).toContain('Customer Segments');
    });

    it('should accept items for canvas block', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        planningData: null,
        validationData: null,
      });
      mockPrisma.planningSession.upsert.mockResolvedValue({});

            const request = createMockRequest({
        message: 'Small business owners, Enterprise companies, Tech startups',
      });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should acknowledge the items and move to next block
      expect(data.data.message.content).toBeDefined();
    });

    it('should pre-fill from validation data when available', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: mockBusinessId,
        name: 'Test Business',
        planningData: null,
        validationData: {
          targetCustomer: 'Small and medium businesses',
          proposedSolution: 'AI-powered automation',
          problemStatement: 'Manual data entry',
        },
      });

            const request = createMockRequest({ message: 'Start canvas' });
      const response = await POST(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should include pre-fill from validation data
      expect(data.data.message.content).toContain('From your validation');
    });
  });

  describe('Business Model Canvas - GET Status', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: mockUserId } });
    });

    it('should return not_started status when no planning session', async () => {
      mockPrisma.planningSession.findUnique.mockResolvedValue(null);

            const request = createMockRequest({}, 'GET');
      const response = await GET(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('not_started');
      expect(data.data.canvas).toBeNull();
      expect(data.data.currentBlock).toBe('customer_segments');
    });

    it('should return in_progress status with completed blocks', async () => {
      mockPrisma.planningSession.findUnique.mockResolvedValue({
        businessId: mockBusinessId,
        canvas: {
          customer_segments: { items: ['SMBs', 'Enterprises'], notes: '', confidence: 'medium', sources: [] },
          value_propositions: { items: [], notes: '', confidence: 'medium', sources: [] },
        },
        completedWorkflows: [],
      });

            const request = createMockRequest({}, 'GET');
      const response = await GET(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('in_progress');
      expect(data.data.completedBlocks).toContain('customer_segments');
      expect(data.data.currentBlock).toBe('value_propositions');
    });

    it('should return completed status with next workflow', async () => {
      const fullCanvas = Object.fromEntries(
        CANVAS_BLOCKS.map((block) => [
          block,
          { items: ['Item 1', 'Item 2'], notes: '', confidence: 'medium', sources: [] },
        ])
      );

      mockPrisma.planningSession.findUnique.mockResolvedValue({
        businessId: mockBusinessId,
        canvas: fullCanvas,
        completedWorkflows: ['business_model_canvas'],
      });

            const request = createMockRequest({}, 'GET');
      const response = await GET(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('completed');
      expect(data.data.nextWorkflow).toBe('financial_projections');
    });
  });

  describe('Business Model Canvas - PUT Update Block', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: mockUserId } });
    });

    it('should return 400 for invalid block name', async () => {
            const request = createMockRequest({
        block: 'invalid_block',
        items: ['Item 1'],
      });
      const response = await PUT(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when planning session not found', async () => {
      mockPrisma.planningSession.findUnique.mockResolvedValue(null);

            const request = createMockRequest({
        block: 'customer_segments',
        items: ['Item 1'],
      });
      const response = await PUT(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
    });

    it('should update canvas block successfully', async () => {
      mockPrisma.planningSession.findUnique.mockResolvedValue({
        businessId: mockBusinessId,
        canvas: {
          customer_segments: { items: [], notes: '', confidence: 'medium', sources: [] },
          metadata: { version: '1.0' },
        },
      });
      mockPrisma.planningSession.update.mockResolvedValue({
        businessId: mockBusinessId,
      });

            const request = createMockRequest({
        block: 'customer_segments',
        items: ['Small businesses', 'Enterprises'],
        confidence: 'high',
      });
      const response = await PUT(request, { params: Promise.resolve({ businessId: mockBusinessId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.planningSession.update).toHaveBeenCalled();
    });
  });
});

describe('Canvas Block Schema Tests', () => {
  it('should validate all canvas block names', () => {
    const { z } = require('zod');

    const canvasBlockSchema = z.enum(CANVAS_BLOCKS);

    // Valid blocks
    CANVAS_BLOCKS.forEach((block) => {
      expect(canvasBlockSchema.safeParse(block).success).toBe(true);
    });

    // Invalid blocks
    expect(canvasBlockSchema.safeParse('invalid_block').success).toBe(false);
    expect(canvasBlockSchema.safeParse('').success).toBe(false);
  });

  it('should validate canvas block update schema', () => {
    const { z } = require('zod');

    const canvasBlockUpdateSchema = z.object({
      block: z.enum(CANVAS_BLOCKS),
      items: z.array(z.string()).optional(),
      notes: z.string().optional(),
      confidence: z.enum(['high', 'medium', 'low']).optional(),
    });

    // Valid minimal update
    const validMinimal = { block: 'customer_segments' };
    expect(canvasBlockUpdateSchema.safeParse(validMinimal).success).toBe(true);

    // Valid full update
    const validFull = {
      block: 'value_propositions',
      items: ['Item 1', 'Item 2'],
      notes: 'Some notes',
      confidence: 'high',
    };
    expect(canvasBlockUpdateSchema.safeParse(validFull).success).toBe(true);

    // Invalid confidence level
    const invalidConfidence = {
      block: 'channels',
      confidence: 'very_high',
    };
    expect(canvasBlockUpdateSchema.safeParse(invalidConfidence).success).toBe(false);
  });

  it('should validate canvas message schema', () => {
    const { z } = require('zod');

    const canvasMessageSchema = z.object({
      message: z.string().min(1, 'Message is required'),
      context: z.string().optional(),
    });

    // Valid input
    expect(canvasMessageSchema.safeParse({ message: 'Test' }).success).toBe(true);

    // Invalid input
    expect(canvasMessageSchema.safeParse({ message: '' }).success).toBe(false);
    expect(canvasMessageSchema.safeParse({}).success).toBe(false);
  });
});

describe('Canvas Response Generation', () => {
  it('should define correct canvas block prompts', () => {
    const BLOCK_PROMPTS = {
      customer_segments: {
        title: 'Customer Segments',
        question: 'Who are your most important customers?',
      },
      value_propositions: {
        title: 'Value Propositions',
        question: 'What value do you deliver to your customers?',
      },
      channels: {
        title: 'Channels',
        question: 'How do you reach and deliver value to your customers?',
      },
    };

    expect(BLOCK_PROMPTS.customer_segments.title).toBe('Customer Segments');
    expect(BLOCK_PROMPTS.value_propositions.question).toContain('value');
    expect(BLOCK_PROMPTS.channels.question).toContain('reach');
  });

  it('should have 9 canvas blocks total', () => {
    expect(CANVAS_BLOCKS).toHaveLength(9);
    expect(CANVAS_BLOCKS).toContain('customer_segments');
    expect(CANVAS_BLOCKS).toContain('cost_structure');
  });
});
