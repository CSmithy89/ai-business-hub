/**
 * Dashboard Flow Load Test
 *
 * Simulates realistic user behavior on the dashboard:
 * - Initial page load
 * - Fetching dashboard widgets
 * - Fetching alerts and metrics
 * - Polling for updates
 *
 * Stages: Ramp up (1m) -> Steady (30 VUs, 3m) -> Ramp down (1m)
 *
 * @see docs/modules/bm-dm/stories/dm-09-6-load-testing-infrastructure.md
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';

import {
  BASE_URL,
  WEB_URL,
  defaultThresholds,
  authHeaders,
  publicHeaders,
  dashboardStages,
  dashboardWidgetDuration,
  successfulRequests,
  failedRequests,
  isSuccess,
  randomSleep,
  ENVIRONMENT,
  WORKSPACE_ID,
} from './config.js';

// ============================================
// TEST OPTIONS
// ============================================

export const options = {
  stages: dashboardStages,
  thresholds: {
    ...defaultThresholds,
    // Dashboard-specific thresholds
    dashboard_widget_duration: ['p(95)<800', 'p(99)<1500'],
    'http_req_duration{endpoint:page}': ['p(95)<1000'],
    'http_req_duration{endpoint:widget}': ['p(95)<500'],
    'http_req_duration{endpoint:poll}': ['p(95)<300'],
  },
  tags: {
    test: 'dashboard-flow',
    environment: ENVIRONMENT,
    workspace: WORKSPACE_ID,
  },
};

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

const ENDPOINTS = {
  // AgentOS API endpoints
  agentOS: {
    health: '/health',
    dashboardHealth: '/agents/dashboard/health',
    pmA2AStatus: '/agents/pm/a2a/status',
    agui: '/agui',
    metrics: '/metrics',
  },
  // Web API endpoints (proxied through Next.js)
  web: {
    dashboard: '/dashboard',
    widgets: '/api/dashboard/widgets',
    alerts: '/api/dashboard/alerts',
    metrics: '/api/dashboard/metrics',
    activity: '/api/dashboard/activity',
  },
};

// Widget types for simulation
const WIDGET_TYPES = [
  'ProjectStatus',
  'TaskList',
  'Metrics',
  'Alert',
  'KanbanBoard',
  'GanttChart',
  'BurndownChart',
  'TeamActivity',
];

// ============================================
// TEST SCENARIOS
// ============================================

/**
 * Simulate initial page load
 * User navigates to /dashboard
 */
function simulatePageLoad() {
  group('Page Load', () => {
    // Check AgentOS health first
    const healthStart = Date.now();
    const healthRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.health}`, {
      headers: publicHeaders,
      tags: { endpoint: 'health' },
    });
    const healthDuration = Date.now() - healthStart;

    check(healthRes, {
      'health check: status 200': (r) => r.status === 200,
      'health check: < 100ms': (r) => healthDuration < 100,
    });

    if (isSuccess(healthRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }

    sleep(randomSleep(50, 150));

    // Check dashboard gateway health
    const dashHealthStart = Date.now();
    const dashHealthRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.dashboardHealth}`, {
      headers: authHeaders,
      tags: { endpoint: 'page', type: 'dashboard-health' },
    });
    const dashHealthDuration = Date.now() - dashHealthStart;

    check(dashHealthRes, {
      'dashboard health: status 200': (r) => r.status === 200,
      'dashboard health: has status': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status !== undefined;
        } catch {
          return false;
        }
      },
    });

    dashboardWidgetDuration.add(dashHealthDuration);
    if (isSuccess(dashHealthRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }

    sleep(randomSleep(100, 300));

    // Check PM A2A adapter status
    const pmStatusStart = Date.now();
    const pmStatusRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.pmA2AStatus}`, {
      headers: authHeaders,
      tags: { endpoint: 'page', type: 'pm-status' },
    });
    const pmStatusDuration = Date.now() - pmStatusStart;

    check(pmStatusRes, {
      'PM A2A status: status 200': (r) => r.status === 200,
    });

    dashboardWidgetDuration.add(pmStatusDuration);
    if (isSuccess(pmStatusRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });
}

/**
 * Simulate fetching dashboard widgets
 * Multiple widget requests in parallel (batched)
 */
function simulateWidgetFetch() {
  group('Widget Fetch', () => {
    // Simulate fetching multiple widget configurations
    // In reality, this would be a single API call that returns widget data
    // We'll simulate by making several health/status checks

    const widgetRequests = [];

    // Select random widgets to fetch (3-5 widgets)
    const numWidgets = Math.floor(Math.random() * 3) + 3;
    const selectedWidgets = [];
    for (let i = 0; i < numWidgets; i++) {
      const widget = WIDGET_TYPES[Math.floor(Math.random() * WIDGET_TYPES.length)];
      selectedWidgets.push(widget);
    }

    // Batch request simulation - call dashboard health with widget context
    const batchStart = Date.now();
    const responses = http.batch([
      ['GET', `${BASE_URL}${ENDPOINTS.agentOS.dashboardHealth}`, null, {
        headers: { ...authHeaders, 'X-Widget-Request': 'batch' },
        tags: { endpoint: 'widget', type: 'batch' },
      }],
      ['GET', `${BASE_URL}${ENDPOINTS.agentOS.pmA2AStatus}`, null, {
        headers: authHeaders,
        tags: { endpoint: 'widget', type: 'pm-data' },
      }],
    ]);
    const batchDuration = Date.now() - batchStart;

    // Check batch responses
    let batchSuccess = true;
    for (const res of responses) {
      if (!isSuccess(res)) {
        batchSuccess = false;
        failedRequests.add(1);
      } else {
        successfulRequests.add(1);
      }
    }

    check(responses[0], {
      'widget batch: primary status 200': (r) => r.status === 200,
    });

    dashboardWidgetDuration.add(batchDuration);

    // Simulate individual widget data requests
    for (let i = 0; i < Math.min(2, selectedWidgets.length); i++) {
      sleep(randomSleep(50, 150));

      const widgetStart = Date.now();
      const widgetRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.dashboardHealth}`, {
        headers: { ...authHeaders, 'X-Widget-Type': selectedWidgets[i] },
        tags: { endpoint: 'widget', type: selectedWidgets[i].toLowerCase() },
      });
      const widgetDuration = Date.now() - widgetStart;

      check(widgetRes, {
        [`widget ${selectedWidgets[i]}: status 200`]: (r) => r.status === 200,
      });

      dashboardWidgetDuration.add(widgetDuration);
      if (isSuccess(widgetRes)) {
        successfulRequests.add(1);
      } else {
        failedRequests.add(1);
      }
    }
  });
}

/**
 * Simulate metrics fetch
 * Prometheus metrics endpoint for dashboard graphs
 */
function simulateMetricsFetch() {
  group('Metrics Fetch', () => {
    const metricsStart = Date.now();
    const metricsRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.metrics}`, {
      headers: publicHeaders,
      tags: { endpoint: 'widget', type: 'metrics' },
    });
    const metricsDuration = Date.now() - metricsStart;

    check(metricsRes, {
      'metrics: status 200': (r) => r.status === 200,
      'metrics: prometheus format': (r) => {
        return r.body && r.body.includes('# HELP');
      },
    });

    dashboardWidgetDuration.add(metricsDuration);
    if (isSuccess(metricsRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });
}

/**
 * Simulate polling for updates
 * Dashboard polls for real-time updates every few seconds
 */
function simulatePolling(iterations = 3) {
  group('Polling Updates', () => {
    for (let i = 0; i < iterations; i++) {
      // Wait between polls (simulate polling interval)
      sleep(2);

      const pollStart = Date.now();
      const pollRes = http.get(`${BASE_URL}${ENDPOINTS.agentOS.dashboardHealth}`, {
        headers: { ...authHeaders, 'X-Poll-Request': 'true', 'X-Poll-Iteration': String(i + 1) },
        tags: { endpoint: 'poll', iteration: String(i + 1) },
      });
      const pollDuration = Date.now() - pollStart;

      check(pollRes, {
        [`poll ${i + 1}: status 200`]: (r) => r.status === 200,
        [`poll ${i + 1}: < 300ms`]: (r) => pollDuration < 300,
      });

      dashboardWidgetDuration.add(pollDuration);
      if (isSuccess(pollRes)) {
        successfulRequests.add(1);
      } else {
        failedRequests.add(1);
      }
    }
  });
}

/**
 * Simulate AG-UI streaming request
 * Tests the AG-UI endpoint used by CopilotKit
 */
function simulateAGUIRequest() {
  group('AG-UI Request', () => {
    const aguiPayload = JSON.stringify({
      message: 'Get dashboard summary',
      context: {
        workspaceId: WORKSPACE_ID,
        source: 'load-test',
      },
    });

    const aguiStart = Date.now();
    const aguiRes = http.post(`${BASE_URL}${ENDPOINTS.agentOS.agui}`, aguiPayload, {
      headers: {
        ...authHeaders,
        Accept: 'text/event-stream',
      },
      tags: { endpoint: 'widget', type: 'agui' },
      timeout: '30s',
    });
    const aguiDuration = Date.now() - aguiStart;

    check(aguiRes, {
      'AG-UI: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    });

    dashboardWidgetDuration.add(aguiDuration);
    if (isSuccess(aguiRes)) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });
}

// ============================================
// MAIN TEST FUNCTION
// ============================================

/**
 * Main test function executed by each virtual user (VU)
 * Simulates a complete dashboard user session
 */
export default function () {
  // Step 1: Initial page load
  simulatePageLoad();

  // Think time - user viewing loading state
  sleep(randomSleep(500, 1500));

  // Step 2: Fetch widgets
  simulateWidgetFetch();

  // Think time - user viewing widgets
  sleep(randomSleep(1000, 2000));

  // Step 3: Fetch metrics for graphs
  simulateMetricsFetch();

  // Think time - user analyzing data
  sleep(randomSleep(2000, 4000));

  // Step 4: Poll for updates (3 times with 2s intervals)
  simulatePolling(3);

  // Step 5: Occasional AG-UI request (20% of users)
  if (Math.random() < 0.2) {
    simulateAGUIRequest();
  }

  // End of session - user idle or navigating away
  sleep(randomSleep(1000, 3000));
}

// ============================================
// LIFECYCLE HOOKS
// ============================================

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log(`Dashboard Flow Load Test Starting`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Web URL: ${WEB_URL}`);
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
  console.log(`Dashboard Flow Load Test Complete`);
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
  const filename = `dashboard-flow-${timestamp}.json`;

  console.log('');
  console.log('='.repeat(60));
  console.log('DASHBOARD FLOW LOAD TEST SUMMARY');
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
  if (data.metrics.http_req_duration) {
    const p50 = data.metrics.http_req_duration.values['p(50)'] || 0;
    const p95 = data.metrics.http_req_duration.values['p(95)'] || 0;
    const p99 = data.metrics.http_req_duration.values['p(99)'] || 0;
    console.log(`  HTTP Request Duration:`);
    console.log(`    p50: ${p50.toFixed(2)}ms`);
    console.log(`    p95: ${p95.toFixed(2)}ms`);
    console.log(`    p99: ${p99.toFixed(2)}ms`);
  }

  if (data.metrics.dashboard_widget_duration) {
    const p50 = data.metrics.dashboard_widget_duration.values['p(50)'] || 0;
    const p95 = data.metrics.dashboard_widget_duration.values['p(95)'] || 0;
    const p99 = data.metrics.dashboard_widget_duration.values['p(99)'] || 0;
    console.log(`  Dashboard Widget Duration:`);
    console.log(`    p50: ${p50.toFixed(2)}ms`);
    console.log(`    p95: ${p95.toFixed(2)}ms`);
    console.log(`    p99: ${p99.toFixed(2)}ms`);
  }

  if (data.metrics.successful_requests) {
    console.log(`  Successful Requests: ${data.metrics.successful_requests.values.count || 0}`);
  }
  if (data.metrics.failed_requests) {
    console.log(`  Failed Requests: ${data.metrics.failed_requests.values.count || 0}`);
  }

  console.log('');
  console.log(`Results saved to: results/${filename}`);
  console.log('='.repeat(60));

  return {
    [`results/${filename}`]: JSON.stringify(data, null, 2),
    stdout: '',
  };
}
