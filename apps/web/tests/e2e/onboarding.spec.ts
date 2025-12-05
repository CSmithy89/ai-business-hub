/**
 * Business Onboarding E2E Tests - Epic 08
 *
 * Tests for business creation wizard, document uploads, and onboarding flows.
 * @see docs/sprint-artifacts/tech-spec-epic-08.md
 */
import { test, expect } from '../support/fixtures';

test.describe('Business Onboarding', () => {
  test.describe('Business Creation Wizard (Story 08.3)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display onboarding wizard on dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Should show the onboarding wizard or "Create Business" CTA
      const createButton = page.locator('[data-testid="create-business-button"]');
      await expect(createButton).toBeVisible();
    });

    test('should navigate through wizard steps', async ({ page }) => {
      await page.goto('/dashboard');

      // Click create business
      await page.click('[data-testid="create-business-button"]');

      // Step 1: Business Details
      await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();
      await page.fill('[data-testid="business-name-input"]', 'My E2E Test Business');
      await page.fill(
        '[data-testid="business-description-input"]',
        'A detailed description of my business that exceeds the minimum character requirement.'
      );
      await page.click('[data-testid="wizard-next-button"]');

      // Step 2: Business Idea
      await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible();
      await page.fill(
        '[data-testid="problem-statement-input"]',
        'The problem my business solves is a significant market pain point.'
      );
      await page.fill(
        '[data-testid="target-customer-input"]',
        'Small to medium businesses in the tech sector.'
      );
      await page.fill(
        '[data-testid="proposed-solution-input"]',
        'An innovative platform that automates complex workflows.'
      );
      await page.click('[data-testid="wizard-next-button"]');

      // Step 3: Documents (optional)
      await expect(page.locator('[data-testid="wizard-step-3"]')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="create-business-button"]');

      // Try to proceed without filling required fields
      await page.click('[data-testid="wizard-next-button"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="description-error"]')).toBeVisible();
    });

    test('should create business successfully', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="create-business-button"]');

      // Fill business details
      const businessName = `E2E Business ${Date.now()}`;
      await page.fill('[data-testid="business-name-input"]', businessName);
      await page.fill(
        '[data-testid="business-description-input"]',
        'A comprehensive description for E2E testing purposes.'
      );
      await page.click('[data-testid="wizard-next-button"]');

      // Fill business idea
      await page.fill(
        '[data-testid="problem-statement-input"]',
        'A significant problem that needs solving in the market.'
      );
      await page.fill('[data-testid="target-customer-input"]', 'Businesses of all sizes.');
      await page.fill(
        '[data-testid="proposed-solution-input"]',
        'A comprehensive solution that addresses the core problem.'
      );
      await page.click('[data-testid="wizard-next-button"]');

      // Skip documents
      await page.click('[data-testid="skip-documents-button"]');

      // Should create business and redirect
      await page.waitForURL(/\/businesses\/[a-zA-Z0-9]+/);

      // Verify business was created
      await expect(page.locator('[data-testid="business-header"]')).toContainText(businessName);
    });

    test('should prevent duplicate business names', async ({ page }) => {
      await page.goto('/dashboard');

      // Create first business
      await page.click('[data-testid="create-business-button"]');
      const businessName = `Duplicate Test ${Date.now()}`;
      await page.fill('[data-testid="business-name-input"]', businessName);
      await page.fill(
        '[data-testid="business-description-input"]',
        'First business with this name.'
      );
      await page.click('[data-testid="wizard-next-button"]');
      await page.fill(
        '[data-testid="problem-statement-input"]',
        'Problem statement for first business.'
      );
      await page.fill('[data-testid="target-customer-input"]', 'Target customers.');
      await page.fill('[data-testid="proposed-solution-input"]', 'Solution for first business.');
      await page.click('[data-testid="wizard-next-button"]');
      await page.click('[data-testid="skip-documents-button"]');
      await page.waitForURL(/\/businesses\/[a-zA-Z0-9]+/);

      // Try to create second business with same name
      await page.goto('/dashboard');
      await page.click('[data-testid="create-business-button"]');
      await page.fill('[data-testid="business-name-input"]', businessName);
      await page.fill(
        '[data-testid="business-description-input"]',
        'Second business with same name.'
      );
      await page.click('[data-testid="wizard-next-button"]');
      await page.fill('[data-testid="problem-statement-input"]', 'Problem for second business.');
      await page.fill('[data-testid="target-customer-input"]', 'Targets.');
      await page.fill('[data-testid="proposed-solution-input"]', 'Solution for second.');
      await page.click('[data-testid="wizard-next-button"]');
      await page.click('[data-testid="skip-documents-button"]');

      // Should show duplicate name error
      await expect(page.getByText(/already exists/i)).toBeVisible();
    });
  });

  test.describe('Document Upload (Story 08.4)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should show document upload zone', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="create-business-button"]');

      // Navigate to documents step
      await page.fill('[data-testid="business-name-input"]', 'Doc Upload Test');
      await page.fill(
        '[data-testid="business-description-input"]',
        'Testing document upload functionality.'
      );
      await page.click('[data-testid="wizard-next-button"]');
      await page.fill('[data-testid="problem-statement-input"]', 'Test problem statement here.');
      await page.fill('[data-testid="target-customer-input"]', 'Test targets.');
      await page.fill('[data-testid="proposed-solution-input"]', 'Test solution here.');
      await page.click('[data-testid="wizard-next-button"]');

      // Should show dropzone
      await expect(page.locator('[data-testid="document-dropzone"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-file-button"]')).toBeVisible();
    });

    test('should validate file types', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="create-business-button"]');

      // Navigate to documents step
      await page.fill('[data-testid="business-name-input"]', 'File Type Test');
      await page.fill(
        '[data-testid="business-description-input"]',
        'Testing file type validation.'
      );
      await page.click('[data-testid="wizard-next-button"]');
      await page.fill('[data-testid="problem-statement-input"]', 'Test problem statement.');
      await page.fill('[data-testid="target-customer-input"]', 'Test targets.');
      await page.fill('[data-testid="proposed-solution-input"]', 'Test solution.');
      await page.click('[data-testid="wizard-next-button"]');

      // Should show accepted file types
      await expect(page.locator('[data-testid="accepted-types"]')).toContainText(/PDF|DOCX|MD/i);
    });

    test('should show file size limit', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="create-business-button"]');

      // Navigate to documents step
      await page.fill('[data-testid="business-name-input"]', 'File Size Test');
      await page.fill(
        '[data-testid="business-description-input"]',
        'Testing file size limit display.'
      );
      await page.click('[data-testid="wizard-next-button"]');
      await page.fill('[data-testid="problem-statement-input"]', 'Problem statement.');
      await page.fill('[data-testid="target-customer-input"]', 'Targets.');
      await page.fill('[data-testid="proposed-solution-input"]', 'Solution.');
      await page.click('[data-testid="wizard-next-button"]');

      // Should show file size limit
      await expect(page.locator('[data-testid="size-limit"]')).toContainText(/MB/i);
    });
  });

  test.describe('Business List (Story 08.2)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display empty state when no businesses', async ({ page }) => {
      await page.goto('/businesses');

      // Should show empty state or CTA
      const emptyState = page.locator('[data-testid="no-businesses"]');
      const businessList = page.locator('[data-testid="business-list"]');

      // Either empty state or list should be visible
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasList = await businessList.isVisible().catch(() => false);

      expect(hasEmptyState || hasList).toBeTruthy();
    });

    test('should display business cards', async ({ page, businessFactory }) => {
      // Get cookies for API auth
      const cookies = await page.context().cookies();
      const authCookie = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

      // Create a test business
      const business = await businessFactory.createBusiness(authCookie, {
        name: `List Test Business ${Date.now()}`,
      });

      await page.goto('/businesses');

      // Should show business card
      await expect(page.locator(`[data-testid="business-card-${business.id}"]`)).toBeVisible();
      await expect(page.getByText(business.name)).toBeVisible();
    });

    test('should navigate to business detail on click', async ({ page, businessFactory }) => {
      const cookies = await page.context().cookies();
      const authCookie = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

      const business = await businessFactory.createBusiness(authCookie, {
        name: `Navigate Test ${Date.now()}`,
      });

      await page.goto('/businesses');
      await page.click(`[data-testid="business-card-${business.id}"]`);

      // Should navigate to business detail
      await page.waitForURL(new RegExp(`/businesses/${business.id}`));
    });
  });

  test.describe('Onboarding Progress (Story 08.5)', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should show progress indicator in business card', async ({ page, businessFactory }) => {
      const cookies = await page.context().cookies();
      const authCookie = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

      const business = await businessFactory.createBusiness(authCookie, {
        name: `Progress Test ${Date.now()}`,
      });

      await page.goto('/businesses');

      // Should show progress indicator
      const card = page.locator(`[data-testid="business-card-${business.id}"]`);
      await expect(card.locator('[data-testid="progress-indicator"]')).toBeVisible();
    });

    test('should show current stage in business detail', async ({ page, businessFactory }) => {
      const cookies = await page.context().cookies();
      const authCookie = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

      const business = await businessFactory.createBusiness(authCookie, {
        name: `Stage Test ${Date.now()}`,
      });

      await page.goto(`/businesses/${business.id}`);

      // Should show stage (IDEA for new businesses)
      await expect(page.locator('[data-testid="business-stage"]')).toContainText(/IDEA/i);
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should display wizard properly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');
      await page.click('[data-testid="create-business-button"]');

      // Wizard should be visible and usable on mobile
      await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible();

      // Form fields should be full width on mobile
      const nameInput = page.locator('[data-testid="business-name-input"]');
      const box = await nameInput.boundingBox();
      expect(box?.width).toBeGreaterThan(300);
    });

    test('should display business list properly on tablet', async ({ page, businessFactory }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      const cookies = await page.context().cookies();
      const authCookie = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

      await businessFactory.createBusiness(authCookie, {
        name: `Tablet Test ${Date.now()}`,
      });

      await page.goto('/businesses');

      // Business list should adapt to tablet
      await expect(page.locator('[data-testid="business-list"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAsTestUser();
    });

    test('should have proper focus management in wizard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="create-business-button"]');

      // First input should be focused
      const nameInput = page.locator('[data-testid="business-name-input"]');
      await expect(nameInput).toBeFocused();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="create-business-button"]');

      // Tab through form fields
      await page.keyboard.press('Tab');
      const descriptionInput = page.locator('[data-testid="business-description-input"]');
      await expect(descriptionInput).toBeFocused();

      // Tab to next button
      await page.keyboard.press('Tab');
      const nextButton = page.locator('[data-testid="wizard-next-button"]');
      await expect(nextButton).toBeFocused();
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="create-business-button"]');

      // Try to proceed without filling fields
      await page.click('[data-testid="wizard-next-button"]');

      // Error should have role="alert" for screen readers
      const errorElement = page.locator('[role="alert"]');
      await expect(errorElement).toBeVisible();
    });
  });
});
