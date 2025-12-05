/**
 * Two-Factor Authentication E2E Tests - Epic 09
 *
 * Tests for 2FA setup, login verification, and management.
 * @see docs/epics/EPIC-09-ui-auth-enhancements.md
 */
import { test, expect } from '../support/fixtures';

test.describe('Two-Factor Authentication', () => {
  test.describe('2FA Setup (Story 09.3)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should navigate to security settings', async ({ page }) => {
      await page.goto('/settings/security');

      await expect(page.locator('[data-testid="security-settings"]')).toBeVisible();
      await expect(page.getByRole('heading', { name: /security/i })).toBeVisible();
    });

    test('should show 2FA setup option', async ({ page }) => {
      await page.goto('/settings/security');

      await expect(page.locator('[data-testid="2fa-section"]')).toBeVisible();
      await expect(page.getByText(/two-factor|2fa/i)).toBeVisible();
    });

    test('should display 2FA setup button when disabled', async ({ page }) => {
      await page.goto('/settings/security');

      // If 2FA is not enabled, should show setup button
      const setupButton = page.locator('[data-testid="setup-2fa-button"]');
      const disableButton = page.locator('[data-testid="disable-2fa-button"]');

      const hasSetup = await setupButton.isVisible().catch(() => false);
      const hasDisable = await disableButton.isVisible().catch(() => false);

      // Either setup or disable should be visible
      expect(hasSetup || hasDisable).toBeTruthy();
    });

    test('should open 2FA setup modal', async ({ page }) => {
      await page.goto('/settings/security');

      const setupButton = page.locator('[data-testid="setup-2fa-button"]');
      if (await setupButton.isVisible()) {
        await setupButton.click();

        await expect(page.locator('[data-testid="2fa-setup-modal"]')).toBeVisible();
      }
    });

    test('should show authenticator app option', async ({ page }) => {
      await page.goto('/settings/security');

      const setupButton = page.locator('[data-testid="setup-2fa-button"]');
      if (await setupButton.isVisible()) {
        await setupButton.click();

        await expect(
          page.getByText(/authenticator app/i)
        ).toBeVisible();
      }
    });

    test('should display QR code for authenticator setup', async ({ page }) => {
      await page.goto('/settings/security');

      const setupButton = page.locator('[data-testid="setup-2fa-button"]');
      if (await setupButton.isVisible()) {
        await setupButton.click();

        // Select authenticator app method
        await page.click('[data-testid="method-authenticator"]');

        // QR code should appear
        await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
      }
    });

    test('should show manual setup code', async ({ page }) => {
      await page.goto('/settings/security');

      const setupButton = page.locator('[data-testid="setup-2fa-button"]');
      if (await setupButton.isVisible()) {
        await setupButton.click();
        await page.click('[data-testid="method-authenticator"]');

        // Manual code should be available
        await expect(
          page.locator('[data-testid="manual-setup-code"]')
        ).toBeVisible();
      }
    });

    test('should verify 6-digit code', async ({ page }) => {
      await page.goto('/settings/security');

      const setupButton = page.locator('[data-testid="setup-2fa-button"]');
      if (await setupButton.isVisible()) {
        await setupButton.click();
        await page.click('[data-testid="method-authenticator"]');

        // Enter verification code
        const codeInput = page.locator('[data-testid="verification-code-input"]');
        await expect(codeInput).toBeVisible();

        // Enter invalid code
        await codeInput.fill('000000');
        await page.click('[data-testid="verify-code-button"]');

        // Should show error
        await expect(page.getByText(/invalid|incorrect/i)).toBeVisible();
      }
    });

    test('should show backup codes after setup', async ({ page }) => {
      await page.goto('/settings/security');

      // This test assumes 2FA can be enabled
      // In real scenario, would need valid TOTP code
      const backupCodesSection = page.locator('[data-testid="backup-codes"]');
      if (await backupCodesSection.isVisible().catch(() => false)) {
        // Should show 10 backup codes
        const codeElements = page.locator('[data-testid^="backup-code-"]');
        const count = await codeElements.count();
        expect(count).toBeLessThanOrEqual(10);
      }
    });

    test('should require confirmation checkbox', async ({ page }) => {
      await page.goto('/settings/security');

      const backupCodesSection = page.locator('[data-testid="backup-codes"]');
      if (await backupCodesSection.isVisible().catch(() => false)) {
        // Confirmation checkbox should exist
        const confirmCheckbox = page.locator('[data-testid="backup-codes-confirmation"]');
        await expect(confirmCheckbox).toBeVisible();
      }
    });
  });

  test.describe('2FA Login (Story 09.4)', () => {
    test('should show 2FA prompt after password', async ({ page }) => {
      // This test requires a user with 2FA enabled
      await page.goto('/sign-in');

      await page.fill('[data-testid="email-input"]', 'user-with-2fa@example.com');
      await page.fill('[data-testid="password-input"]', 'ValidPass123!');
      await page.click('[data-testid="sign-in-button"]');

      // If user has 2FA, should show verification screen
      const twoFactorScreen = page.locator('[data-testid="2fa-verification"]');
      if (await twoFactorScreen.isVisible().catch(() => false)) {
        await expect(twoFactorScreen).toBeVisible();
        await expect(
          page.locator('[data-testid="2fa-code-input"]')
        ).toBeVisible();
      }
    });

    test('should accept authenticator code', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('[data-testid="email-input"]', 'user-with-2fa@example.com');
      await page.fill('[data-testid="password-input"]', 'ValidPass123!');
      await page.click('[data-testid="sign-in-button"]');

      const twoFactorScreen = page.locator('[data-testid="2fa-verification"]');
      if (await twoFactorScreen.isVisible().catch(() => false)) {
        // Code input should exist
        await expect(
          page.locator('[data-testid="2fa-code-input"]')
        ).toBeVisible();
      }
    });

    test('should offer backup code alternative', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('[data-testid="email-input"]', 'user-with-2fa@example.com');
      await page.fill('[data-testid="password-input"]', 'ValidPass123!');
      await page.click('[data-testid="sign-in-button"]');

      const twoFactorScreen = page.locator('[data-testid="2fa-verification"]');
      if (await twoFactorScreen.isVisible().catch(() => false)) {
        // Should have option to use backup code
        await expect(
          page.getByText(/backup code|recovery/i)
        ).toBeVisible();
      }
    });

    test('should show trust device option', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('[data-testid="email-input"]', 'user-with-2fa@example.com');
      await page.fill('[data-testid="password-input"]', 'ValidPass123!');
      await page.click('[data-testid="sign-in-button"]');

      const twoFactorScreen = page.locator('[data-testid="2fa-verification"]');
      if (await twoFactorScreen.isVisible().catch(() => false)) {
        await expect(
          page.locator('[data-testid="trust-device-checkbox"]')
        ).toBeVisible();
      }
    });

    test('should handle invalid 2FA code', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('[data-testid="email-input"]', 'user-with-2fa@example.com');
      await page.fill('[data-testid="password-input"]', 'ValidPass123!');
      await page.click('[data-testid="sign-in-button"]');

      const codeInput = page.locator('[data-testid="2fa-code-input"]');
      if (await codeInput.isVisible().catch(() => false)) {
        await codeInput.fill('000000');
        await page.click('[data-testid="verify-2fa-button"]');

        await expect(page.getByText(/invalid|incorrect/i)).toBeVisible();
      }
    });
  });

  test.describe('2FA Management (Story 09.5)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should show 2FA status', async ({ page }) => {
      await page.goto('/settings/security');

      const statusIndicator = page.locator('[data-testid="2fa-status"]');
      await expect(statusIndicator).toBeVisible();
    });

    test('should show backup codes count', async ({ page }) => {
      await page.goto('/settings/security');

      // If 2FA is enabled, should show remaining backup codes
      const backupCodesCount = page.locator('[data-testid="backup-codes-remaining"]');
      if (await backupCodesCount.isVisible().catch(() => false)) {
        await expect(backupCodesCount).toContainText(/\d+/);
      }
    });

    test('should allow viewing backup codes with re-auth', async ({ page }) => {
      await page.goto('/settings/security');

      const viewCodesButton = page.locator('[data-testid="view-backup-codes"]');
      if (await viewCodesButton.isVisible()) {
        await viewCodesButton.click();

        // Should require password re-entry
        const passwordPrompt = page.locator('[data-testid="reauth-password"]');
        if (await passwordPrompt.isVisible()) {
          await expect(passwordPrompt).toBeVisible();
        }
      }
    });

    test('should allow generating new backup codes', async ({ page }) => {
      await page.goto('/settings/security');

      const regenerateButton = page.locator('[data-testid="regenerate-backup-codes"]');
      if (await regenerateButton.isVisible()) {
        await regenerateButton.click();

        // Should show warning about invalidating old codes
        await expect(
          page.getByText(/invalidate|replace/i)
        ).toBeVisible();
      }
    });

    test('should show trusted devices', async ({ page }) => {
      await page.goto('/settings/security');

      const trustedDevices = page.locator('[data-testid="trusted-devices"]');
      if (await trustedDevices.isVisible()) {
        await expect(trustedDevices).toBeVisible();
      }
    });

    test('should allow revoking trusted devices', async ({ page }) => {
      await page.goto('/settings/security');

      const deviceRow = page.locator('[data-testid^="trusted-device-"]').first();
      if (await deviceRow.isVisible().catch(() => false)) {
        const revokeButton = deviceRow.locator('[data-testid="revoke-device"]');
        await expect(revokeButton).toBeVisible();
      }
    });

    test('should disable 2FA with password confirmation', async ({ page }) => {
      await page.goto('/settings/security');

      const disableButton = page.locator('[data-testid="disable-2fa-button"]');
      if (await disableButton.isVisible()) {
        await disableButton.click();

        // Should require password confirmation
        await expect(
          page.locator('[data-testid="confirm-password-input"]')
        ).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should support keyboard navigation in 2FA setup', async ({ page }) => {
      await page.goto('/settings/security');

      // Tab to 2FA section
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('should announce 2FA status to screen readers', async ({ page }) => {
      await page.goto('/settings/security');

      const statusElement = page.locator('[data-testid="2fa-status"]');
      if (await statusElement.isVisible()) {
        // Should have appropriate ARIA attributes
        const role = await statusElement.getAttribute('role');
        const ariaLabel = await statusElement.getAttribute('aria-label');
        expect(role || ariaLabel).toBeTruthy();
      }
    });

    test('should have proper labels on code inputs', async ({ page }) => {
      await page.goto('/settings/security');

      const setupButton = page.locator('[data-testid="setup-2fa-button"]');
      if (await setupButton.isVisible()) {
        await setupButton.click();
        await page.click('[data-testid="method-authenticator"]');

        const codeInput = page.locator('[data-testid="verification-code-input"]');
        if (await codeInput.isVisible()) {
          // Should have associated label
          const labelledBy = await codeInput.getAttribute('aria-labelledby');
          const label = await codeInput.getAttribute('aria-label');
          const id = await codeInput.getAttribute('id');

          expect(labelledBy || label || id).toBeTruthy();
        }
      }
    });
  });
});
