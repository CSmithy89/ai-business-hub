/**
 * K6 Load Testing Configuration
 *
 * Shared configuration for all load tests in the HYVVE platform.
 * Provides base URLs, authentication helpers, thresholds, and custom metrics.
 *
 * @see https://k6.io/docs/
 */

import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

/**
 * Base URL for AgentOS (Python/FastAPI)
 * Override with: k6 run -e BASE_URL=http://staging:7777 script.js
 */
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:7777';

/**
 * Base URL for Next.js web application
 * Override with: k6 run -e WEB_URL=http://staging:3000 script.js
 */
export const WEB_URL = __ENV.WEB_URL || 'http://localhost:3000';

/**
 * Base URL for Claude Code Router (CCR)
 * Override with: k6 run -e CCR_URL=http://ccr:3456 script.js
 */
export const CCR_URL = __ENV.CCR_URL || 'http://localhost:3456';

/**
 * JWT authentication token for protected endpoints
 * Override with: k6 run -e AUTH_TOKEN=<token> script.js
 */
export const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

/**
 * Workspace ID for tenant isolation
 * Override with: k6 run -e WORKSPACE_ID=<id> script.js
 */
export const WORKSPACE_ID = __ENV.WORKSPACE_ID || 'load-test-workspace';

/**
 * Current environment (development, staging, production)
 */
export const ENVIRONMENT = __ENV.ENVIRONMENT || 'development';

// ============================================
// CUSTOM METRICS
// ============================================

/**
 * A2A-specific error rate
 * Tracks failures in A2A protocol operations
 */
export const a2aErrorRate = new Rate('a2a_errors');

/**
 * A2A operation duration
 * Tracks latency of A2A RPC calls
 */
export const a2aDuration = new Trend('a2a_duration', true);

/**
 * A2A discovery latency
 * Tracks latency of agent discovery endpoints
 */
export const a2aDiscoveryDuration = new Trend('a2a_discovery_duration', true);

/**
 * Dashboard widget rendering time
 * Tracks time to fetch and render dashboard widgets
 */
export const dashboardWidgetDuration = new Trend('dashboard_widget_duration', true);

/**
 * CCR routing decision latency
 * Tracks model routing decision time
 */
export const ccrRoutingDuration = new Trend('ccr_routing_duration', true);

/**
 * Successful requests counter
 */
export const successfulRequests = new Counter('successful_requests');

/**
 * Failed requests counter
 */
export const failedRequests = new Counter('failed_requests');

// ============================================
// DEFAULT THRESHOLDS
// ============================================

/**
 * Default performance thresholds for all load tests
 *
 * - http_req_duration p95 < 500ms: 95th percentile response time
 * - http_req_duration p99 < 1000ms: 99th percentile response time
 * - http_req_failed < 1%: Overall error rate
 * - a2a_errors < 1%: A2A-specific error rate
 * - a2a_duration p95 < 500ms: A2A operation latency
 */
export const defaultThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  a2a_errors: ['rate<0.01'],
  a2a_duration: ['p(95)<500'],
};

/**
 * Extended thresholds including dashboard and CCR metrics
 */
export const extendedThresholds = {
  ...defaultThresholds,
  a2a_discovery_duration: ['p(95)<200'],
  dashboard_widget_duration: ['p(95)<800'],
  ccr_routing_duration: ['p(95)<100'],
};

// ============================================
// DEFAULT OPTIONS
// ============================================

/**
 * Default k6 options for all load tests
 */
export const defaultOptions = {
  thresholds: defaultThresholds,
  tags: {
    environment: ENVIRONMENT,
    workspace: WORKSPACE_ID,
  },
  // Disable TLS verification for local development
  insecureSkipTLSVerify: ENVIRONMENT === 'development',
  // User agent for identifying load test traffic
  userAgent: 'HYVVE-LoadTest/1.0',
};

// ============================================
// HTTP HEADERS
// ============================================

/**
 * Default headers for authenticated requests
 */
export const authHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'X-Workspace-Id': WORKSPACE_ID,
  'X-Request-Source': 'load-test',
};

/**
 * Headers for public endpoints (no auth)
 */
export const publicHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'X-Request-Source': 'load-test',
};

/**
 * Headers for A2A JSON-RPC requests
 */
export const a2aHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'X-Workspace-Id': WORKSPACE_ID,
  'X-Request-Source': 'load-test',
  'X-A2A-Protocol': '1.0',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a unique request ID for tracing
 * @returns {string} UUID-like request ID
 */
export function generateRequestId() {
  return `lt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Build A2A JSON-RPC request payload
 * @param {string} method - RPC method (run, health, capabilities)
 * @param {object} params - Method parameters
 * @param {string|number} id - Request ID (optional, auto-generated if not provided)
 * @returns {string} JSON string payload
 */
export function buildA2ARequest(method, params = {}, id = null) {
  return JSON.stringify({
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: id || generateRequestId(),
  });
}

/**
 * Check if response is successful
 * @param {object} response - k6 http response object
 * @returns {boolean} true if successful
 */
export function isSuccess(response) {
  return response.status >= 200 && response.status < 300;
}

/**
 * Check if A2A response is successful (no JSON-RPC error)
 * @param {object} response - k6 http response object
 * @returns {boolean} true if successful A2A response
 */
export function isA2ASuccess(response) {
  if (!isSuccess(response)) {
    return false;
  }
  try {
    const body = JSON.parse(response.body);
    return !body.error;
  } catch {
    return false;
  }
}

/**
 * Record A2A metrics
 * @param {object} response - k6 http response object
 * @param {number} duration - Request duration in milliseconds
 */
export function recordA2AMetrics(response, duration) {
  const success = isA2ASuccess(response);
  a2aErrorRate.add(!success);
  a2aDuration.add(duration);
  if (success) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
  }
}

/**
 * Sleep for a random duration between min and max
 * Simulates human "think time" between actions
 * @param {number} minMs - Minimum sleep time in milliseconds
 * @param {number} maxMs - Maximum sleep time in milliseconds
 */
export function randomSleep(minMs, maxMs) {
  const sleepTime = Math.random() * (maxMs - minMs) + minMs;
  return sleepTime / 1000; // k6 sleep takes seconds
}

// ============================================
// SCENARIO STAGES
// ============================================

/**
 * A2A endpoints load test stages
 * Ramp up -> Steady (50 VUs) -> Spike (100 VUs) -> Recovery -> Ramp down
 */
export const a2aStages = [
  { duration: '30s', target: 20 }, // Ramp up
  { duration: '2m', target: 50 }, // Ramp to steady
  { duration: '2m', target: 50 }, // Steady state
  { duration: '30s', target: 100 }, // Spike
  { duration: '30s', target: 50 }, // Recovery
  { duration: '30s', target: 0 }, // Ramp down
];

/**
 * Dashboard flow load test stages
 * Sustained 30 VUs for realistic user behavior
 */
export const dashboardStages = [
  { duration: '1m', target: 30 }, // Ramp up
  { duration: '3m', target: 30 }, // Steady state
  { duration: '1m', target: 0 }, // Ramp down
];

/**
 * CCR routing load test stages
 * Steady 20 VUs for routing decisions
 */
export const ccrStages = [
  { duration: '30s', target: 20 }, // Ramp up
  { duration: '2m', target: 20 }, // Steady state
  { duration: '30s', target: 0 }, // Ramp down
];

// ============================================
// EXPORTS SUMMARY
// ============================================

export default {
  BASE_URL,
  WEB_URL,
  CCR_URL,
  AUTH_TOKEN,
  WORKSPACE_ID,
  ENVIRONMENT,
  defaultOptions,
  defaultThresholds,
  extendedThresholds,
  authHeaders,
  publicHeaders,
  a2aHeaders,
  a2aStages,
  dashboardStages,
  ccrStages,
  a2aErrorRate,
  a2aDuration,
  a2aDiscoveryDuration,
  dashboardWidgetDuration,
  ccrRoutingDuration,
  successfulRequests,
  failedRequests,
  generateRequestId,
  buildA2ARequest,
  isSuccess,
  isA2ASuccess,
  recordA2AMetrics,
  randomSleep,
};
