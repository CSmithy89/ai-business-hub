import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '../../../common/services/prisma.service';
import { ConfidenceLevel, VelocityTrend } from '../dto/prism-forecast.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              findMany: jest.fn(),
              aggregate: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getForecast', () => {
    it('should return LOW confidence with insufficient data', async () => {
      // Mock empty history
      jest.spyOn(service as any, 'getVelocityHistory').mockResolvedValue([]);
      jest.spyOn(service as any, 'getRemainingPoints').mockResolvedValue(100);

      const result = await service.getForecast('proj1', 'ws1');

      expect(result.confidence).toBe(ConfidenceLevel.LOW);
      expect(result.factors).toContain('Insufficient historical data');
    });

    it('should calculate forecast with sufficient data', async () => {
      const mockHistory = [
        {
          period: '2024-W01',
          completedPoints: 10,
          totalTasks: 5,
          completedTasks: 5,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
        },
        {
          period: '2024-W02',
          completedPoints: 12,
          totalTasks: 6,
          completedTasks: 6,
          startDate: '2024-01-08',
          endDate: '2024-01-14',
        },
        {
          period: '2024-W03',
          completedPoints: 11,
          totalTasks: 5,
          completedTasks: 5,
          startDate: '2024-01-15',
          endDate: '2024-01-21',
        },
      ];

      jest.spyOn(service as any, 'getVelocityHistory').mockResolvedValue(mockHistory);
      jest.spyOn(service as any, 'getRemainingPoints').mockResolvedValue(50);

      const result = await service.getForecast('proj1', 'ws1');

      expect(result.predictedDate).toBeDefined();
      expect(result.velocityAvg).toBeGreaterThan(0);
      expect(result.dataPoints).toBe(3);
    });

    it('should apply scenario adjustments', async () => {
      const mockHistory = [
        { period: '2024-W01', completedPoints: 10, totalTasks: 5, completedTasks: 5, startDate: '2024-01-01', endDate: '2024-01-07' },
      ];

      jest.spyOn(service as any, 'getVelocityHistory').mockResolvedValue(mockHistory);
      jest.spyOn(service as any, 'getRemainingPoints').mockResolvedValue(50);

      const scenario = { addedScope: 20 };
      const result = await service.getForecast('proj1', 'ws1', scenario);

      expect(result.factors).toContain('Added scope: 20 points');
    });
  });

  describe('getVelocity', () => {
    it('should return zero velocity with no data', async () => {
      jest.spyOn(service as any, 'getVelocityHistory').mockResolvedValue([]);

      const result = await service.getVelocity('proj1', 'ws1', '4w');

      expect(result.velocity).toBe(0);
      expect(result.confidence).toBe(ConfidenceLevel.LOW);
      expect(result.sampleSize).toBe(0);
    });

    it('should calculate velocity from historical data', async () => {
      const mockHistory = [
        { period: '2024-W01', completedPoints: 10, totalTasks: 5, completedTasks: 5, startDate: '2024-01-01', endDate: '2024-01-07' },
        { period: '2024-W02', completedPoints: 12, totalTasks: 6, completedTasks: 6, startDate: '2024-01-08', endDate: '2024-01-14' },
        { period: '2024-W03', completedPoints: 14, totalTasks: 7, completedTasks: 7, startDate: '2024-01-15', endDate: '2024-01-21' },
        { period: '2024-W04', completedPoints: 13, totalTasks: 6, completedTasks: 6, startDate: '2024-01-22', endDate: '2024-01-28' },
      ];

      jest.spyOn(service as any, 'getVelocityHistory').mockResolvedValue(mockHistory);

      const result = await service.getVelocity('proj1', 'ws1', '4w');

      expect(result.velocity).toBeCloseTo(12.25, 2); // (10+12+14+13)/4
      expect(result.sampleSize).toBe(4);
    });

    it('should detect upward trend', async () => {
      const mockHistory = [
        { period: '2024-W01', completedPoints: 8, totalTasks: 4, completedTasks: 4, startDate: '2024-01-01', endDate: '2024-01-07' },
        { period: '2024-W02', completedPoints: 10, totalTasks: 5, completedTasks: 5, startDate: '2024-01-08', endDate: '2024-01-14' },
        { period: '2024-W03', completedPoints: 12, totalTasks: 6, completedTasks: 6, startDate: '2024-01-15', endDate: '2024-01-21' },
        { period: '2024-W04', completedPoints: 14, totalTasks: 7, completedTasks: 7, startDate: '2024-01-22', endDate: '2024-01-28' },
      ];

      jest.spyOn(service as any, 'getVelocityHistory').mockResolvedValue(mockHistory);

      const result = await service.getVelocity('proj1', 'ws1', '4w');

      expect(result.trend).toBe(VelocityTrend.UP);
    });
  });

  describe('getVelocityHistory', () => {
    it('should fetch historical velocity data', async () => {
      const mockTasks = [
        { storyPoints: 5 },
        { storyPoints: 3 },
        { storyPoints: 2 },
      ];

      prismaService.task.findMany.mockResolvedValue(mockTasks as unknown as any);

      const result = await service.getVelocityHistory('proj1', 'ws1', 4);

      expect(result).toHaveLength(4);
      expect(result[0]).toHaveProperty('period');
      expect(result[0]).toHaveProperty('completedPoints');
    });

    it('should handle no completed tasks', async () => {
      prismaService.task.findMany.mockResolvedValue([] as unknown as any);

      const result = await service.getVelocityHistory('proj1', 'ws1', 4);

      expect(result).toHaveLength(4);
      expect(result[0].completedPoints).toBe(0);
    });
  });

  describe('detectAnomalies', () => {
    it('should return empty array with insufficient data', async () => {
      jest.spyOn(service as any, 'getVelocityHistory').mockResolvedValue([
        { period: '2024-W01', completedPoints: 10, totalTasks: 5, completedTasks: 5, startDate: '2024-01-01', endDate: '2024-01-07' },
      ]);

      const result = await service.detectAnomalies('proj1', 'ws1');

      expect(result).toEqual([]);
    });

    it('should detect anomalies in velocity data', async () => {
      const mockHistory = [
        { period: '2024-W01', completedPoints: 10, totalTasks: 5, completedTasks: 5, startDate: '2024-01-01', endDate: '2024-01-07' },
        { period: '2024-W02', completedPoints: 12, totalTasks: 6, completedTasks: 6, startDate: '2024-01-08', endDate: '2024-01-14' },
        { period: '2024-W03', completedPoints: 2, totalTasks: 1, completedTasks: 1, startDate: '2024-01-15', endDate: '2024-01-21' }, // Anomaly
        { period: '2024-W04', completedPoints: 11, totalTasks: 5, completedTasks: 5, startDate: '2024-01-22', endDate: '2024-01-28' },
      ];

      jest.spyOn(service as any, 'getVelocityHistory').mockResolvedValue(mockHistory);

      const result = await service.detectAnomalies('proj1', 'ws1');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('period');
      expect(result[0]).toHaveProperty('severity');
    });
  });

  describe('analyzeCompletionProbability', () => {
    it('should calculate probability for target date', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 90); // 90 days from now

      const mockVelocity = {
        velocity: 12,
        trend: VelocityTrend.STABLE,
        confidence: ConfidenceLevel.HIGH,
        sampleSize: 8,
        timeRange: '4w',
      };

      jest.spyOn(service as any, 'getRemainingPoints').mockResolvedValue(100);
      jest.spyOn(service, 'getVelocity').mockResolvedValue(mockVelocity);

      const result = await service.analyzeCompletionProbability(
        'proj1',
        'ws1',
        targetDate.toISOString().split('T')[0],
      );

      expect(result.targetDate).toBeDefined();
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
      expect(result.assessment).toBeDefined();
    });

    it('should indicate on-track when velocity exceeds requirement', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 90);

      const mockVelocity = {
        velocity: 20, // High velocity
        trend: VelocityTrend.UP,
        confidence: ConfidenceLevel.HIGH,
        sampleSize: 8,
        timeRange: '4w',
      };

      jest.spyOn(service as any, 'getRemainingPoints').mockResolvedValue(50); // Low remaining
      jest.spyOn(service, 'getVelocity').mockResolvedValue(mockVelocity);

      const result = await service.analyzeCompletionProbability(
        'proj1',
        'ws1',
        targetDate.toISOString().split('T')[0],
      );

      expect(result.assessment).toContain('On track');
    });
  });

  describe('fallbackLinearProjection', () => {
    it('should calculate linear projection with default velocity', () => {
      const result = (service as any).fallbackLinearProjection([], 100);

      expect(result.predictedDate).toBeDefined();
      expect(result.confidence).toBe(ConfidenceLevel.LOW);
      expect(result.factors).toContain('Fallback mode');
      expect(result.factors).toContain('Insufficient historical data');
    });

    it('should use average velocity from history', () => {
      const mockHistory = [
        { period: '2024-W01', completedPoints: 10, totalTasks: 5, completedTasks: 5, startDate: '2024-01-01', endDate: '2024-01-07' },
        { period: '2024-W02', completedPoints: 12, totalTasks: 6, completedTasks: 6, startDate: '2024-01-08', endDate: '2024-01-14' },
      ];

      const result = (service as any).fallbackLinearProjection(mockHistory, 66);

      expect(result.velocityAvg).toBe(11); // (10+12)/2
      expect(result.dataPoints).toBe(2);
    });
  });

  describe('getRemainingPoints', () => {
    it('should calculate remaining story points', async () => {
      prismaService.task.aggregate.mockResolvedValue({
        _sum: { storyPoints: 150 },
      } as unknown as any);

      const result = await (service as any).getRemainingPoints('proj1', 'ws1');

      expect(result).toBe(150);
    });

    it('should return 0 when no remaining points', async () => {
      prismaService.task.aggregate.mockResolvedValue({
        _sum: { storyPoints: null },
      } as unknown as any);

      const result = await (service as any).getRemainingPoints('proj1', 'ws1');

      expect(result).toBe(0);
    });
  });
});
