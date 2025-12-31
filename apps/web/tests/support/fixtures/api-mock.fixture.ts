/**
 * API Mock Fixture - HTTP and WebSocket Mocking Utilities
 *
 * Provides utilities for mocking API responses and WebSocket connections
 * in E2E tests. Enables testing of loading states, error handling,
 * and real-time updates without requiring live backend services.
 *
 * @see docs/modules/bm-dm/stories/dm-09-3-e2e-infrastructure.md
 */
import { test as base, Page, Route, Request } from '@playwright/test';

/**
 * Configuration for mocking an HTTP request
 */
export interface MockApiConfig {
  /** URL pattern to match (string or regex) */
  url: string | RegExp;
  /** HTTP method to match (default: all methods) */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Response status code (default: 200) */
  status?: number;
  /** Response body (will be JSON serialized if object) */
  body?: unknown;
  /** Response headers */
  headers?: Record<string, string>;
  /** Delay before responding (ms) - useful for testing loading states */
  delay?: number;
  /** Number of times to use this mock (default: unlimited) */
  times?: number;
}

/**
 * Configuration for mocking WebSocket connections
 */
export interface MockWebSocketConfig {
  /** WebSocket URL pattern to match */
  url: string | RegExp;
  /** Messages to send after connection */
  messages?: WebSocketMessage[];
  /** Whether to automatically accept the connection (default: true) */
  accept?: boolean;
}

/**
 * WebSocket message to send during mock
 */
export interface WebSocketMessage {
  /** Message data (will be JSON serialized if object) */
  data: unknown;
  /** Delay before sending (ms) */
  delay?: number;
}

/**
 * API Mock Fixture
 *
 * Provides methods for mocking HTTP requests and WebSocket connections.
 */
export interface ApiMockFixture {
  /**
   * Mock an HTTP API request
   *
   * @param config - Mock configuration
   * @returns Cleanup function to remove the mock
   *
   * @example
   * ```typescript
   * // Mock a successful response
   * await apiMock.mockApi({
   *   url: '/api/dashboard/widgets',
   *   body: { widgets: [] },
   * });
   *
   * // Mock an error response
   * await apiMock.mockApi({
   *   url: '/api/approvals',
   *   status: 500,
   *   body: { error: 'Internal server error' },
   * });
   *
   * // Mock with delay for loading state testing
   * await apiMock.mockApi({
   *   url: '/api/projects',
   *   body: { projects: [] },
   *   delay: 2000, // 2 second delay
   * });
   * ```
   */
  mockApi: (config: MockApiConfig) => Promise<() => Promise<void>>;

  /**
   * Mock multiple API endpoints at once
   *
   * @param configs - Array of mock configurations
   * @returns Cleanup function to remove all mocks
   */
  mockApis: (configs: MockApiConfig[]) => Promise<() => Promise<void>>;

  /**
   * Mock a WebSocket connection
   *
   * @param config - WebSocket mock configuration
   * @returns Object with methods to control the mock WebSocket
   *
   * @example
   * ```typescript
   * const ws = await apiMock.mockWebSocket({
   *   url: /\/ws\/updates/,
   *   messages: [
   *     { data: { type: 'connected' } },
   *     { data: { type: 'update', payload: {} }, delay: 1000 },
   *   ],
   * });
   *
   * // Send additional messages
   * await ws.send({ type: 'custom', data: {} });
   *
   * // Close the connection
   * await ws.close();
   * ```
   */
  mockWebSocket: (config: MockWebSocketConfig) => Promise<MockWebSocketHandle>;

  /**
   * Wait for a specific API request to be made
   *
   * @param urlPattern - URL pattern to match
   * @param options - Wait options
   */
  waitForRequest: (
    urlPattern: string | RegExp,
    options?: { timeout?: number; method?: string }
  ) => Promise<Request>;

  /**
   * Get all intercepted requests matching a pattern
   *
   * @param urlPattern - URL pattern to match
   */
  getRequests: (urlPattern: string | RegExp) => Request[];

  /**
   * Clear all recorded requests
   */
  clearRequests: () => void;
}

/**
 * Handle for controlling a mock WebSocket connection
 */
export interface MockWebSocketHandle {
  /** Send a message through the mock WebSocket */
  send: (data: unknown) => Promise<void>;
  /** Close the mock WebSocket connection */
  close: (code?: number, reason?: string) => Promise<void>;
  /** Whether the WebSocket is connected */
  isConnected: boolean;
}

/**
 * Create the API mock fixture
 */
export const apiMockFixture = base.extend<{ apiMock: ApiMockFixture }>({
  apiMock: async ({ page }, use) => {
    const interceptedRequests: Request[] = [];
    const activeRoutes: Array<{ pattern: string | RegExp; cleanup: () => Promise<void> }> = [];

    // Track all requests for later inspection
    page.on('request', (request) => {
      interceptedRequests.push(request);
    });

    const mockApi = async (config: MockApiConfig): Promise<() => Promise<void>> => {
      const {
        url,
        method,
        status = 200,
        body,
        headers = {},
        delay = 0,
        times,
      } = config;

      let callCount = 0;

      const handler = async (route: Route) => {
        // Check method if specified
        if (method && route.request().method() !== method) {
          await route.fallback();
          return;
        }

        // Check times limit
        if (times !== undefined && callCount >= times) {
          await route.fallback();
          return;
        }

        callCount++;

        // Apply delay if specified
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Prepare response body
        const responseBody =
          typeof body === 'string' ? body : JSON.stringify(body);

        // Set content-type for JSON
        const responseHeaders: Record<string, string> = {
          'content-type': 'application/json',
          ...headers,
        };

        await route.fulfill({
          status,
          body: responseBody,
          headers: responseHeaders,
        });
      };

      await page.route(url, handler);

      const cleanup = async () => {
        await page.unroute(url, handler);
      };

      activeRoutes.push({ pattern: url, cleanup });
      return cleanup;
    };

    const mockApis = async (
      configs: MockApiConfig[]
    ): Promise<() => Promise<void>> => {
      const cleanups = await Promise.all(configs.map((config) => mockApi(config)));
      return async () => {
        await Promise.all(cleanups.map((cleanup) => cleanup()));
      };
    };

    const mockWebSocket = async (
      _config: MockWebSocketConfig
    ): Promise<MockWebSocketHandle> => {
      // Note: Playwright doesn't have built-in WebSocket mocking
      // This is a placeholder that can be extended with custom solutions
      // For now, we provide a mock handle that tracks state

      let connected = true;

      return {
        send: async (_data: unknown) => {
          if (!connected) {
            throw new Error('WebSocket is not connected');
          }
          // In a real implementation, this would send data through the mock
          // For now, this is a placeholder
        },
        close: async (_code?: number, _reason?: string) => {
          connected = false;
        },
        get isConnected() {
          return connected;
        },
      };
    };

    const waitForRequest = async (
      urlPattern: string | RegExp,
      options: { timeout?: number; method?: string } = {}
    ): Promise<Request> => {
      const { timeout = 30000, method } = options;

      return page.waitForRequest((request) => {
        const urlMatches =
          typeof urlPattern === 'string'
            ? request.url().includes(urlPattern)
            : urlPattern.test(request.url());

        const methodMatches = !method || request.method() === method;

        return urlMatches && methodMatches;
      }, { timeout });
    };

    const getRequests = (urlPattern: string | RegExp): Request[] => {
      return interceptedRequests.filter((request) => {
        if (typeof urlPattern === 'string') {
          return request.url().includes(urlPattern);
        }
        return urlPattern.test(request.url());
      });
    };

    const clearRequests = () => {
      interceptedRequests.length = 0;
    };

    const fixture: ApiMockFixture = {
      mockApi,
      mockApis,
      mockWebSocket,
      waitForRequest,
      getRequests,
      clearRequests,
    };

    await use(fixture);

    // Cleanup all active routes
    for (const route of activeRoutes) {
      await route.cleanup();
    }
  },
});

// Export the test with API mock fixture
export const test = apiMockFixture;
export { expect } from '@playwright/test';

// --------------------------
// Common Mock Response Helpers
// --------------------------

/**
 * Create a mock for dashboard widgets endpoint
 *
 * @param page - Playwright page
 * @param widgets - Widget data to return
 * @param options - Additional options
 */
export async function mockDashboardWidgets(
  page: Page,
  widgets: unknown[],
  options: { delay?: number } = {}
): Promise<() => Promise<void>> {
  const { delay = 0 } = options;

  const handler = async (route: Route) => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ widgets }),
    });
  };

  await page.route('**/api/dashboard/widgets**', handler);

  return async () => {
    await page.unroute('**/api/dashboard/widgets**', handler);
  };
}

/**
 * Create a mock for approvals endpoint
 *
 * @param page - Playwright page
 * @param approvals - Approval data to return
 * @param options - Additional options
 */
export async function mockApprovals(
  page: Page,
  approvals: unknown[],
  options: { delay?: number; total?: number } = {}
): Promise<() => Promise<void>> {
  const { delay = 0, total } = options;

  const handler = async (route: Route) => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        approvals,
        total: total ?? approvals.length,
      }),
    });
  };

  await page.route('**/api/approvals**', handler);

  return async () => {
    await page.unroute('**/api/approvals**', handler);
  };
}

/**
 * Create a mock for agent health endpoints
 *
 * @param page - Playwright page
 * @param healthy - Whether agents should appear healthy
 */
export async function mockAgentHealth(
  page: Page,
  healthy = true
): Promise<() => Promise<void>> {
  const status = healthy ? 200 : 503;
  const body = healthy
    ? { status: 'ok', agents: [] }
    : { status: 'error', message: 'Service unavailable' };

  const handler = async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  };

  await page.route('**/health**', handler);
  await page.route('**/.well-known/agent-card.json', handler);

  return async () => {
    await page.unroute('**/health**', handler);
    await page.unroute('**/.well-known/agent-card.json', handler);
  };
}

/**
 * Create a mock that returns an error response
 *
 * @param page - Playwright page
 * @param urlPattern - URL pattern to mock
 * @param statusCode - HTTP status code
 * @param message - Error message
 */
export async function mockError(
  page: Page,
  urlPattern: string | RegExp,
  statusCode = 500,
  message = 'Internal server error'
): Promise<() => Promise<void>> {
  const handler = async (route: Route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: message }),
    });
  };

  await page.route(urlPattern, handler);

  return async () => {
    await page.unroute(urlPattern, handler);
  };
}

/**
 * Create a mock that simulates network failure
 *
 * @param page - Playwright page
 * @param urlPattern - URL pattern to abort
 */
export async function mockNetworkFailure(
  page: Page,
  urlPattern: string | RegExp
): Promise<() => Promise<void>> {
  const handler = async (route: Route) => {
    await route.abort('failed');
  };

  await page.route(urlPattern, handler);

  return async () => {
    await page.unroute(urlPattern, handler);
  };
}

/**
 * Create a mock that simulates slow network
 *
 * @param page - Playwright page
 * @param urlPattern - URL pattern to slow down
 * @param delayMs - Delay in milliseconds
 */
export async function mockSlowNetwork(
  page: Page,
  urlPattern: string | RegExp,
  delayMs = 5000
): Promise<() => Promise<void>> {
  const handler = async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fallback();
  };

  await page.route(urlPattern, handler);

  return async () => {
    await page.unroute(urlPattern, handler);
  };
}
