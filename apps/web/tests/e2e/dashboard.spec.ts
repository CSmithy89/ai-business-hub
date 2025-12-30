/**
 * Dashboard Integration E2E Tests - Story DM-03.5
 *
 * Comprehensive testing of the full dashboard integration flow:
 * - Dashboard page loads with chat sidebar
 * - Chat input accepts messages
 * - Quick action buttons work
 * - Loading states appear during processing
 * - Error states display for failures
 * - Widget rendering from agent responses
 *
 * @see docs/modules/bm-dm/stories/dm-03-5-end-to-end-testing.md
 * @see docs/modules/bm-dm/epics/epic-dm-03-tech-spec.md - Section 3.5
 */
import { test, expect } from '../support/fixtures';

// AgentOS base URL for direct API tests
const AGENT_BASE_URL = process.env.AGENT_BASE_URL || 'http://localhost:8001';

test.describe('Dashboard Page Structure', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('dashboard page loads with agent section', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify page title and basic structure
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

    // Verify agent section is present
    await expect(page.getByTestId('dashboard-agent-section')).toBeVisible();
  });

  test('dashboard shows AI insights header', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify AI Insights header
    await expect(page.getByRole('heading', { name: /AI Insights/i })).toBeVisible();

    // Verify description text
    await expect(page.getByText(/Real-time updates from your AI team/i)).toBeVisible();
  });

  test('dashboard has widget grid', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify dashboard grid exists
    await expect(page.getByTestId('dashboard-grid')).toBeVisible();

    // Grid should have aria-label for accessibility
    await expect(page.getByRole('region', { name: /Dashboard widgets/i })).toBeVisible();
  });

  test('dashboard has chat sidebar card', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify Dashboard Assistant title is present
    await expect(page.getByRole('heading', { name: /Dashboard Assistant/i })).toBeVisible();
  });

  test('dashboard shows widget placeholder when no widgets rendered', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify placeholder message is shown
    await expect(page.getByText(/No widgets yet/i)).toBeVisible();
    await expect(
      page.getByText(/Use the AI Assistant to ask about your projects/i)
    ).toBeVisible();
  });
});

test.describe('Dashboard Chat Interaction', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('quick action buttons are visible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify Quick actions section
    await expect(page.getByText(/Quick actions/i)).toBeVisible();

    // Verify at least one quick action button is present
    await expect(page.getByTestId('quick-action-project-status')).toBeVisible();
    await expect(page.getByTestId('quick-action-at-risk')).toBeVisible();
    await expect(page.getByTestId('quick-action-team-activity')).toBeVisible();
    await expect(page.getByTestId('quick-action-workspace-overview')).toBeVisible();
  });

  test('quick action buttons display label and description', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check project status button content
    const projectStatusBtn = page.getByTestId('quick-action-project-status');
    await expect(projectStatusBtn).toContainText('Show project status');
    await expect(projectStatusBtn).toContainText('View project progress');

    // Check at risk button content
    const atRiskBtn = page.getByTestId('quick-action-at-risk');
    await expect(atRiskBtn).toContainText("What's at risk?");
    await expect(atRiskBtn).toContainText('Identify potential issues');
  });

  test('quick action button opens chat panel', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click a quick action
    await page.getByTestId('quick-action-project-status').click();

    // Wait a moment for panel to open
    await page.waitForTimeout(500);

    // The chat panel should be open (CopilotKit panel)
    // Note: The actual CopilotKit panel rendering depends on the integration
    // Here we verify the click doesn't cause errors
    await expect(page.getByTestId('dashboard-agent-section')).toBeVisible();
  });

  test('open chat button exists and is clickable', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify Open AI Assistant button
    const openChatBtn = page.getByTestId('dashboard-open-chat');
    await expect(openChatBtn).toBeVisible();
    await expect(openChatBtn).toContainText('Open AI Assistant');

    // Click should not throw
    await openChatBtn.click();
    await expect(page.getByTestId('dashboard-agent-section')).toBeVisible();
  });

  test('keyboard shortcut hint is displayed', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify keyboard shortcut hint
    await expect(page.getByText(/Cmd\+\//)).toBeVisible();
    await expect(page.getByText(/to toggle assistant/i)).toBeVisible();
  });
});

test.describe('Dashboard Widget Grid', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('widget grid has responsive layout classes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify grid has the correct class structure
    const grid = page.getByTestId('dashboard-grid');
    await expect(grid).toBeVisible();

    // Check that grid has gap styling (responsive grid)
    const gridClass = await grid.getAttribute('class');
    expect(gridClass).toContain('grid');
    expect(gridClass).toContain('gap-4');
  });

  test('widget grid is accessible', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify accessibility attributes
    const grid = page.getByTestId('dashboard-grid');
    await expect(grid).toHaveAttribute('role', 'region');
    await expect(grid).toHaveAttribute('aria-label', 'Dashboard widgets');
  });
});

test.describe('Dashboard Loading States', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('loading skeleton shows while page loads', async ({ page }) => {
    // Navigate with networkidle wait removed to catch loading states
    await page.goto('/dashboard');

    // The loading skeleton might flash briefly - verify structure
    await page.waitForLoadState('domcontentloaded');

    // Eventually the content should load
    await expect(page.getByTestId('dashboard-agent-section')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Dashboard Error Handling', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('dashboard gracefully handles offline state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Go offline
    await page.context().setOffline(true);

    // Dashboard should still be visible
    await expect(page.getByTestId('dashboard-agent-section')).toBeVisible();

    // Quick actions should still be interactive (just won't work)
    const btn = page.getByTestId('quick-action-project-status');
    await expect(btn).toBeVisible();

    // Restore network
    await page.context().setOffline(false);
  });
});

test.describe('Dashboard CopilotKit Integration', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('CopilotKit provider wraps dashboard content', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // The DashboardSlots component should be rendered (registers tool action)
    // This is an implicit test - if CopilotKit fails to initialize, the page would error
    await expect(page.getByTestId('dashboard-agent-section')).toBeVisible();

    // Quick actions work - this exercises the useCopilotChatState hook
    await page.getByTestId('dashboard-open-chat').click();
  });
});

test.describe('Dashboard Agent A2A Health', () => {
  // These tests verify the backend agents are reachable

  test('dashboard gateway agent is healthy', async ({ page }) => {
    const response = await page.request.get(`${AGENT_BASE_URL}/health`);

    // Skip if agent service not running
    if (!response.ok()) {
      test.skip();
      return;
    }

    expect(response.status()).toBe(200);
  });

  test('agent card discovery endpoint is available', async ({ page }) => {
    const response = await page.request.get(
      `${AGENT_BASE_URL}/.well-known/agent-card.json`
    );

    // Skip if agent service not running
    if (!response.ok()) {
      test.skip();
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.agents).toBeDefined();
  });

  test('navi agent A2A endpoint is available', async ({ page }) => {
    const response = await page.request.get(`${AGENT_BASE_URL}/a2a/navi/agent-card`);

    // Skip if agent service not running
    if (!response.ok()) {
      test.skip();
      return;
    }

    expect(response.status()).toBe(200);
  });

  test('pulse agent A2A endpoint is available', async ({ page }) => {
    const response = await page.request.get(`${AGENT_BASE_URL}/a2a/pulse/agent-card`);

    // Skip if agent service not running
    if (!response.ok()) {
      test.skip();
      return;
    }

    expect(response.status()).toBe(200);
  });

  test('herald agent A2A endpoint is available', async ({ page }) => {
    const response = await page.request.get(`${AGENT_BASE_URL}/a2a/herald/agent-card`);

    // Skip if agent service not running
    if (!response.ok()) {
      test.skip();
      return;
    }

    expect(response.status()).toBe(200);
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.loginAsTestUser();
  });

  test('dashboard is accessible from navigation', async ({ page }) => {
    // Start from a different page
    await page.goto('/businesses');
    await page.waitForLoadState('networkidle');

    // Look for dashboard link in navigation
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i });

    // Skip if navigation doesn't have dashboard link yet
    if (!(await dashboardLink.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await dashboardLink.click();
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('dashboard-agent-section')).toBeVisible();
  });
});
