# Epic Technical Specification: Event Bus Infrastructure

Date: 2025-12-03
Author: chris
Epic ID: EPIC-05
Status: Ready for Development

---

## Overview

Epic 05 implements the Redis Streams-based event bus infrastructure that enables asynchronous, loosely-coupled communication between platform modules. This is a critical piece of the HYVVE Platform architecture that allows the approval system, BYOAI providers, AgentOS, and future modules (CRM, Content) to communicate without direct dependencies.

The event bus provides:
- **Pub/Sub messaging** via Redis Streams with consumer groups
- **At-least-once delivery** guarantees with acknowledgment tracking
- **30-day event retention** for audit, replay, and debugging
- **Dead letter queue (DLQ)** with retry logic for failed events
- **Correlation ID tracing** for distributed request tracking

This epic builds upon the typed event interfaces already defined in `packages/shared/src/types/events.ts` (completed in Epic 04 technical debt cleanup) and replaces the stub `EventBusService` in `apps/api/src/approvals/stubs/event-bus.stub.ts`.

## Objectives and Scope

### In Scope

- **Redis Streams Infrastructure**: Connection management, stream creation, consumer group setup
- **Event Publisher Service**: Type-safe event publishing with auto-generated metadata
- **Event Subscriber Decorator**: NestJS decorator pattern for event handlers
- **Retry and DLQ**: Exponential backoff retry logic with dead letter queue
- **Core Platform Events**: Wire up existing approval/agent events to real event bus
- **Event Replay**: Admin endpoint to replay events from a time range
- **Monitoring Dashboard**: Admin UI for event flow visualization and DLQ management

### Out of Scope

- WebSocket-based real-time notifications (part of Epic 07 Chat Panel)
- AI provider events (Epic 06 - BYOAI)
- Cross-region event replication
- Event schema versioning/evolution (future enhancement)
- Kafka migration path (Redis Streams sufficient for MVP scale)

### Dependencies

| Dependency | Epic | Status | Notes |
|------------|------|--------|-------|
| Redis 7 container | EPIC-00 | Done | Docker compose includes Redis |
| BaseEvent interface | EPIC-04 | Done | `packages/shared/src/types/events.ts` |
| EventTypes constants | EPIC-04 | Done | Typed event names and payloads |
| Multi-tenant context | EPIC-03 | Done | TenantGuard extracts workspaceId |
| Prisma database | EPIC-00 | Done | For event metadata persistence |

---

## System Architecture Alignment

### Architecture Reference

From `docs/architecture.md` (Section: Cross-Module Communication):
```
Cross-Module Communication
- Protocol: Redis Streams
- Pattern: Publish/Subscribe with consumer groups
- Delivery: At-least-once with idempotency keys
```

### Event Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NestJS Backend (apps/api)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │ ApprovalService  │    │  AgentOSService  │    │ Future Modules │ │
│  └────────┬─────────┘    └────────┬─────────┘    └───────┬────────┘ │
│           │                       │                       │          │
│           └───────────────────────┼───────────────────────┘          │
│                                   │                                  │
│                           ┌───────▼───────┐                          │
│                           │ EventPublisher │ emit(type, payload)     │
│                           │    Service     │                         │
│                           └───────┬───────┘                          │
│                                   │                                  │
└───────────────────────────────────┼──────────────────────────────────┘
                                    │
                           ┌────────▼────────┐
                           │  Redis Streams  │
                           │                 │
                           │ hyvve:events    │ ◄── Main event stream
                           │ hyvve:dlq       │ ◄── Dead letter queue
                           │                 │
                           └────────┬────────┘
                                    │
┌───────────────────────────────────┼──────────────────────────────────┐
│                                   │                                  │
│  ┌──────────────────┐    ┌───────▼───────┐    ┌──────────────────┐  │
│  │ NotificationSvc  │◄───│ EventConsumer │───►│ AnalyticsService │  │
│  │ @EventSubscriber │    │    Service    │    │ @EventSubscriber │  │
│  │('approval.*')    │    │               │    │('*')             │  │
│  └──────────────────┘    └───────────────┘    └──────────────────┘  │
│                                                                      │
│                        Consumer Group: hyvve-platform                │
└──────────────────────────────────────────────────────────────────────┘
```

### Stream Naming Convention

| Stream | Purpose | Retention |
|--------|---------|-----------|
| `hyvve:events` | Main event stream (all tenants) | 30 days |
| `hyvve:dlq` | Dead letter queue for failed events | 90 days |
| `hyvve:events:replay` | Temporary stream for replay operations | 24 hours |

### Consumer Group Configuration

```typescript
// Consumer group setup
const CONSUMER_GROUP = 'hyvve-platform';
const CONSUMER_NAME = process.env.HOSTNAME || `consumer-${process.pid}`;
const BLOCK_TIMEOUT_MS = 5000;  // Block for 5s waiting for new events
const BATCH_SIZE = 10;          // Process 10 events per batch
```

---

## Detailed Design

### Services and Modules

| Service | Responsibility | Location |
|---------|----------------|----------|
| `EventsModule` | Module registration, Redis connection | `apps/api/src/events/events.module.ts` |
| `EventPublisherService` | Publish events to Redis Streams | `apps/api/src/events/event-publisher.service.ts` |
| `EventConsumerService` | Consume events, dispatch to handlers | `apps/api/src/events/event-consumer.service.ts` |
| `EventRetryService` | Handle retries and DLQ | `apps/api/src/events/event-retry.service.ts` |
| `EventReplayService` | Replay historical events | `apps/api/src/events/event-replay.service.ts` |
| `EventsController` | Admin API for monitoring | `apps/api/src/events/events.controller.ts` |

### Data Models

**EventMetadata (Prisma Model)** - For tracking event processing:

```prisma
// packages/db/prisma/schema.prisma

model EventMetadata {
  id            String    @id @default(cuid())
  eventId       String    @unique
  streamId      String    // Redis stream message ID
  type          String
  source        String
  tenantId      String
  correlationId String?
  status        EventStatus @default(PENDING)
  attempts      Int       @default(0)
  lastError     String?
  processedAt   DateTime?
  createdAt     DateTime  @default(now())

  @@index([tenantId, createdAt])
  @@index([type, status])
  @@index([correlationId])
}

enum EventStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  DLQ
}
```

### APIs and Interfaces

**Story 05.2 - EventPublisherService Interface:**

```typescript
// apps/api/src/events/event-publisher.service.ts
@Injectable()
export class EventPublisherService {
  /**
   * Publish an event to Redis Streams
   *
   * @param type - Event type from EventTypes constant
   * @param data - Event payload (type-safe based on event type)
   * @param context - Tenant and user context
   * @returns Event ID
   */
  async publish<T extends Record<string, unknown>>(
    type: EventType,
    data: T,
    context: {
      tenantId: string;
      userId: string;
      correlationId?: string;
    }
  ): Promise<string>;

  /**
   * Publish multiple events atomically
   */
  async publishBatch(events: Array<{
    type: EventType;
    data: Record<string, unknown>;
    context: { tenantId: string; userId: string; correlationId?: string };
  }>): Promise<string[]>;
}
```

**Story 05.3 - EventSubscriber Decorator:**

```typescript
// apps/api/src/events/decorators/event-subscriber.decorator.ts

/**
 * Decorator to mark a method as an event handler
 *
 * @param eventPattern - Event type or wildcard pattern (e.g., 'approval.*')
 * @param options - Handler options (priority, retries)
 */
export function EventSubscriber(
  eventPattern: string,
  options?: {
    priority?: number;      // Lower = higher priority
    maxRetries?: number;    // Override default 3
    concurrency?: number;   // Max concurrent handlers
  }
): MethodDecorator;

// Usage:
@Injectable()
export class NotificationHandler {
  @EventSubscriber('approval.item.approved')
  async handleApprovalApproved(event: BaseEvent<ApprovalDecisionPayload>) {
    // Send notification
  }

  @EventSubscriber('approval.*')
  async handleAllApprovalEvents(event: BaseEvent) {
    // Log all approval events
  }
}
```

**Story 05.6 - Event Replay API:**

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/admin/events/replay` | `{ startTime, endTime, eventTypes?, tenantId? }` | `{ jobId, status }` | Admin |
| GET | `/admin/events/replay/:jobId` | - | `{ status, progress, eventsReplayed }` | Admin |

**Story 05.7 - Event Monitoring API:**

| Method | Path | Response | Auth |
|--------|------|----------|------|
| GET | `/admin/events/stats` | `{ throughput, dlqSize, consumerLag }` | Admin |
| GET | `/admin/events/dlq` | `{ events: DLQEvent[], total, page }` | Admin |
| POST | `/admin/events/dlq/:eventId/retry` | `{ success, newEventId }` | Admin |
| DELETE | `/admin/events/dlq/:eventId` | `{ success }` | Admin |

### Workflows and Sequencing

**Event Publishing Flow:**

```
1. Service calls eventPublisher.publish(type, data, context)
2. EventPublisherService:
   a. Generate event ID (CUID)
   b. Add timestamp, correlationId if missing
   c. Serialize event to JSON
   d. XADD to hyvve:events stream
   e. Insert EventMetadata record (status: PENDING)
   f. Log publish with correlationId
   g. Return event ID
```

**Event Consumption Flow:**

```
1. EventConsumerService starts on module init
2. XREADGROUP from hyvve:events (blocking read)
3. For each event:
   a. Deserialize JSON payload
   b. Match against registered @EventSubscriber patterns
   c. For each matching handler:
      i.  Update EventMetadata status: PROCESSING
      ii. Execute handler in try/catch
      iii. On success: XACK, update status: COMPLETED
      iv. On error: Increment attempts, schedule retry
4. Continue XREADGROUP loop
```

**Retry and DLQ Flow:**

```
1. Event handler throws exception
2. EventRetryService:
   a. Increment attempts in EventMetadata
   b. If attempts < 3:
      - Calculate backoff: 1min, 5min, 30min
      - Schedule retry via BullMQ delayed job
   c. If attempts >= 3:
      - XADD event to hyvve:dlq stream
      - Update EventMetadata status: DLQ
      - Log DLQ entry with error details
3. Admin can manually retry from DLQ via API
```

---

## Story Implementation Details

### Story 05.1: Set Up Redis Streams Infrastructure

**Points:** 2 | **Priority:** P0

**Technical Implementation:**

1. Create `EventsModule` in `apps/api/src/events/`:
   ```typescript
   @Module({
     imports: [
       BullModule.registerQueue({ name: 'event-retry' }),
     ],
     providers: [
       EventPublisherService,
       EventConsumerService,
       EventRetryService,
       EventReplayService,
     ],
     controllers: [EventsController],
     exports: [EventPublisherService],
   })
   export class EventsModule implements OnModuleInit {
     async onModuleInit() {
       await this.setupStreams();
       await this.setupConsumerGroup();
     }
   }
   ```

2. Configure Redis connection via `@nestjs/bullmq` (already in project)

3. Stream setup commands:
   ```typescript
   // Create streams if not exist (XGROUP CREATE auto-creates stream)
   await redis.xgroup('CREATE', 'hyvve:events', 'hyvve-platform', '0', 'MKSTREAM');
   await redis.xgroup('CREATE', 'hyvve:dlq', 'hyvve-platform', '0', 'MKSTREAM');

   // Set retention (approximate via XTRIM during writes)
   // 30 days = ~2.6 million events at 1 event/second
   ```

4. Health check endpoint:
   ```typescript
   @Get('health/events')
   async checkEventsHealth() {
     const info = await redis.xinfo('GROUPS', 'hyvve:events');
     return {
       healthy: true,
       consumerGroup: info,
       pendingCount: await redis.xpending('hyvve:events', 'hyvve-platform')
     };
   }
   ```

**Acceptance Criteria:**
- [x] Redis connection configured in EventsModule
- [x] Consumer groups created on startup
- [x] Streams auto-created with MKSTREAM
- [x] Health check endpoint returns stream info
- [x] DLQ stream created

**Files to Create:**
- `apps/api/src/events/events.module.ts`
- `apps/api/src/events/redis.provider.ts`

---

### Story 05.2: Implement Event Publisher

**Points:** 2 | **Priority:** P0

**Technical Implementation:**

```typescript
// apps/api/src/events/event-publisher.service.ts
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  async publish<T extends Record<string, unknown>>(
    type: EventType,
    data: T,
    context: {
      tenantId: string;
      userId: string;
      correlationId?: string;
      source?: string;
    }
  ): Promise<string> {
    const event: BaseEvent = {
      id: createId(), // CUID
      type,
      source: context.source ?? 'platform',
      timestamp: new Date().toISOString(),
      correlationId: context.correlationId ?? createId(),
      tenantId: context.tenantId,
      userId: context.userId,
      version: '1.0',
      data,
    };

    // Add to Redis Stream
    const streamId = await this.redis.xadd(
      'hyvve:events',
      '*', // Auto-generate stream ID
      'event', JSON.stringify(event)
    );

    // Track in database
    await this.prisma.eventMetadata.create({
      data: {
        eventId: event.id,
        streamId,
        type: event.type,
        source: event.source,
        tenantId: event.tenantId,
        correlationId: event.correlationId,
        status: 'PENDING',
      },
    });

    this.logger.log({
      message: 'Event published',
      eventId: event.id,
      type: event.type,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
    });

    return event.id;
  }
}
```

**Integration with Existing Services:**

Replace stub EventBusService usage in:
- `apps/api/src/approvals/services/approval-router.service.ts`
- `apps/api/src/approvals/services/approval-escalation.service.ts`
- `apps/api/src/approvals/services/approval.service.ts`

**Acceptance Criteria:**
- [x] `publish()` method adds event to Redis Stream
- [x] Auto-generates event ID, timestamp, correlationId
- [x] Includes tenant context in event
- [x] Creates EventMetadata record
- [x] Returns event ID to caller
- [x] Logs publish with structured data

**Files to Create:**
- `apps/api/src/events/event-publisher.service.ts`

**Files to Modify:**
- `apps/api/src/approvals/approvals.module.ts` (import EventsModule)
- `apps/api/src/approvals/services/*.ts` (inject EventPublisherService)

---

### Story 05.3: Implement Event Subscriber

**Points:** 3 | **Priority:** P0

**Technical Implementation:**

```typescript
// apps/api/src/events/decorators/event-subscriber.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const EVENT_SUBSCRIBER_METADATA = 'EVENT_SUBSCRIBER_METADATA';

export interface EventSubscriberOptions {
  pattern: string;
  priority?: number;
  maxRetries?: number;
}

export const EventSubscriber = (
  pattern: string,
  options?: Omit<EventSubscriberOptions, 'pattern'>
): MethodDecorator => {
  return SetMetadata(EVENT_SUBSCRIBER_METADATA, {
    pattern,
    priority: options?.priority ?? 100,
    maxRetries: options?.maxRetries ?? 3,
  });
};
```

```typescript
// apps/api/src/events/event-consumer.service.ts
@Injectable()
export class EventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly handlers = new Map<string, EventHandlerInfo[]>();
  private running = false;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly discoveryService: DiscoveryService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    // Discover all @EventSubscriber decorated methods
    await this.discoverHandlers();
    // Start consuming
    this.running = true;
    this.consumeLoop();
  }

  private async consumeLoop() {
    while (this.running) {
      const messages = await this.redis.xreadgroup(
        'GROUP', 'hyvve-platform', this.consumerName,
        'COUNT', 10,
        'BLOCK', 5000,
        'STREAMS', 'hyvve:events', '>'
      );

      if (messages) {
        for (const [stream, entries] of messages) {
          for (const [id, fields] of entries) {
            await this.processEvent(id, JSON.parse(fields[1]));
          }
        }
      }
    }
  }

  private async processEvent(streamId: string, event: BaseEvent) {
    const matchingHandlers = this.findMatchingHandlers(event.type);

    for (const handler of matchingHandlers) {
      try {
        await handler.execute(event);
        await this.redis.xack('hyvve:events', 'hyvve-platform', streamId);
      } catch (error) {
        await this.handleError(streamId, event, handler, error);
      }
    }
  }

  private findMatchingHandlers(eventType: string): EventHandlerInfo[] {
    const results: EventHandlerInfo[] = [];

    for (const [pattern, handlers] of this.handlers) {
      if (this.matchesPattern(eventType, pattern)) {
        results.push(...handlers);
      }
    }

    return results.sort((a, b) => a.priority - b.priority);
  }

  private matchesPattern(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return eventType.startsWith(prefix);
    }
    return eventType === pattern;
  }
}
```

**Acceptance Criteria:**
- [x] `@EventSubscriber()` decorator registers methods as handlers
- [x] Consumer reads from Redis Stream in consumer group
- [x] Events dispatched to matching handlers by pattern
- [x] Wildcard patterns supported (e.g., `approval.*`)
- [x] Events acknowledged after successful processing
- [x] Handler priority ordering works

**Files to Create:**
- `apps/api/src/events/decorators/event-subscriber.decorator.ts`
- `apps/api/src/events/event-consumer.service.ts`
- `apps/api/src/events/interfaces/event-handler.interface.ts`

---

### Story 05.4: Implement Retry and Dead Letter Queue

**Points:** 2 | **Priority:** P0

**Technical Implementation:**

```typescript
// apps/api/src/events/event-retry.service.ts
@Injectable()
export class EventRetryService {
  private readonly RETRY_DELAYS = [60_000, 300_000, 1_800_000]; // 1m, 5m, 30m

  constructor(
    @InjectQueue('event-retry') private retryQueue: Queue,
    @InjectRedis() private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  async scheduleRetry(
    streamId: string,
    event: BaseEvent,
    error: Error,
    currentAttempt: number
  ): Promise<void> {
    // Update metadata
    await this.prisma.eventMetadata.update({
      where: { eventId: event.id },
      data: {
        attempts: currentAttempt + 1,
        lastError: error.message,
      },
    });

    if (currentAttempt >= 3) {
      await this.moveToDLQ(event, error);
      return;
    }

    const delay = this.RETRY_DELAYS[currentAttempt] ?? this.RETRY_DELAYS[2];

    await this.retryQueue.add(
      'retry-event',
      { eventId: event.id, streamId },
      { delay }
    );

    this.logger.log({
      message: 'Event retry scheduled',
      eventId: event.id,
      attempt: currentAttempt + 1,
      delayMs: delay,
    });
  }

  private async moveToDLQ(event: BaseEvent, error: Error): Promise<void> {
    // Add to DLQ stream
    await this.redis.xadd(
      'hyvve:dlq',
      '*',
      'event', JSON.stringify(event),
      'error', error.message,
      'movedAt', new Date().toISOString()
    );

    // Update metadata
    await this.prisma.eventMetadata.update({
      where: { eventId: event.id },
      data: { status: 'DLQ' },
    });

    this.logger.error({
      message: 'Event moved to DLQ',
      eventId: event.id,
      type: event.type,
      error: error.message,
    });
  }
}
```

**Retry Processor:**

```typescript
// apps/api/src/events/processors/event-retry.processor.ts
@Processor('event-retry')
export class EventRetryProcessor {
  @Process('retry-event')
  async handleRetry(job: Job<{ eventId: string; streamId: string }>) {
    const metadata = await this.prisma.eventMetadata.findUnique({
      where: { eventId: job.data.eventId },
    });

    if (metadata?.status === 'DLQ') return; // Already in DLQ

    // Re-add to main stream for reprocessing
    // Consumer will pick it up again
    await this.eventConsumer.reprocessEvent(job.data.eventId);
  }
}
```

**Acceptance Criteria:**
- [x] Failed events tracked with attempt count
- [x] Retry delays: 1 minute, 5 minutes, 30 minutes
- [x] Events moved to DLQ after 3 failures
- [x] DLQ entries include error details
- [x] Retry jobs use BullMQ for scheduling
- [x] DLQ monitoring endpoint available

**Files to Create:**
- `apps/api/src/events/event-retry.service.ts`
- `apps/api/src/events/processors/event-retry.processor.ts`

---

### Story 05.5: Define Core Platform Events

**Points:** 2 | **Priority:** P0

**Technical Implementation:**

Events are already defined in `packages/shared/src/types/events.ts`. This story wires them up:

1. **Update exports in packages/shared:**
   ```typescript
   // packages/shared/src/index.ts
   export * from './types/events';
   ```

2. **Create event handlers for approval events:**
   ```typescript
   // apps/api/src/approvals/handlers/approval-event.handler.ts
   @Injectable()
   export class ApprovalEventHandler {
     @EventSubscriber(EventTypes.APPROVAL_APPROVED)
     async handleApproved(event: BaseEvent<ApprovalDecisionPayload>) {
       // Trigger downstream actions (e.g., execute the approved action)
       this.logger.log({
         message: 'Approval approved - triggering execution',
         approvalId: event.data.approvalId,
       });
     }

     @EventSubscriber(EventTypes.APPROVAL_ESCALATED)
     async handleEscalated(event: BaseEvent<ApprovalEscalatedPayload>) {
       // Send notification to escalation target
       this.logger.log({
         message: 'Approval escalated - notifying target',
         approvalId: event.data.approvalId,
         escalatedToId: event.data.escalatedToId,
       });
     }
   }
   ```

3. **Create event handlers for agent events:**
   ```typescript
   // apps/api/src/agents/handlers/agent-event.handler.ts
   @Injectable()
   export class AgentEventHandler {
     @EventSubscriber(EventTypes.AGENT_RUN_COMPLETED)
     async handleAgentCompleted(event: BaseEvent<AgentRunCompletedPayload>) {
       // Update agent run metrics
     }

     @EventSubscriber(EventTypes.AGENT_CONFIRMATION_REQUESTED)
     async handleConfirmationRequested(event: BaseEvent<AgentConfirmationPayload>) {
       // Create approval item for human review
     }
   }
   ```

**Acceptance Criteria:**
- [x] All event types from `EventTypes` constant have handlers or are documented
- [x] Approval events trigger appropriate downstream actions
- [x] Agent events integrated with AgentOS bridge
- [x] Event payload interfaces properly typed
- [x] Event documentation complete

**Files to Create/Modify:**
- `apps/api/src/approvals/handlers/approval-event.handler.ts`
- `apps/api/src/agentos/handlers/agent-event.handler.ts`
- Update `packages/shared/src/index.ts` exports

---

### Story 05.6: Implement Event Replay

**Points:** 2 | **Priority:** P2

**Technical Implementation:**

```typescript
// apps/api/src/events/event-replay.service.ts
@Injectable()
export class EventReplayService {
  async startReplay(options: {
    startTime: Date;
    endTime: Date;
    eventTypes?: string[];
    tenantId?: string;
  }): Promise<{ jobId: string }> {
    const jobId = createId();

    // Start background job for replay
    await this.replayQueue.add('replay-events', {
      jobId,
      ...options,
    });

    return { jobId };
  }

  async getReplayStatus(jobId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    eventsReplayed: number;
    errors: number;
  }> {
    // Read from Redis or database
    return this.prisma.replayJob.findUnique({ where: { id: jobId } });
  }
}

@Processor('event-replay')
export class EventReplayProcessor {
  @Process('replay-events')
  async handleReplay(job: Job) {
    const { startTime, endTime, eventTypes, tenantId, jobId } = job.data;

    // Query events from main stream within time range
    const events = await this.redis.xrange(
      'hyvve:events',
      this.toStreamId(startTime),
      this.toStreamId(endTime)
    );

    let replayed = 0;
    for (const [id, fields] of events) {
      const event = JSON.parse(fields[1]) as BaseEvent;

      // Apply filters
      if (tenantId && event.tenantId !== tenantId) continue;
      if (eventTypes && !eventTypes.includes(event.type)) continue;

      // Re-publish with replay flag
      await this.publisher.publish(
        event.type as EventType,
        { ...event.data, __replay: true },
        {
          tenantId: event.tenantId,
          userId: event.userId,
          correlationId: `replay-${jobId}`,
        }
      );
      replayed++;

      // Update progress
      job.updateProgress((replayed / events.length) * 100);
    }

    return { eventsReplayed: replayed };
  }
}
```

**Acceptance Criteria:**
- [x] Admin endpoint accepts time range and filters
- [x] Replay job runs asynchronously
- [x] Progress tracking available via status endpoint
- [x] Replayed events marked with `__replay: true` flag
- [x] Event handlers can filter replay events if needed

**Files to Create:**
- `apps/api/src/events/event-replay.service.ts`
- `apps/api/src/events/processors/event-replay.processor.ts`
- `apps/api/src/events/dto/replay-events.dto.ts`

---

### Story 05.7: Create Event Monitoring Dashboard

**Points:** 2 | **Priority:** P1

**Technical Implementation:**

**Backend API:**

```typescript
// apps/api/src/events/events.controller.ts
@Controller('admin/events')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'owner')
export class EventsController {
  @Get('stats')
  async getStats() {
    const [streamInfo, dlqInfo, consumerInfo] = await Promise.all([
      this.redis.xinfo('STREAM', 'hyvve:events'),
      this.redis.xinfo('STREAM', 'hyvve:dlq'),
      this.redis.xinfo('GROUPS', 'hyvve:events'),
    ]);

    return {
      mainStream: {
        length: streamInfo.length,
        firstEntry: streamInfo['first-entry'],
        lastEntry: streamInfo['last-entry'],
      },
      dlq: {
        length: dlqInfo.length,
      },
      consumerGroup: {
        pending: consumerInfo[0].pending,
        consumers: consumerInfo[0].consumers,
        lag: consumerInfo[0].lag,
      },
      throughput: await this.calculateThroughput(),
    };
  }

  @Get('dlq')
  async getDLQEvents(@Query() query: PaginationDto) {
    const events = await this.redis.xrange(
      'hyvve:dlq',
      '-', '+',
      'COUNT', query.limit
    );

    return {
      events: events.map(([id, fields]) => ({
        streamId: id,
        event: JSON.parse(fields[1]),
        error: fields[3],
        movedAt: fields[5],
      })),
      total: await this.redis.xlen('hyvve:dlq'),
    };
  }

  @Post('dlq/:streamId/retry')
  async retryDLQEvent(@Param('streamId') streamId: string) {
    // Move event back to main stream
    const [[_, fields]] = await this.redis.xrange('hyvve:dlq', streamId, streamId);
    const event = JSON.parse(fields[1]) as BaseEvent;

    // Reset attempts and re-publish
    await this.prisma.eventMetadata.update({
      where: { eventId: event.id },
      data: { attempts: 0, status: 'PENDING' },
    });

    await this.redis.xadd('hyvve:events', '*', 'event', JSON.stringify(event));
    await this.redis.xdel('hyvve:dlq', streamId);

    return { success: true };
  }
}
```

**Frontend Dashboard (Next.js):**

```typescript
// apps/web/src/app/(dashboard)/admin/events/page.tsx
export default function EventMonitoringPage() {
  const { data: stats } = useQuery({
    queryKey: ['event-stats'],
    queryFn: () => apiClient.get('/admin/events/stats'),
    refetchInterval: 5000,
  });

  const { data: dlqEvents } = useQuery({
    queryKey: ['dlq-events'],
    queryFn: () => apiClient.get('/admin/events/dlq'),
  });

  return (
    <div className="space-y-6">
      <h1>Event Bus Monitoring</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Events (24h)" value={stats?.throughput?.last24h} />
        <StatCard title="DLQ Size" value={stats?.dlq?.length} alert />
        <StatCard title="Consumer Lag" value={stats?.consumerGroup?.lag} />
        <StatCard title="Pending" value={stats?.consumerGroup?.pending} />
      </div>

      <Card>
        <CardHeader>Dead Letter Queue</CardHeader>
        <CardContent>
          <DLQEventTable events={dlqEvents?.events} onRetry={handleRetry} />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Acceptance Criteria:**
- [x] Admin page shows event throughput metrics
- [x] DLQ size and contents visible
- [x] Individual DLQ events can be inspected
- [x] Retry button for DLQ events works
- [x] Consumer group lag displayed
- [x] Auto-refresh every 5 seconds

**Files to Create:**
- `apps/api/src/events/events.controller.ts`
- `apps/api/src/events/dto/pagination.dto.ts`
- `apps/web/src/app/(dashboard)/admin/events/page.tsx`
- `apps/web/src/components/events/dlq-event-table.tsx`
- `apps/web/src/components/events/stat-card.tsx`

---

## Technical Constraints

### Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Event publish latency | < 10ms p95 | Async write to Redis |
| Event processing latency | < 100ms p95 | Handler execution time |
| Throughput | 1000 events/sec | Single Redis instance |
| Consumer lag | < 100 events | Healthy consumption |

### Redis Configuration

```yaml
# docker-compose.yml additions
redis:
  image: redis:7-alpine
  command: >
    redis-server
    --appendonly yes
    --maxmemory 256mb
    --maxmemory-policy volatile-lru
```

### Security Considerations

1. **Tenant Isolation**: All events include `tenantId`; handlers must respect tenant boundaries
2. **PII in Events**: Avoid storing sensitive data in event payloads; use references (IDs) instead
3. **Admin Access**: Event monitoring endpoints restricted to admin/owner roles
4. **Event Replay**: Audit log all replay operations

---

## Testing Strategy

### Unit Tests

```typescript
// apps/api/src/events/__tests__/event-publisher.service.spec.ts
describe('EventPublisherService', () => {
  it('should publish event to Redis stream', async () => {
    const eventId = await publisher.publish(
      EventTypes.APPROVAL_APPROVED,
      { approvalId: 'test-123' },
      { tenantId: 'tenant-1', userId: 'user-1' }
    );

    expect(eventId).toBeDefined();
    expect(mockRedis.xadd).toHaveBeenCalledWith(
      'hyvve:events',
      '*',
      'event',
      expect.stringContaining('test-123')
    );
  });
});
```

### Integration Tests

```typescript
// apps/api/test/events.e2e-spec.ts
describe('Event Bus E2E', () => {
  it('should publish and consume events', async () => {
    // Publish event
    const eventId = await publisher.publish(...);

    // Wait for handler
    await waitFor(() => handlerCalled);

    // Verify acknowledgment
    const pending = await redis.xpending('hyvve:events', 'hyvve-platform');
    expect(pending.count).toBe(0);
  });
});
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Redis connection loss | Medium | High | Circuit breaker, fallback to database queue |
| Event handler timeout | Low | Medium | Configurable timeout, async processing |
| DLQ overflow | Low | Medium | Alerting on DLQ size, auto-purge old entries |
| Consumer group rebalancing | Medium | Low | Graceful shutdown, pending event tracking |
| Event schema changes | Medium | Medium | Version field in events, backward compatibility |

---

## Migration Plan

### Phase 1: Infrastructure (Story 05.1)
- Deploy EventsModule alongside existing code
- Verify Redis Streams connectivity
- No changes to existing event emissions

### Phase 2: Publisher (Story 05.2)
- Replace `EventBusService` stub with `EventPublisherService`
- Update all emit() calls to use typed interface
- Both stub and real publisher emit events

### Phase 3: Consumer (Stories 05.3-05.5)
- Deploy event handlers with `@EventSubscriber`
- Events start being processed
- Monitor DLQ for failures

### Phase 4: Monitoring (Stories 05.6-05.7)
- Deploy admin dashboard
- Enable event replay capability
- Complete migration

---

## Related Documentation

- PRD: `docs/prd.md` (FR-5 Event Bus)
- Architecture: `docs/architecture.md` (Cross-Module Communication)
- Epic Definition: `docs/epics/EPIC-05-event-bus.md`
- Event Types: `packages/shared/src/types/events.ts`
- Current Stub: `apps/api/src/approvals/stubs/event-bus.stub.ts`

---

_Generated by BMAD epic-tech-context workflow_
_Date: 2025-12-03_
_For: chris_
