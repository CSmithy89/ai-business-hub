import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfidenceCalculatorService } from './confidence-calculator.service';
import { PrismaService } from '../../common/services/prisma.service';
import { ConfidenceFactor } from '@hyvve/shared';

describe('ConfidenceCalculatorService', () => {
  let service: ConfidenceCalculatorService;

  const mockPrismaService = {
    workspace: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfidenceCalculatorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConfidenceCalculatorService>(
      ConfidenceCalculatorService,
    );
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('calculate()', () => {
    const workspaceId = 'workspace-123';

    describe('Valid Calculations', () => {
      it('should calculate weighted average correctly', async () => {
        // Mock workspace with default settings
        mockPrismaService.workspace.findUnique.mockResolvedValue({
          settings: null,
        });

        const factors: ConfidenceFactor[] = [
          {
            factor: 'data_completeness',
            score: 90,
            weight: 0.5,
            explanation: 'All required fields filled',
          },
          {
            factor: 'historical_accuracy',
            score: 70,
            weight: 0.5,
            explanation: '70% success rate',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.overallScore).toBe(80); // (90*0.5 + 70*0.5) = 80
        expect(result.factors).toEqual(factors);
      });

      it('should calculate with three factors correctly', async () => {
        mockPrismaService.workspace.findUnique.mockResolvedValue({
          settings: null,
        });

        const factors: ConfidenceFactor[] = [
          {
            factor: 'data_completeness',
            score: 100,
            weight: 0.4,
            explanation: 'Perfect',
          },
          {
            factor: 'historical_accuracy',
            score: 80,
            weight: 0.4,
            explanation: 'Good',
          },
          {
            factor: 'business_rules',
            score: 50,
            weight: 0.2,
            explanation: 'Some issues',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        // (100*0.4 + 80*0.4 + 50*0.2) = 82
        expect(result.overallScore).toBe(82);
      });

      it('should round to 2 decimal places', async () => {
        mockPrismaService.workspace.findUnique.mockResolvedValue({
          settings: null,
        });

        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 33.333,
            weight: 0.333,
            explanation: 'Test',
          },
          {
            factor: 'test2',
            score: 66.666,
            weight: 0.667,
            explanation: 'Test 2',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        // Should be rounded to 2 decimal places
        // (33.333*0.333 + 66.666*0.667) = 55.57
        expect(result.overallScore).toBeCloseTo(55.57, 2);
      });
    });

    describe('Recommendation Logic', () => {
      beforeEach(() => {
        mockPrismaService.workspace.findUnique.mockResolvedValue({
          settings: null,
        });
      });

      it('should return approve for score >= 85', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 85,
            weight: 1.0,
            explanation: 'Exactly 85',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.recommendation).toBe('approve');
        expect(result.aiReasoning).toBeUndefined();
      });

      it('should return approve for score > 85', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 95,
            weight: 1.0,
            explanation: 'Very high',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.recommendation).toBe('approve');
        expect(result.aiReasoning).toBeUndefined();
      });

      it('should return review for score exactly 60', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 60,
            weight: 1.0,
            explanation: 'Exactly 60',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.recommendation).toBe('review');
        expect(result.aiReasoning).toBeUndefined();
      });

      it('should return review for score between 60 and 84', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 75,
            weight: 1.0,
            explanation: 'Medium confidence',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.recommendation).toBe('review');
        expect(result.aiReasoning).toBeUndefined();
      });

      it('should return review for score exactly 84.99', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 84.99,
            weight: 1.0,
            explanation: 'Just under threshold',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.recommendation).toBe('review');
        expect(result.aiReasoning).toBeUndefined();
      });

      it('should return full_review for score < 60', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 59,
            weight: 1.0,
            explanation: 'Just under threshold',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.recommendation).toBe('full_review');
        expect(result.aiReasoning).toBeDefined();
      });

      it('should return full_review with reasoning for low confidence', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'historical_accuracy',
            score: 40,
            weight: 0.6,
            explanation: 'Poor history',
          },
          {
            factor: 'data_completeness',
            score: 80,
            weight: 0.4,
            explanation: 'Good data',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        // (40*0.6 + 80*0.4) = 56
        expect(result.overallScore).toBe(56);
        expect(result.recommendation).toBe('full_review');
        expect(result.aiReasoning).toBeDefined();
        expect(result.aiReasoning).toContain('56.0%');
        expect(result.aiReasoning).toContain('historical_accuracy');
      });
    });

    describe('Workspace Thresholds', () => {
      it('should use workspace-specific thresholds', async () => {
        mockPrismaService.workspace.findUnique.mockResolvedValue({
          settings: {
            autoApproveThreshold: 90,
            quickReviewThreshold: 70,
          },
        });

        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 85,
            weight: 1.0,
            explanation: 'Score 85',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        // With custom threshold of 90, score of 85 should be 'review' not 'approve'
        expect(result.recommendation).toBe('review');
      });

      it('should use default thresholds when workspace settings do not exist', async () => {
        mockPrismaService.workspace.findUnique.mockResolvedValue({
          settings: null,
        });

        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 85,
            weight: 1.0,
            explanation: 'Score 85',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        // With default threshold of 85, score of 85 should be 'approve'
        expect(result.recommendation).toBe('approve');
      });

      it('should use default thresholds when workspace not found', async () => {
        mockPrismaService.workspace.findUnique.mockResolvedValue(null);

        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 85,
            weight: 1.0,
            explanation: 'Score 85',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.recommendation).toBe('approve');
      });

      it('should use default thresholds on database error', async () => {
        mockPrismaService.workspace.findUnique.mockRejectedValue(
          new Error('Database error'),
        );

        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 85,
            weight: 1.0,
            explanation: 'Score 85',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.recommendation).toBe('approve');
      });

      it('should handle partial workspace settings', async () => {
        mockPrismaService.workspace.findUnique.mockResolvedValue({
          settings: {
            autoApproveThreshold: null,
            quickReviewThreshold: 70,
          },
        });

        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 85,
            weight: 1.0,
            explanation: 'Score 85',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        // Should use default autoApprove (85) and custom quickReview (70)
        expect(result.recommendation).toBe('approve');
      });
    });

    describe('AI Reasoning Generation', () => {
      beforeEach(() => {
        mockPrismaService.workspace.findUnique.mockResolvedValue({
          settings: null,
        });
      });

      it('should include overall score in reasoning', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 50,
            weight: 1.0,
            explanation: 'Low score',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.aiReasoning).toContain('50.0%');
      });

      it('should list low factors in reasoning', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'historical_accuracy',
            score: 40,
            weight: 0.5,
            explanation: 'Poor history',
          },
          {
            factor: 'data_completeness',
            score: 55,
            weight: 0.5,
            explanation: 'Missing data',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.aiReasoning).toContain('historical_accuracy');
        expect(result.aiReasoning).toContain('data_completeness');
      });

      it('should list concerning factors in reasoning', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'business_rules',
            score: 50,
            weight: 0.7,
            explanation: 'Rule violation detected',
            concerning: true,
          },
          {
            factor: 'data_completeness',
            score: 80,
            weight: 0.3,
            explanation: 'Data OK',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.aiReasoning).toContain('Concerning factors');
        expect(result.aiReasoning).toContain('Rule violation detected');
      });

      it('should not generate reasoning for high confidence', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 90,
            weight: 1.0,
            explanation: 'High confidence',
          },
        ];

        const result = await service.calculate(factors, workspaceId);

        expect(result.aiReasoning).toBeUndefined();
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockPrismaService.workspace.findUnique.mockResolvedValue({
          settings: null,
        });
      });

      it('should throw error when factors array is empty', async () => {
        await expect(service.calculate([], workspaceId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.calculate([], workspaceId)).rejects.toThrow(
          'At least one confidence factor is required',
        );
      });

      it('should throw error when weights do not sum to 1.0', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 80,
            weight: 0.5,
            explanation: 'Test',
          },
          {
            factor: 'test2',
            score: 90,
            weight: 0.3,
            explanation: 'Test 2',
          },
        ];

        await expect(service.calculate(factors, workspaceId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.calculate(factors, workspaceId)).rejects.toThrow(
          'Factor weights must sum to 1.0',
        );
      });

      it('should accept weights with small floating point errors', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 80,
            weight: 0.333,
            explanation: 'Test',
          },
          {
            factor: 'test2',
            score: 90,
            weight: 0.333,
            explanation: 'Test 2',
          },
          {
            factor: 'test3',
            score: 70,
            weight: 0.334,
            explanation: 'Test 3',
          },
        ];

        // Sum is 1.0 but might have floating point error
        await expect(
          service.calculate(factors, workspaceId),
        ).resolves.toBeDefined();
      });

      it('should throw error for score < 0', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: -10,
            weight: 1.0,
            explanation: 'Negative score',
          },
        ];

        await expect(service.calculate(factors, workspaceId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.calculate(factors, workspaceId)).rejects.toThrow(
          'Factor score must be between 0 and 100',
        );
      });

      it('should throw error for score > 100', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 150,
            weight: 1.0,
            explanation: 'Over 100',
          },
        ];

        await expect(service.calculate(factors, workspaceId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.calculate(factors, workspaceId)).rejects.toThrow(
          'Factor score must be between 0 and 100',
        );
      });

      it('should throw error for weight < 0', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 80,
            weight: -0.5,
            explanation: 'Negative weight',
          },
        ];

        await expect(service.calculate(factors, workspaceId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.calculate(factors, workspaceId)).rejects.toThrow(
          'Factor weight must be between 0 and 1',
        );
      });

      it('should throw error for weight > 1', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 80,
            weight: 1.5,
            explanation: 'Weight over 1',
          },
        ];

        await expect(service.calculate(factors, workspaceId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.calculate(factors, workspaceId)).rejects.toThrow(
          'Factor weight must be between 0 and 1',
        );
      });

      it('should accept score of 0', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 0,
            weight: 1.0,
            explanation: 'Zero score',
          },
        ];

        await expect(
          service.calculate(factors, workspaceId),
        ).resolves.toBeDefined();
      });

      it('should accept score of 100', async () => {
        const factors: ConfidenceFactor[] = [
          {
            factor: 'test',
            score: 100,
            weight: 1.0,
            explanation: 'Perfect score',
          },
        ];

        const result = await service.calculate(factors, workspaceId);
        expect(result.overallScore).toBe(100);
      });
    });
  });
});
