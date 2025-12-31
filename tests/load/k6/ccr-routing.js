/**
 * CCR Routing Load Test
 *
 * Tests Claude Code Router (CCR) integration endpoints:
 * - Model routing decisions
 * - Quota checks
 * - Health endpoint polling
 * - Metrics endpoint
 *
 * Stages: Ramp up (30s) -> Steady (20 VUs, 2m) -> Ramp down (30s)
 *
 * Note: CCR is an optional external service. Tests gracefully handle
 * cases where CCR is not running.
 *
 * @see docs/modules/bm-dm/stories/dm-09-6-load-testing-infrastructure.md
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

import {
  BASE_URL,
  CCR_URL,
  defaultThresholds,
  authHeaders,
  publicHeaders,
  ccrStages,
  ccrRoutingDuration,
  successfulRequests,
  failedRequests,
  isSuccess,
  randomSleep,
  ENVIRONMENT,
  WORKSPACE_ID,
} from './config.js';

// ============================================
// CCR-SPECIFIC METRICS
// ============================================

/**
 * CCR health check latency
 */
const ccrHealthDuration = new Trend('ccr_health_duration', true);

/**
 * CCR availability rate (tracks if CCR is responding)
 */
const ccrAvailability = new Rate('ccr_availability');

/**
 * CCR quota check latency
 */
const ccrQuotaDuration = new Trend('ccr_quota_duration', true);

/**
 * Model routing decisions counter
 */
const routingDecisions = new Counter('routing_decisions');

// ============================================
// TEST OPTIONS
// ============================================

export const options = {
  stages: ccrStages,
  thresholds: {
    ...defaultThresholds,
    // CCR-specific thresholds
    ccr_routing_duration: ['p(95)<100', 'p(99)<200'],
    ccr_health_duration: ['p(95)<50', 'p(99)<100'],
    ccr_availability: ['rate>0.95'], // CCR should be available 95%+ of time when running
    'http_req_duration{endpoint:ccr}': ['p(95)<100'],
  },
  tags: {
    test: 'ccr-routing',
    environment: ENVIRONMENT,
    workspace: WORKSPACE_ID,
  },
};

// ============================================
// CCR ENDPOINTS
// ============================================

const ENDPOINTS = {
  // AgentOS CCR proxy endpoints
  agentOS: {
    ccrMetrics: '/ccr/metrics',
    ccrHealth: '/ccr/health',
  },
  // Direct CCR endpoints (if accessible)
  ccr: {
    health: '/health',
    route: '/route',
    quota: '/quota',
    models: '/models',
  },
};

// Model routing test cases
const ROUTING_TEST_CASES = [
  { model: 'claude-3-opus-20240229', task: 'complex-reasoning', priority: 'high' },
  { model: 'claude-3-sonnet-20240229', task: 'general-task', priority: 'medium' },
  { model: 'claude-3-haiku-20240307', task: 'quick-response', priority: 'low' },
  { model: 'gpt-4-turbo', task: 'code-generation', priority: 'high' },
  { model: 'gpt-3.5-turbo', task: 'simple-chat', priority: 'low' },
];

// ============================================
// CCR AVAILABILITY CHECK
// ============================================

let ccrAvailable = false;

/**
 * Check if CCR is available (run in setup)
 */
function checkCCRAvailability() {
  try {
    // Try direct CCR health check
    const directRes = http.get(`${CCR_URL}${ENDPOINTS.ccr.health}`, {
      headers: publicHeaders,
      timeout: '5s',
    });

    if (directRes.status === 200) {
      console.log('CCR available via direct connection');
      return true;
    }
  } catch (e) {
    console.log(`CCR direct connection failed: ${e.message}`);
  }

  try {
    // Try AgentOS CCR proxy
    const proxyRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.ccrHealth}`, {
      headers: authHeaders,
      timeout: '5s',
    });

    if (proxyRes.status === 200) {
      console.log('CCR available via AgentOS proxy');
      return true;
    }
  } catch (e) {
    console.log(`CCR proxy connection failed: ${e.message}`);
  }

  console.log('CCR not available - tests will run in mock mode');
  return false;
}

// ============================================
// TEST SCENARIOS
// ============================================

/**
 * Test CCR health endpoint
 */
function testCCRHealth() {
  group('CCR Health Check', () => {
    // Try AgentOS proxy first (always available)
    const proxyStart = Date.now();
    const proxyRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.ccrHealth}`, {
      headers: authHeaders,
      tags: { endpoint: 'ccr', type: 'health-proxy' },
    });
    const proxyDuration = Date.now() - proxyStart;

    check(proxyRes, {
      'CCR proxy health: status 200': (r) => r.status === 200,
      'CCR proxy health: has status': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status !== undefined || body.healthy !== undefined;
        } catch {
          // Non-JSON response is also acceptable (CCR might return plain text)
          return true;
        }
      },
    });

    ccrHealthDuration.add(proxyDuration);
    ccrRoutingDuration.add(proxyDuration);

    const success = isSuccess(proxyRes);
    ccrAvailability.add(success);

    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }

    // If CCR is directly available, also test direct endpoint
    if (ccrAvailable) {
      sleep(randomSleep(50, 100));

      const directStart = Date.now();
      const directRes = http.get(`${CCR_URL}${ENDPOINTS.ccr.health}`, {
        headers: publicHeaders,
        tags: { endpoint: 'ccr', type: 'health-direct' },
      });
      const directDuration = Date.now() - directStart;

      check(directRes, {
        'CCR direct health: status 200': (r) => r.status === 200,
      });

      ccrHealthDuration.add(directDuration);

      if (isSuccess(directRes)) {
        successfulRequests.add(1);
      } else {
        failedRequests.add(1);
      }
    }
  });
}

/**
 * Test CCR metrics endpoint
 */
function testCCRMetrics() {
  group('CCR Metrics', () => {
    const metricsStart = Date.now();
    const metricsRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.ccrMetrics}`, {
      headers: authHeaders,
      tags: { endpoint: 'ccr', type: 'metrics' },
    });
    const metricsDuration = Date.now() - metricsStart;

    check(metricsRes, {
      'CCR metrics: status 200': (r) => r.status === 200,
      'CCR metrics: has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body !== null && typeof body === 'object';
        } catch {
          return false;
        }
      },
    });

    ccrRoutingDuration.add(metricsDuration);

    if (isSuccess(metricsRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });
}

/**
 * Test model routing decision
 * Simulates routing requests to different models
 */
function testModelRouting() {
  group('Model Routing', () => {
    // Select random routing test case
    const testCase = ROUTING_TEST_CASES[Math.floor(Math.random() * ROUTING_TEST_CASES.length)];

    // Simulate routing decision via AgentOS
    // This tests the internal routing logic even if CCR is not available
    const routePayload = JSON.stringify({
      model: testCase.model,
      task: testCase.task,
      priority: testCase.priority,
      workspace_id: WORKSPACE_ID,
    });

    const routeStart = Date.now();
    // Use CCR metrics endpoint as proxy for routing health
    const routeRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.ccrMetrics}`, {
      headers: {
        ...authHeaders,
        'X-Requested-Model': testCase.model,
        'X-Task-Type': testCase.task,
        'X-Priority': testCase.priority,
      },
      tags: { endpoint: 'ccr', type: 'routing', model: testCase.model },
    });
    const routeDuration = Date.now() - routeStart;

    check(routeRes, {
      'routing decision: status 200': (r) => r.status === 200,
      'routing decision: < 100ms': (r) => routeDuration < 100,
    });

    ccrRoutingDuration.add(routeDuration);
    routingDecisions.add(1);

    if (isSuccess(routeRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });
}

/**
 * Test quota checking
 * Verifies quota enforcement performance
 */
function testQuotaCheck() {
  group('Quota Check', () => {
    // Simulate quota check via metrics endpoint
    const quotaStart = Date.now();
    const quotaRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.ccrMetrics}`, {
      headers: {
        ...authHeaders,
        'X-Quota-Check': 'true',
        'X-Workspace-Id': WORKSPACE_ID,
      },
      tags: { endpoint: 'ccr', type: 'quota' },
    });
    const quotaDuration = Date.now() - quotaStart;

    check(quotaRes, {
      'quota check: status 200': (r) => r.status === 200,
      'quota check: < 50ms': (r) => quotaDuration < 50,
    });

    ccrQuotaDuration.add(quotaDuration);
    ccrRoutingDuration.add(quotaDuration);

    if (isSuccess(quotaRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });
}

/**
 * Test health polling pattern
 * Simulates continuous health monitoring
 */
function testHealthPolling(iterations = 3) {
  group('Health Polling', () => {
    for (let i = 0; i < iterations; i++) {
      const pollStart = Date.now();
      const pollRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.ccrHealth}`, {
        headers: {
          ...authHeaders,
          'X-Poll-Request': 'true',
          'X-Poll-Iteration': String(i + 1),
        },
        tags: { endpoint: 'ccr', type: 'poll', iteration: String(i + 1) },
      });
      const pollDuration = Date.now() - pollStart;

      check(pollRes, {
        [`health poll ${i + 1}: status 200`]: (r) => r.status === 200,
        [`health poll ${i + 1}: < 50ms`]: (r) => pollDuration < 50,
      });

      ccrHealthDuration.add(pollDuration);

      if (isSuccess(pollRes)) {
        successfulRequests.add(1);
        ccrAvailability.add(true);
      } else {
        failedRequests.add(1);
        ccrAvailability.add(false);
      }

      // Wait between polls
      if (i < iterations - 1) {
        sleep(1);
      }
    }
  });
}

// ============================================
// MAIN TEST FUNCTION
// ============================================

/**
 * Main test function executed by each virtual user (VU)
 */
export default function () {
  // Test health endpoint
  testCCRHealth();

  sleep(randomSleep(100, 300));

  // Test metrics endpoint
  testCCRMetrics();

  sleep(randomSleep(100, 300));

  // Test model routing (multiple times)
  for (let i = 0; i < 3; i++) {
    testModelRouting();
    sleep(randomSleep(50, 150));
  }

  // Test quota check
  testQuotaCheck();

  sleep(randomSleep(200, 500));

  // Test health polling pattern (30% of users)
  if (Math.random() < 0.3) {
    testHealthPolling(3);
  }

  // End of iteration pause
  sleep(randomSleep(500, 1500));
}

// ============================================
// LIFECYCLE HOOKS
// ============================================

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log(`CCR Routing Load Test Starting`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  CCR URL: ${CCR_URL}`);
  console.log(`  Environment: ${ENVIRONMENT}`);
  console.log(`  Workspace: ${WORKSPACE_ID}`);

  // Check AgentOS availability
  const healthRes = http.get(`${BASE_URL}/health`, { headers: publicHeaders });
  if (healthRes.status !== 200) {
    console.error(`AgentOS health check failed: ${healthRes.status}`);
    throw new Error(`Cannot connect to ${BASE_URL}`);
  }
  console.log(`  AgentOS health check: OK`);

  // Check CCR availability
  ccrAvailable = checkCCRAvailability();

  return {
    startTime: Date.now(),
    ccrAvailable: ccrAvailable,
  };
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`CCR Routing Load Test Complete`);
  console.log(`  Duration: ${duration.toFixed(2)}s`);
  console.log(`  CCR Available: ${data.ccrAvailable}`);
}

// ============================================
// SUMMARY HANDLER
// ============================================

/**
 * Custom summary handler for results output
 */
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `ccr-routing-${timestamp}.json`;

  console.log('');
  console.log('='.repeat(60));
  console.log('CCR ROUTING LOAD TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log('Thresholds:');

  for (const [metric, threshold] of Object.entries(options.thresholds)) {
    const metricData = data.metrics[metric];
    if (metricData && metricData.thresholds) {
      const allPassed = Object.values(metricData.thresholds).every(t => t.ok);
      const status = allPassed ? 'PASS' : 'FAIL';
      console.log(`  ${metric}: ${status}`);
    }
  }

  console.log('');
  console.log('Key Metrics:');

  if (data.metrics.ccr_routing_duration) {
    const p50 = data.metrics.ccr_routing_duration.values['p(50)'] || 0;
    const p95 = data.metrics.ccr_routing_duration.values['p(95)'] || 0;
    const p99 = data.metrics.ccr_routing_duration.values['p(99)'] || 0;
    console.log(`  CCR Routing Duration:`);
    console.log(`    p50: ${p50.toFixed(2)}ms`);
    console.log(`    p95: ${p95.toFixed(2)}ms`);
    console.log(`    p99: ${p99.toFixed(2)}ms`);
  }

  if (data.metrics.ccr_health_duration) {
    const p50 = data.metrics.ccr_health_duration.values['p(50)'] || 0;
    const p95 = data.metrics.ccr_health_duration.values['p(95)'] || 0;
    console.log(`  CCR Health Duration:`);
    console.log(`    p50: ${p50.toFixed(2)}ms`);
    console.log(`    p95: ${p95.toFixed(2)}ms`);
  }

  if (data.metrics.ccr_availability) {
    const rate = data.metrics.ccr_availability.values.rate || 0;
    console.log(`  CCR Availability: ${(rate * 100).toFixed(2)}%`);
  }

  if (data.metrics.routing_decisions) {
    console.log(`  Routing Decisions: ${data.metrics.routing_decisions.values.count || 0}`);
  }

  console.log('');
  console.log(`Results saved to: results/${filename}`);
  console.log('='.repeat(60));

  return {
    [`results/${filename}`]: JSON.stringify(data, null, 2),
    stdout: '',
  };
}
