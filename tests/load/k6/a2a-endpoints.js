/**
 * A2A Endpoints Load Test
 *
 * Tests A2A protocol endpoints under load conditions:
 * - Discovery endpoints (agent.json, agents listing)
 * - Dashboard Gateway RPC
 * - Navi PM Agent RPC
 * - Pulse (Vitals) Agent RPC
 * - Herald Agent RPC
 *
 * Stages: Ramp up -> Steady (50 VUs) -> Spike (100 VUs) -> Recovery -> Ramp down
 *
 * @see docs/modules/bm-dm/stories/dm-09-6-load-testing-infrastructure.md
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

import {
  BASE_URL,
  defaultThresholds,
  publicHeaders,
  a2aHeaders,
  a2aStages,
  a2aErrorRate,
  a2aDuration,
  a2aDiscoveryDuration,
  successfulRequests,
  failedRequests,
  buildA2ARequest,
  isSuccess,
  isA2ASuccess,
  randomSleep,
  ENVIRONMENT,
  WORKSPACE_ID,
} from './config.js';

// ============================================
// TEST OPTIONS
// ============================================

export const options = {
  stages: a2aStages,
  thresholds: {
    ...defaultThresholds,
    // Additional A2A-specific thresholds
    a2a_discovery_duration: ['p(95)<200', 'p(99)<500'],
    'http_req_duration{endpoint:discovery}': ['p(95)<200'],
    'http_req_duration{endpoint:rpc}': ['p(95)<500'],
  },
  tags: {
    test: 'a2a-endpoints',
    environment: ENVIRONMENT,
    workspace: WORKSPACE_ID,
  },
};

// ============================================
// A2A ENDPOINTS
// ============================================

const ENDPOINTS = {
  // Discovery endpoints (public, no auth required)
  discovery: {
    global: '/.well-known/agent.json',
    agents: '/.well-known/agents',
    dashboard: '/a2a/dashboard_gateway/.well-known/agent.json',
    navi: '/a2a/navi/.well-known/agent.json',
    pulse: '/a2a/pulse/.well-known/agent.json',
    herald: '/a2a/herald/.well-known/agent.json',
  },
  // RPC endpoints (require authentication)
  rpc: {
    dashboard: '/a2a/dashboard/rpc',
    navi: '/a2a/navi/rpc',
    pulse: '/a2a/pulse/rpc',
    herald: '/a2a/herald/rpc',
  },
};

// ============================================
// TEST SCENARIOS
// ============================================

/**
 * Test discovery endpoints (no auth required)
 */
function testDiscoveryEndpoints() {
  group('A2A Discovery Endpoints', () => {
    // Global agent.json
    const globalStart = Date.now();
    const globalRes = http.get(`${BASE_URL}${ENDPOINTS.discovery.global}`, {
      headers: publicHeaders,
      tags: { endpoint: 'discovery', agent: 'global' },
    });
    const globalDuration = Date.now() - globalStart;

    check(globalRes, {
      'global discovery: status 200': (r) => r.status === 200,
      'global discovery: has agents': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.agents && Array.isArray(body.agents);
        } catch {
          return false;
        }
      },
    });

    a2aDiscoveryDuration.add(globalDuration);
    if (isSuccess(globalRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
      a2aErrorRate.add(true);
    }

    sleep(randomSleep(100, 300));

    // Multi-agent listing
    const agentsStart = Date.now();
    const agentsRes = http.get(`${BASE_URL}${ENDPOINTS.discovery.agents}`, {
      headers: publicHeaders,
      tags: { endpoint: 'discovery', agent: 'listing' },
    });
    const agentsDuration = Date.now() - agentsStart;

    check(agentsRes, {
      'agents listing: status 200': (r) => r.status === 200,
      'agents listing: has endpoints': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.agents && body.agents.length > 0;
        } catch {
          return false;
        }
      },
    });

    a2aDiscoveryDuration.add(agentsDuration);
    if (isSuccess(agentsRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
      a2aErrorRate.add(true);
    }

    sleep(randomSleep(100, 300));

    // Individual agent discovery (sample: dashboard gateway)
    const dashboardStart = Date.now();
    const dashboardRes = http.get(`${BASE_URL}${ENDPOINTS.discovery.dashboard}`, {
      headers: publicHeaders,
      tags: { endpoint: 'discovery', agent: 'dashboard' },
    });
    const dashboardDuration = Date.now() - dashboardStart;

    check(dashboardRes, {
      'dashboard discovery: status 200': (r) => r.status === 200,
      'dashboard discovery: has capabilities': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.name && body.capabilities;
        } catch {
          return false;
        }
      },
    });

    a2aDiscoveryDuration.add(dashboardDuration);
    if (isSuccess(dashboardRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
      a2aErrorRate.add(true);
    }
  });
}

/**
 * Test Dashboard Gateway RPC endpoint
 */
function testDashboardRPC() {
  group('Dashboard Gateway RPC', () => {
    // Health check
    const healthPayload = buildA2ARequest('health', {});
    const healthStart = Date.now();
    const healthRes = http.post(`${BASE_URL}${ENDPOINTS.rpc.dashboard}`, healthPayload, {
      headers: a2aHeaders,
      tags: { endpoint: 'rpc', agent: 'dashboard', method: 'health' },
    });
    const healthDuration = Date.now() - healthStart;

    check(healthRes, {
      'dashboard health: status 200': (r) => r.status === 200,
      'dashboard health: valid response': (r) => isA2ASuccess(r),
    });

    a2aDuration.add(healthDuration);
    if (isA2ASuccess(healthRes)) {
      successfulRequests.add(1);
      a2aErrorRate.add(false);
    } else {
      failedRequests.add(1);
      a2aErrorRate.add(true);
    }

    sleep(randomSleep(200, 500));

    // Capabilities check
    const capsPayload = buildA2ARequest('capabilities', {});
    const capsStart = Date.now();
    const capsRes = http.post(`${BASE_URL}${ENDPOINTS.rpc.dashboard}`, capsPayload, {
      headers: a2aHeaders,
      tags: { endpoint: 'rpc', agent: 'dashboard', method: 'capabilities' },
    });
    const capsDuration = Date.now() - capsStart;

    check(capsRes, {
      'dashboard capabilities: status 200': (r) => r.status === 200,
      'dashboard capabilities: valid response': (r) => isA2ASuccess(r),
    });

    a2aDuration.add(capsDuration);
    if (isA2ASuccess(capsRes)) {
      successfulRequests.add(1);
      a2aErrorRate.add(false);
    } else {
      failedRequests.add(1);
      a2aErrorRate.add(true);
    }

    sleep(randomSleep(200, 500));

    // Run task (simple query)
    const runPayload = buildA2ARequest('run', {
      task: 'Get dashboard status',
      context: { caller_id: 'load-test' },
    });
    const runStart = Date.now();
    const runRes = http.post(`${BASE_URL}${ENDPOINTS.rpc.dashboard}`, runPayload, {
      headers: a2aHeaders,
      tags: { endpoint: 'rpc', agent: 'dashboard', method: 'run' },
      timeout: '30s', // Longer timeout for task execution
    });
    const runDuration = Date.now() - runStart;

    check(runRes, {
      'dashboard run: status 200': (r) => r.status === 200,
      'dashboard run: valid response': (r) => isA2ASuccess(r),
    });

    a2aDuration.add(runDuration);
    if (isA2ASuccess(runRes)) {
      successfulRequests.add(1);
      a2aErrorRate.add(false);
    } else {
      failedRequests.add(1);
      a2aErrorRate.add(true);
    }
  });
}

/**
 * Test Navi PM Agent RPC endpoint
 */
function testNaviRPC() {
  group('Navi PM Agent RPC', () => {
    // Health check
    const healthPayload = buildA2ARequest('health', {});
    const healthStart = Date.now();
    const healthRes = http.post(`${BASE_URL}${ENDPOINTS.rpc.navi}`, healthPayload, {
      headers: a2aHeaders,
      tags: { endpoint: 'rpc', agent: 'navi', method: 'health' },
    });
    const healthDuration = Date.now() - healthStart;

    check(healthRes, {
      'navi health: status 200': (r) => r.status === 200,
      'navi health: valid response': (r) => isA2ASuccess(r),
    });

    a2aDuration.add(healthDuration);
    if (isA2ASuccess(healthRes)) {
      successfulRequests.add(1);
      a2aErrorRate.add(false);
    } else {
      failedRequests.add(1);
      a2aErrorRate.add(true);
    }

    sleep(randomSleep(200, 500));

    // Capabilities check
    const capsPayload = buildA2ARequest('capabilities', {});
    const capsStart = Date.now();
    const capsRes = http.post(`${BASE_URL}${ENDPOINTS.rpc.navi}`, capsPayload, {
      headers: a2aHeaders,
      tags: { endpoint: 'rpc', agent: 'navi', method: 'capabilities' },
    });
    const capsDuration = Date.now() - capsStart;

    check(capsRes, {
      'navi capabilities: status 200': (r) => r.status === 200,
      'navi capabilities: valid response': (r) => isA2ASuccess(r),
    });

    a2aDuration.add(capsDuration);
    if (isA2ASuccess(capsRes)) {
      successfulRequests.add(1);
      a2aErrorRate.add(false);
    } else {
      failedRequests.add(1);
      a2aErrorRate.add(true);
    }
  });
}

/**
 * Test Pulse (Vitals) Agent RPC endpoint
 */
function testPulseRPC() {
  group('Pulse Agent RPC', () => {
    // Health check
    const healthPayload = buildA2ARequest('health', {});
    const healthStart = Date.now();
    const healthRes = http.post(`${BASE_URL}${ENDPOINTS.rpc.pulse}`, healthPayload, {
      headers: a2aHeaders,
      tags: { endpoint: 'rpc', agent: 'pulse', method: 'health' },
    });
    const healthDuration = Date.now() - healthStart;

    check(healthRes, {
      'pulse health: status 200': (r) => r.status === 200,
      'pulse health: valid response': (r) => isA2ASuccess(r),
    });

    a2aDuration.add(healthDuration);
    if (isA2ASuccess(healthRes)) {
      successfulRequests.add(1);
      a2aErrorRate.add(false);
    } else {
      failedRequests.add(1);
      a2aErrorRate.add(true);
    }
  });
}

/**
 * Test Herald Agent RPC endpoint
 */
function testHeraldRPC() {
  group('Herald Agent RPC', () => {
    // Health check
    const healthPayload = buildA2ARequest('health', {});
    const healthStart = Date.now();
    const healthRes = http.post(`${BASE_URL}${ENDPOINTS.rpc.herald}`, healthPayload, {
      headers: a2aHeaders,
      tags: { endpoint: 'rpc', agent: 'herald', method: 'health' },
    });
    const healthDuration = Date.now() - healthStart;

    check(healthRes, {
      'herald health: status 200': (r) => r.status === 200,
      'herald health: valid response': (r) => isA2ASuccess(r),
    });

    a2aDuration.add(healthDuration);
    if (isA2ASuccess(healthRes)) {
      successfulRequests.add(1);
      a2aErrorRate.add(false);
    } else {
      failedRequests.add(1);
      a2aErrorRate.add(true);
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
  // Test discovery endpoints (public)
  testDiscoveryEndpoints();

  // Small pause between test groups
  sleep(randomSleep(500, 1000));

  // Test RPC endpoints (authenticated)
  // Randomly select which agent to test to distribute load
  const agentTests = [testDashboardRPC, testNaviRPC, testPulseRPC, testHeraldRPC];
  const selectedTest = agentTests[Math.floor(Math.random() * agentTests.length)];
  selectedTest();

  // Pause between iterations
  sleep(randomSleep(1000, 2000));
}

// ============================================
// LIFECYCLE HOOKS
// ============================================

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log(`A2A Load Test Starting`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Environment: ${ENVIRONMENT}`);
  console.log(`  Workspace: ${WORKSPACE_ID}`);

  // Verify connectivity
  const healthRes = http.get(`${BASE_URL}/health`, { headers: publicHeaders });
  if (healthRes.status !== 200) {
    console.error(`Health check failed: ${healthRes.status}`);
    throw new Error(`Cannot connect to ${BASE_URL}`);
  }

  console.log(`  Health check: OK`);
  return { startTime: Date.now() };
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`A2A Load Test Complete`);
  console.log(`  Duration: ${duration.toFixed(2)}s`);
}

// ============================================
// SUMMARY HANDLER
// ============================================

/**
 * Custom summary handler for results output
 */
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `a2a-endpoints-${timestamp}.json`;

  console.log('');
  console.log('='.repeat(60));
  console.log('A2A ENDPOINTS LOAD TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log('Thresholds:');

  for (const [metric, threshold] of Object.entries(options.thresholds)) {
    const passed = data.metrics[metric] ? !data.metrics[metric].thresholds : true;
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`  ${metric}: ${status}`);
  }

  console.log('');
  console.log('Key Metrics:');
  if (data.metrics.http_req_duration) {
    const p50 = data.metrics.http_req_duration.values['p(50)'] || 0;
    const p95 = data.metrics.http_req_duration.values['p(95)'] || 0;
    const p99 = data.metrics.http_req_duration.values['p(99)'] || 0;
    console.log(`  HTTP Request Duration:`);
    console.log(`    p50: ${p50.toFixed(2)}ms`);
    console.log(`    p95: ${p95.toFixed(2)}ms`);
    console.log(`    p99: ${p99.toFixed(2)}ms`);
  }

  if (data.metrics.a2a_duration) {
    const p50 = data.metrics.a2a_duration.values['p(50)'] || 0;
    const p95 = data.metrics.a2a_duration.values['p(95)'] || 0;
    const p99 = data.metrics.a2a_duration.values['p(99)'] || 0;
    console.log(`  A2A Duration:`);
    console.log(`    p50: ${p50.toFixed(2)}ms`);
    console.log(`    p95: ${p95.toFixed(2)}ms`);
    console.log(`    p99: ${p99.toFixed(2)}ms`);
  }

  if (data.metrics.a2a_errors) {
    const rate = data.metrics.a2a_errors.values.rate || 0;
    console.log(`  A2A Error Rate: ${(rate * 100).toFixed(2)}%`);
  }

  console.log('');
  console.log(`Results saved to: results/${filename}`);
  console.log('='.repeat(60));

  return {
    [`results/${filename}`]: JSON.stringify(data, null, 2),
    stdout: '',
  };
}
