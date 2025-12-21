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

  describe('runMonteCarloSimulation', () => {
    it('should run simulation with stable velocity', () => {
      const velocityHistory = [10, 12, 11, 13, 12, 11];
      const remainingPoints = 100;

      const result = (service as any).runMonteCarloSimulation(velocityHistory, remainingPoints, 1000);

      expect(result.dates).toBeDefined();
      expect(result.dates.p50).toBeDefined();
      expect(result.dates.p25).toBeDefined();
      expect(result.dates.p75).toBeDefined();
      expect(result.velocityMean).toBeCloseTo(11.5, 1);
      expect(result.simulationRuns).toBe(1000);
    });

    it('should detect upward trend with increasing velocity', () => {
      const velocityHistory = [8, 10, 12, 14, 16, 18];
      const remainingPoints = 100;

      const result = (service as any).runMonteCarloSimulation(velocityHistory, remainingPoints, 1000);

      expect(result.trendSlope).toBeGreaterThan(0);
      // Optimistic date should be earlier than pessimistic
      expect(new Date(result.dates.p25).getTime()).toBeLessThan(new Date(result.dates.p75).getTime());
    });

    it('should detect downward trend with decreasing velocity', () => {
      const velocityHistory = [18, 16, 14, 12, 10, 8];
      const remainingPoints = 100;

      const result = (service as any).runMonteCarloSimulation(velocityHistory, remainingPoints, 1000);

      expect(result.trendSlope).toBeLessThan(0);
    });

    it('should handle empty velocity history', () => {
      const result = (service as any).runMonteCarloSimulation([], 100, 1000);

      expect(result.velocityMean).toBe(0);
      expect(result.simulationRuns).toBe(0);
      expect(result.dates.p50).toBeDefined();
    });

    it('should generate percentiles in correct order', () => {
      const velocityHistory = [10, 12, 11, 13];
      const remainingPoints = 50;

      const result = (service as any).runMonteCarloSimulation(velocityHistory, remainingPoints, 1000);

      const p10Date = new Date(result.dates.p10).getTime();
      const p25Date = new Date(result.dates.p25).getTime();
      const p50Date = new Date(result.dates.p50).getTime();
      const p75Date = new Date(result.dates.p75).getTime();
      const p90Date = new Date(result.dates.p90).getTime();

      expect(p10Date).toBeLessThanOrEqual(p25Date);
      expect(p25Date).toBeLessThanOrEqual(p50Date);
      expect(p50Date).toBeLessThanOrEqual(p75Date);
      expect(p75Date).toBeLessThanOrEqual(p90Date);
    });
  });

  describe('analyzePredictionFactors', () => {
    it('should identify insufficient data factor', () => {
      const mockHistory = [
        { period: '2024-W01', completedPoints: 10, totalTasks: 5, completedTasks: 5, startDate: '2024-01-01', endDate: '2024-01-07' },
      ];

      const factors = (service as any).analyzePredictionFactors(mockHistory, 0, ConfidenceLevel.LOW);

      const dataFactor = factors.find((f: any) => f.name === 'Historical Data');
      expect(dataFactor).toBeDefined();
      expect(dataFactor.impact).toBe('NEGATIVE');
      expect(dataFactor.description).toContain('Insufficient');
    });

    it('should identify sufficient data factor', () => {
      const mockHistory = Array.from({ length: 8 }, (_, i) => ({
        period: `2024-W${i + 1}`,
        completedPoints: 10,
        totalTasks: 5,
        completedTasks: 5,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      }));

      const factors = (service as any).analyzePredictionFactors(mockHistory, 0, ConfidenceLevel.HIGH);

      const dataFactor = factors.find((f: any) => f.name === 'Historical Data');
      expect(dataFactor).toBeDefined();
      expect(dataFactor.impact).toBe('POSITIVE');
      expect(dataFactor.description).toContain('Sufficient');
    });

    it('should identify increasing velocity trend', () => {
      const mockHistory = Array.from({ length: 6 }, () => ({
        period: '2024-W01',
        completedPoints: 10,
        totalTasks: 5,
        completedTasks: 5,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      }));

      const factors = (service as any).analyzePredictionFactors(mockHistory, 0.5, ConfidenceLevel.MED);

      const trendFactor = factors.find((f: any) => f.name === 'Velocity Trend');
      expect(trendFactor).toBeDefined();
      expect(trendFactor.value).toBe('INCREASING');
      expect(trendFactor.impact).toBe('POSITIVE');
    });

    it('should identify decreasing velocity trend', () => {
      const mockHistory = Array.from({ length: 6 }, () => ({
        period: '2024-W01',
        completedPoints: 10,
        totalTasks: 5,
        completedTasks: 5,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      }));

      const factors = (service as any).analyzePredictionFactors(mockHistory, -0.5, ConfidenceLevel.MED);

      const trendFactor = factors.find((f: any) => f.name === 'Velocity Trend');
      expect(trendFactor).toBeDefined();
      expect(trendFactor.value).toBe('DECREASING');
      expect(trendFactor.impact).toBe('NEGATIVE');
    });

    it('should include scope change factor when scenario provided', () => {
      const mockHistory = Array.from({ length: 6 }, () => ({
        period: '2024-W01',
        completedPoints: 10,
        totalTasks: 5,
        completedTasks: 5,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      }));

      const scenario = { addedScope: 50 };
      const factors = (service as any).analyzePredictionFactors(mockHistory, 0, ConfidenceLevel.MED, scenario);

      const scopeFactor = factors.find((f: any) => f.name === 'Scope Change');
      expect(scopeFactor).toBeDefined();
      expect(scopeFactor.value).toBe('+50 points');
      expect(scopeFactor.impact).toBe('NEGATIVE');
    });

    it('should include team capacity factor when scenario provided', () => {
      const mockHistory = Array.from({ length: 6 }, () => ({
        period: '2024-W01',
        completedPoints: 10,
        totalTasks: 5,
        completedTasks: 5,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      }));

      const scenario = { teamSizeChange: 2 };
      const factors = (service as any).analyzePredictionFactors(mockHistory, 0, ConfidenceLevel.MED, scenario);

      const teamFactor = factors.find((f: any) => f.name === 'Team Capacity');
      expect(teamFactor).toBeDefined();
      expect(teamFactor.value).toBe('+2 members');
      expect(teamFactor.impact).toBe('POSITIVE');
    });
  });

  describe('getForecast with Monte Carlo', () => {
    it('should use Monte Carlo simulation with sufficient data', async () => {
      const mockHistory = Array.from({ length: 8 }, (_, i) => ({
        period: `2024-W${i + 1}`,
        completedPoints: 10 + i,
        totalTasks: 5,
        completedTasks: 5,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      }));

      jest.spyOn(service as any, 'getVelocityHistory').mockResolvedValue(mockHistory);
      jest.spyOn(service as any, 'getRemainingPoints').mockResolvedValue(100);

      const result = await service.getForecast('proj1', 'ws1');

      expect(result.probabilityDistribution).toBeDefined();
      expect(result.probabilityDistribution?.p50).toBeDefined();
      expect(result.probabilityDistribution?.p25).toBeDefined();
      expect(result.probabilityDistribution?.p75).toBeDefined();
      expect(result.factors).toBeInstanceOf(Array);
      expect((result.factors as any[]).length).toBeGreaterThan(0);
      expect((result.factors as any[])[0]).toHaveProperty('name');
      expect((result.factors as any[])[0]).toHaveProperty('impact');
    });

    it('should apply scenario adjustments to Monte Carlo', async () => {
      const mockHistory = Array.from({ length: 8 }, (_, i) => ({
        period: `2024-W${i + 1}`,
        completedPoints: 10,
        totalTasks: 5,
        completedTasks: 5,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      }));

      jest.spyOn(service as any, 'getVelocityHistory').mockResolvedValue(mockHistory);
      jest.spyOn(service as any, 'getRemainingPoints').mockResolvedValue(100);

      const scenario = { addedScope: 50, teamSizeChange: 1 };
      const result = await service.getForecast('proj1', 'ws1', scenario);

      const factors = result.factors as any[];
      expect(factors.find(f => f.name === 'Scope Change')).toBeDefined();
      expect(factors.find(f => f.name === 'Team Capacity')).toBeDefined();
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

  // ============================================
  // RISK DETECTION TESTS (PM-08-3)
  // ============================================

  describe('detectScheduleRisk', () => {
    it('should detect schedule risk when predicted date exceeds target', () => {
      const mockForecast = {
        predictedDate: '2025-03-15',
        confidence: ConfidenceLevel.MED,
        optimisticDate: '2025-03-01',
        pessimisticDate: '2025-03-30',
        reasoning: 'Test',
        factors: [],
        velocityAvg: 10,
        dataPoints: 6,
        probabilityDistribution: {
          p10: '2025-02-15',
          p25: '2025-03-01',
          p50: '2025-03-15',
          p75: '2025-04-01',
          p90: '2025-04-15',
        },
      };

      const targetDate = new Date('2025-03-01');

      const result = (service as any).detectScheduleRisk(mockForecast, targetDate);

      expect(result).toBeDefined();
      expect(result.category).toBe('SCHEDULE');
      expect(result.probability).toBe(0.65); // P50 > target
      expect(result.impact).toBeGreaterThan(0);
      expect(result.description).toContain('missing deadline');
      expect(result.mitigation).toBeDefined();
    });

    it('should return null when no schedule risk', () => {
      const mockForecast = {
        predictedDate: '2025-02-15',
        confidence: ConfidenceLevel.HIGH,
        optimisticDate: '2025-02-01',
        pessimisticDate: '2025-02-28',
        reasoning: 'Test',
        factors: [],
        velocityAvg: 10,
        dataPoints: 6,
        probabilityDistribution: {
          p10: '2025-02-01',
          p25: '2025-02-10',
          p50: '2025-02-15',
          p75: '2025-02-20',
          p90: '2025-02-25',
        },
      };

      const targetDate = new Date('2025-03-01');

      const result = (service as any).detectScheduleRisk(mockForecast, targetDate);

      expect(result).toBeNull();
    });

    it('should calculate high probability when P25 > target', () => {
      const mockForecast = {
        predictedDate: '2025-04-01',
        confidence: ConfidenceLevel.MED,
        optimisticDate: '2025-03-15',
        pessimisticDate: '2025-04-15',
        reasoning: 'Test',
        factors: [],
        velocityAvg: 10,
        dataPoints: 6,
        probabilityDistribution: {
          p10: '2025-03-01',
          p25: '2025-03-10',
          p50: '2025-04-01',
          p75: '2025-04-15',
          p90: '2025-05-01',
        },
      };

      const targetDate = new Date('2025-03-01');

      const result = (service as any).detectScheduleRisk(mockForecast, targetDate);

      expect(result.probability).toBe(0.85); // P25 > target = high probability
    });
  });

  describe('detectScopeRisk', () => {
    it('should detect scope risk when increase >10%', async () => {
      const baselineScope = 100;
      prismaService.task.aggregate.mockResolvedValue({
        _sum: { storyPoints: 125 },
      } as unknown as any);

      const result = await (service as any).detectScopeRisk('proj1', 'ws1', baselineScope);

      expect(result).toBeDefined();
      expect(result.category).toBe('SCOPE');
      expect(result.probability).toBeGreaterThan(0.4);
      expect(result.description).toContain('25%');
      expect(result.mitigation).toBeDefined();
    });

    it('should return null when scope increase <=10%', async () => {
      const baselineScope = 100;
      prismaService.task.aggregate.mockResolvedValue({
        _sum: { storyPoints: 105 },
      } as unknown as any);

      const result = await (service as any).detectScopeRisk('proj1', 'ws1', baselineScope);

      expect(result).toBeNull();
    });

    it('should handle zero baseline scope', async () => {
      const baselineScope = 0;
      prismaService.task.aggregate.mockResolvedValue({
        _sum: { storyPoints: 50 },
      } as unknown as any);

      const result = await (service as any).detectScopeRisk('proj1', 'ws1', baselineScope);

      expect(result).toBeNull(); // Can't calculate increase from 0 baseline
    });
  });

  describe('detectResourceRisk', () => {
    it('should detect resource risk with decreasing velocity trend', () => {
      const mockForecast = {
        predictedDate: '2025-03-15',
        confidence: ConfidenceLevel.MED,
        optimisticDate: '2025-03-01',
        pessimisticDate: '2025-03-30',
        reasoning: 'Test',
        factors: [
          {
            name: 'Velocity Trend',
            value: 'DECREASING',
            impact: 'NEGATIVE',
            description: 'Velocity is declining',
          },
        ],
        velocityAvg: 10,
        dataPoints: 6,
      };

      const result = (service as any).detectResourceRisk(mockForecast);

      expect(result).toBeDefined();
      expect(result.category).toBe('RESOURCE');
      expect(result.probability).toBeGreaterThan(0);
      expect(result.description).toContain('declining');
      expect(result.mitigation).toBeDefined();
    });

    it('should return null with stable velocity trend', () => {
      const mockForecast = {
        predictedDate: '2025-03-15',
        confidence: ConfidenceLevel.HIGH,
        optimisticDate: '2025-03-01',
        pessimisticDate: '2025-03-30',
        reasoning: 'Test',
        factors: [
          {
            name: 'Velocity Trend',
            value: 'STABLE',
            impact: 'NEUTRAL',
            description: 'Velocity is consistent',
          },
        ],
        velocityAvg: 10,
        dataPoints: 6,
      };

      const result = (service as any).detectResourceRisk(mockForecast);

      expect(result).toBeNull();
    });

    it('should return null when no velocity factor present', () => {
      const mockForecast = {
        predictedDate: '2025-03-15',
        confidence: ConfidenceLevel.HIGH,
        optimisticDate: '2025-03-01',
        pessimisticDate: '2025-03-30',
        reasoning: 'Test',
        factors: [],
        velocityAvg: 10,
        dataPoints: 6,
      };

      const result = (service as any).detectResourceRisk(mockForecast);

      expect(result).toBeNull();
    });
  });

  describe('generateScheduleMitigation', () => {
    it('should generate minor delay mitigation', () => {
      const result = (service as any).generateScheduleMitigation(5, {} as any);
      expect(result).toContain('Minor delay');
    });

    it('should generate moderate delay mitigation', () => {
      const result = (service as any).generateScheduleMitigation(21, {} as any);
      expect(result).toContain('reducing scope');
    });

    it('should generate significant delay mitigation', () => {
      const result = (service as any).generateScheduleMitigation(56, {} as any);
      expect(result).toContain('Significant delay');
      expect(result).toContain('8 weeks');
    });
  });

  describe('generateScopeMitigation', () => {
    it('should generate scope mitigation with details', () => {
      const result = (service as any).generateScopeMitigation(0.25, 125, 100);
      expect(result).toContain('25%');
      expect(result).toContain('25 points');
      expect(result).toContain('Phase 2');
    });
  });

  describe('generateResourceMitigation', () => {
    it('should generate resource mitigation with details', () => {
      const result = (service as any).generateResourceMitigation(-0.20);
      expect(result).toContain('20%');
      expect(result).toContain('Investigate');
    });
  });
});
