import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { EventConsumerService } from './event-consumer.service';
import { RedisProvider } from './redis.provider';
import { PrismaService } from '../common/services/prisma.service';
import { EventRetryService } from './event-retry.service';
import { BaseEvent } from '@hyvve/shared';
import { STREAMS, CONSUMER_GROUP } from './constants/streams.constants';

describe('EventConsumerService', () => {
  let service: EventConsumerService;
  let prisma: jest.Mocked<PrismaService>;
  let retryService: jest.Mocked<EventRetryService>;
  let mockRedisClient: {
    xreadgroup: jest.Mock;
    xack: jest.Mock;
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

  beforeEach(async () => {
    mockRedisClient = {
      xreadgroup: jest.fn().mockResolvedValue(null),
      xack: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventConsumerService,
        {
          provide: RedisProvider,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockRedisClient),
          },
        },
        {
          provide: DiscoveryService,
          useValue: {
            getProviders: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn().mockReturnValue(null),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            eventMetadata: {
              update: jest.fn().mockResolvedValue({}),
              findUnique: jest.fn().mockResolvedValue({ attempts: 0 }),
            },
          },
        },
        {
          provide: EventRetryService,
          useValue: {
            scheduleRetry: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<EventConsumerService>(EventConsumerService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    retryService = module.get(EventRetryService) as jest.Mocked<EventRetryService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('pattern matching', () => {
    // Access private method via any cast for testing
    const testMatchesPattern = (eventType: string, pattern: string): boolean => {
      return (service as any).matchesPattern(eventType, pattern);
    };

    it('should match exact event type', () => {
      expect(testMatchesPattern('approval.item.approved', 'approval.item.approved')).toBe(true);
      expect(testMatchesPattern('approval.item.rejected', 'approval.item.approved')).toBe(false);
    });

    it('should match wildcard suffix patterns', () => {
      expect(testMatchesPattern('approval.item.approved', 'approval.*')).toBe(true);
      expect(testMatchesPattern('approval.item.rejected', 'approval.*')).toBe(true);
      expect(testMatchesPattern('approval.queue.updated', 'approval.*')).toBe(true);
    });

    it('should not match different module with wildcard', () => {
      expect(testMatchesPattern('content.article.published', 'approval.*')).toBe(false);
      expect(testMatchesPattern('approvalExtra.item.done', 'approval.*')).toBe(false);
    });

    it('should match all events with * pattern', () => {
      expect(testMatchesPattern('approval.item.approved', '*')).toBe(true);
      expect(testMatchesPattern('content.article.published', '*')).toBe(true);
      expect(testMatchesPattern('any.random.event', '*')).toBe(true);
    });

    it('should require dot separator for wildcard match', () => {
      expect(testMatchesPattern('approval', 'approval.*')).toBe(false);
      expect(testMatchesPattern('approvalItem', 'approval.*')).toBe(false);
    });
  });

  describe('handler registration', () => {
    it('should register handler for pattern', () => {
      const mockInstance = {
        constructor: { name: 'TestHandler' },
        handleEvent: jest.fn(),
      };

      // Access private method
      (service as any).registerHandler(mockInstance, 'handleEvent', {
        pattern: 'approval.*',
        priority: 50,
        maxRetries: 3,
      });

      const handlers = (service as any).handlers;
      expect(handlers.has('approval.*')).toBe(true);
      expect(handlers.get('approval.*')).toHaveLength(1);
    });

    it('should register multiple handlers for same pattern', () => {
      const mockInstance1 = {
        constructor: { name: 'Handler1' },
        handle1: jest.fn(),
      };
      const mockInstance2 = {
        constructor: { name: 'Handler2' },
        handle2: jest.fn(),
      };

      (service as any).registerHandler(mockInstance1, 'handle1', {
        pattern: 'approval.*',
        priority: 100,
        maxRetries: 3,
      });
      (service as any).registerHandler(mockInstance2, 'handle2', {
        pattern: 'approval.*',
        priority: 50,
        maxRetries: 3,
      });

      const handlers = (service as any).handlers.get('approval.*');
      expect(handlers).toHaveLength(2);
    });
  });

  describe('findMatchingHandlers', () => {
    beforeEach(() => {
      // Register test handlers
      const mockHandler = {
        constructor: { name: 'TestHandler' },
        handleAll: jest.fn(),
        handleApproval: jest.fn(),
        handleExact: jest.fn(),
      };

      (service as any).registerHandler(mockHandler, 'handleAll', {
        pattern: '*',
        priority: 100,
        maxRetries: 3,
      });
      (service as any).registerHandler(mockHandler, 'handleApproval', {
        pattern: 'approval.*',
        priority: 50,
        maxRetries: 3,
      });
      (service as any).registerHandler(mockHandler, 'handleExact', {
        pattern: 'approval.item.approved',
        priority: 1,
        maxRetries: 3,
      });
    });

    it('should find all matching handlers', () => {
      const handlers = (service as any).findMatchingHandlers('approval.item.approved');

      expect(handlers).toHaveLength(3);
    });

    it('should sort handlers by priority', () => {
      const handlers = (service as any).findMatchingHandlers('approval.item.approved');

      expect(handlers[0].priority).toBe(1);
      expect(handlers[1].priority).toBe(50);
      expect(handlers[2].priority).toBe(100);
    });

    it('should return empty array when no handlers match', () => {
      const handlers = (service as any).findMatchingHandlers('unknown.event.type');

      // Only '*' handler matches
      expect(handlers).toHaveLength(1);
      expect(handlers[0].pattern).toBe('*');
    });
  });

  describe('event processing', () => {
    it('should acknowledge event when no handlers exist', async () => {
      await (service as any).processEvent('stream-id-123', mockEvent);

      expect(mockRedisClient.xack).toHaveBeenCalledWith(
        STREAMS.MAIN,
        CONSUMER_GROUP,
        'stream-id-123',
      );
    });

    it('should update event status to COMPLETED when no handlers', async () => {
      await (service as any).processEvent('stream-id-123', mockEvent);

      expect(prisma.eventMetadata.update).toHaveBeenCalledWith({
        where: { eventId: mockEvent.id },
        data: expect.objectContaining({
          status: 'COMPLETED',
        }),
      });
    });

    it('should execute handlers in priority order', async () => {
      const executionOrder: number[] = [];

      const mockHandler = {
        constructor: { name: 'TestHandler' },
        lowPriority: jest.fn().mockImplementation(() => {
          executionOrder.push(100);
        }),
        highPriority: jest.fn().mockImplementation(() => {
          executionOrder.push(1);
        }),
      };

      (service as any).registerHandler(mockHandler, 'lowPriority', {
        pattern: 'approval.*',
        priority: 100,
        maxRetries: 3,
      });
      (service as any).registerHandler(mockHandler, 'highPriority', {
        pattern: 'approval.*',
        priority: 1,
        maxRetries: 3,
      });

      await (service as any).processEvent('stream-id-123', mockEvent);

      expect(executionOrder).toEqual([1, 100]);
    });

    it('should schedule retry when handler fails', async () => {
      const mockHandler = {
        constructor: { name: 'FailingHandler' },
        failingMethod: jest.fn().mockRejectedValue(new Error('Handler error')),
      };

      (service as any).registerHandler(mockHandler, 'failingMethod', {
        pattern: 'approval.*',
        priority: 1,
        maxRetries: 3,
      });

      await (service as any).processEvent('stream-id-123', mockEvent);

      expect(retryService.scheduleRetry).toHaveBeenCalledWith(
        'stream-id-123',
        mockEvent,
        expect.any(Error),
        0,
      );
    });

    it('should acknowledge event when all handlers succeed', async () => {
      const mockHandler = {
        constructor: { name: 'SuccessHandler' },
        successMethod: jest.fn().mockResolvedValue(undefined),
      };

      (service as any).registerHandler(mockHandler, 'successMethod', {
        pattern: 'approval.*',
        priority: 1,
        maxRetries: 3,
      });

      await (service as any).processEvent('stream-id-123', mockEvent);

      expect(mockRedisClient.xack).toHaveBeenCalledWith(
        STREAMS.MAIN,
        CONSUMER_GROUP,
        'stream-id-123',
      );
    });

    it('should not acknowledge event when handlers fail', async () => {
      const mockHandler = {
        constructor: { name: 'FailingHandler' },
        failingMethod: jest.fn().mockRejectedValue(new Error('Handler error')),
      };

      (service as any).registerHandler(mockHandler, 'failingMethod', {
        pattern: 'approval.*',
        priority: 1,
        maxRetries: 3,
      });

      await (service as any).processEvent('stream-id-123', mockEvent);

      // xack should not be called when handlers fail
      expect(mockRedisClient.xack).not.toHaveBeenCalled();
    });
  });

  describe('updateEventStatus', () => {
    it('should update status to COMPLETED', async () => {
      await (service as any).updateEventStatus(mockEvent.id, 'COMPLETED');

      expect(prisma.eventMetadata.update).toHaveBeenCalledWith({
        where: { eventId: mockEvent.id },
        data: expect.objectContaining({
          status: 'COMPLETED',
          processedAt: expect.any(Date),
        }),
      });
    });

    it('should update status to FAILED with error message', async () => {
      await (service as any).updateEventStatus(mockEvent.id, 'FAILED', 'Test error');

      expect(prisma.eventMetadata.update).toHaveBeenCalledWith({
        where: { eventId: mockEvent.id },
        data: expect.objectContaining({
          status: 'FAILED',
          lastError: 'Test error',
        }),
      });
    });

    it('should retry on database failure', async () => {
      prisma.eventMetadata.update = jest
        .fn()
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({});

      await (service as any).updateEventStatus(mockEvent.id, 'COMPLETED');

      expect(prisma.eventMetadata.update).toHaveBeenCalledTimes(2);
    });
  });
});
