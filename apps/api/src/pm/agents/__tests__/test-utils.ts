/**
 * PM Agents Integration Test Utilities
 *
 * Provides shared test setup, mocks, and data factories for PM agent integration tests.
 *
 * @see docs/modules/bm-pm/stories/pm-12-4-integration-e2e-tests.md
 */
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import * as request from 'supertest';

// ============================================
// Types
// ============================================

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  request: request.SuperTest<request.Test>;
  authToken: string;
  testUserId: string;
}

export interface TestData {
  workspaceId: string;
  projectId: string;
  phaseId: string;
  taskIds: string[];
  userId: string;
}

export interface MockAgentClient {
  chat: jest.Mock;
  getBriefing: jest.Mock;
  generateReport: jest.Mock;
  runHealthCheck: jest.Mock;
  estimateTask: jest.Mock;
}

// ============================================
// Mock Factories
// ============================================

/**
 * Create a mock PythonAgentClient for testing agent endpoints
 * without making real agent calls
 */
export function createMockAgentClient(): MockAgentClient {
  return {
    chat: jest.fn().mockResolvedValue({
      conversationId: 'conv-test-001',
      response: 'Mock agent response: I can help you with that!',
      suggestions: [],
      metadata: {
        agent: 'navi',
        tokensUsed: 150,
        responseTime: 500,
      },
    }),
    getBriefing: jest.fn().mockResolvedValue({
      summary: 'Today you have 3 tasks to complete.',
      tasks: [
        { id: 'task-001', title: 'Review PR', priority: 'HIGH', dueDate: new Date().toISOString() },
        { id: 'task-002', title: 'Deploy feature', priority: 'MEDIUM', dueDate: new Date().toISOString() },
      ],
      highlights: ['Sprint ends in 2 days', 'One task is overdue'],
      projectHealth: { score: 82, trend: 'STABLE' },
    }),
    generateReport: jest.fn().mockResolvedValue({
      id: 'report-test-001',
      content: 'Mock report content: Sprint Summary...',
      downloadUrl: 'https://example.com/reports/test-001.pdf',
      format: 'PDF',
    }),
    runHealthCheck: jest.fn().mockResolvedValue({
      score: 85,
      level: 'EXCELLENT',
      trend: 'STABLE',
      factors: {
        onTimeDelivery: 0.9,
        taskCompletion: 0.85,
        blockerImpact: 0.95,
      },
      suggestions: ['Consider breaking down large tasks'],
    }),
    estimateTask: jest.fn().mockResolvedValue({
      storyPoints: 5,
      estimatedHours: 8,
      confidenceLevel: 'medium',
      confidenceScore: 0.75,
      basis: 'Based on similar tasks in this project',
      coldStart: false,
      similarTasks: ['task-prev-001', 'task-prev-002'],
      complexityFactors: ['API integration', 'Database migration'],
    }),
  };
}

/**
 * Create mock Prisma service for unit tests
 * Returns a mock object with common Prisma methods
 */
export function createMockPrisma(): any {
  const mock: any = {
    workspace: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    phase: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    agentSuggestion: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    report: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    healthScore: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    riskEntry: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    userPreference: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversationMessage: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };

  // Make $transaction call the callback directly with the mock
  mock.$transaction.mockImplementation((callback: any) => {
    if (typeof callback === 'function') {
      return callback(mock);
    }
    return Promise.all(callback);
  });

  return mock;
}

// ============================================
// Test Data Seeders
// ============================================

/**
 * Generate unique test IDs with consistent prefix
 */
export function testId(type: string, index = 1): string {
  return `test-${type}-${String(index).padStart(3, '0')}`;
}

/**
 * Create test data context for unit/integration tests using mocks
 * Returns test data IDs without actually calling Prisma (for use with mocked Prisma)
 */
export function createTestData(): TestData {
  return {
    workspaceId: testId('workspace'),
    projectId: testId('project'),
    phaseId: testId('phase'),
    taskIds: [testId('task', 1), testId('task', 2), testId('task', 3)],
    userId: testId('user'),
  };
}

/**
 * Seed test data for integration tests (for real database tests)
 * Creates workspace, project, phases, and tasks with consistent IDs
 * @deprecated Use createTestData() with mocked Prisma instead
 */
export async function seedTestData(_prisma: PrismaService): Promise<TestData> {
  // For mock-based tests, just return the test data context
  // Real database seeding would be done in beforeAll with actual Prisma calls
  return createTestData();
}

/**
 * Clean up all test data created by seedTestData
 * For mock-based tests, this is a no-op
 * @deprecated Use mocked Prisma which doesn't persist data
 */
export async function cleanupTestData(_prisma: PrismaService): Promise<void> {
  // No-op for mock-based tests
  // Real database cleanup would deleteMany with test- prefix filters
}

// ============================================
// Suggestion Factory
// ============================================

export interface SuggestionOptions {
  type?: string;
  confidence?: number;
  expiresInHours?: number;
  status?: string;
}

/**
 * Create a test suggestion mock object (for use with mocked Prisma)
 * Returns a suggestion-like object without actual database calls
 */
export function createTestSuggestion(
  _testData: TestData,
  _options: SuggestionOptions = {},
): { id: string } {
  const id = testId('suggestion', Date.now() % 1000);
  return { id };
}

/**
 * Create mock suggestion data for testing
 */
export function mockSuggestionData(
  testData: TestData,
  options: SuggestionOptions = {},
) {
  const expiresInHours = options.expiresInHours ?? 24;
  return {
    id: testId('suggestion', Date.now() % 1000),
    workspaceId: testData.workspaceId,
    projectId: testData.projectId,
    userId: testData.userId,
    type: options.type ?? 'TASK_COMPLETE',
    title: 'Test Suggestion',
    description: 'This is a test suggestion from the integration tests',
    confidence: options.confidence ?? 0.85,
    payload: { taskId: testData.taskIds[0] },
    expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    status: options.status ?? 'PENDING',
    agentName: 'navi',
  };
}

/**
 * Create an expired test suggestion mock
 */
export function createExpiredSuggestion(testData: TestData): { id: string } {
  return createTestSuggestion(testData, { expiresInHours: -1 });
}

// ============================================
// Report Factory
// ============================================

/**
 * Create test report IDs (for use with mocked Prisma)
 */
export function createTestReports(count = 3): string[] {
  const reportIds: string[] = [];
  for (let i = 0; i < count; i++) {
    reportIds.push(testId('report', i + 1));
  }
  return reportIds;
}

/**
 * Create mock report data for testing
 */
export function mockReportData(testData: TestData, index = 1) {
  const types = ['PROJECT_STATUS', 'HEALTH_REPORT', 'PROGRESS_REPORT'];
  return {
    id: testId('report', index),
    workspaceId: testData.workspaceId,
    projectId: testData.projectId,
    type: types[(index - 1) % types.length],
    title: `Test Report ${index}`,
    content: { summary: `Test report content ${index}` },
    generatedBy: testData.userId,
    generatedAt: new Date(),
    format: 'MARKDOWN',
  };
}

// ============================================
// Authentication Helpers
// ============================================

/**
 * Create a mock authentication context for tests
 * Returns mock user and workspace data
 */
export function mockAuthContext(testData: TestData) {
  return {
    user: {
      id: testData.userId,
      sub: testData.userId,
      email: 'test@example.com',
      name: 'Test User',
    },
    workspace: {
      id: testData.workspaceId,
    },
  };
}

/**
 * Create a mock JWT token for integration tests
 * Note: In real integration tests, you'd generate an actual JWT
 */
export function createTestAuthToken(userId: string, workspaceId: string): string {
  // For integration tests with real auth, you'd use:
  // return jwtService.sign({ sub: userId, workspaceId });
  // For now, return a mock token format
  return `test-token-${userId}-${workspaceId}`;
}

// ============================================
// Request Helpers
// ============================================

/**
 * Create request headers with authentication
 */
export function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create request headers with workspace context
 */
export function workspaceHeaders(
  token: string,
  workspaceId: string,
): Record<string, string> {
  return {
    ...authHeaders(token),
    'X-Workspace-Id': workspaceId,
  };
}

// ============================================
// Assertion Helpers
// ============================================

/**
 * Assert that a response has the expected pagination structure
 */
export function expectPaginatedResponse(response: any) {
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('meta');
  expect(response.body.meta).toHaveProperty('total');
  expect(response.body.meta).toHaveProperty('page');
  expect(response.body.meta).toHaveProperty('limit');
  expect(Array.isArray(response.body.data)).toBe(true);
}

/**
 * Assert that a response matches the suggestion structure
 */
export function expectSuggestionStructure(suggestion: any) {
  expect(suggestion).toHaveProperty('id');
  expect(suggestion).toHaveProperty('type');
  expect(suggestion).toHaveProperty('title');
  expect(suggestion).toHaveProperty('confidence');
  expect(suggestion).toHaveProperty('status');
}

/**
 * Assert that a response matches the health score structure
 */
export function expectHealthScoreStructure(healthScore: any) {
  expect(healthScore).toHaveProperty('score');
  expect(healthScore).toHaveProperty('level');
  expect(healthScore).toHaveProperty('trend');
  expect(typeof healthScore.score).toBe('number');
  expect(healthScore.score).toBeGreaterThanOrEqual(0);
  expect(healthScore.score).toBeLessThanOrEqual(100);
}

/**
 * Assert that a response matches the report structure
 */
export function expectReportStructure(report: any) {
  expect(report).toHaveProperty('id');
  expect(report).toHaveProperty('type');
  expect(report).toHaveProperty('title');
  expect(report).toHaveProperty('generatedAt');
}

// ============================================
// Rate Limit Helpers
// ============================================

/**
 * Wait for rate limit window to reset
 * Use between tests that trigger rate limiting
 */
export async function waitForRateLimitReset(ms = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute requests until rate limit is hit
 * Returns the number of successful requests before rate limit
 */
export async function findRateLimitThreshold(
  requestFn: () => Promise<request.Response>,
  maxAttempts = 50,
): Promise<{ successful: number; rateLimited: boolean }> {
  let successful = 0;
  let rateLimited = false;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await requestFn();
    if (response.status === 429) {
      rateLimited = true;
      break;
    }
    if (response.status >= 200 && response.status < 300) {
      successful++;
    }
  }

  return { successful, rateLimited };
}
