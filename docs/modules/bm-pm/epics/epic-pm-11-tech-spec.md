# Epic PM-11: External API & Governance - Technical Specification

**Epic:** PM-11 - External API & Governance
**Module:** Core-PM (bm-pm)
**FRs Covered:** REST API, Webhooks, API Governance
**Stories:** 5 (PM-11.1 to PM-11.5)
**Created:** 2025-12-24
**Status:** Technical Context

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Data Model Changes](#data-model-changes)
4. [OpenAPI 3.0 Specification](#openapi-30-specification)
5. [API Authentication & Authorization](#api-authentication--authorization)
6. [REST API Endpoints](#rest-api-endpoints)
7. [Webhook System](#webhook-system)
8. [Rate Limiting Implementation](#rate-limiting-implementation)
9. [API Documentation Portal](#api-documentation-portal)
10. [Story Breakdown with Technical Notes](#story-breakdown-with-technical-notes)
11. [Security & Compliance](#security--compliance)
12. [Testing Strategy](#testing-strategy)
13. [Risks & Mitigations](#risks--mitigations)

---

## Executive Summary

Epic PM-11 provides a public REST API for external developers to integrate with the Core-PM system. This enables third-party applications, CI/CD pipelines, and integrations to programmatically manage projects, tasks, phases, and query knowledge base content.

**Key Outcomes:**
- REST API with OpenAPI 3.0 specification (versioned as /api/v1)
- API key authentication with scoped permissions (pm:read, pm:write, pm:admin)
- Webhook subscriptions for event-driven integrations
- Rate limiting with Redis-based token bucket algorithm
- Interactive API documentation portal (Swagger UI/Redoc)
- Audit logging for all API operations

**Technical Approach:**
- Extend existing NestJS API infrastructure in `apps/api/src`
- Reuse existing ApiKey model with additional scope field
- Leverage existing AuthGuard and TenantGuard for API authentication
- Redis-based rate limiting (10,000 requests/hour default, configurable per plan)
- Webhook delivery via BullMQ with retry logic (3 attempts with exponential backoff)
- Auto-generated OpenAPI spec from NestJS controllers/decorators

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          External API (PM-11)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ External Clients                                                            │
│  • Third-party apps                                                         │
│  • CI/CD pipelines (GitHub Actions, GitLab CI)                            │
│  • Zapier/Make integrations                                                │
│  • Custom scripts (curl, Python, etc.)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ API Gateway (NestJS)                                                        │
│  • /api/v1/pm/* (versioned API)                                            │
│  • API Key Authentication (ApiKeyGuard)                                    │
│  • Rate Limiting (RateLimitGuard + Redis)                                 │
│  • Request Validation (class-validator)                                   │
│  • OpenAPI Spec Generation (auto from controllers)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ API Controllers (NestJS)                                                    │
│  • ProjectsApiController                                                   │
│  • PhasesApiController                                                     │
│  • TasksApiController                                                      │
│  • ViewsApiController                                                      │
│  • KBApiController                                                         │
│  • WebhooksApiController                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Services (Reuse Existing)                                                   │
│  • ProjectsService                                                          │
│  • PhasesService                                                            │
│  • TasksService                                                             │
│  • SavedViewsService                                                        │
│  • PagesService (KB)                                                        │
│  • WebhookDeliveryService (new)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Webhook System                                                              │
│  • Event Bus Listeners (Redis Streams)                                     │
│  • Webhook Delivery Queue (BullMQ)                                         │
│  • Retry Logic (3 attempts, exponential backoff)                          │
│  • HMAC Signature Verification                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Rate Limiting (Redis)                                                       │
│  • Token Bucket Algorithm                                                  │
│  • Per-API-Key Limits                                                      │
│  • Configurable by Workspace Plan                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ API Documentation Portal                                                    │
│  • /api/docs (Swagger UI)                                                  │
│  • Auto-generated from OpenAPI spec                                        │
│  • Try-it-out functionality                                                │
│  • Authentication guide                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Request Flow

```
External Client
  ↓ (HTTP Request: GET /api/v1/pm/tasks)
  ↓ (Headers: X-API-Key: sk_prod_...)
  ↓
API Gateway (NestJS)
  ↓
ApiKeyGuard
  ↓ (Validate API key hash)
  ↓ (Extract workspaceId from API key)
  ↓ (Check API key not expired/revoked)
  ↓
RateLimitGuard
  ↓ (Check Redis rate limit for API key)
  ↓ (Increment request count if under limit)
  ↓
ScopeGuard
  ↓ (Verify API key has required scope: pm:read)
  ↓
TasksApiController
  ↓
TasksService (existing)
  ↓ (Query database with RLS: workspaceId)
  ↓
Response JSON
  ↓
External Client
```

### Webhook Delivery Flow

```
PM Event (task.created)
  ↓
Event Bus Listener (WebhookService)
  ↓ (Find active webhook subscriptions for event type)
  ↓
For each subscription:
  ↓
BullMQ Job (WebhookDeliveryQueue)
  ↓
WebhookDeliveryService
  ↓ (Generate HMAC signature)
  ↓ (POST request to webhook URL)
  ↓
  ├─ Success → Log delivery
  ├─ Failure (5xx, timeout) → Retry (attempt 2)
  │   └─ Retry with exponential backoff (attempt 3)
  └─ Max attempts reached → Mark as failed, notify user
```

---

## Data Model Changes

### Extend Existing ApiKey Model

```prisma
// packages/db/prisma/schema.prisma

// EXISTING MODEL (no schema changes, use permissions JSON)
model ApiKey {
  id          String @id @default(uuid())
  workspaceId String @map("workspace_id")

  name        String
  keyHash     String @unique @map("key_hash")
  keyPrefix   String @map("key_prefix")

  // JSON structure: { scopes: string[], rateLimit: number }
  // Example: { "scopes": ["pm:read", "pm:write", "kb:read"], "rateLimit": 10000 }
  permissions Json

  lastUsedAt DateTime? @map("last_used_at")
  expiresAt  DateTime? @map("expires_at")

  createdById String    @map("created_by_id")
  createdAt   DateTime  @default(now()) @map("created_at")
  revokedAt   DateTime? @map("revoked_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  createdBy User      @relation("CreatedBy", fields: [createdById], references: [id])

  @@index([workspaceId])
  @@index([keyHash])
  @@index([keyPrefix])
  @@map("api_keys")
}
```

### New Models

```prisma
/// WebhookSubscription - Webhook endpoint configuration
model WebhookSubscription {
  id          String @id @default(uuid())
  workspaceId String @map("workspace_id")
  projectId   String? @map("project_id") // Optional: project-specific webhooks

  // Webhook Configuration
  url         String
  secret      String // For HMAC signature verification
  description String?

  // Event Subscriptions
  // JSON array: ["task.created", "task.updated", "task.completed", "phase.transitioned"]
  events      Json

  // Status
  enabled     Boolean @default(true)

  // Delivery Stats
  successCount Int @default(0) @map("success_count")
  failureCount Int @default(0) @map("failure_count")
  lastTriggeredAt DateTime? @map("last_triggered_at")
  lastSuccessAt DateTime? @map("last_success_at")
  lastFailureAt DateTime? @map("last_failure_at")

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  createdBy   String @map("created_by")

  // Relations
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  deliveries  WebhookDelivery[]

  @@index([workspaceId])
  @@index([projectId])
  @@index([enabled])
  @@map("webhook_subscriptions")
}

/// WebhookDelivery - Webhook delivery log (for debugging)
model WebhookDelivery {
  id             String @id @default(uuid())
  subscriptionId String @map("subscription_id")

  // Event Details
  eventType      String @map("event_type")
  eventId        String @map("event_id")
  payload        Json

  // Delivery Attempt
  attempt        Int @default(1)
  status         WebhookDeliveryStatus @default(PENDING)

  // Response
  httpStatus     Int? @map("http_status")
  responseBody   String? @map("response_body") @db.Text
  errorMessage   String? @map("error_message") @db.Text

  // Timing
  deliveredAt    DateTime? @map("delivered_at")
  duration       Int? // Milliseconds

  // Timestamps
  createdAt      DateTime @default(now()) @map("created_at")

  // Relations
  subscription   WebhookSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([subscriptionId])
  @@index([status])
  @@index([createdAt])
  @@map("webhook_deliveries")
}

enum WebhookDeliveryStatus {
  PENDING
  SUCCESS
  FAILED
  RETRYING
}

// Update Workspace model to add relation
model Workspace {
  // ... existing fields ...
  webhooks WebhookSubscription[]
}
```

### API Scopes

```typescript
// packages/shared/src/types/api-scopes.ts

export const API_SCOPES = {
  // PM Scopes
  PM_READ: 'pm:read',
  PM_WRITE: 'pm:write',
  PM_ADMIN: 'pm:admin',

  // KB Scopes
  KB_READ: 'kb:read',
  KB_WRITE: 'kb:write',
  KB_ADMIN: 'kb:admin',

  // Webhook Scopes
  WEBHOOK_READ: 'webhook:read',
  WEBHOOK_WRITE: 'webhook:write',
} as const;

export type ApiScope = typeof API_SCOPES[keyof typeof API_SCOPES];

export interface ApiKeyPermissions {
  scopes: ApiScope[];
  rateLimit?: number; // Requests per hour (default: 10000)
}
```

---

## OpenAPI 3.0 Specification

### Auto-Generation from NestJS

```typescript
// apps/api/src/main.ts

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('HYVVE Core-PM API')
    .setDescription('External API for HYVVE Project Management and Knowledge Base')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key for authentication (format: sk_prod_...)',
      },
      'api-key',
    )
    .addTag('projects', 'Project management operations')
    .addTag('phases', 'Phase management operations')
    .addTag('tasks', 'Task management operations')
    .addTag('views', 'Saved view operations')
    .addTag('kb', 'Knowledge Base operations')
    .addTag('webhooks', 'Webhook subscription operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'HYVVE API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });

  await app.listen(3001);
}
bootstrap();
```

### Example Controller Decorators

```typescript
// apps/api/src/pm/api/tasks-api.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { RateLimitGuard } from '@/common/guards/rate-limit.guard';
import { ScopeGuard } from '@/common/guards/scope.guard';
import { Scopes } from '@/common/decorators/scopes.decorator';
import { API_SCOPES } from '@shared/types/api-scopes';

@ApiTags('tasks')
@Controller('api/v1/pm/tasks')
@UseGuards(ApiKeyGuard, RateLimitGuard, ScopeGuard)
@ApiSecurity('api-key')
export class TasksApiController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'List tasks with filters' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully', type: [TaskDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async listTasks(
    @Query() query: ListTasksQueryDto,
  ): Promise<PaginatedResponse<TaskDto>> {
    // Implementation
  }

  @Post()
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully', type: TaskDto })
  async createTask(@Body() dto: CreateTaskDto): Promise<TaskDto> {
    // Implementation
  }

  @Get(':id')
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully', type: TaskDto })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTask(@Param('id') id: string): Promise<TaskDto> {
    // Implementation
  }

  @Put(':id')
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully', type: TaskDto })
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskDto> {
    // Implementation
  }

  @Delete(':id')
  @Scopes(API_SCOPES.PM_ADMIN)
  @ApiOperation({ summary: 'Delete task (soft delete)' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  async deleteTask(@Param('id') id: string): Promise<void> {
    // Implementation
  }
}
```

---

## API Authentication & Authorization

### API Key Guard

```typescript
// apps/api/src/common/guards/api-key.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Hash the API key for lookup
    const keyHash = this.hashApiKey(apiKey);

    // Find API key in database
    const apiKeyRecord = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { workspace: true },
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is revoked
    if (apiKeyRecord.revokedAt) {
      throw new UnauthorizedException('API key has been revoked');
    }

    // Check if key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Attach workspace and API key to request
    request['workspaceId'] = apiKeyRecord.workspaceId;
    request['apiKey'] = apiKeyRecord;
    request['apiKeyId'] = apiKeyRecord.id;

    // Update last used timestamp (async, don't block)
    this.updateLastUsed(apiKeyRecord.id).catch(() => {});

    return true;
  }

  private extractApiKey(request: Request): string | null {
    // Check X-API-Key header
    const headerKey = request.headers['x-api-key'];
    if (headerKey && typeof headerKey === 'string') {
      return headerKey;
    }

    // Check Authorization: Bearer header
    const authHeader = request.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const match = authHeader.match(/^Bearer\s+(.+)$/);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  private async updateLastUsed(apiKeyId: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    });
  }
}
```

### Scope Guard

```typescript
// apps/api/src/common/guards/scope.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '@/common/decorators/scopes.decorator';
import { ApiScope } from '@shared/types/api-scopes';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<ApiScope[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScopes || requiredScopes.length === 0) {
      return true; // No scopes required
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.apiKey;

    if (!apiKey) {
      throw new ForbiddenException('API key not found in request');
    }

    const permissions = apiKey.permissions as { scopes: ApiScope[] };
    const userScopes = permissions.scopes || [];

    // Check if user has ANY of the required scopes
    const hasRequiredScope = requiredScopes.some((scope) => userScopes.includes(scope));

    if (!hasRequiredScope) {
      throw new ForbiddenException(
        `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`,
      );
    }

    return true;
  }
}
```

### Scopes Decorator

```typescript
// apps/api/src/common/decorators/scopes.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { ApiScope } from '@shared/types/api-scopes';

export const SCOPES_KEY = 'scopes';
export const Scopes = (...scopes: ApiScope[]) => SetMetadata(SCOPES_KEY, scopes);
```

---

## REST API Endpoints

### Projects API

```typescript
// GET /api/v1/pm/projects
// List projects with pagination and filters
Query: {
  limit?: number (default: 50, max: 100)
  offset?: number (default: 0)
  status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'
  search?: string
  sortBy?: 'name' | 'createdAt' | 'updatedAt' (default: 'createdAt')
  sortOrder?: 'asc' | 'desc' (default: 'desc')
}
Response: {
  data: Project[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

// POST /api/v1/pm/projects
// Create a new project
Body: {
  name: string
  slug: string
  description?: string
  type: ProjectType
  color?: string
  icon?: string
  budget?: number
  startDate?: string (ISO 8601)
  targetDate?: string (ISO 8601)
}
Response: Project

// GET /api/v1/pm/projects/:id
// Get project by ID
Response: Project

// PUT /api/v1/pm/projects/:id
// Update project
Body: Partial<Project>
Response: Project

// DELETE /api/v1/pm/projects/:id
// Soft delete project (requires pm:admin)
Response: { success: boolean }
```

### Phases API

```typescript
// GET /api/v1/pm/projects/:projectId/phases
// List phases for a project
Response: Phase[]

// POST /api/v1/pm/projects/:projectId/phases
// Create a new phase
Body: {
  name: string
  description?: string
  bmadPhase?: BmadPhaseType
  startDate?: string
  endDate?: string
}
Response: Phase

// GET /api/v1/pm/phases/:id
// Get phase by ID
Response: Phase

// PUT /api/v1/pm/phases/:id
// Update phase
Body: Partial<Phase>
Response: Phase

// POST /api/v1/pm/phases/:id/start
// Start a phase
Response: Phase

// POST /api/v1/pm/phases/:id/complete
// Complete a phase
Response: Phase
```

### Tasks API

```typescript
// GET /api/v1/pm/tasks
// List tasks with filters
Query: {
  projectId?: string
  phaseId?: string
  status?: TaskStatus
  assigneeId?: string
  priority?: TaskPriority
  type?: TaskType
  dueAfter?: string (ISO 8601)
  dueBefore?: string (ISO 8601)
  search?: string
  limit?: number (default: 50, max: 100)
  offset?: number
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
}
Response: {
  data: Task[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

// POST /api/v1/pm/tasks
// Create a new task
Body: {
  phaseId: string
  title: string
  description?: string
  type: TaskType
  priority: TaskPriority
  status?: TaskStatus (default: 'BACKLOG')
  assigneeId?: string
  agentId?: string
  assignmentType?: AssignmentType
  dueDate?: string
  storyPoints?: number
  estimatedHours?: number
}
Response: Task

// GET /api/v1/pm/tasks/:id
// Get task by ID
Response: Task

// PUT /api/v1/pm/tasks/:id
// Update task
Body: Partial<Task>
Response: Task

// POST /api/v1/pm/tasks/:id/assign
// Assign task to user or agent
Body: {
  assigneeId?: string
  agentId?: string
  assignmentType: AssignmentType
}
Response: Task

// POST /api/v1/pm/tasks/:id/transition
// Transition task to new status
Body: {
  status: TaskStatus
}
Response: Task

// GET /api/v1/pm/tasks/:id/activities
// Get task activity log
Response: TaskActivity[]

// DELETE /api/v1/pm/tasks/:id
// Soft delete task (requires pm:admin)
Response: { success: boolean }
```

### Views API

```typescript
// GET /api/v1/pm/views
// List saved views for project
Query: {
  projectId?: string
}
Response: SavedView[]

// POST /api/v1/pm/views
// Create saved view
Body: {
  projectId: string
  name: string
  description?: string
  viewType: 'list' | 'kanban' | 'calendar' | 'timeline'
  config: Json // Filter/sort configuration
  isPublic: boolean
}
Response: SavedView

// GET /api/v1/pm/views/:id
// Get saved view by ID
Response: SavedView

// PUT /api/v1/pm/views/:id
// Update saved view
Body: Partial<SavedView>
Response: SavedView

// DELETE /api/v1/pm/views/:id
// Delete saved view
Response: { success: boolean }
```

### Knowledge Base API

```typescript
// GET /api/v1/kb/pages
// List KB pages (tree or flat)
Query: {
  parentId?: string (null for root pages)
  workspaceId?: string (auto-filtered by API key workspace)
  search?: string
  isVerified?: boolean
  limit?: number
  offset?: number
}
Response: {
  data: KnowledgePage[]
  pagination: { total: number, limit: number, offset: number }
}

// POST /api/v1/kb/pages
// Create KB page
Body: {
  title: string
  slug: string
  content: Json (Tiptap JSON)
  parentId?: string
}
Response: KnowledgePage

// GET /api/v1/kb/pages/:id
// Get KB page by ID
Response: KnowledgePage

// PUT /api/v1/kb/pages/:id
// Update KB page
Body: Partial<KnowledgePage>
Response: KnowledgePage

// GET /api/v1/kb/search
// Full-text search KB
Query: {
  q: string
  limit?: number
  offset?: number
}
Response: {
  data: KnowledgePage[]
  pagination: { total: number }
}

// POST /api/v1/kb/search/semantic
// RAG-powered semantic search
Body: {
  query: string
  topK?: number (default: 5)
  boostVerified?: boolean (default: true)
}
Response: {
  results: Array<{
    pageId: string
    pageTitle: string
    chunkText: string
    similarity: number
    isVerified: boolean
  }>
}
```

### Webhooks API

```typescript
// GET /api/v1/webhooks
// List webhook subscriptions
Query: {
  projectId?: string
}
Response: WebhookSubscription[]

// POST /api/v1/webhooks
// Create webhook subscription
Body: {
  url: string
  events: string[] // e.g., ['task.created', 'task.completed']
  projectId?: string
  description?: string
}
Response: WebhookSubscription

// GET /api/v1/webhooks/:id
// Get webhook subscription by ID
Response: WebhookSubscription

// PUT /api/v1/webhooks/:id
// Update webhook subscription
Body: Partial<WebhookSubscription>
Response: WebhookSubscription

// POST /api/v1/webhooks/:id/test
// Test webhook delivery
Response: {
  success: boolean
  httpStatus: number
  responseBody: string
}

// GET /api/v1/webhooks/:id/deliveries
// Get webhook delivery logs
Query: {
  limit?: number
  offset?: number
  status?: WebhookDeliveryStatus
}
Response: {
  data: WebhookDelivery[]
  pagination: { total: number, limit: number, offset: number }
}

// DELETE /api/v1/webhooks/:id
// Delete webhook subscription
Response: { success: boolean }
```

---

## Webhook System

### Event Types

```typescript
// Webhook event types (subset of internal pm.* events)
export const WEBHOOK_EVENTS = {
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_STATUS_CHANGED: 'task.status_changed',
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',

  PHASE_STARTED: 'phase.started',
  PHASE_COMPLETED: 'phase.completed',
  PHASE_TRANSITIONED: 'phase.transitioned',

  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_ARCHIVED: 'project.archived',
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];
```

### Webhook Payload Structure

```typescript
interface WebhookPayload {
  id: string; // Delivery ID
  event: WebhookEventType;
  timestamp: string; // ISO 8601
  workspaceId: string;
  data: {
    // Event-specific data (e.g., task object for task.created)
    [key: string]: any;
  };
}

// Example: task.created
{
  "id": "whd_01HF8X...",
  "event": "task.created",
  "timestamp": "2025-12-24T10:30:00Z",
  "workspaceId": "ws_abc123",
  "data": {
    "task": {
      "id": "task_xyz",
      "title": "Implement API endpoint",
      "status": "BACKLOG",
      "priority": "HIGH",
      "phaseId": "phase_123",
      "projectId": "proj_456",
      "createdAt": "2025-12-24T10:30:00Z",
      "createdBy": "user_789"
    }
  }
}
```

### Webhook Delivery Service

```typescript
// apps/api/src/webhooks/webhook-delivery.service.ts

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/common/services/prisma.service';
import { EventBusService } from '@/events/event-bus.service';
import { BaseEvent } from '@shared/types/events';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class WebhookDeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    @InjectQueue('webhook-delivery') private readonly webhookQueue: Queue,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen to PM events that trigger webhooks
    this.eventBus.on('pm.task.created', (event) => this.handleEvent(event, 'task.created'));
    this.eventBus.on('pm.task.updated', (event) => this.handleEvent(event, 'task.updated'));
    this.eventBus.on('pm.task.state_changed', (event) => this.handleEvent(event, 'task.status_changed'));
    this.eventBus.on('pm.task.assigned', (event) => this.handleEvent(event, 'task.assigned'));
    this.eventBus.on('pm.task.completed', (event) => this.handleEvent(event, 'task.completed'));

    this.eventBus.on('pm.phase.started', (event) => this.handleEvent(event, 'phase.started'));
    this.eventBus.on('pm.phase.completed', (event) => this.handleEvent(event, 'phase.completed'));

    this.eventBus.on('pm.project.created', (event) => this.handleEvent(event, 'project.created'));
    this.eventBus.on('pm.project.updated', (event) => this.handleEvent(event, 'project.updated'));
  }

  private async handleEvent(event: BaseEvent, webhookEventType: string) {
    // Find active webhook subscriptions for this event type
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: {
        workspaceId: event.tenantId,
        enabled: true,
        events: {
          array_contains: webhookEventType,
        },
      },
    });

    // Queue delivery for each subscription
    for (const subscription of subscriptions) {
      await this.queueDelivery(subscription, event, webhookEventType);
    }
  }

  private async queueDelivery(
    subscription: WebhookSubscription,
    event: BaseEvent,
    webhookEventType: string,
  ) {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event: webhookEventType,
      timestamp: new Date().toISOString(),
      workspaceId: subscription.workspaceId,
      data: event.data,
    };

    // Add job to queue with retry configuration
    await this.webhookQueue.add(
      'deliver',
      {
        subscriptionId: subscription.id,
        url: subscription.url,
        secret: subscription.secret,
        payload,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s
        },
      },
    );
  }

  async deliverWebhook(
    url: string,
    secret: string,
    payload: WebhookPayload,
  ): Promise<{ success: boolean; httpStatus?: number; responseBody?: string; error?: string }> {
    try {
      // Generate HMAC signature
      const signature = this.generateSignature(payload, secret);

      // Send POST request
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': payload.id,
          'X-Webhook-Event': payload.event,
          'User-Agent': 'HYVVE-Webhooks/1.0',
        },
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status >= 200 && status < 300,
      });

      return {
        success: true,
        httpStatus: response.status,
        responseBody: JSON.stringify(response.data),
      };
    } catch (error) {
      return {
        success: false,
        httpStatus: error.response?.status,
        responseBody: error.response?.data ? JSON.stringify(error.response.data) : undefined,
        error: error.message,
      };
    }
  }

  private generateSignature(payload: WebhookPayload, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  async verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}
```

### Webhook Delivery Worker

```typescript
// apps/api/src/webhooks/webhook-delivery.processor.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { PrismaService } from '@/common/services/prisma.service';

@Processor('webhook-delivery')
export class WebhookDeliveryProcessor extends WorkerHost {
  constructor(
    private readonly deliveryService: WebhookDeliveryService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { subscriptionId, url, secret, payload } = job.data;

    // Create delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        subscriptionId,
        eventType: payload.event,
        eventId: payload.id,
        payload,
        attempt: job.attemptsMade + 1,
        status: 'PENDING',
      },
    });

    // Attempt delivery
    const result = await this.deliveryService.deliverWebhook(url, secret, payload);

    // Update delivery record
    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: result.success ? 'SUCCESS' : job.attemptsMade >= 2 ? 'FAILED' : 'RETRYING',
        httpStatus: result.httpStatus,
        responseBody: result.responseBody,
        errorMessage: result.error,
        deliveredAt: result.success ? new Date() : null,
      },
    });

    // Update subscription stats
    await this.prisma.webhookSubscription.update({
      where: { id: subscriptionId },
      data: {
        lastTriggeredAt: new Date(),
        ...(result.success
          ? {
              successCount: { increment: 1 },
              lastSuccessAt: new Date(),
            }
          : {
              failureCount: { increment: 1 },
              lastFailureAt: new Date(),
            }),
      },
    });

    if (!result.success) {
      throw new Error(result.error || 'Webhook delivery failed');
    }
  }
}
```

---

## Rate Limiting Implementation

### Redis-Based Token Bucket

```typescript
// apps/api/src/common/guards/rate-limit.guard.ts

import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.apiKey;

    if (!apiKey) {
      return true; // Let ApiKeyGuard handle missing key
    }

    // Get rate limit from API key permissions (default: 10000 requests/hour)
    const permissions = apiKey.permissions as { scopes: string[]; rateLimit?: number };
    const rateLimitPerHour = permissions.rateLimit || 10000;

    // Token bucket parameters
    const bucketSize = rateLimitPerHour;
    const refillRate = rateLimitPerHour / 3600; // Tokens per second
    const now = Date.now() / 1000; // Current time in seconds

    // Redis key for this API key
    const key = `rate-limit:${apiKey.id}`;

    // Lua script for atomic token bucket check-and-decrement
    const luaScript = `
      local key = KEYS[1]
      local bucket_size = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local requested = 1

      local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1])
      local last_refill = tonumber(bucket[2])

      if tokens == nil then
        tokens = bucket_size
        last_refill = now
      end

      -- Refill tokens based on time elapsed
      local elapsed = now - last_refill
      tokens = math.min(bucket_size, tokens + (elapsed * refill_rate))
      last_refill = now

      if tokens >= requested then
        tokens = tokens - requested
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
        redis.call('EXPIRE', key, 3600)
        return {1, math.floor(tokens)}
      else
        return {0, math.floor(tokens)}
      end
    `;

    const result = await this.redis.eval(
      luaScript,
      1,
      key,
      bucketSize.toString(),
      refillRate.toString(),
      now.toString(),
    ) as [number, number];

    const [allowed, remainingTokens] = result;

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', rateLimitPerHour);
    response.setHeader('X-RateLimit-Remaining', remainingTokens);
    response.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);

    if (!allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          retryAfter: 3600,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
```

---

## API Documentation Portal

### Swagger UI Configuration

```typescript
// apps/api/src/main.ts (extended)

// Serve OpenAPI spec as JSON
app.get('/api/docs/spec.json', (req, res) => {
  res.json(document);
});

// Serve Redoc alternative
SwaggerModule.setup('api/docs/redoc', app, document, {
  customSiteTitle: 'HYVVE API Documentation (Redoc)',
  customCss: '.redoc-wrap { font-family: sans-serif; }',
  redoc: true,
});
```

### Custom API Guide Page

```typescript
// apps/web/src/app/(dashboard)/api-docs/page.tsx

export default function ApiDocsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-6">HYVVE API Documentation</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <p>The HYVVE API allows you to programmatically interact with your projects, tasks, and knowledge base.</p>

        <h3 className="text-xl font-semibold mt-6 mb-2">1. Generate an API Key</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>Navigate to Settings → API Keys</li>
          <li>Click "Create API Key"</li>
          <li>Name your key and select scopes (pm:read, pm:write, etc.)</li>
          <li>Copy the key - you won't be able to see it again!</li>
        </ol>

        <h3 className="text-xl font-semibold mt-6 mb-2">2. Make Your First Request</h3>
        <CodeBlock language="bash">
{`curl -X GET 'https://api.hyvve.com/api/v1/pm/tasks' \\
  -H 'X-API-Key: sk_prod_YOUR_KEY_HERE'`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-2">3. Explore the API</h3>
        <div className="flex gap-4">
          <Button asChild>
            <a href="/api/docs" target="_blank">Interactive Docs (Swagger)</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/docs/redoc" target="_blank">API Reference (Redoc)</a>
          </Button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
        <p>Include your API key in the <code>X-API-Key</code> header with every request:</p>
        <CodeBlock language="typescript">
{`const response = await fetch('https://api.hyvve.com/api/v1/pm/tasks', {
  headers: {
    'X-API-Key': 'sk_prod_YOUR_KEY_HERE',
    'Content-Type': 'application/json',
  },
});`}
        </CodeBlock>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Rate Limits</h2>
        <p>Default rate limit: <strong>10,000 requests per hour</strong></p>
        <p>Rate limit headers are included in every response:</p>
        <ul className="list-disc list-inside">
          <li><code>X-RateLimit-Limit</code>: Total requests allowed per hour</li>
          <li><code>X-RateLimit-Remaining</code>: Requests remaining in current window</li>
          <li><code>X-RateLimit-Reset</code>: Unix timestamp when limit resets</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Webhooks</h2>
        <p>Subscribe to events and receive real-time notifications:</p>
        <CodeBlock language="typescript">
{`// Create webhook subscription
const webhook = await fetch('https://api.hyvve.com/api/v1/webhooks', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sk_prod_YOUR_KEY_HERE',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://your-app.com/webhook',
    events: ['task.created', 'task.completed'],
  }),
});

// Verify webhook signature
const signature = req.headers['x-webhook-signature'];
const isValid = verifySignature(req.body, signature, secret);`}
        </CodeBlock>
      </section>
    </div>
  );
}
```

---

## Story Breakdown with Technical Notes

### PM-11.1: REST API Design (Story PM-11-1)

**Goal:** Documented REST API for PM operations

**Technical Implementation:**
- Create `apps/api/src/pm/api/` module with versioned controllers
- Implement API key authentication extending existing ApiKey model
- Add OpenAPI decorators to controllers for auto-spec generation
- Endpoints: Projects CRUD, Phases CRUD, Tasks CRUD, Views CRUD, Search

**API Structure:**
- Base path: `/api/v1/pm/*`
- Versioning strategy: URL path versioning (v1, v2, etc.)
- Response format: JSON with standard envelope

**Acceptance Criteria:**
- [x] All endpoints documented with OpenAPI 3.0 decorators
- [x] Versioned API path (/api/v1)
- [x] Projects, Phases, Tasks, Views CRUD endpoints
- [x] Search endpoint with filters
- [x] Pagination support (limit/offset)

---

### PM-11.2: API Authentication (Story PM-11-2)

**Goal:** Secure API authentication with scoped permissions

**Technical Implementation:**
- Extend existing ApiKey model (use permissions JSON for scopes)
- Create ApiKeyGuard extending existing auth infrastructure
- Create ScopeGuard for permission checking
- API key format: `sk_prod_...` (prefix for visibility)
- SHA-256 hashing for key storage

**Scopes:**
- `pm:read` - Read projects, phases, tasks, views
- `pm:write` - Create/update projects, phases, tasks
- `pm:admin` - Delete operations, admin actions
- `kb:read` - Read KB pages
- `kb:write` - Create/update KB pages
- `webhook:read` - List webhooks
- `webhook:write` - Create/delete webhooks

**Key Management UI:**
- Settings → API Keys page
- Create key modal with scope selection
- Display key once (copy-to-clipboard)
- List keys with last used timestamp
- Revoke key functionality

**Acceptance Criteria:**
- [x] API key authentication via X-API-Key header
- [x] Scoped permissions (pm:read, pm:write, pm:admin)
- [x] Key management UI in settings
- [x] SHA-256 key hashing for storage
- [x] Key expiration support (optional)

---

### PM-11.3: Webhook Configuration (Story PM-11-3)

**Goal:** Event-driven webhooks for external integrations

**Technical Implementation:**
- WebhookSubscription model (new)
- WebhookDelivery model for logging (new)
- Event bus listeners for pm.* events
- BullMQ queue for webhook delivery with retry
- HMAC signature for verification

**Event Types:**
- task.created, task.updated, task.status_changed, task.assigned, task.completed, task.deleted
- phase.started, phase.completed, phase.transitioned
- project.created, project.updated, project.archived

**Retry Logic:**
- Max 3 attempts with exponential backoff (2s, 4s, 8s)
- Fail on 5xx or timeout, success on 2xx
- Log all delivery attempts

**Webhook Payload:**
```json
{
  "id": "whd_...",
  "event": "task.created",
  "timestamp": "2025-12-24T10:30:00Z",
  "workspaceId": "ws_...",
  "data": { "task": {...} }
}
```

**HMAC Verification:**
- Secret stored per webhook subscription
- Signature in `X-Webhook-Signature` header
- HMAC-SHA256 of payload body

**Acceptance Criteria:**
- [x] Webhook subscription CRUD endpoints
- [x] Event type selection (task.*, phase.*, project.*)
- [x] POST request sent on event trigger
- [x] Retry on failure (3 attempts, exponential backoff)
- [x] Webhook delivery logs for debugging
- [x] HMAC signature verification

---

### PM-11.4: API Documentation Portal (Story PM-11-4)

**Goal:** Interactive API documentation with "Try It" functionality

**Technical Implementation:**
- Swagger UI at `/api/docs`
- Redoc alternative at `/api/docs/redoc`
- Auto-generated from OpenAPI decorators
- Custom API guide page at `/api-docs`

**Features:**
- Endpoint list with descriptions
- Request/response examples
- Try-it-out functionality with API key input
- Authentication guide
- Code samples (curl, JavaScript, Python)
- Webhook verification examples

**Acceptance Criteria:**
- [x] Swagger UI accessible at /api/docs
- [x] Auto-generated from OpenAPI spec
- [x] Try-it-out functionality works
- [x] Authentication guide included
- [x] Code samples provided

---

### PM-11.5: API Rate Limiting & Governance (Story PM-11-5)

**Goal:** Prevent API abuse with rate limiting

**Technical Implementation:**
- Redis-based token bucket algorithm
- Per-API-key limits (configurable in permissions JSON)
- Rate limit headers in responses
- Usage dashboard in settings

**Default Limits:**
- 10,000 requests per hour per API key
- Configurable per workspace plan (future: tiered limits)

**Rate Limit Headers:**
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

**429 Response:**
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "retryAfter": 3600
}
```

**Usage Dashboard:**
- API key usage stats (requests per day)
- Top endpoints by usage
- Rate limit warnings

**Acceptance Criteria:**
- [x] Rate limiting enforced (10,000 req/hour default)
- [x] 429 response with Retry-After header
- [x] Configurable per workspace plan
- [x] Usage dashboard in settings
- [x] Rate limit headers in all responses

---

## Security & Compliance

### API Security

1. **Authentication:**
   - API keys stored as SHA-256 hashes (never plaintext)
   - Keys transmitted over HTTPS only
   - Key rotation recommended every 90 days
   - Revoked keys immediately invalidated

2. **Authorization:**
   - Scope-based permissions (pm:read, pm:write, etc.)
   - Workspace-level isolation (RLS via workspaceId)
   - API keys cannot access other workspaces

3. **Rate Limiting:**
   - Prevent abuse and DDoS attacks
   - Token bucket algorithm (smooth rate limiting)
   - Per-API-key limits (not per-IP for multi-tenant)

4. **Webhook Security:**
   - HMAC-SHA256 signature verification
   - Secret rotation support
   - Disable webhooks with repeated failures (>10)
   - Block internal IP addresses (SSRF prevention)

5. **Audit Logging:**
   - All API requests logged (AuditLog model)
   - Track: endpoint, API key, IP, timestamp, response status
   - Retention: 90 days

### Compliance

1. **GDPR:**
   - API keys are user-specific (createdBy field)
   - Data deletion cascades to API keys
   - Audit logs support data export

2. **SOC 2:**
   - API access logged for audit trail
   - Rate limiting prevents abuse
   - API keys can be revoked immediately

---

## Testing Strategy

### Unit Tests

```typescript
// API Key Guard
describe('ApiKeyGuard', () => {
  it('should validate API key hash');
  it('should reject expired API keys');
  it('should reject revoked API keys');
  it('should attach workspaceId to request');
  it('should update lastUsedAt timestamp');
});

// Scope Guard
describe('ScopeGuard', () => {
  it('should allow request with required scope');
  it('should reject request without required scope');
  it('should handle multiple scopes (OR logic)');
});

// Rate Limit Guard
describe('RateLimitGuard', () => {
  it('should allow request under limit');
  it('should reject request over limit');
  it('should refill tokens over time');
  it('should set rate limit headers');
});

// Webhook Delivery Service
describe('WebhookDeliveryService', () => {
  it('should generate HMAC signature');
  it('should queue webhook delivery');
  it('should retry on failure');
  it('should update delivery stats');
});
```

### Integration Tests

```typescript
// API Endpoints
describe('Tasks API', () => {
  it('should list tasks with API key');
  it('should reject request without API key');
  it('should reject request with invalid scope');
  it('should filter tasks by projectId');
  it('should paginate results');
});

// Webhook Delivery
describe('Webhook Delivery E2E', () => {
  it('should deliver webhook on task.created event');
  it('should retry on webhook failure');
  it('should include HMAC signature');
  it('should log delivery attempt');
});
```

### Load Tests (k6)

```javascript
// Load test: API rate limiting
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Sustained load
    { duration: '1m', target: 0 },   // Ramp down
  ],
};

export default function () {
  const res = http.get('https://api.hyvve.com/api/v1/pm/tasks', {
    headers: { 'X-API-Key': 'sk_prod_test_...' },
  });

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'rate limit headers present': (r) => r.headers['X-RateLimit-Limit'] !== undefined,
  });
}
```

---

## Risks & Mitigations

### Risk 1: API Key Leakage

**Risk:** API keys committed to public repositories or exposed in client-side code

**Mitigation:**
- Key prefix `sk_prod_` makes keys easily identifiable
- Warn users in UI: "Never commit API keys to Git"
- Key rotation workflow (one-click rotation)
- Monitor for keys in public GitHub repos (future: GitHub Secret Scanning)

### Risk 2: Rate Limit Bypass

**Risk:** Attackers create multiple API keys to bypass rate limits

**Mitigation:**
- Limit API keys per workspace (max 10)
- Workspace-level rate limiting (in addition to per-key)
- Alert on suspicious key creation patterns
- Admin review for high-volume key requests

### Risk 3: Webhook Abuse (SSRF)

**Risk:** Webhooks used to probe internal network

**Mitigation:**
- Block private IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Timeout webhooks after 10 seconds
- Disable webhook after 10 consecutive failures
- Validate URL format (https:// only in production)

### Risk 4: API Versioning Complexity

**Risk:** Breaking changes impact external integrations

**Mitigation:**
- Semantic versioning (v1, v2, etc.)
- Deprecation warnings 6 months before removal
- Maintain v1 for 12 months after v2 release
- Changelog for every API change

### Risk 5: Webhook Delivery Failures

**Risk:** Webhooks fail silently, users miss events

**Mitigation:**
- Retry logic (3 attempts with backoff)
- Delivery log UI for debugging
- Email notification after 3 failed attempts
- Test webhook endpoint before enabling

---

## References

- [Epic Definition](epic-pm-11-external-api-governance.md)
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)
- [Existing ApiKey Model](../../../../packages/db/prisma/schema.prisma)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
