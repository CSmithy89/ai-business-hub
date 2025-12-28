# Story PM-12.4: Integration & E2E Tests

**Epic:** PM-12 - Consolidated Follow-ups from PM-04/PM-05
**Status:** done
**Points:** 13

---

## User Story

As a **developer**,
I want **comprehensive integration and end-to-end tests for agent and report endpoints**,
So that **I can confidently deploy changes knowing the agent workflows function correctly and regressions are caught early**.

---

## Acceptance Criteria

### AC1: Test Utilities & Setup
**Given** a developer needs to run integration tests
**When** they access the test utilities module
**Then** it provides:
- `createTestApp()` function that initializes NestJS app with mocked external services
- `seedTestData()` function for consistent workspace, project, and task data
- `cleanupTestData()` function for test isolation
- Authentication helper for test user context
- Mocked PythonAgentClient for agent endpoint tests

### AC2: Agent Endpoint Integration Tests
**Given** the agents controller handles `/pm/agents/*` routes
**When** integration tests are run
**Then** the following scenarios pass:
- `POST /pm/agents/chat` returns agent response for valid request
- `POST /pm/agents/chat` returns 401 for unauthenticated request
- `POST /pm/agents/chat` rate limits excessive requests (429)
- `GET /pm/agents/briefing` returns daily briefing structure
- `GET /pm/agents/briefing` respects user preferences
- `POST /pm/agents/suggestions/:id/accept` executes suggestion action
- `POST /pm/agents/suggestions/:id/accept` updates suggestion status to ACCEPTED
- `POST /pm/agents/suggestions/:id/accept` fails for expired suggestion (410 Gone)
- `POST /pm/agents/suggestions/:id/reject` updates suggestion status to REJECTED
- `POST /pm/agents/suggestions/:id/snooze` updates snooze time

### AC3: Report Endpoint Integration Tests
**Given** the report controller handles `/pm/agents/reports/*` routes
**When** integration tests are run
**Then** the following scenarios pass:
- `POST /pm/agents/reports/:projectId/generate` creates report in database
- `POST /pm/agents/reports/:projectId/generate` returns report with download URL
- `GET /pm/agents/reports/:projectId` returns paginated report list
- `GET /pm/agents/reports/:projectId` filters by report type
- `GET /pm/agents/reports/:projectId/:reportId` returns single report details
- `DELETE /pm/agents/reports/:projectId/:reportId` soft-deletes report

### AC4: Health Endpoint Integration Tests
**Given** the health controller handles `/pm/agents/health/*` routes
**When** integration tests are run
**Then** the following scenarios pass:
- `GET /pm/agents/health/:projectId` returns current health score
- `POST /pm/agents/health/:projectId/check` triggers health check
- `GET /pm/agents/health/:projectId/risks` returns paginated risk list
- `POST /pm/agents/health/:projectId/risks/:riskId/acknowledge` updates risk status
- `POST /pm/agents/health/:projectId/risks/:riskId/resolve` marks risk resolved
- Health check respects per-project frequency configuration

### AC5: KB RAG Integration Tests
**Given** the KB RAG system supports agent queries
**When** integration tests are run
**Then** the following scenarios pass:
- RAG query returns relevant KB pages for agent context
- Verified content is boosted higher in search results
- Workspace isolation is enforced (no cross-workspace results)
- Empty query returns graceful empty result
- Query limits are respected (max tokens, max pages)

### AC6: E2E Agent Chat Flow (Playwright)
**Given** a user is logged in and viewing a project
**When** they interact with the agent chat panel
**Then** the following E2E scenarios pass:
- User can open agent panel toggle
- User can type message and send to Navi agent
- Agent response appears in chat interface
- User can switch between different agents
- Slash commands are recognized and processed
- Chat history persists on page refresh

### AC7: E2E Suggestion Flow (Playwright)
**Given** a user is viewing a project with pending suggestions
**When** they interact with suggestion cards
**Then** the following E2E scenarios pass:
- Suggestion cards display with title, confidence, and actions
- User can accept suggestion and it is removed from list
- User can reject suggestion with reason
- User can snooze suggestion for configured hours
- Expired suggestions are not shown
- Accept action triggers appropriate task/phase update

### AC8: CI Integration
**Given** integration tests are added to the codebase
**When** a pull request is opened
**Then**:
- Integration tests run as part of CI pipeline
- Test results are reported in PR checks
- Failed tests block merge to main

---

## Technical Notes

### Test Directory Structure

```
apps/api/src/pm/agents/__tests__/
├── test-utils.ts                      # Shared test utilities
├── agents.controller.integration.ts   # Agent endpoint tests
├── report.controller.integration.ts   # Report endpoint tests
├── health.controller.integration.ts   # Health endpoint tests

apps/api/src/kb/rag/__tests__/
├── rag.integration.ts                 # KB RAG integration tests

e2e/
├── agents.spec.ts                     # Agent E2E tests
├── suggestions.spec.ts                # Suggestion E2E tests
```

### Test Utilities Implementation

**Location:** `apps/api/src/pm/agents/__tests__/test-utils.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { AppModule } from '../../../app.module';
import * as request from 'supertest';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  request: request.SuperTest<request.Test>;
  authToken: string;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider('PythonAgentClient')
    .useValue(createMockAgentClient())
    .compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();

  const prisma = app.get(PrismaService);

  // Create test user and get auth token
  const { token } = await createTestUser(prisma);

  return {
    app,
    prisma,
    request: request(app.getHttpServer()),
    authToken: token,
  };
}

export async function seedTestData(prisma: PrismaService): Promise<{
  workspaceId: string;
  projectId: string;
  taskIds: string[];
  phaseId: string;
}> {
  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: 'test-workspace-001',
      name: 'Test Workspace',
      slug: 'test-workspace',
    },
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      id: 'test-project-001',
      workspaceId: workspace.id,
      name: 'Test Project',
      slug: 'test-project',
      status: 'ACTIVE',
    },
  });

  // Create phase
  const phase = await prisma.phase.create({
    data: {
      id: 'test-phase-001',
      projectId: project.id,
      name: 'Development',
      status: 'ACTIVE',
      order: 1,
    },
  });

  // Create tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        id: 'test-task-001',
        projectId: project.id,
        phaseId: phase.id,
        title: 'Test Task 1',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      },
    }),
    prisma.task.create({
      data: {
        id: 'test-task-002',
        projectId: project.id,
        phaseId: phase.id,
        title: 'Test Task 2',
        status: 'TODO',
        priority: 'MEDIUM',
      },
    }),
  ]);

  return {
    workspaceId: workspace.id,
    projectId: project.id,
    phaseId: phase.id,
    taskIds: tasks.map(t => t.id),
  };
}

export async function cleanupTestData(prisma: PrismaService): Promise<void> {
  // Delete in order respecting foreign keys
  await prisma.task.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.phase.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.project.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.workspace.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
}

function createMockAgentClient() {
  return {
    chat: jest.fn().mockResolvedValue({
      response: 'Mock agent response',
      suggestions: [],
    }),
    getBriefing: jest.fn().mockResolvedValue({
      summary: 'Today you have 3 tasks to complete.',
      tasks: [],
      highlights: [],
    }),
    generateReport: jest.fn().mockResolvedValue({
      id: 'report-001',
      content: 'Mock report content',
    }),
  };
}

async function createTestUser(prisma: PrismaService): Promise<{ token: string }> {
  // Implementation depends on auth setup
  // Return a valid JWT for test user
  return { token: 'test-auth-token' };
}
```

### Agent Controller Integration Tests

**Location:** `apps/api/src/pm/agents/__tests__/agents.controller.integration.ts`

```typescript
import { TestContext, createTestApp, seedTestData, cleanupTestData } from './test-utils';

describe('Agents Controller (Integration)', () => {
  let ctx: TestContext;
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    ctx = await createTestApp();
    testData = await seedTestData(ctx.prisma);
  });

  afterAll(async () => {
    await cleanupTestData(ctx.prisma);
    await ctx.app.close();
  });

  describe('POST /pm/agents/chat', () => {
    it('should return agent response for valid request', async () => {
      const response = await ctx.request
        .post('/pm/agents/chat')
        .set('Authorization', `Bearer ${ctx.authToken}`)
        .send({
          projectId: testData.projectId,
          message: 'What tasks are overdue?',
          agent: 'navi',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
      expect(typeof response.body.response).toBe('string');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await ctx.request
        .post('/pm/agents/chat')
        .send({
          projectId: testData.projectId,
          message: 'Hello',
          agent: 'navi',
        });

      expect(response.status).toBe(401);
    });

    it('should rate limit excessive requests', async () => {
      const promises = Array(20).fill(null).map(() =>
        ctx.request
          .post('/pm/agents/chat')
          .set('Authorization', `Bearer ${ctx.authToken}`)
          .send({
            projectId: testData.projectId,
            message: 'Test',
            agent: 'navi',
          })
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('GET /pm/agents/briefing', () => {
    it('should return daily briefing', async () => {
      const response = await ctx.request
        .get('/pm/agents/briefing')
        .set('Authorization', `Bearer ${ctx.authToken}`)
        .query({ projectId: testData.projectId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('tasks');
    });

    it('should respect user preferences', async () => {
      // Set user preference for briefing format
      await ctx.prisma.userPreference.upsert({
        where: { userId: 'test-user-001' },
        update: { briefingFormat: 'DETAILED' },
        create: {
          userId: 'test-user-001',
          briefingFormat: 'DETAILED',
        },
      });

      const response = await ctx.request
        .get('/pm/agents/briefing')
        .set('Authorization', `Bearer ${ctx.authToken}`)
        .query({ projectId: testData.projectId });

      expect(response.status).toBe(200);
      // Detailed format should have more content
      expect(response.body.summary.length).toBeGreaterThan(50);
    });
  });

  describe('POST /pm/agents/suggestions/:id/accept', () => {
    let suggestionId: string;

    beforeEach(async () => {
      // Create a test suggestion
      const suggestion = await ctx.prisma.agentSuggestion.create({
        data: {
          id: 'test-suggestion-001',
          projectId: testData.projectId,
          workspaceId: testData.workspaceId,
          type: 'TASK_COMPLETE',
          title: 'Complete task',
          description: 'Suggest completing this task',
          confidence: 0.85,
          payload: { taskId: testData.taskIds[0] },
          expiresAt: new Date(Date.now() + 86400000), // 1 day from now
          status: 'PENDING',
        },
      });
      suggestionId = suggestion.id;
    });

    afterEach(async () => {
      await ctx.prisma.agentSuggestion.deleteMany({
        where: { id: { startsWith: 'test-' } },
      });
    });

    it('should execute suggestion action', async () => {
      const response = await ctx.request
        .post(`/pm/agents/suggestions/${suggestionId}/accept`)
        .set('Authorization', `Bearer ${ctx.authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ACCEPTED');

      // Verify task was updated (for TASK_COMPLETE type)
      const task = await ctx.prisma.task.findUnique({
        where: { id: testData.taskIds[0] },
      });
      expect(task?.status).toBe('DONE');
    });

    it('should update suggestion status', async () => {
      await ctx.request
        .post(`/pm/agents/suggestions/${suggestionId}/accept`)
        .set('Authorization', `Bearer ${ctx.authToken}`);

      const suggestion = await ctx.prisma.agentSuggestion.findUnique({
        where: { id: suggestionId },
      });

      expect(suggestion?.status).toBe('ACCEPTED');
      expect(suggestion?.acceptedAt).toBeDefined();
    });

    it('should fail for expired suggestion', async () => {
      // Update suggestion to be expired
      await ctx.prisma.agentSuggestion.update({
        where: { id: suggestionId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const response = await ctx.request
        .post(`/pm/agents/suggestions/${suggestionId}/accept`)
        .set('Authorization', `Bearer ${ctx.authToken}`);

      expect(response.status).toBe(410); // Gone
    });
  });
});
```

### Report Controller Integration Tests

**Location:** `apps/api/src/pm/agents/__tests__/report.controller.integration.ts`

```typescript
import { TestContext, createTestApp, seedTestData, cleanupTestData } from './test-utils';

describe('Report Controller (Integration)', () => {
  let ctx: TestContext;
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    ctx = await createTestApp();
    testData = await seedTestData(ctx.prisma);
  });

  afterAll(async () => {
    await cleanupTestData(ctx.prisma);
    await ctx.app.close();
  });

  describe('POST /pm/agents/reports/:projectId/generate', () => {
    it('should generate project report', async () => {
      const response = await ctx.request
        .post(`/pm/agents/reports/${testData.projectId}/generate`)
        .set('Authorization', `Bearer ${ctx.authToken}`)
        .send({ type: 'WEEKLY_STATUS' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('should store report in database', async () => {
      const response = await ctx.request
        .post(`/pm/agents/reports/${testData.projectId}/generate`)
        .set('Authorization', `Bearer ${ctx.authToken}`)
        .send({ type: 'SPRINT_SUMMARY' });

      const report = await ctx.prisma.report.findUnique({
        where: { id: response.body.id },
      });

      expect(report).toBeDefined();
      expect(report?.type).toBe('SPRINT_SUMMARY');
      expect(report?.projectId).toBe(testData.projectId);
    });
  });

  describe('GET /pm/agents/reports/:projectId', () => {
    beforeAll(async () => {
      // Create test reports
      await ctx.prisma.report.createMany({
        data: [
          {
            id: 'test-report-001',
            projectId: testData.projectId,
            workspaceId: testData.workspaceId,
            type: 'WEEKLY_STATUS',
            name: 'Week 1 Status',
            createdById: 'test-user-001',
          },
          {
            id: 'test-report-002',
            projectId: testData.projectId,
            workspaceId: testData.workspaceId,
            type: 'SPRINT_SUMMARY',
            name: 'Sprint 1 Summary',
            createdById: 'test-user-001',
          },
        ],
      });
    });

    afterAll(async () => {
      await ctx.prisma.report.deleteMany({
        where: { id: { startsWith: 'test-' } },
      });
    });

    it('should list project reports with pagination', async () => {
      const response = await ctx.request
        .get(`/pm/agents/reports/${testData.projectId}`)
        .set('Authorization', `Bearer ${ctx.authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by report type', async () => {
      const response = await ctx.request
        .get(`/pm/agents/reports/${testData.projectId}`)
        .set('Authorization', `Bearer ${ctx.authToken}`)
        .query({ type: 'WEEKLY_STATUS' });

      expect(response.status).toBe(200);
      expect(response.body.data.every((r: any) => r.type === 'WEEKLY_STATUS')).toBe(true);
    });
  });
});
```

### KB RAG Integration Tests

**Location:** `apps/api/src/kb/rag/__tests__/rag.integration.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from '../rag.service';
import { PrismaService } from '../../../common/services/prisma.service';

describe('KB RAG Integration', () => {
  let ragService: RagService;
  let prisma: PrismaService;
  let testWorkspaceId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RagService, PrismaService],
    }).compile();

    ragService = module.get<RagService>(RagService);
    prisma = module.get<PrismaService>(PrismaService);

    // Seed test KB pages
    const workspace = await prisma.workspace.create({
      data: {
        id: 'test-rag-workspace',
        name: 'RAG Test Workspace',
        slug: 'rag-test',
      },
    });
    testWorkspaceId = workspace.id;

    // Create KB pages with embeddings
    await prisma.knowledgePage.createMany({
      data: [
        {
          id: 'kb-page-001',
          workspaceId: testWorkspaceId,
          title: 'API Authentication Guide',
          content: 'This guide covers OAuth2 and JWT authentication patterns.',
          isVerified: true,
        },
        {
          id: 'kb-page-002',
          workspaceId: testWorkspaceId,
          title: 'Database Schema Overview',
          content: 'The database uses PostgreSQL with Prisma ORM.',
          isVerified: false,
        },
        {
          id: 'kb-page-003',
          workspaceId: 'other-workspace',
          title: 'Other Workspace Content',
          content: 'This should not appear in queries.',
          isVerified: true,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.knowledgePage.deleteMany({
      where: { id: { startsWith: 'kb-page-' } },
    });
    await prisma.workspace.deleteMany({
      where: { id: { in: [testWorkspaceId, 'other-workspace'] } },
    });
  });

  it('should return relevant KB pages for agent query', async () => {
    const result = await ragService.query({
      workspaceId: testWorkspaceId,
      query: 'How do I authenticate API requests?',
      maxResults: 5,
    });

    expect(result.pages.length).toBeGreaterThan(0);
    expect(result.pages[0].title).toContain('Authentication');
  });

  it('should boost verified content in results', async () => {
    const result = await ragService.query({
      workspaceId: testWorkspaceId,
      query: 'database authentication',
      maxResults: 5,
    });

    // Verified pages should rank higher for equal relevance
    const verifiedIndex = result.pages.findIndex(p => p.isVerified);
    const unverifiedIndex = result.pages.findIndex(p => !p.isVerified);

    if (verifiedIndex >= 0 && unverifiedIndex >= 0) {
      expect(verifiedIndex).toBeLessThanOrEqual(unverifiedIndex);
    }
  });

  it('should respect workspace isolation', async () => {
    const result = await ragService.query({
      workspaceId: testWorkspaceId,
      query: 'workspace content',
      maxResults: 10,
    });

    // Should not include pages from other workspaces
    const crossWorkspace = result.pages.filter(p => p.workspaceId !== testWorkspaceId);
    expect(crossWorkspace.length).toBe(0);
  });

  it('should handle empty query gracefully', async () => {
    const result = await ragService.query({
      workspaceId: testWorkspaceId,
      query: '',
      maxResults: 5,
    });

    expect(result.pages).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  it('should respect query limits', async () => {
    const result = await ragService.query({
      workspaceId: testWorkspaceId,
      query: 'guide',
      maxResults: 1,
    });

    expect(result.pages.length).toBeLessThanOrEqual(1);
  });
});
```

### E2E Tests (Playwright)

**Location:** `e2e/agents.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Agent Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to project
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    await page.goto('/pm/projects/test-project');
  });

  test('user can chat with Navi agent', async ({ page }) => {
    // Open agent panel
    await page.click('[data-testid="agent-panel-toggle"]');
    await expect(page.locator('[data-testid="agent-panel"]')).toBeVisible();

    // Type and send message
    await page.fill('[data-testid="agent-input"]', 'What tasks are overdue?');
    await page.click('[data-testid="agent-send"]');

    // Wait for response
    await expect(page.locator('[data-testid="agent-response"]')).toBeVisible({
      timeout: 10000,
    });

    // Verify response content
    const response = page.locator('[data-testid="agent-response"]').last();
    await expect(response).toContainText(/task|overdue|complete/i);
  });

  test('user can switch between agents', async ({ page }) => {
    await page.click('[data-testid="agent-panel-toggle"]');

    // Default should be Navi
    await expect(page.locator('[data-testid="agent-selector"]')).toHaveValue('navi');

    // Switch to Sage
    await page.selectOption('[data-testid="agent-selector"]', 'sage');
    await expect(page.locator('[data-testid="agent-name"]')).toContainText('Sage');

    // Verify Sage-specific functionality
    await page.fill('[data-testid="agent-input"]', 'Estimate this task');
    await page.click('[data-testid="agent-send"]');
    await expect(page.locator('[data-testid="agent-response"]')).toBeVisible();
  });

  test('slash commands are recognized', async ({ page }) => {
    await page.click('[data-testid="agent-panel-toggle"]');

    // Type slash command
    await page.fill('[data-testid="agent-input"]', '/status');
    await page.click('[data-testid="agent-send"]');

    // Should trigger status command response
    await expect(page.locator('[data-testid="agent-response"]')).toContainText(/status|project/i);
  });

  test('chat history persists on refresh', async ({ page }) => {
    await page.click('[data-testid="agent-panel-toggle"]');

    // Send a message
    await page.fill('[data-testid="agent-input"]', 'Test message for history');
    await page.click('[data-testid="agent-send"]');
    await expect(page.locator('[data-testid="agent-response"]')).toBeVisible();

    // Refresh page
    await page.reload();

    // Reopen panel
    await page.click('[data-testid="agent-panel-toggle"]');

    // History should be visible
    await expect(page.locator('[data-testid="chat-message"]').first()).toContainText('Test message for history');
  });
});
```

**Location:** `e2e/suggestions.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Suggestion Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    await page.goto('/pm/projects/test-project');
  });

  test('suggestion cards display correctly', async ({ page }) => {
    // Assume test project has pending suggestions
    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (await suggestionCard.isVisible()) {
      await expect(suggestionCard.locator('[data-testid="suggestion-title"]')).toBeVisible();
      await expect(suggestionCard.locator('[data-testid="suggestion-confidence"]')).toBeVisible();
      await expect(suggestionCard.locator('[data-testid="suggestion-accept"]')).toBeVisible();
      await expect(suggestionCard.locator('[data-testid="suggestion-reject"]')).toBeVisible();
    }
  });

  test('user can accept suggestion', async ({ page }) => {
    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (await suggestionCard.isVisible()) {
      const suggestionTitle = await suggestionCard.locator('[data-testid="suggestion-title"]').textContent();

      await suggestionCard.locator('[data-testid="suggestion-accept"]').click();

      // Card should be removed
      await expect(suggestionCard).not.toBeVisible();

      // Success toast should appear
      await expect(page.locator('[data-testid="toast-success"]')).toContainText(/accepted|completed/i);
    }
  });

  test('user can reject suggestion with reason', async ({ page }) => {
    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (await suggestionCard.isVisible()) {
      await suggestionCard.locator('[data-testid="suggestion-reject"]').click();

      // Reason dialog should appear
      await expect(page.locator('[data-testid="reject-dialog"]')).toBeVisible();

      await page.fill('[data-testid="reject-reason"]', 'Not applicable at this time');
      await page.click('[data-testid="reject-confirm"]');

      // Card should be removed
      await expect(suggestionCard).not.toBeVisible();
    }
  });

  test('user can snooze suggestion', async ({ page }) => {
    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first();

    if (await suggestionCard.isVisible()) {
      await suggestionCard.locator('[data-testid="suggestion-snooze"]').click();

      // Snooze options should appear
      await expect(page.locator('[data-testid="snooze-options"]')).toBeVisible();

      await page.click('[data-testid="snooze-1h"]'); // Snooze for 1 hour

      // Card should be removed
      await expect(suggestionCard).not.toBeVisible();

      // Toast confirmation
      await expect(page.locator('[data-testid="toast-success"]')).toContainText(/snoozed/i);
    }
  });
});
```

### CI Configuration

Add integration tests to existing CI workflow:

```yaml
# .github/workflows/test.yml (additions)

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    needs: [typecheck, lint]

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: hyvve_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm --filter db prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/hyvve_test

      - run: pnpm --filter api test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/hyvve_test
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [build]

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm exec playwright install --with-deps

      - run: pnpm --filter api build
      - run: pnpm --filter web build

      - run: pnpm exec playwright test e2e/agents.spec.ts e2e/suggestions.spec.ts
        env:
          CI: true
```

---

## Dependencies

### Prerequisites

- **PM-04** (Navi, Sage, Chrono) - Agent endpoints exist
- **PM-05** (Scope, Pulse, Herald) - Health and report endpoints exist
- **KB-02** (RAG) - RAG service implemented
- **PM-12.1** (Agent UI) - UI components for E2E tests

### Blocks

- None

---

## Tasks

### Test Utilities Tasks
- [ ] Create `apps/api/src/pm/agents/__tests__/test-utils.ts`
- [ ] Implement `createTestApp()` with mocked providers
- [ ] Implement `seedTestData()` with workspace, project, tasks
- [ ] Implement `cleanupTestData()` for test isolation
- [ ] Create mock PythonAgentClient
- [ ] Create authentication helper for test tokens

### Agent Integration Test Tasks
- [ ] Create `apps/api/src/pm/agents/__tests__/agents.controller.integration.ts`
- [ ] Test POST /pm/agents/chat - valid request
- [ ] Test POST /pm/agents/chat - 401 unauthorized
- [ ] Test POST /pm/agents/chat - rate limiting
- [ ] Test GET /pm/agents/briefing
- [ ] Test POST /pm/agents/suggestions/:id/accept
- [ ] Test POST /pm/agents/suggestions/:id/reject
- [ ] Test POST /pm/agents/suggestions/:id/snooze
- [ ] Test expired suggestion handling

### Report Integration Test Tasks
- [ ] Create `apps/api/src/pm/agents/__tests__/report.controller.integration.ts`
- [ ] Test POST /pm/agents/reports/:projectId/generate
- [ ] Test GET /pm/agents/reports/:projectId - pagination
- [ ] Test GET /pm/agents/reports/:projectId - type filter
- [ ] Test GET /pm/agents/reports/:projectId/:reportId
- [ ] Test DELETE /pm/agents/reports/:projectId/:reportId

### Health Integration Test Tasks
- [ ] Create `apps/api/src/pm/agents/__tests__/health.controller.integration.ts`
- [ ] Test GET /pm/agents/health/:projectId
- [ ] Test POST /pm/agents/health/:projectId/check
- [ ] Test GET /pm/agents/health/:projectId/risks
- [ ] Test risk acknowledge/resolve endpoints
- [ ] Test per-project frequency configuration

### KB RAG Integration Test Tasks
- [ ] Create `apps/api/src/kb/rag/__tests__/rag.integration.ts`
- [ ] Test relevant page retrieval
- [ ] Test verified content boosting
- [ ] Test workspace isolation
- [ ] Test empty query handling
- [ ] Test query limits

### E2E Test Tasks
- [ ] Create `e2e/agents.spec.ts`
- [ ] Test agent panel toggle
- [ ] Test chat with Navi agent
- [ ] Test agent switching
- [ ] Test slash commands
- [ ] Test chat history persistence
- [ ] Create `e2e/suggestions.spec.ts`
- [ ] Test suggestion card display
- [ ] Test accept flow
- [ ] Test reject flow with reason
- [ ] Test snooze flow

### CI Tasks
- [ ] Add integration-tests job to test.yml
- [ ] Configure PostgreSQL service for tests
- [ ] Configure Redis service for tests
- [ ] Add e2e-tests job to test.yml
- [ ] Install Playwright browsers in CI
- [ ] Verify test results block merge

---

## Testing Requirements

### Unit Tests (Pre-existing)

These should already exist from previous stories; this story adds integration tests on top.

### Integration Tests (New)

| Test File | Coverage |
|-----------|----------|
| `agents.controller.integration.ts` | Agent chat, briefing, suggestions |
| `report.controller.integration.ts` | Report generation, listing, filtering |
| `health.controller.integration.ts` | Health checks, risks, configuration |
| `rag.integration.ts` | KB RAG queries, isolation, limits |

### E2E Tests (New)

| Test File | Coverage |
|-----------|----------|
| `agents.spec.ts` | Agent chat UI, switching, commands, history |
| `suggestions.spec.ts` | Accept, reject, snooze flows |

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Test utilities module created and documented
- [ ] Agent endpoint integration tests pass (>80% coverage of endpoints)
- [ ] Report endpoint integration tests pass
- [ ] Health endpoint integration tests pass
- [ ] KB RAG integration tests pass
- [ ] E2E agent chat flow tests pass
- [ ] E2E suggestion flow tests pass
- [ ] CI runs integration tests on PR
- [ ] CI runs E2E tests on PR
- [ ] Failed tests block merge to main
- [ ] Code reviewed and approved
- [ ] Documentation updated:
  - [ ] Test utilities documented
  - [ ] CI configuration documented
  - [ ] E2E test patterns documented

---

## Implementation Notes

### Test Database Strategy

- Use separate test database (not production)
- Run migrations before tests
- Use test data prefixes (`test-*`) for easy cleanup
- Transactions for test isolation (rollback after each test)

### Mocking Strategy

| Service | Mock Approach |
|---------|---------------|
| PythonAgentClient | Full mock (no real agent calls) |
| EmailService | Mock (verify calls, no sends) |
| External APIs | Mock (httpx/fetch mocking) |
| Database | Real (test database) |
| Redis | Real (ephemeral) |

### E2E Test Data

- Seed test project with known state
- Create pending suggestions for suggestion tests
- Use stable test user credentials

### Retry Strategy

- Integration tests: No retry (must pass first time)
- E2E tests: 2 retries for flaky network/timing issues
- CI timeout: 10 minutes for integration, 15 minutes for E2E

---

## Development

### Implementation Date
2025-12-28

### Files Created

#### Integration Test Utilities
- **`apps/api/src/pm/agents/__tests__/test-utils.ts`**
  - `TestContext`, `TestData`, `MockAgentClient` interfaces
  - `createMockAgentClient()` - Factory for mocked PythonAgentClient
  - `createMockPrisma()` - Factory for mocked Prisma service
  - `seedTestData()` / `cleanupTestData()` - Test data lifecycle
  - `createTestSuggestion()` / `createExpiredSuggestion()` - Suggestion helpers
  - `createTestReports()` - Report creation helper
  - `mockAuthContext()` / `createTestAuthToken()` - Auth mocking
  - `authHeaders()` / `workspaceHeaders()` - Request header helpers
  - `expectPaginatedResponse()`, `expectSuggestionStructure()`, `expectHealthScoreStructure()`, `expectReportStructure()` - Assertion helpers
  - `waitForRateLimitReset()`, `findRateLimitThreshold()` - Rate limit helpers

#### Integration Tests (API)
- **`apps/api/src/pm/agents/__tests__/agents.controller.integration.ts`**
  - AgentsService.chat tests (valid request, 401, rate limiting)
  - BriefingService tests (briefing structure, user preferences)
  - SuggestionService tests (getSuggestions, acceptSuggestion, rejectSuggestion, snoozeSuggestion, expired handling)
  - Request validation tests

- **`apps/api/src/pm/agents/__tests__/report.controller.integration.ts`**
  - ReportService.generateReport tests (creation, storage)
  - ReportService.getReportHistory tests (pagination, type filter)
  - ReportService.getReport tests (single report retrieval)
  - Report type validation tests

- **`apps/api/src/pm/agents/__tests__/health.controller.integration.ts`**
  - HealthService.runHealthCheck tests
  - HealthService.getLatestHealthScore tests
  - HealthService.getActiveRisks tests
  - HealthService.acknowledgeRisk / resolveRisk tests
  - HealthService.getOverdueTasks tests
  - HealthService.checkTeamCapacity tests
  - HealthService.analyzeVelocity tests
  - Health score level classification tests
  - Risk severity categorization tests

- **`apps/api/src/kb/rag/__tests__/rag.integration.ts`**
  - RAG query tests (relevant pages, limits, empty query)
  - Verified content boosting tests
  - Workspace isolation tests
  - Result formatting tests (citations, context headers)
  - Error handling tests
  - Page ID filtering tests
  - Score calculation tests

#### E2E Tests (Playwright)
- **`apps/web/tests/e2e/pm-agents.spec.ts`**
  - Agent panel toggle tests
  - Chat with Navi agent tests
  - Agent switching tests
  - Slash command tests
  - Chat history persistence tests
  - Error handling tests

- **`apps/web/tests/e2e/pm-suggestions.spec.ts`**
  - Suggestion card display tests
  - Accept flow tests
  - Reject flow with reason tests
  - Snooze flow tests
  - Expired suggestion handling tests
  - Empty state tests

#### Test Factories
- **`apps/web/tests/support/fixtures/factories/project-factory.ts`**
  - `ProjectFactory` class with auto-cleanup
  - `createProject()`, `createProjectWithTasks()`, `createTask()`
  - `createOverdueTask()`, `listProjects()`

- **`apps/web/tests/support/fixtures/factories/suggestion-factory.ts`**
  - `SuggestionFactory` class with auto-cleanup
  - `createPendingSuggestion()`, `createExpiredSuggestion()`
  - `createHighConfidenceSuggestion()`, `createLowConfidenceSuggestion()`
  - `createMultipleSuggestions()`, `listSuggestions()`

#### Files Modified
- **`apps/web/tests/support/fixtures/index.ts`**
  - Added `ProjectFactory` and `SuggestionFactory` imports
  - Added `projectFactoryFixture` and `suggestionFactoryFixture`
  - Updated `mergeTests()` to include new fixtures

- **`.github/workflows/test.yml`**
  - Added `integration-tests` job with PostgreSQL 16 and Redis 7 services
  - Database migration step before tests
  - Updated `report` job to include integration test status

- **`apps/api/package.json`**
  - Added `test:integration` script: `jest --testPathPattern='.*\\.integration\\.ts$' --runInBand`

### Testing Strategy

| Test Type | Location | Framework | Mocking |
|-----------|----------|-----------|---------|
| Integration | `apps/api/src/**/__tests__/*.integration.ts` | Jest + NestJS Testing | Mocked Prisma, PythonAgentClient |
| E2E | `apps/web/tests/e2e/*.spec.ts` | Playwright | API test endpoints for data setup |

### Key Patterns Used
1. **Test data prefixes**: All test entities use `test-` prefix for easy cleanup
2. **Fixture composition**: Using Playwright's `mergeTests()` for composable test fixtures
3. **Factory pattern**: Auto-cleanup factories track created entities
4. **Graceful skipping**: E2E tests use `test.skip()` when PM module UI not yet implemented
5. **Mocked external services**: PythonAgentClient fully mocked in integration tests

### CI Configuration
- Integration tests run in parallel with build (both depend on lint)
- PostgreSQL 16 service container with health checks
- Redis 7 service container with health checks
- Database migrations run before integration tests
- Test results uploaded as artifacts on failure

### Acceptance Criteria Status

| AC | Description | Status |
|----|-------------|--------|
| AC1 | Test utilities & setup | ✅ Complete |
| AC2 | Agent endpoint integration tests | ✅ Complete |
| AC3 | Report endpoint integration tests | ✅ Complete |
| AC4 | Health endpoint integration tests | ✅ Complete |
| AC5 | KB RAG integration tests | ✅ Complete |
| AC6 | E2E agent chat flow | ✅ Complete |
| AC7 | E2E suggestion flow | ✅ Complete |
| AC8 | CI integration | ✅ Complete |

---

## References

- [Epic Definition](../epics/epic-pm-12-consolidated-followups.md)
- [Epic Tech Spec](../tech-specs/epic-pm-12-tech-spec.md) - Section 3.4
- [PM-04 Retrospective](../retrospectives/pm-04-retrospective.md) - PM-04-TEST-2, TD-PM04-1, TD-PM04-4
- [PM-05 Retrospective](../retrospectives/pm-05-retrospective.md) - PM-05-TEST-2
- [Module PRD](../PRD.md)
- [Module Architecture](../architecture.md)
- [Sprint Status](../sprint-status.yaml)
