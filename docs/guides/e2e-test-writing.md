# E2E Test Writing Guide

How to write end-to-end tests for HYVVE using Playwright.

## Overview

E2E tests verify complete user flows across the stack:
- Frontend (Next.js)
- API (NestJS)
- Agents (AgentOS)
- Database (PostgreSQL)

## Test Structure

```
apps/web/e2e/
├── fixtures/
│   ├── auth.fixture.ts      # Authentication helpers
│   ├── dashboard.fixture.ts  # Dashboard page helpers
│   └── workspace.fixture.ts  # Workspace setup
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── dashboard/
│   │   ├── widgets.spec.ts
│   │   └── hitl-approval.spec.ts
│   └── settings/
│       └── api-keys.spec.ts
└── playwright.config.ts
```

## Writing Tests

### Basic Test

```typescript
// apps/web/e2e/tests/dashboard/widgets.spec.ts
import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../fixtures/dashboard.fixture';

test.describe('Dashboard Widgets', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.loginAndNavigate();
  });

  test('should display project overview widget', async ({ page }) => {
    // Wait for widget to load
    await expect(page.getByTestId('widget-project-overview')).toBeVisible();

    // Verify content
    const title = page.getByTestId('project-title');
    await expect(title).toHaveText(/Test Project/);
  });

  test('should refresh widgets on button click', async ({ page }) => {
    // Click refresh
    await page.getByRole('button', { name: 'Refresh' }).click();

    // Wait for loading state
    await expect(page.getByTestId('widget-loading')).toBeVisible();

    // Wait for completion
    await expect(page.getByTestId('widget-project-overview')).toBeVisible();
  });
});
```

### Page Object Pattern

```typescript
// apps/web/e2e/fixtures/dashboard.fixture.ts
import { Page, expect } from '@playwright/test';
import { AuthFixture } from './auth.fixture';

export class DashboardPage {
  private page: Page;
  private auth: AuthFixture;

  constructor(page: Page) {
    this.page = page;
    this.auth = new AuthFixture(page);
  }

  async loginAndNavigate() {
    await this.auth.loginAsTestUser();
    await this.page.goto('/dashboard');
    await this.waitForWidgets();
  }

  async waitForWidgets() {
    // Wait for at least one widget to render
    await expect(
      this.page.locator('[data-testid^="widget-"]').first()
    ).toBeVisible({ timeout: 10000 });
  }

  async getWidgetCount() {
    return this.page.locator('[data-testid^="widget-"]').count();
  }

  async clickApprove(approvalId: string) {
    await this.page
      .getByTestId(`approval-${approvalId}`)
      .getByRole('button', { name: 'Approve' })
      .click();
  }
}
```

### Testing HITL Approvals

```typescript
// apps/web/e2e/tests/dashboard/hitl-approval.spec.ts
import { test, expect } from '@playwright/test';

test.describe('HITL Approval Flow', () => {
  test('should approve pending action', async ({ page }) => {
    // Navigate to dashboard with pending approval
    await page.goto('/dashboard');

    // Wait for approval card
    const approvalCard = page.getByTestId('approval-card');
    await expect(approvalCard).toBeVisible({ timeout: 5000 });

    // Verify approval details
    await expect(approvalCard.getByText('Create Task')).toBeVisible();
    await expect(approvalCard.getByText(/confidence: \d+%/i)).toBeVisible();

    // Click approve
    await approvalCard.getByRole('button', { name: 'Approve' }).click();

    // Verify approval processed
    await expect(approvalCard).not.toBeVisible();
    await expect(page.getByText('Action approved')).toBeVisible();
  });

  test('should reject pending action', async ({ page }) => {
    await page.goto('/dashboard');

    const approvalCard = page.getByTestId('approval-card');
    await expect(approvalCard).toBeVisible();

    // Click reject
    await approvalCard.getByRole('button', { name: 'Reject' }).click();

    // Verify rejection
    await expect(approvalCard).not.toBeVisible();
    await expect(page.getByText('Action rejected')).toBeVisible();
  });

  test('should handle approval timeout', async ({ page }) => {
    await page.goto('/dashboard');

    const approvalCard = page.getByTestId('approval-card');
    await expect(approvalCard).toBeVisible();

    // Wait for timeout (mocked to 5s in test env)
    await page.waitForTimeout(6000);

    // Verify timeout message
    await expect(approvalCard).not.toBeVisible();
    await expect(page.getByText('Approval expired')).toBeVisible();
  });
});
```

### Testing WebSocket Updates

```typescript
test('should receive real-time widget updates', async ({ page }) => {
  await page.goto('/dashboard');

  // Get initial metrics value
  const metricsWidget = page.getByTestId('widget-metrics');
  const initialValue = await metricsWidget.getByTestId('metric-value').textContent();

  // Trigger update via API (simulating agent push)
  await page.evaluate(async () => {
    await fetch('/api/test/trigger-widget-update', { method: 'POST' });
  });

  // Wait for WebSocket update
  await expect(metricsWidget.getByTestId('metric-value')).not.toHaveText(initialValue);
});
```

## Best Practices

### Use data-testid Attributes

```tsx
// Component
<div data-testid="widget-project-overview">
  <h2 data-testid="project-title">{project.name}</h2>
</div>

// Test
await expect(page.getByTestId('widget-project-overview')).toBeVisible();
```

### Wait for Network Idle

```typescript
await page.goto('/dashboard', { waitUntil: 'networkidle' });
```

### Mock External Services

```typescript
// Mock agent responses
await page.route('**/a2a/**', async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({
      widgets: [{ type: 'metrics', data: { value: 42 } }],
    }),
  });
});
```

### Retry Flaky Assertions

```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    timeout: 5000,
  },
  retries: process.env.CI ? 2 : 0,
});
```

## Running Tests

```bash
# Run all E2E tests
pnpm e2e

# Run specific test file
pnpm e2e tests/dashboard/widgets.spec.ts

# Run with UI
pnpm e2e --ui

# Run headed (see browser)
pnpm e2e --headed

# Debug mode
pnpm e2e --debug
```

## CI Configuration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm playwright install --with-deps
      - run: pnpm e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Related Documentation

- [A2A Troubleshooting](../runbooks/a2a-troubleshooting.md)
- [CopilotKit Patterns](./copilotkit-patterns.md)
