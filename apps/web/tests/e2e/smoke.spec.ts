/**
 * Smoke Tests - Basic Application Health
 *
 * Fast sanity checks to verify the application is running.
 * These run first in CI to fail fast on broken builds.
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HYVVE|Home/i);
  });

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
  });

  test('sign-up page loads', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.locator('[data-testid="sign-up-button"]')).toBeVisible();
  });
});
