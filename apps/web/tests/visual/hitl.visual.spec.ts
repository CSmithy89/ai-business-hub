/**
 * HITL Visual Regression Tests - Story DM-09.5
 *
 * Visual regression testing for Human-in-the-Loop approval components using Percy.
 * Tests approval cards, confidence indicators, and approval queue in various states.
 *
 * @see docs/modules/bm-dm/stories/dm-09-5-visual-regression-tests.md
 * @see apps/web/.percy.yml
 */
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import { mockApprovals } from '../support/fixtures/api-mock.fixture';

/**
 * Approval state configuration for visual testing
 */
interface ApprovalStateConfig {
  name: string;
  description: string;
  approvals: ApprovalData[];
}

/**
 * Mock approval data structure
 */
interface ApprovalData {
  id: string;
  type: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'expired';
  confidence: number;
  createdAt: string;
  module?: string;
  priority?: number;
  aiReasoning?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

// ============================================
// ApprovalCard Status States
// ============================================
const approvalStatusStates: ApprovalStateConfig[] = [
  {
    name: 'approval-pending',
    description: 'ApprovalCard in pending status',
    approvals: [
      {
        id: 'approval-pending-1',
        type: 'content_publish',
        title: 'Blog Post: AI Automation Strategies',
        status: 'pending',
        confidence: 0.75,
        createdAt: new Date().toISOString(),
        module: 'crm',
        priority: 2,
        aiReasoning: 'Content aligns with brand guidelines and passes quality checks.',
      },
    ],
  },
  {
    name: 'approval-approved',
    description: 'ApprovalCard in approved status',
    approvals: [
      {
        id: 'approval-approved-1',
        type: 'email_send',
        title: 'Newsletter Campaign: Q4 Update',
        status: 'approved',
        confidence: 0.85,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        module: 'crm',
        approvedBy: 'admin@example.com',
        approvedAt: new Date().toISOString(),
      },
    ],
  },
  {
    name: 'approval-rejected',
    description: 'ApprovalCard in rejected status',
    approvals: [
      {
        id: 'approval-rejected-1',
        type: 'data_export',
        title: 'Customer Data Export Request',
        status: 'rejected',
        confidence: 0.55,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        module: 'crm',
        rejectedReason: 'Incomplete data validation. Missing required fields.',
      },
    ],
  },
  {
    name: 'approval-auto-approved',
    description: 'ApprovalCard auto-approved by AI',
    approvals: [
      {
        id: 'approval-auto-1',
        type: 'task_complete',
        title: 'Task Status Update: Sprint Planning',
        status: 'auto_approved',
        confidence: 0.95,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        module: 'pm',
        aiReasoning: 'Routine task with high confidence score. Auto-approved per policy.',
      },
    ],
  },
  {
    name: 'approval-expired',
    description: 'ApprovalCard in expired status',
    approvals: [
      {
        id: 'approval-expired-1',
        type: 'contract_review',
        title: 'Vendor Agreement Review',
        status: 'expired',
        confidence: 0.7,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        module: 'branding',
      },
    ],
  },
];

// ============================================
// Confidence Level States
// ============================================
const confidenceLevelStates: ApprovalStateConfig[] = [
  {
    name: 'confidence-high',
    description: 'High confidence (>85%) - Green indicator',
    approvals: [
      {
        id: 'conf-high',
        type: 'content_publish',
        title: 'High Confidence Approval',
        status: 'pending',
        confidence: 0.92,
        createdAt: new Date().toISOString(),
        priority: 1,
        aiReasoning: 'All quality checks passed with high certainty.',
      },
    ],
  },
  {
    name: 'confidence-medium',
    description: 'Medium confidence (60-85%) - Yellow indicator',
    approvals: [
      {
        id: 'conf-medium',
        type: 'email_send',
        title: 'Medium Confidence Approval',
        status: 'pending',
        confidence: 0.72,
        createdAt: new Date().toISOString(),
        priority: 2,
        aiReasoning: 'Content quality acceptable but some improvements suggested.',
      },
    ],
  },
  {
    name: 'confidence-low',
    description: 'Low confidence (<60%) - Red indicator',
    approvals: [
      {
        id: 'conf-low',
        type: 'data_export',
        title: 'Low Confidence Approval',
        status: 'pending',
        confidence: 0.45,
        createdAt: new Date().toISOString(),
        priority: 3,
        aiReasoning: 'Several validation issues detected. Manual review required.',
      },
    ],
  },
];

// ============================================
// Priority States
// ============================================
const priorityStates: ApprovalStateConfig[] = [
  {
    name: 'priority-high',
    description: 'High priority approval',
    approvals: [
      {
        id: 'priority-high',
        type: 'contract_review',
        title: 'Urgent: Client Contract Renewal',
        status: 'pending',
        confidence: 0.78,
        createdAt: new Date().toISOString(),
        priority: 3,
      },
    ],
  },
  {
    name: 'priority-medium',
    description: 'Medium priority approval',
    approvals: [
      {
        id: 'priority-medium',
        type: 'content_publish',
        title: 'Weekly Blog Post Publication',
        status: 'pending',
        confidence: 0.82,
        createdAt: new Date().toISOString(),
        priority: 2,
      },
    ],
  },
  {
    name: 'priority-low',
    description: 'Low priority approval',
    approvals: [
      {
        id: 'priority-low',
        type: 'email_send',
        title: 'Monthly Newsletter Draft',
        status: 'pending',
        confidence: 0.88,
        createdAt: new Date().toISOString(),
        priority: 1,
      },
    ],
  },
];

// ============================================
// Approval Queue States
// ============================================
const queueStates: ApprovalStateConfig[] = [
  {
    name: 'queue-multiple-approvals',
    description: 'Queue with multiple pending approvals',
    approvals: [
      {
        id: 'queue-1',
        type: 'content_publish',
        title: 'Blog Post: AI in Manufacturing',
        status: 'pending',
        confidence: 0.92,
        createdAt: new Date().toISOString(),
        module: 'crm',
        priority: 3,
      },
      {
        id: 'queue-2',
        type: 'email_send',
        title: 'Newsletter: December Edition',
        status: 'pending',
        confidence: 0.72,
        createdAt: new Date(Date.now() - 600000).toISOString(),
        module: 'crm',
        priority: 2,
      },
      {
        id: 'queue-3',
        type: 'data_export',
        title: 'Analytics Report Export',
        status: 'pending',
        confidence: 0.45,
        createdAt: new Date(Date.now() - 1200000).toISOString(),
        module: 'pm',
        priority: 1,
      },
      {
        id: 'queue-4',
        type: 'task_complete',
        title: 'Sprint Retrospective Notes',
        status: 'pending',
        confidence: 0.88,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        module: 'pm',
        priority: 2,
      },
    ],
  },
  {
    name: 'queue-mixed-statuses',
    description: 'Queue with mixed approval statuses',
    approvals: [
      {
        id: 'mixed-1',
        type: 'content_publish',
        title: 'Pending Review',
        status: 'pending',
        confidence: 0.75,
        createdAt: new Date().toISOString(),
        priority: 2,
      },
      {
        id: 'mixed-2',
        type: 'email_send',
        title: 'Recently Approved',
        status: 'approved',
        confidence: 0.85,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        approvedAt: new Date().toISOString(),
      },
      {
        id: 'mixed-3',
        type: 'data_export',
        title: 'Rejected Request',
        status: 'rejected',
        confidence: 0.55,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        rejectedReason: 'Insufficient data quality',
      },
    ],
  },
  {
    name: 'queue-empty',
    description: 'Empty approval queue',
    approvals: [],
  },
];

// ============================================
// Visual Test Suite
// ============================================

test.describe('HITL Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Skip Percy in local runs without PERCY_TOKEN
    if (!process.env.PERCY_TOKEN && !process.env.CI) {
      test.skip(true, 'PERCY_TOKEN not set - skipping visual tests');
    }

    // Mock agent health endpoints
    await page.route('**/health**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      });
    });
  });

  // ============================================
  // ApprovalCard Status Tests
  // ============================================
  test.describe('ApprovalCard Status States', () => {
    for (const state of approvalStatusStates) {
      test(`${state.name}: ${state.description}`, async ({ page }) => {
        await mockApprovals(page, state.approvals);
        await page.goto('/approvals');
        await page.waitForLoadState('networkidle');

        // Wait for approval header to render
        const header = page.locator('[data-testid="approvals-header"]');
        await expect(header).toBeVisible({ timeout: 15000 });

        await percySnapshot(page, `HITL: ${state.name}`);
      });
    }
  });

  // ============================================
  // Confidence Level Tests
  // ============================================
  test.describe('ConfidenceIndicator States', () => {
    for (const state of confidenceLevelStates) {
      test(`${state.name}: ${state.description}`, async ({ page }) => {
        await mockApprovals(page, state.approvals);
        await page.goto('/approvals');
        await page.waitForLoadState('networkidle');

        const header = page.locator('[data-testid="approvals-header"]');
        await expect(header).toBeVisible({ timeout: 15000 });

        await percySnapshot(page, `HITL: ${state.name}`);
      });
    }
  });

  // ============================================
  // Priority Level Tests
  // ============================================
  test.describe('Priority States', () => {
    for (const state of priorityStates) {
      test(`${state.name}: ${state.description}`, async ({ page }) => {
        await mockApprovals(page, state.approvals);
        await page.goto('/approvals');
        await page.waitForLoadState('networkidle');

        const header = page.locator('[data-testid="approvals-header"]');
        await expect(header).toBeVisible({ timeout: 15000 });

        await percySnapshot(page, `HITL: ${state.name}`);
      });
    }
  });

  // ============================================
  // Approval Queue View Tests
  // ============================================
  test.describe('Approval Queue Views', () => {
    for (const state of queueStates) {
      test(`${state.name}: ${state.description}`, async ({ page }) => {
        await mockApprovals(page, state.approvals);
        await page.goto('/approvals');
        await page.waitForLoadState('networkidle');

        // For empty state, wait for either list or empty message
        const header = page.locator('[data-testid="approvals-header"]');
        await expect(header).toBeVisible({ timeout: 15000 });

        await percySnapshot(page, `HITL: ${state.name}`);
      });
    }
  });

  // ============================================
  // Expanded Card State Tests
  // ============================================
  test.describe('Expanded Card States', () => {
    test('approval-card-expanded: Expanded card with details', async ({ page }) => {
      await mockApprovals(page, [
        {
          id: 'expanded-test',
          type: 'content_publish',
          title: 'Blog Post: Automation Best Practices',
          status: 'pending',
          confidence: 0.78,
          createdAt: new Date().toISOString(),
          priority: 2,
          aiReasoning: 'Content quality is good. Minor improvements suggested for SEO.',
        },
      ]);

      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Wait for card to be visible and click to expand
      const card = page.locator('[data-testid="approval-card-expanded-test"]');
      const cardVisible = await card.isVisible().catch(() => false);

      if (cardVisible) {
        await card.click();
        await page.waitForTimeout(500); // Wait for expansion animation
      }

      await percySnapshot(page, 'HITL: approval-card-expanded');
    });

    test('approval-card-with-ai-reasoning: Card showing AI reasoning', async ({ page }) => {
      await mockApprovals(page, [
        {
          id: 'reasoning-test',
          type: 'email_send',
          title: 'Newsletter with AI Analysis',
          status: 'pending',
          confidence: 0.82,
          createdAt: new Date().toISOString(),
          aiReasoning:
            'Email content aligns with brand voice. Subject line is compelling. ' +
            'Call-to-action is clear. Recommended for immediate approval.',
        },
      ]);

      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Click card to show details with AI reasoning
      const card = page.locator('[data-testid="approval-card-reasoning-test"]');
      const cardVisible = await card.isVisible().catch(() => false);

      if (cardVisible) {
        await card.click();
        await page.waitForTimeout(500);
      }

      await percySnapshot(page, 'HITL: approval-with-ai-reasoning');
    });
  });

  // ============================================
  // Bulk Selection Mode Tests
  // ============================================
  test.describe('Bulk Selection Mode', () => {
    test('bulk-mode-active: Bulk selection mode with checkboxes', async ({ page }) => {
      await mockApprovals(page, [
        {
          id: 'bulk-1',
          type: 'content_publish',
          title: 'Content Item 1',
          status: 'pending',
          confidence: 0.85,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'bulk-2',
          type: 'email_send',
          title: 'Email Item 2',
          status: 'pending',
          confidence: 0.78,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'bulk-3',
          type: 'data_export',
          title: 'Export Item 3',
          status: 'pending',
          confidence: 0.65,
          createdAt: new Date().toISOString(),
        },
      ]);

      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Try to enable bulk mode
      const bulkToggle = page.locator('[data-testid="bulk-mode-toggle"]');
      const toggleVisible = await bulkToggle.isVisible().catch(() => false);

      if (toggleVisible) {
        await bulkToggle.click();
        await page.waitForTimeout(300);
      }

      await percySnapshot(page, 'HITL: bulk-mode-active');
    });

    test('bulk-mode-selected: Bulk mode with items selected', async ({ page }) => {
      await mockApprovals(page, [
        {
          id: 'select-1',
          type: 'content_publish',
          title: 'Selected Item 1',
          status: 'pending',
          confidence: 0.85,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'select-2',
          type: 'email_send',
          title: 'Selected Item 2',
          status: 'pending',
          confidence: 0.78,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'select-3',
          type: 'data_export',
          title: 'Not Selected Item',
          status: 'pending',
          confidence: 0.65,
          createdAt: new Date().toISOString(),
        },
      ]);

      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');

      // Enable bulk mode and select items
      const bulkToggle = page.locator('[data-testid="bulk-mode-toggle"]');
      const toggleVisible = await bulkToggle.isVisible().catch(() => false);

      if (toggleVisible) {
        await bulkToggle.click();
        await page.waitForTimeout(200);

        // Select first two checkboxes
        const checkbox1 = page.locator('[data-testid="approval-checkbox-select-1"]');
        const checkbox2 = page.locator('[data-testid="approval-checkbox-select-2"]');

        if (await checkbox1.isVisible()) {
          await checkbox1.click();
        }
        if (await checkbox2.isVisible()) {
          await checkbox2.click();
        }

        await page.waitForTimeout(200);
      }

      await percySnapshot(page, 'HITL: bulk-mode-selected');
    });
  });

  // ============================================
  // Filter States
  // ============================================
  test.describe('Filter States', () => {
    test('filter-by-status-pending: Filtered to pending only', async ({ page }) => {
      await mockApprovals(page, [
        {
          id: 'filter-1',
          type: 'content_publish',
          title: 'Pending Item',
          status: 'pending',
          confidence: 0.85,
          createdAt: new Date().toISOString(),
        },
      ]);

      await page.goto('/approvals?status=pending');
      await page.waitForLoadState('networkidle');

      const header = page.locator('[data-testid="approvals-header"]');
      await expect(header).toBeVisible({ timeout: 15000 });

      await percySnapshot(page, 'HITL: filter-by-status-pending');
    });

    test('filter-by-module-crm: Filtered by CRM module', async ({ page }) => {
      await mockApprovals(page, [
        {
          id: 'crm-1',
          type: 'email_send',
          title: 'CRM Email Campaign',
          status: 'pending',
          confidence: 0.78,
          createdAt: new Date().toISOString(),
          module: 'crm',
        },
        {
          id: 'crm-2',
          type: 'content_publish',
          title: 'CRM Content Publication',
          status: 'pending',
          confidence: 0.82,
          createdAt: new Date().toISOString(),
          module: 'crm',
        },
      ]);

      await page.goto('/approvals?module=crm');
      await page.waitForLoadState('networkidle');

      const header = page.locator('[data-testid="approvals-header"]');
      await expect(header).toBeVisible({ timeout: 15000 });

      await percySnapshot(page, 'HITL: filter-by-module-crm');
    });
  });

  // ============================================
  // Loading State
  // ============================================
  test.describe('Loading States', () => {
    test('approvals-loading: Loading state', async ({ page }) => {
      // Mock slow response to capture loading state
      await page.route('**/api/approvals**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ approvals: [], total: 0 }),
        });
      });

      await page.goto('/approvals');
      await page.waitForLoadState('domcontentloaded');

      // Capture immediately for loading state
      await percySnapshot(page, 'HITL: approvals-loading', {
        widths: [1280],
      });
    });
  });

  // ============================================
  // Error State
  // ============================================
  test.describe('Error States', () => {
    test('approvals-api-error: API error state', async ({ page }) => {
      await page.route('**/api/approvals**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to load approvals' }),
        });
      });

      await page.goto('/approvals');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await percySnapshot(page, 'HITL: approvals-api-error');
    });
  });
});
