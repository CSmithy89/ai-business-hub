import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EventReplayService } from './event-replay.service';
import { PrismaService } from '../common/services/prisma.service';
import { QUEUE_EVENT_REPLAY, BULLMQ_CONFIG } from './constants/streams.constants';

describe('EventReplayService', () => {
  let service: EventReplayService;
  let replayQueue: jest.Mocked<Queue>;
  let prisma: jest.Mocked<PrismaService>;

  const mockReplayOptions = {
    startTime: '2025-12-01T00:00:00Z',
    endTime: '2025-12-03T00:00:00Z',
    eventTypes: ['approval.item.approved', 'approval.item.rejected'],
    tenantId: 'tenant-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventReplayService,
        {
          provide: getQueueToken(QUEUE_EVENT_REPLAY),
          useValue: {
            add: jest.fn().mockResolvedValue({ id: 'job-123' }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            replayJob: {
              create: jest.fn().mockResolvedValue({}),
              findUnique: jest.fn().mockResolvedValue(null),
              update: jest.fn().mockResolvedValue({}),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventReplayService>(EventReplayService);
    replayQueue = module.get(getQueueToken(QUEUE_EVENT_REPLAY)) as jest.Mocked<Queue>;
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startReplay', () => {
    it('should create replay job and return job ID', async () => {
      const result = await service.startReplay(mockReplayOptions);

      expect(result.jobId).toBeDefined();
      expect(typeof result.jobId).toBe('string');
      expect(result.status).toBe('pending');
    });

    it('should create ReplayJob record in database', async () => {
      await service.startReplay(mockReplayOptions);

      expect(prisma.replayJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
          status: 'PENDING',
          progress: 0,
          eventsReplayed: 0,
          totalEvents: 0,
          errors: 0,
          options: expect.objectContaining({
            startTime: mockReplayOptions.startTime,
            endTime: mockReplayOptions.endTime,
            eventTypes: mockReplayOptions.eventTypes,
            tenantId: mockReplayOptions.tenantId,
          }),
        }),
      });
    });

    it('should add job to BullMQ queue', async () => {
      const result = await service.startReplay(mockReplayOptions);

      expect(replayQueue.add).toHaveBeenCalledWith(
        'replay-events',
        {
          jobId: result.jobId,
          startTime: mockReplayOptions.startTime,
          endTime: mockReplayOptions.endTime,
          eventTypes: mockReplayOptions.eventTypes,
          tenantId: mockReplayOptions.tenantId,
        },
        {
          jobId: result.jobId,
          removeOnComplete: BULLMQ_CONFIG.JOBS_RETAIN_COMPLETED,
          removeOnFail: BULLMQ_CONFIG.JOBS_RETAIN_FAILED,
        },
      );
    });

    it('should work with minimal options', async () => {
      const minimalOptions = {
        startTime: '2025-12-01T00:00:00Z',
        endTime: '2025-12-03T00:00:00Z',
      };

      const result = await service.startReplay(minimalOptions);

      expect(result.jobId).toBeDefined();
      expect(result.status).toBe('pending');
    });
  });

  describe('getReplayStatus', () => {
    const mockJob = {
      id: 'job-123',
      status: 'RUNNING',
      progress: 50,
      eventsReplayed: 250,
      totalEvents: 500,
      errors: 2,
      startedAt: new Date('2025-12-03T10:00:00Z'),
      completedAt: null,
      errorMessage: null,
    };

    it('should return job status', async () => {
      prisma.replayJob.findUnique = jest.fn().mockResolvedValue(mockJob);

      const result = await service.getReplayStatus('job-123');

      expect(result.jobId).toBe('job-123');
      expect(result.status).toBe('running');
      expect(result.progress).toBe(50);
      expect(result.eventsReplayed).toBe(250);
      expect(result.totalEvents).toBe(500);
      expect(result.errors).toBe(2);
    });

    it('should throw NotFoundException for non-existent job', async () => {
      prisma.replayJob.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.getReplayStatus('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should format dates as ISO strings', async () => {
      prisma.replayJob.findUnique = jest.fn().mockResolvedValue({
        ...mockJob,
        completedAt: new Date('2025-12-03T10:30:00Z'),
      });

      const result = await service.getReplayStatus('job-123');

      expect(result.startedAt).toBe('2025-12-03T10:00:00.000Z');
      expect(result.completedAt).toBe('2025-12-03T10:30:00.000Z');
    });

    it('should handle pending status', async () => {
      prisma.replayJob.findUnique = jest.fn().mockResolvedValue({
        ...mockJob,
        status: 'PENDING',
        startedAt: null,
      });

      const result = await service.getReplayStatus('job-123');

      expect(result.status).toBe('pending');
      expect(result.startedAt).toBeUndefined();
    });

    it('should handle completed status', async () => {
      prisma.replayJob.findUnique = jest.fn().mockResolvedValue({
        ...mockJob,
        status: 'COMPLETED',
        progress: 100,
        eventsReplayed: 500,
        completedAt: new Date('2025-12-03T10:30:00Z'),
      });

      const result = await service.getReplayStatus('job-123');

      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
    });

    it('should handle failed status with error message', async () => {
      prisma.replayJob.findUnique = jest.fn().mockResolvedValue({
        ...mockJob,
        status: 'FAILED',
        errorMessage: 'Redis connection lost',
      });

      const result = await service.getReplayStatus('job-123');

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Redis connection lost');
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status to running', async () => {
      await service.updateJobStatus('job-123', {
        status: 'running',
        startedAt: new Date(),
      });

      expect(prisma.replayJob.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: expect.objectContaining({
          status: 'RUNNING',
          startedAt: expect.any(Date),
        }),
      });
    });

    it('should update progress and counts', async () => {
      await service.updateJobStatus('job-123', {
        progress: 50,
        eventsReplayed: 250,
        totalEvents: 500,
      });

      expect(prisma.replayJob.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: expect.objectContaining({
          progress: 50,
          eventsReplayed: 250,
          totalEvents: 500,
        }),
      });
    });

    it('should update error count', async () => {
      await service.updateJobStatus('job-123', {
        errors: 5,
      });

      expect(prisma.replayJob.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: expect.objectContaining({
          errors: 5,
        }),
      });
    });

    it('should update completion info', async () => {
      const completedAt = new Date();
      await service.updateJobStatus('job-123', {
        status: 'completed',
        completedAt,
      });

      expect(prisma.replayJob.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt,
        }),
      });
    });

    it('should update error message on failure', async () => {
      await service.updateJobStatus('job-123', {
        status: 'failed',
        errorMessage: 'Database timeout',
      });

      expect(prisma.replayJob.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: expect.objectContaining({
          status: 'FAILED',
          errorMessage: 'Database timeout',
        }),
      });
    });

    it('should handle partial updates', async () => {
      await service.updateJobStatus('job-123', {
        progress: 25,
      });

      expect(prisma.replayJob.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: {
          progress: 25,
        },
      });
    });
  });
});
