/**
 * Authentication E2E Tests - Epic 01
 *
 * Tests for email/password registration, sign-in, Google OAuth, and password reset.
 * @see docs/sprint-artifacts/tech-spec-epic-01.md
 */
import { test, expect } from '../support/fixtures';

test.describe('Authentication', () => {
  test.describe('Registration (Story 01.2)', () => {
    test('should register with valid email and password', async ({ page }) => {
      const email = `test-${Date.now()}@example.com`;

      await page.goto('/sign-up');
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', email);
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
      await page.click('[data-testid="sign-up-button"]');

      // Should show verification email sent message
      await expect(page.getByText(/verification email/i)).toBeVisible();
    });

    test('should reject weak password', async ({ page }) => {
      await page.goto('/sign-up');
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'weak');

      // Password strength indicator should show weak
      await expect(page.locator('[data-testid="password-strength"]')).toContainText(/weak/i);
    });

    test('should reject duplicate email', async ({ page, userFactory }) => {
      // Create existing user first
      const existingUser = await userFactory.createVerifiedUser();

      await page.goto('/sign-up');
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
      await page.click('[data-testid="sign-up-button"]');

      // Should show email in use error
      await expect(page.getByText(/email.*already.*use/i)).toBeVisible();
    });
  });

  test.describe('Sign In (Story 01.4)', () => {
    test('should sign in with valid credentials', async ({ page, userFactory }) => {
      const user = await userFactory.createVerifiedUser({
        password: 'ValidPass123!',
      });

      await page.goto('/sign-in');
      await page.fill('[data-testid="email-input"]', user.email);
      await page.fill('[data-testid="password-input"]', 'ValidPass123!');
      await page.click('[data-testid="sign-in-button"]');

      // Should redirect to dashboard
      await page.waitForURL(/\/(dashboard|workspaces)/);
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('[data-testid="email-input"]', 'wrong@example.com');
      await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
      await page.click('[data-testid="sign-in-button"]');

      // Should show invalid credentials error
      await expect(page.getByText(/invalid.*credentials/i)).toBeVisible();
    });

    test('should reject unverified user', async ({ page, userFactory }) => {
      // Create unverified user
      const user = await userFactory.createUser({
        password: 'ValidPass123!',
      });

      await page.goto('/sign-in');
      await page.fill('[data-testid="email-input"]', user.email);
      await page.fill('[data-testid="password-input"]', 'ValidPass123!');
      await page.click('[data-testid="sign-in-button"]');

      // Should show verification required error
      await expect(page.getByText(/verify.*email/i)).toBeVisible();
    });
  });

  test.describe('Google OAuth (Story 01.5)', () => {
    test('should initiate Google OAuth flow', async ({ page }) => {
      await page.goto('/sign-in');
      await page.click('[data-testid="google-sign-in-button"]');

      // Should redirect to Google consent screen
      await page.waitForURL(/accounts\.google\.com/);
    });
  });

  test.describe('Password Reset (Story 01.6)', () => {
    test('should send password reset email', async ({ page, userFactory }) => {
      const user = await userFactory.createVerifiedUser();

      await page.goto('/forgot-password');
      await page.fill('[data-testid="email-input"]', user.email);
      await page.click('[data-testid="reset-password-button"]');

      // Should show success message
      await expect(page.getByText(/reset.*email.*sent/i)).toBeVisible();
    });
  });

  test.describe('Session Management (Story 01.7)', () => {
    test('should persist session across page loads', async ({ page, auth }) => {
      await auth.loginAsTestUser();

      // Navigate to different page
      await page.goto('/settings');
      await page.reload();

      // Should still be logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should sign out successfully', async ({ page, auth }) => {
      await auth.loginAsTestUser();
      await auth.logout();

      // Should redirect to sign-in
      await expect(page).toHaveURL(/sign-in/);
    });
  });
});
