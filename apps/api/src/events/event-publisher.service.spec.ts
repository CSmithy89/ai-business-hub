import { Test, TestingModule } from '@nestjs/testing';
import { EventPublisherService } from './event-publisher.service';
import { RedisProvider } from './redis.provider';
import { PrismaService } from '../common/services/prisma.service';
import { EventTypes } from '@hyvve/shared';
import { STREAMS } from './constants/streams.constants';

describe('EventPublisherService', () => {
  let service: EventPublisherService;
  let prisma: jest.Mocked<PrismaService>;
  let mockRedisClient: {
    xadd: jest.Mock;
    pipeline: jest.Mock;
  };

  const mockContext = {
    tenantId: 'tenant-123',
    userId: 'user-123',
  };

  beforeEach(async () => {
    mockRedisClient = {
      xadd: jest.fn().mockResolvedValue('1234567890-0'),
      pipeline: jest.fn().mockReturnValue({
        xadd: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, '1234567890-0'],
          [null, '1234567891-0'],
        ]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventPublisherService,
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
              create: jest.fn().mockResolvedValue({}),
              createMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventPublisherService>(EventPublisherService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publish', () => {
    it('should publish event to Redis stream', async () => {
      const eventId = await service.publish(
        EventTypes.APPROVAL_REQUESTED,
        { approvalId: 'approval-123' },
        mockContext,
      );

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
      expect(mockRedisClient.xadd).toHaveBeenCalledWith(
        STREAMS.MAIN,
        'MAXLEN',
        '~',
        expect.any(String),
        '*',
        'event',
        expect.any(String),
      );
    });

    it('should create EventMetadata record', async () => {
      await service.publish(
        EventTypes.APPROVAL_REQUESTED,
        { approvalId: 'approval-123' },
        mockContext,
      );

      expect(prisma.eventMetadata.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: expect.any(String),
          streamId: '1234567890-0',
          type: EventTypes.APPROVAL_REQUESTED,
          source: 'platform',
          tenantId: mockContext.tenantId,
          correlationId: expect.any(String),
          status: 'PENDING',
        }),
      });
    });

    it('should use provided correlationId', async () => {
      const correlationId = 'custom-correlation-123';

      await service.publish(
        EventTypes.APPROVAL_REQUESTED,
        { approvalId: 'approval-123' },
        { ...mockContext, correlationId },
      );

      expect(prisma.eventMetadata.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          correlationId,
        }),
      });
    });

    it('should use provided source', async () => {
      const source = 'crm-module';

      await service.publish(
        EventTypes.APPROVAL_REQUESTED,
        { approvalId: 'approval-123' },
        { ...mockContext, source },
      );

      expect(prisma.eventMetadata.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          source,
        }),
      });
    });

    it('should include tenantId in event payload', async () => {
      await service.publish(
        EventTypes.APPROVAL_REQUESTED,
        { approvalId: 'approval-123' },
        mockContext,
      );

      const callArgs = mockRedisClient.xadd.mock.calls[0];
      const eventJson = callArgs[6]; // 'event' is at index 5, value at 6
      const event = JSON.parse(eventJson);

      expect(event.tenantId).toBe(mockContext.tenantId);
      expect(event.userId).toBe(mockContext.userId);
    });

    it('should include timestamp and version in event', async () => {
      await service.publish(
        EventTypes.APPROVAL_REQUESTED,
        { approvalId: 'approval-123' },
        mockContext,
      );

      const callArgs = mockRedisClient.xadd.mock.calls[0];
      const eventJson = callArgs[6];
      const event = JSON.parse(eventJson);

      expect(event.timestamp).toBeDefined();
      expect(event.version).toBe('1.0');
    });

    it('should throw error on Redis failure', async () => {
      mockRedisClient.xadd.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        service.publish(
          EventTypes.APPROVAL_REQUESTED,
          { approvalId: 'approval-123' },
          mockContext,
        ),
      ).rejects.toThrow('Redis connection failed');
    });

    it('should throw error on Prisma failure', async () => {
      prisma.eventMetadata.create = jest.fn().mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        service.publish(
          EventTypes.APPROVAL_REQUESTED,
          { approvalId: 'approval-123' },
          mockContext,
        ),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('publishBatch', () => {
    const mockEvents = [
      {
        type: EventTypes.APPROVAL_REQUESTED,
        data: { approvalId: 'approval-1' },
        context: mockContext,
      },
      {
        type: EventTypes.APPROVAL_APPROVED,
        data: { approvalId: 'approval-2' },
        context: mockContext,
      },
    ];

    it('should publish multiple events atomically', async () => {
      const eventIds = await service.publishBatch(mockEvents);

      expect(eventIds).toHaveLength(2);
      expect(eventIds.every((id) => typeof id === 'string')).toBe(true);
    });

    it('should use Redis pipeline for batch operations', async () => {
      await service.publishBatch(mockEvents);

      expect(mockRedisClient.pipeline).toHaveBeenCalled();
    });

    it('should create EventMetadata records for all events', async () => {
      await service.publishBatch(mockEvents);

      expect(prisma.eventMetadata.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: EventTypes.APPROVAL_REQUESTED,
            tenantId: mockContext.tenantId,
            status: 'PENDING',
          }),
          expect.objectContaining({
            type: EventTypes.APPROVAL_APPROVED,
            tenantId: mockContext.tenantId,
            status: 'PENDING',
          }),
        ]),
      });
    });

    it('should throw error on pipeline execution failure', async () => {
      mockRedisClient.pipeline.mockReturnValue({
        xadd: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.publishBatch(mockEvents)).rejects.toThrow(
        'Pipeline execution failed',
      );
    });

    it('should throw error if any event in pipeline fails', async () => {
      mockRedisClient.pipeline.mockReturnValue({
        xadd: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, '1234567890-0'],
          [new Error('Event publish failed'), null],
        ]),
      });

      await expect(service.publishBatch(mockEvents)).rejects.toThrow(
        'Event publish failed',
      );
    });

    it('should handle empty events array', async () => {
      mockRedisClient.pipeline.mockReturnValue({
        xadd: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      prisma.eventMetadata.createMany = jest.fn().mockResolvedValue({ count: 0 });

      const eventIds = await service.publishBatch([]);

      expect(eventIds).toHaveLength(0);
    });
  });
});
