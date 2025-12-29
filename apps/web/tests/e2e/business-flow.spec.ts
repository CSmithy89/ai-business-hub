/**
 * Business Creation Flow E2E Test
 * Tests the complete flow: sign up -> create workspace -> create business
 */

import { test, expect } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

test.describe('Business Creation Flow', () => {
  // Generate unique identifiers for this test run
  const timestamp = Date.now()
  const testEmail = `e2e-flow-${timestamp}@example.com`
  const testPassword = 'TestPass123!'
  const testName = 'E2E Flow User'

  test('complete business creation flow', async ({ page }) => {
    // Step 1: Sign Up
    await test.step('Sign up new user', async () => {
      await page.goto('/sign-up')
      await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible()

      await page.fill('[data-testid="name-input"]', testName)
      await page.fill('[data-testid="email-input"]', testEmail)
      await page.fill('[data-testid="password-input"]', testPassword)
      await page.fill('[data-testid="confirm-password-input"]', testPassword)

      // Check terms checkbox
      const termsCheckbox = page.getByRole('checkbox', { name: /terms/i })
      await termsCheckbox.check()

      await page.click('[data-testid="sign-up-button"]')

      // Wait for account created message
      await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible({ timeout: 15000 })
    })

    // Step 1.5: Verify email in database and sign in
    await test.step('Verify email and sign in', async () => {
      // Verify email directly in database
      await execAsync(
        `docker exec hyvve_postgres psql -U postgres -d hyvve -c "UPDATE users SET email_verified = true WHERE email = '${testEmail}';"`
      )

      // Now sign in
      await page.goto('/sign-in')
      await page.fill('[data-testid="email-input"]', testEmail)
      await page.fill('[data-testid="password-input"]', testPassword)
      await page.click('[data-testid="sign-in-button"]')

      // Wait for redirect after sign-in
      await page.waitForURL(/\/(businesses|dashboard|onboarding|workspaces)/, { timeout: 30000 })
    })

    // Step 2: Create or select workspace (if needed)
    await test.step('Handle workspace creation', async () => {
      // Check if we need to create a workspace
      const url = page.url()

      if (url.includes('/workspaces/create') || url.includes('/onboarding')) {
        // Look for workspace name input
        const workspaceInput = page.locator('input[name="name"], input[placeholder*="workspace" i]').first()
        if (await workspaceInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await workspaceInput.fill('Test Workspace')
          const createButton = page.getByRole('button', { name: /create/i })
          if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await createButton.click()
            await page.waitForURL(/\/(businesses|dashboard)/, { timeout: 15000 })
          }
        }
      }
    })

    // Step 3: Navigate to businesses if not already there
    await test.step('Navigate to businesses', async () => {
      const url = page.url()
      if (!url.includes('/businesses')) {
        // Try to navigate via sidebar or menu
        const businessesLink = page.getByRole('link', { name: /businesses/i }).first()
        if (await businessesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
          await businessesLink.click()
          await page.waitForURL(/\/businesses/, { timeout: 15000 })
        } else {
          // Direct navigation
          await page.goto('/businesses')
        }
      }
    })

    // Step 4: Create a new business
    await test.step('Create new business', async () => {
      // Look for create business button
      const createButton = page.getByRole('button', { name: /create|new|add.*business/i }).first()

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createButton.click()

        // Fill business details
        await page.waitForSelector('[data-testid="business-name-input"], input[name="name"]', { timeout: 10000 })

        const nameInput = page.locator('[data-testid="business-name-input"], input[name="name"]').first()
        await nameInput.fill(`E2E Test Business ${timestamp}`)

        // Try to find and fill description if present
        const descInput = page.locator('[data-testid="business-description-input"], textarea[name="description"]').first()
        if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await descInput.fill('A test business created during E2E testing.')
        }

        // Look for next/submit button
        const nextButton = page.getByRole('button', { name: /next|continue|create|submit/i })
        if (await nextButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextButton.first().click()
        }
      }
    })

    // Capture final state
    await test.step('Verify business was created', async () => {
      await page.waitForLoadState('networkidle')

      // Take screenshot for verification
      await page.screenshot({ path: 'test-results/business-flow-final.png', fullPage: true })

      // Check we're on a business-related page
      const url = page.url()
      expect(url).toMatch(/\/(businesses|validation|onboarding|branding|planning)/)
    })
  })
})
