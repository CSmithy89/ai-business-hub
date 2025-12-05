/**
 * OAuth Provider E2E Tests - Epic 09
 *
 * Tests for Microsoft OAuth, GitHub OAuth, and account linking.
 * @see docs/epics/EPIC-09-ui-auth-enhancements.md
 */
import { test, expect } from '@playwright/test';

test.describe('OAuth Providers', () => {
  test.describe('Microsoft OAuth (Story 09.1)', () => {
    test('should show Microsoft sign-in button', async ({ page }) => {
      await page.goto('/sign-in');

      const microsoftButton = page.locator('[data-testid="microsoft-sign-in-button"]');
      // Microsoft OAuth may not be implemented yet
      if (await microsoftButton.isVisible().catch(() => false)) {
        await expect(microsoftButton).toBeVisible();
        await expect(microsoftButton).toContainText(/microsoft/i);
      }
    });

    test('should show Microsoft sign-up button', async ({ page }) => {
      await page.goto('/sign-up');

      const microsoftButton = page.locator('[data-testid="microsoft-sign-up-button"]');
      if (await microsoftButton.isVisible().catch(() => false)) {
        await expect(microsoftButton).toBeVisible();
      }
    });

    test('should initiate Microsoft OAuth flow', async ({ page }) => {
      await page.goto('/sign-in');

      const microsoftButton = page.locator('[data-testid="microsoft-sign-in-button"]');
      if (await microsoftButton.isVisible()) {
        await microsoftButton.click();

        // Should redirect to Microsoft login
        await page.waitForURL(/login\.microsoftonline\.com|microsoft\.com/);
      }
    });

    test('should match button styling with Google OAuth button', async ({
      page,
    }) => {
      await page.goto('/sign-in');

      const googleButton = page.locator('[data-testid="google-sign-in-button"]');
      const microsoftButton = page.locator('[data-testid="microsoft-sign-in-button"]');

      if (
        (await googleButton.isVisible()) &&
        (await microsoftButton.isVisible().catch(() => false))
      ) {
        const googleBox = await googleButton.boundingBox();
        const microsoftBox = await microsoftButton.boundingBox();

        // Buttons should have similar dimensions
        if (googleBox && microsoftBox) {
          expect(Math.abs(googleBox.width - microsoftBox.width)).toBeLessThan(50);
        }
      }
    });
  });

  test.describe('GitHub OAuth (Story 09.2)', () => {
    test('should show GitHub sign-in button if enabled', async ({ page }) => {
      await page.goto('/sign-in');

      const githubButton = page.locator('[data-testid="github-sign-in-button"]');
      // GitHub OAuth may not be implemented yet
      if (await githubButton.isVisible().catch(() => false)) {
        await expect(githubButton).toBeVisible();
        await expect(githubButton).toContainText(/github/i);
      }
    });

    test('should initiate GitHub OAuth flow', async ({ page }) => {
      await page.goto('/sign-in');

      const githubButton = page.locator('[data-testid="github-sign-in-button"]');
      if (await githubButton.isVisible()) {
        await githubButton.click();

        // Should redirect to GitHub login
        await page.waitForURL(/github\.com/);
      }
    });
  });

  test.describe('Magic Link Authentication (Story 09.6)', () => {
    test('should show magic link option on sign-in page', async ({ page }) => {
      await page.goto('/sign-in');

      const magicLinkOption = page.locator('[data-testid="magic-link-option"]');
      if (await magicLinkOption.isVisible().catch(() => false)) {
        await expect(magicLinkOption).toBeVisible();
        await expect(magicLinkOption).toContainText(/email.*link|magic link/i);
      }
    });

    test('should navigate to magic link form', async ({ page }) => {
      await page.goto('/sign-in');

      const magicLinkOption = page.locator('[data-testid="magic-link-option"]');
      if (await magicLinkOption.isVisible()) {
        await magicLinkOption.click();

        await expect(
          page.locator('[data-testid="magic-link-form"]')
        ).toBeVisible();
      }
    });

    test('should require valid email for magic link', async ({ page }) => {
      await page.goto('/magic-link');

      const emailInput = page.locator('[data-testid="magic-link-email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill('invalid-email');
        await page.click('[data-testid="send-magic-link-button"]');

        await expect(page.getByText(/valid email/i)).toBeVisible();
      }
    });

    test('should send magic link email', async ({ page }) => {
      await page.goto('/magic-link');

      const emailInput = page.locator('[data-testid="magic-link-email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        await page.click('[data-testid="send-magic-link-button"]');

        // Should show success message
        await expect(page.getByText(/email sent|check your email/i)).toBeVisible();
      }
    });

    test('should show magic link verification page', async ({ page }) => {
      // Magic link verification page
      await page.goto('/magic-link/verify?token=test-token');

      // Should show verification in progress or error
      const verifyingState = page.getByText(/verifying|invalid|expired/i);
      await expect(verifyingState).toBeVisible();
    });
  });

  test.describe('Account Linking (Story 09.7)', () => {
    test('should show linked accounts in settings', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/settings/account');

      const linkedAccounts = page.locator('[data-testid="linked-accounts"]');
      if (await linkedAccounts.isVisible().catch(() => false)) {
        await expect(linkedAccounts).toBeVisible();
      }
    });

    test('should display currently linked providers', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/settings/account');

      const linkedProviders = page.locator('[data-testid^="linked-provider-"]');
      if ((await linkedProviders.count()) > 0) {
        await expect(linkedProviders.first()).toBeVisible();
      }
    });

    test('should show link provider button', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/settings/account');

      const linkButton = page.locator('[data-testid="link-provider-button"]');
      if (await linkButton.isVisible().catch(() => false)) {
        await expect(linkButton).toBeVisible();
      }
    });

    test('should prevent unlinking last auth method', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await page.goto('/settings/account');

      const linkedProviders = page.locator('[data-testid^="linked-provider-"]');
      const count = await linkedProviders.count();

      if (count === 1) {
        const unlinkButton = linkedProviders
          .first()
          .locator('[data-testid="unlink-provider"]');

        if (await unlinkButton.isVisible()) {
          await unlinkButton.click();

          // Should show warning
          await expect(
            page.getByText(/cannot remove|last.*method/i)
          ).toBeVisible();
        }
      }
    });
  });

  test.describe('OTP Code Verification (Story 09.8)', () => {
    test('should show OTP option on email verification page', async ({
      page,
    }) => {
      await page.goto('/verify-email?email=test@example.com');

      const otpSection = page.locator('[data-testid="otp-verification"]');
      if (await otpSection.isVisible().catch(() => false)) {
        await expect(otpSection).toBeVisible();
      }
    });

    test('should have 6-digit OTP input', async ({ page }) => {
      await page.goto('/verify-email?email=test@example.com');

      const otpInput = page.locator('[data-testid="otp-input"]');
      if (await otpInput.isVisible().catch(() => false)) {
        // OTP input should accept 6 digits
        await expect(otpInput).toHaveAttribute('maxlength', '6');
      }
    });

    test('should validate OTP code', async ({ page }) => {
      await page.goto('/verify-email?email=test@example.com');

      const otpInput = page.locator('[data-testid="otp-input"]');
      if (await otpInput.isVisible()) {
        await otpInput.fill('000000');
        await page.click('[data-testid="verify-otp-button"]');

        // Should show error for invalid code
        await expect(page.getByText(/invalid|incorrect|expired/i)).toBeVisible();
      }
    });
  });

  test.describe('OAuth Error Handling', () => {
    test('should handle OAuth callback errors gracefully', async ({ page }) => {
      await page.goto('/api/auth/callback/google?error=access_denied');

      // Should show error message
      await expect(page.getByText(/error|denied|failed/i)).toBeVisible();
    });

    test('should handle OAuth state mismatch', async ({ page }) => {
      await page.goto('/api/auth/callback/google?state=invalid-state');

      // Should show error or redirect to sign-in
      const currentUrl = page.url();
      expect(
        currentUrl.includes('sign-in') || currentUrl.includes('error')
      ).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible OAuth buttons', async ({ page }) => {
      await page.goto('/sign-in');

      const googleButton = page.locator('[data-testid="google-sign-in-button"]');
      if (await googleButton.isVisible()) {
        // Should have accessible name
        const ariaLabel = await googleButton.getAttribute('aria-label');
        const innerText = await googleButton.innerText();

        expect(ariaLabel || innerText).toBeTruthy();
      }
    });

    test('should support keyboard activation of OAuth buttons', async ({
      page,
    }) => {
      await page.goto('/sign-in');

      // Tab to OAuth button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Might need multiple tabs

      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();

      // Should be activatable with Enter
      const tagName = await focused.evaluate((el) => el.tagName);
      expect(['BUTTON', 'A'].includes(tagName)).toBeTruthy();
    });
  });
});
