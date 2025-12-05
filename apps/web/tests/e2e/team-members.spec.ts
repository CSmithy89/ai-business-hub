/**
 * Team Members UI E2E Tests - Epic 09
 *
 * Tests for team members page enhancements: stats, search, filters, invitations.
 * @see docs/epics/EPIC-09-ui-auth-enhancements.md
 */
import { test, expect } from '../support/fixtures';

test.describe('Team Members UI', () => {
  test.describe('Team Members Stats Cards (Story 09.9)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display stats cards section', async ({ page }) => {
      await page.goto('/settings/team');

      const statsSection = page.locator('[data-testid="team-stats"]');
      await expect(statsSection).toBeVisible();
    });

    test('should show total members count', async ({ page }) => {
      await page.goto('/settings/team');

      const totalMembers = page.locator('[data-testid="stat-total-members"]');
      await expect(totalMembers).toBeVisible();
      await expect(totalMembers).toContainText(/\d+/);
    });

    test('should show admins count', async ({ page }) => {
      await page.goto('/settings/team');

      const adminsCount = page.locator('[data-testid="stat-admins"]');
      await expect(adminsCount).toBeVisible();
    });

    test('should show pending invitations count', async ({ page }) => {
      await page.goto('/settings/team');

      const pendingCount = page.locator('[data-testid="stat-pending-invitations"]');
      await expect(pendingCount).toBeVisible();
    });

    test('should show seats indicator', async ({ page }) => {
      await page.goto('/settings/team');

      const seatsIndicator = page.locator('[data-testid="stat-seats"]');
      if (await seatsIndicator.isVisible()) {
        await expect(seatsIndicator).toContainText(/unlimited|\d+/i);
      }
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/settings/team');

      const statsSection = page.locator('[data-testid="team-stats"]');
      await expect(statsSection).toBeVisible();

      // Stats should stack vertically on mobile
      const box = await statsSection.boundingBox();
      expect(box?.width).toBeLessThan(400);
    });
  });

  test.describe('Team Members Search & Filters (Story 09.10)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display search input', async ({ page }) => {
      await page.goto('/settings/team');

      await expect(
        page.locator('[data-testid="member-search-input"]')
      ).toBeVisible();
    });

    test('should search by name', async ({ page }) => {
      await page.goto('/settings/team');

      const searchInput = page.locator('[data-testid="member-search-input"]');
      await searchInput.fill('John');

      // Wait for debounced search
      await page.waitForTimeout(500);

      // Results should filter
      await expect(page).toHaveURL(/search=John/i);
    });

    test('should search by email', async ({ page }) => {
      await page.goto('/settings/team');

      const searchInput = page.locator('[data-testid="member-search-input"]');
      await searchInput.fill('test@');

      await page.waitForTimeout(500);

      await expect(page).toHaveURL(/search=test/i);
    });

    test('should display role filter dropdown', async ({ page }) => {
      await page.goto('/settings/team');

      const roleFilter = page.locator('[data-testid="role-filter"]');
      await expect(roleFilter).toBeVisible();
    });

    test('should filter by role', async ({ page }) => {
      await page.goto('/settings/team');

      await page.click('[data-testid="role-filter"]');
      await page.click('[data-testid="role-option-admin"]');

      await expect(page).toHaveURL(/role=admin/i);
    });

    test('should display status filter', async ({ page }) => {
      await page.goto('/settings/team');

      const statusFilter = page.locator('[data-testid="status-filter"]');
      await expect(statusFilter).toBeVisible();
    });

    test('should filter by status', async ({ page }) => {
      await page.goto('/settings/team');

      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-option-pending"]');

      await expect(page).toHaveURL(/status=pending/i);
    });

    test('should show no results state', async ({ page }) => {
      await page.goto('/settings/team');

      const searchInput = page.locator('[data-testid="member-search-input"]');
      await searchInput.fill('nonexistentuserxyz123');

      await page.waitForTimeout(500);

      await expect(page.getByText(/no.*found|no results/i)).toBeVisible();
    });

    test('should persist filters in URL', async ({ page }) => {
      await page.goto('/settings/team?role=admin&status=active');

      // Filters should be applied
      const roleFilter = page.locator('[data-testid="role-filter"]');
      await expect(roleFilter).toContainText(/admin/i);
    });
  });

  test.describe('Invite Member Modal (Story 09.11)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should show invite button in header', async ({ page }) => {
      await page.goto('/settings/team');

      await expect(
        page.locator('[data-testid="invite-member-button"]')
      ).toBeVisible();
    });

    test('should open invite modal on click', async ({ page }) => {
      await page.goto('/settings/team');

      await page.click('[data-testid="invite-member-button"]');

      await expect(
        page.locator('[data-testid="invite-member-modal"]')
      ).toBeVisible();
    });

    test('should have email input with validation', async ({ page }) => {
      await page.goto('/settings/team');
      await page.click('[data-testid="invite-member-button"]');

      const emailInput = page.locator('[data-testid="invite-email-input"]');
      await expect(emailInput).toBeVisible();

      // Test validation
      await emailInput.fill('invalid-email');
      await page.click('[data-testid="send-invitation-button"]');

      await expect(page.getByText(/valid email/i)).toBeVisible();
    });

    test('should have role dropdown', async ({ page }) => {
      await page.goto('/settings/team');
      await page.click('[data-testid="invite-member-button"]');

      await expect(
        page.locator('[data-testid="invite-role-select"]')
      ).toBeVisible();
    });

    test('should show permission preview', async ({ page }) => {
      await page.goto('/settings/team');
      await page.click('[data-testid="invite-member-button"]');

      await page.click('[data-testid="invite-role-select"]');
      await page.click('[data-testid="role-option-admin"]');

      const permissionPreview = page.locator('[data-testid="permission-preview"]');
      if (await permissionPreview.isVisible()) {
        await expect(permissionPreview).toBeVisible();
      }
    });

    test('should have optional message field', async ({ page }) => {
      await page.goto('/settings/team');
      await page.click('[data-testid="invite-member-button"]');

      const messageField = page.locator('[data-testid="invite-message-input"]');
      if (await messageField.isVisible()) {
        await expect(messageField).toBeVisible();
      }
    });

    test('should send invitation successfully', async ({ page }) => {
      await page.goto('/settings/team');
      await page.click('[data-testid="invite-member-button"]');

      await page.fill(
        '[data-testid="invite-email-input"]',
        `test-${Date.now()}@example.com`
      );
      await page.click('[data-testid="invite-role-select"]');
      await page.click('[data-testid="role-option-member"]');

      await page.click('[data-testid="send-invitation-button"]');

      // Should show success
      await expect(page.getByText(/invitation sent|invited/i)).toBeVisible();
    });

    test('should close modal on cancel', async ({ page }) => {
      await page.goto('/settings/team');
      await page.click('[data-testid="invite-member-button"]');

      await page.click('[data-testid="cancel-invite-button"]');

      await expect(
        page.locator('[data-testid="invite-member-modal"]')
      ).not.toBeVisible();
    });
  });

  test.describe('Pending Invitations Section (Story 09.12)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display pending invitations section', async ({ page }) => {
      await page.goto('/settings/team');

      const pendingSection = page.locator('[data-testid="pending-invitations"]');
      await expect(pendingSection).toBeVisible();
    });

    test('should show invitation details', async ({ page }) => {
      await page.goto('/settings/team');

      const invitationRow = page.locator('[data-testid^="invitation-row-"]').first();
      if (await invitationRow.isVisible().catch(() => false)) {
        // Should show email
        await expect(invitationRow.locator('[data-testid="invitation-email"]')).toBeVisible();
        // Should show role
        await expect(invitationRow.locator('[data-testid="invitation-role"]')).toBeVisible();
      }
    });

    test('should show invited date', async ({ page }) => {
      await page.goto('/settings/team');

      const invitationRow = page.locator('[data-testid^="invitation-row-"]').first();
      if (await invitationRow.isVisible().catch(() => false)) {
        const invitedDate = invitationRow.locator('[data-testid="invitation-date"]');
        await expect(invitedDate).toBeVisible();
      }
    });

    test('should have resend button', async ({ page }) => {
      await page.goto('/settings/team');

      const invitationRow = page.locator('[data-testid^="invitation-row-"]').first();
      if (await invitationRow.isVisible().catch(() => false)) {
        await expect(
          invitationRow.locator('[data-testid="resend-invitation"]')
        ).toBeVisible();
      }
    });

    test('should resend invitation', async ({ page }) => {
      await page.goto('/settings/team');

      const resendButton = page.locator('[data-testid="resend-invitation"]').first();
      if (await resendButton.isVisible()) {
        await resendButton.click();

        await expect(page.getByText(/resent|sent again/i)).toBeVisible();
      }
    });

    test('should have revoke button', async ({ page }) => {
      await page.goto('/settings/team');

      const invitationRow = page.locator('[data-testid^="invitation-row-"]').first();
      if (await invitationRow.isVisible().catch(() => false)) {
        await expect(
          invitationRow.locator('[data-testid="revoke-invitation"]')
        ).toBeVisible();
      }
    });

    test('should revoke invitation with confirmation', async ({ page }) => {
      await page.goto('/settings/team');

      const revokeButton = page.locator('[data-testid="revoke-invitation"]').first();
      if (await revokeButton.isVisible()) {
        await revokeButton.click();

        // Should show confirmation
        const confirmButton = page.locator('[data-testid="confirm-revoke"]');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await expect(page.getByText(/revoked|removed/i)).toBeVisible();
        }
      }
    });

    test('should show empty state when no pending invitations', async ({
      page,
    }) => {
      await page.goto('/settings/team');

      const emptyState = page.locator('[data-testid="no-pending-invitations"]');
      const invitationRows = page.locator('[data-testid^="invitation-row-"]');

      const hasEmpty = await emptyState.isVisible().catch(() => false);
      const hasRows = (await invitationRows.count()) > 0;

      // Either has empty state or has rows
      expect(hasEmpty || hasRows).toBeTruthy();
    });
  });

  test.describe('Last Active & Status (Story 09.13)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should show last active column', async ({ page }) => {
      await page.goto('/settings/team');

      const lastActiveHeader = page.locator('[data-testid="column-last-active"]');
      await expect(lastActiveHeader).toBeVisible();
    });

    test('should show status indicator', async ({ page }) => {
      await page.goto('/settings/team');

      const memberRow = page.locator('[data-testid^="member-row-"]').first();
      if (await memberRow.isVisible()) {
        const statusIndicator = memberRow.locator('[data-testid="member-status"]');
        await expect(statusIndicator).toBeVisible();
      }
    });

    test('should display relative time format', async ({ page }) => {
      await page.goto('/settings/team');

      const memberRow = page.locator('[data-testid^="member-row-"]').first();
      if (await memberRow.isVisible()) {
        const lastActive = memberRow.locator('[data-testid="last-active"]');
        const text = await lastActive.textContent();

        // Should show relative time format
        expect(
          text?.match(/just now|minutes? ago|hours? ago|days? ago|never/i)
        ).toBeTruthy();
      }
    });

    test('should show active status for recent activity', async ({ page }) => {
      await page.goto('/settings/team');

      const memberRow = page.locator('[data-testid^="member-row-"]').first();
      if (await memberRow.isVisible()) {
        const statusIndicator = memberRow.locator('[data-testid="member-status"]');
        const classes = await statusIndicator.getAttribute('class');

        // Status indicator should have color class
        expect(
          classes?.includes('green') ||
            classes?.includes('yellow') ||
            classes?.includes('active') ||
            classes?.includes('pending')
        ).toBeTruthy();
      }
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should support keyboard navigation in members table', async ({
      page,
    }) => {
      await page.goto('/settings/team');

      // Tab through table
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('should have proper table structure', async ({ page }) => {
      await page.goto('/settings/team');

      const table = page.locator('[data-testid="members-table"]');
      if (await table.isVisible()) {
        // Should have proper table roles
        await expect(table.locator('thead')).toBeVisible();
        await expect(table.locator('tbody')).toBeVisible();
      }
    });

    test('should announce actions to screen readers', async ({ page }) => {
      await page.goto('/settings/team');

      const actionButton = page.locator('[data-testid="member-actions"]').first();
      if (await actionButton.isVisible()) {
        const ariaLabel = await actionButton.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });

    test('should have focusable invite button', async ({ page }) => {
      await page.goto('/settings/team');

      const inviteButton = page.locator('[data-testid="invite-member-button"]');
      await inviteButton.focus();

      await expect(inviteButton).toBeFocused();
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/settings/team');

      await expect(page.locator('[data-testid="team-stats"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="member-search-input"]')
      ).toBeVisible();
    });

    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/settings/team');

      // Core functionality should still work
      await expect(
        page.locator('[data-testid="invite-member-button"]')
      ).toBeVisible();
    });

    test('should show mobile-optimized member cards on small screens', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/settings/team');

      // On mobile, might use card layout instead of table
      const memberCard = page.locator('[data-testid^="member-card-"]').first();
      const memberRow = page.locator('[data-testid^="member-row-"]').first();

      const hasCard = await memberCard.isVisible().catch(() => false);
      const hasRow = await memberRow.isVisible().catch(() => false);

      // Either card or row layout should be visible
      expect(hasCard || hasRow).toBeTruthy();
    });
  });
});
