import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EventRetryService } from './event-retry.service';
import { RedisProvider } from './redis.provider';
import { PrismaService } from '../common/services/prisma.service';
import { BaseEvent } from '@hyvve/shared';
import {
  STREAMS,
  CONSUMER_GROUP,
  RETRY_CONFIG,
  DLQ_CONFIG,
} from './constants/streams.constants';

describe('EventRetryService', () => {
  let service: EventRetryService;
  let retryQueue: jest.Mocked<Queue>;
  let prisma: jest.Mocked<PrismaService>;
  let mockRedisClient: {
    xadd: jest.Mock;
    xack: jest.Mock;
    xlen: jest.Mock;
    xrange: jest.Mock;
    xdel: jest.Mock;
  };

  const mockEvent: BaseEvent = {
    id: 'event-123',
    type: 'approval.item.approved',
    source: 'platform',
    timestamp: new Date().toISOString(),
    correlationId: 'correlation-123',
    tenantId: 'tenant-123',
    userId: 'user-123',
    version: '1.0',
    data: { approvalId: 'approval-123' },
  };

  const mockError = new Error('Handler processing failed');

  beforeEach(async () => {
    mockRedisClient = {
      xadd: jest.fn().mockResolvedValue('1234567890-0'),
      xack: jest.fn().mockResolvedValue(1),
      xlen: jest.fn().mockResolvedValue(100),
      xrange: jest.fn().mockResolvedValue([]),
      xdel: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventRetryService,
        {
          provide: getQueueToken('event-retry'),
          useValue: {
            add: jest.fn().mockResolvedValue({ id: 'job-123' }),
          },
        },
        {
          provide: RedisProvider,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockRedisClient),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            eventMetadata: {
              update: jest.fn().mockResolvedValue({}),
              create: jest.fn().mockResolvedValue({}),
              findUnique: jest.fn().mockResolvedValue(null),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventRetryService>(EventRetryService);
    retryQueue = module.get(getQueueToken('event-retry')) as jest.Mocked<Queue>;
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleRetry', () => {
    it('should schedule retry job for first attempt', async () => {
      await service.scheduleRetry('stream-123', mockEvent, mockError, 0);

      expect(retryQueue.add).toHaveBeenCalledWith(
        'retry-event',
        {
          eventId: mockEvent.id,
          streamId: 'stream-123',
          attempt: 1,
        },
        {
          delay: RETRY_CONFIG.DELAYS_MS[0], // 60 seconds
          jobId: `retry-${mockEvent.id}-1`,
        },
      );
    });

    it('should use exponential backoff delays', async () => {
      // First retry: 60 seconds
      await service.scheduleRetry('stream-123', mockEvent, mockError, 0);
      expect(retryQueue.add).toHaveBeenCalledWith(
        'retry-event',
        expect.any(Object),
        expect.objectContaining({ delay: RETRY_CONFIG.DELAYS_MS[0] }),
      );

      // Second retry: 5 minutes
      await service.scheduleRetry('stream-123', mockEvent, mockError, 1);
      expect(retryQueue.add).toHaveBeenCalledWith(
        'retry-event',
        expect.any(Object),
        expect.objectContaining({ delay: RETRY_CONFIG.DELAYS_MS[1] }),
      );
    });

    it('should update event metadata with error', async () => {
      await service.scheduleRetry('stream-123', mockEvent, mockError, 0);

      expect(prisma.eventMetadata.update).toHaveBeenCalledWith({
        where: { eventId: mockEvent.id },
        data: expect.objectContaining({
          attempts: 1,
          lastError: mockError.message,
          status: 'FAILED',
        }),
      });
    });

    it('should move to DLQ after max retries', async () => {
      await service.scheduleRetry('stream-123', mockEvent, mockError, 2);

      // Should not add to retry queue
      expect(retryQueue.add).not.toHaveBeenCalled();

      // Should add to DLQ stream
      expect(mockRedisClient.xadd).toHaveBeenCalledWith(
        STREAMS.DLQ,
        'MAXLEN',
        '~',
        String(DLQ_CONFIG.MAX_SIZE),
        '*',
        'event',
        JSON.stringify(mockEvent),
        'error',
        mockError.message,
        'errorStack',
        mockError.stack || 'N/A',
        'movedAt',
        expect.any(String),
        'attempts',
        String(RETRY_CONFIG.MAX_RETRIES),
      );
    });

    it('should acknowledge event when moved to DLQ', async () => {
      await service.scheduleRetry('stream-123', mockEvent, mockError, 2);

      expect(mockRedisClient.xack).toHaveBeenCalledWith(
        STREAMS.MAIN,
        CONSUMER_GROUP,
        'stream-123',
      );
    });

    it('should update status to DLQ when moved', async () => {
      await service.scheduleRetry('stream-123', mockEvent, mockError, 2);

      expect(prisma.eventMetadata.update).toHaveBeenCalledWith({
        where: { eventId: mockEvent.id },
        data: expect.objectContaining({
          status: 'DLQ',
        }),
      });
    });
  });

  describe('checkDLQSize', () => {
    it('should return DLQ size', async () => {
      mockRedisClient.xlen.mockResolvedValue(500);

      const size = await service.checkDLQSize();

      expect(size).toBe(500);
      expect(mockRedisClient.xlen).toHaveBeenCalledWith(STREAMS.DLQ);
    });

    it('should log warning when approaching capacity', async () => {
      mockRedisClient.xlen.mockResolvedValue(DLQ_CONFIG.WARNING_THRESHOLD);

      const size = await service.checkDLQSize();

      expect(size).toBe(DLQ_CONFIG.WARNING_THRESHOLD);
    });

    it('should log critical error when near maximum', async () => {
      mockRedisClient.xlen.mockResolvedValue(DLQ_CONFIG.CRITICAL_THRESHOLD);

      const size = await service.checkDLQSize();

      expect(size).toBe(DLQ_CONFIG.CRITICAL_THRESHOLD);
    });

    it('should return -1 on error', async () => {
      mockRedisClient.xlen.mockRejectedValue(new Error('Redis error'));

      const size = await service.checkDLQSize();

      expect(size).toBe(-1);
    });
  });

  describe('retryFromDLQ', () => {
    const mockDLQEntry = [
      'dlq-stream-id-123',
      ['event', JSON.stringify(mockEvent), 'error', 'Original error', 'attempts', '3'],
    ];

    it('should find and retry event from DLQ', async () => {
      mockRedisClient.xrange.mockResolvedValue([mockDLQEntry]);

      const newEventId = await service.retryFromDLQ(mockEvent.id);

      expect(newEventId).toBeDefined();
      expect(typeof newEventId).toBe('string');
      expect(newEventId).not.toBe(mockEvent.id);
    });

    it('should create new EventMetadata for retried event', async () => {
      mockRedisClient.xrange.mockResolvedValue([mockDLQEntry]);

      await service.retryFromDLQ(mockEvent.id);

      expect(prisma.eventMetadata.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: expect.any(String),
          type: mockEvent.type,
          tenantId: mockEvent.tenantId,
          status: 'PENDING',
          attempts: 0,
        }),
      });
    });

    it('should republish event to main stream', async () => {
      mockRedisClient.xrange.mockResolvedValue([mockDLQEntry]);

      await service.retryFromDLQ(mockEvent.id);

      expect(mockRedisClient.xadd).toHaveBeenCalledWith(
        STREAMS.MAIN,
        '*',
        'event',
        expect.any(String),
      );
    });

    it('should delete event from DLQ after successful retry', async () => {
      mockRedisClient.xrange.mockResolvedValue([mockDLQEntry]);

      await service.retryFromDLQ(mockEvent.id);

      expect(mockRedisClient.xdel).toHaveBeenCalledWith(
        STREAMS.DLQ,
        'dlq-stream-id-123',
      );
    });

    it('should throw NotFoundException if event not in DLQ', async () => {
      mockRedisClient.xrange.mockResolvedValue([]);

      await expect(service.retryFromDLQ('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update original event metadata for audit trail', async () => {
      mockRedisClient.xrange.mockResolvedValue([mockDLQEntry]);

      const newEventId = await service.retryFromDLQ(mockEvent.id);

      expect(prisma.eventMetadata.update).toHaveBeenCalledWith({
        where: { eventId: mockEvent.id },
        data: {
          lastError: expect.stringContaining(`Retried from DLQ as event ${newEventId}`),
        },
      });
    });

    it('should generate new timestamp for retried event', async () => {
      mockRedisClient.xrange.mockResolvedValue([mockDLQEntry]);

      await service.retryFromDLQ(mockEvent.id);

      const addCall = mockRedisClient.xadd.mock.calls.find(
        (call) => call[0] === STREAMS.MAIN,
      );
      const eventJson = addCall[3];
      const retriedEvent = JSON.parse(eventJson);

      expect(retriedEvent.timestamp).not.toBe(mockEvent.timestamp);
    });
  });
});
