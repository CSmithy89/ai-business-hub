/**
 * Workspace Management E2E Tests - Epic 02
 *
 * ATDD Tests - RED Phase (failing tests before implementation)
 * @see docs/sprint-artifacts/tech-spec-epic-02.md
 */
import { test, expect } from '../support/fixtures';

test.describe('Workspace Management', () => {
  test.describe('Workspace CRUD (Story 02.1)', () => {
    test('AC-2.1.1: should create workspace with user as owner', async ({
      page,
      auth,
    }) => {
      // GIVEN: Authenticated user
      await auth.loginAsTestUser();

      // WHEN: Creating a new workspace
      await page.goto('/workspaces/new');
      await page.fill('[data-testid="workspace-name-input"]', 'My Test Business');
      await page.click('[data-testid="create-workspace-button"]');

      // THEN: Workspace created and user redirected as owner
      await page.waitForURL(/\/workspaces\/[\w-]+\/dashboard/);
      await expect(page.locator('[data-testid="workspace-name"]')).toContainText(
        'My Test Business'
      );
    });

    test('AC-2.1.2: should auto-generate unique slug from name', async ({
      page,
      auth,
    }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/new');
      await page.fill('[data-testid="workspace-name-input"]', 'My Business');
      await page.click('[data-testid="create-workspace-button"]');

      // Slug should be lowercase with nanoid suffix
      await expect(page).toHaveURL(/\/workspaces\/my-business-[\w]+\/dashboard/);
    });

    test('AC-2.1.3: should list all user workspaces', async ({
      page,
      auth,
      workspaceFactory,
    }) => {
      const user = await auth.loginAsTestUser();
      // Create 3 workspaces for user
      const token = await auth.getAuthToken();
      await workspaceFactory.createWorkspace(token, { name: 'Workspace 1' });
      await workspaceFactory.createWorkspace(token, { name: 'Workspace 2' });
      await workspaceFactory.createWorkspace(token, { name: 'Workspace 3' });

      await page.goto('/workspaces');

      const workspaceCards = page.locator('[data-testid="workspace-card"]');
      await expect(workspaceCards).toHaveCount(3);
    });

    test('AC-2.1.4: member role cannot update workspace settings', async ({
      page,
      auth,
    }) => {
      // GIVEN: User with member role in workspace
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings');

      // THEN: Settings form should be disabled or 403 shown
      await expect(
        page.locator('[data-testid="workspace-name-input"]')
      ).toBeDisabled();
    });

    test('AC-2.1.5: owner can soft delete workspace', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings/danger');

      // Type workspace name to confirm
      await page.fill(
        '[data-testid="delete-confirmation-input"]',
        'Test Workspace'
      );
      await page.click('[data-testid="delete-workspace-button"]');

      // Should show deletion scheduled message
      await expect(page.getByText(/scheduled for deletion/i)).toBeVisible();
    });
  });

  test.describe('Member Invitation (Story 02.2)', () => {
    test('AC-2.2.1: owner can invite members', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings/team');

      await page.click('[data-testid="invite-member-button"]');
      await page.fill('[data-testid="invite-email-input"]', 'newmember@example.com');
      await page.selectOption('[data-testid="invite-role-select"]', 'member');
      await page.click('[data-testid="send-invitation-button"]');

      // Should show success message
      await expect(page.getByText(/invitation sent/i)).toBeVisible();
    });

    test('AC-2.2.3: member role cannot invite others', async ({ page, auth }) => {
      // Login as member (not owner)
      await auth.loginAs('member@example.com', 'Test1234!');
      await page.goto('/workspaces/test-workspace/settings/team');

      // Invite button should not be visible
      await expect(
        page.locator('[data-testid="invite-member-button"]')
      ).not.toBeVisible();
    });

    test('AC-2.2.4: duplicate invitation blocked', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings/team');

      // Invite same email twice
      await page.click('[data-testid="invite-member-button"]');
      await page.fill('[data-testid="invite-email-input"]', 'existing@example.com');
      await page.click('[data-testid="send-invitation-button"]');

      // Should show error
      await expect(page.getByText(/already.*pending/i)).toBeVisible();
    });
  });

  test.describe('Invitation Acceptance (Story 02.3)', () => {
    test('AC-2.3.1: logged-in user can accept invitation', async ({
      page,
      auth,
    }) => {
      await auth.loginAsTestUser();

      // Navigate to invitation link
      await page.goto('/invite/valid-token-abc123');

      // Should be added to workspace
      await expect(page.getByText(/joined.*workspace/i)).toBeVisible();
    });

    test('AC-2.3.2: new user redirected to sign-up with context', async ({
      page,
    }) => {
      // Not logged in, visit invitation
      await page.goto('/invite/valid-token-abc123');

      // Should redirect to sign-up with invite context
      await expect(page).toHaveURL(/\/sign-up\?invite=valid-token-abc123/);
    });

    test('AC-2.3.3: expired invitation shows error', async ({ page }) => {
      await page.goto('/invite/expired-token-xyz');

      await expect(page.getByText(/invitation.*expired/i)).toBeVisible();
    });

    test('AC-2.3.4: already-used invitation rejected', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/invite/already-used-token');

      await expect(page.getByText(/already.*accepted/i)).toBeVisible();
    });
  });

  test.describe('Workspace Switching (Story 02.4)', () => {
    test('AC-2.4.1: user can switch between workspaces', async ({
      page,
      auth,
    }) => {
      await auth.loginAsTestUser();
      await page.goto('/dashboard');

      // Open workspace selector
      await page.click('[data-testid="workspace-selector"]');
      await page.click('[data-testid="workspace-option-other-workspace"]');

      // Context should update
      await expect(page.locator('[data-testid="workspace-name"]')).toContainText(
        'Other Workspace'
      );
    });

    test('AC-2.4.2: session updates on workspace switch', async ({
      page,
      auth,
    }) => {
      await auth.loginAsTestUser();
      await page.goto('/dashboard');

      await page.click('[data-testid="workspace-selector"]');
      await page.click('[data-testid="workspace-option-workspace-b"]');

      // Reload and verify session persisted
      await page.reload();
      await expect(page.locator('[data-testid="workspace-name"]')).toContainText(
        'Workspace B'
      );
    });

    test('AC-2.4.3: last workspace remembered on return', async ({
      page,
      auth,
    }) => {
      await auth.loginAsTestUser();

      // Switch to specific workspace
      await page.goto('/dashboard');
      await page.click('[data-testid="workspace-selector"]');
      await page.click('[data-testid="workspace-option-remembered"]');

      // Logout and login again
      await auth.logout();
      await auth.loginAsTestUser();

      // Should return to last workspace
      await expect(page.locator('[data-testid="workspace-name"]')).toContainText(
        'Remembered'
      );
    });
  });

  test.describe('Member Management (Story 02.5)', () => {
    test('AC-2.5.1: member list shows all members with roles', async ({
      page,
      auth,
    }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings/team');

      const memberRows = page.locator('[data-testid="member-row"]');
      await expect(memberRows).toHaveCount(5);

      // Verify roles are displayed
      await expect(page.locator('[data-testid="member-role"]').first()).toBeVisible();
    });

    test('AC-2.5.2: owner can change member roles', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings/team');

      // Change member role to admin
      await page.click('[data-testid="member-actions-user123"]');
      await page.click('[data-testid="change-role-admin"]');

      await expect(page.getByText(/role updated/i)).toBeVisible();
    });

    test('AC-2.5.3: admin cannot demote owner', async ({ page, auth }) => {
      // Login as admin
      await auth.loginAs('admin@example.com', 'Test1234!');
      await page.goto('/workspaces/test-workspace/settings/team');

      // Owner row should not have role change option
      const ownerRow = page.locator('[data-testid="member-row-owner"]');
      await expect(
        ownerRow.locator('[data-testid="change-role-button"]')
      ).not.toBeVisible();
    });

    test('AC-2.5.4: member can leave workspace', async ({ page, auth }) => {
      await auth.loginAs('member@example.com', 'Test1234!');
      await page.goto('/workspaces/test-workspace/settings/team');

      await page.click('[data-testid="leave-workspace-button"]');
      await page.click('[data-testid="confirm-leave-button"]');

      // Should redirect to workspace list
      await expect(page).toHaveURL('/workspaces');
    });

    test('AC-2.5.5: owner cannot leave workspace', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings/team');

      // Leave button should show transfer ownership message
      await page.click('[data-testid="leave-workspace-button"]');
      await expect(page.getByText(/transfer ownership first/i)).toBeVisible();
    });
  });

  test.describe('Workspace Settings (Story 02.6)', () => {
    test('AC-2.6.1: settings page accessible to owner/admin', async ({
      page,
      auth,
    }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings');

      await expect(page.locator('[data-testid="settings-form"]')).toBeVisible();
    });

    test('AC-2.6.2: workspace name can be updated', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings');

      await page.fill('[data-testid="workspace-name-input"]', 'Updated Name');
      await page.click('[data-testid="save-settings-button"]');

      await expect(page.getByText(/settings saved/i)).toBeVisible();
    });

    test('AC-2.6.3: workspace avatar can be uploaded', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings');

      // Upload avatar
      await page.setInputFiles(
        '[data-testid="avatar-upload-input"]',
        'test-fixtures/avatar.png'
      );

      await expect(page.locator('[data-testid="workspace-avatar"]')).toHaveAttribute(
        'src',
        /blob:|data:/
      );
    });
  });

  test.describe('Workspace Deletion (Story 02.7)', () => {
    test('AC-2.7.1: delete requires confirmation with workspace name', async ({
      page,
      auth,
    }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/test-workspace/settings/danger');

      // Try to delete without confirmation
      await page.click('[data-testid="delete-workspace-button"]');

      // Button should be disabled until name typed
      await expect(
        page.locator('[data-testid="delete-workspace-button"]')
      ).toBeDisabled();

      // Type correct name
      await page.fill(
        '[data-testid="delete-confirmation-input"]',
        'Test Workspace'
      );
      await expect(
        page.locator('[data-testid="delete-workspace-button"]')
      ).toBeEnabled();
    });

    test('AC-2.7.2: 30-day grace period for recovery', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      // Navigate to recently deleted workspace
      await page.goto('/workspaces/deleted-workspace/settings');

      // Should show recovery option
      await expect(page.getByText(/recover workspace/i)).toBeVisible();
      await expect(page.getByText(/\d+ days remaining/i)).toBeVisible();
    });

    test('AC-2.7.3: deleted workspace access blocked', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/workspaces/deleted-workspace/dashboard');

      await expect(page.getByText(/scheduled for deletion/i)).toBeVisible();
    });
  });
});
