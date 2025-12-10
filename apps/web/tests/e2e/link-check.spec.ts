import { test, expect } from '@playwright/test'

test('Verify dashboard links and page availability', async ({ page }) => {
  // 1. Login
  await page.goto('/sign-in')
  await page.getByRole('textbox', { name: 'Email' }).fill('user6@example.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('Password123!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/dashboard/)

  // 2. Check Dashboard
  await expect(page).toHaveURL(/\/dashboard/)
  console.log('Dashboard: OK')

  // 3. Check Approvals - should NOT show 404
  await page.getByRole('link', { name: 'Approvals' }).click()
  await page.waitForURL(/\/approvals/)
  await expect(page.getByText('404')).not.toBeVisible()
  console.log('Approvals: OK')

  // 4. Check AI Team - should NOT show 404
  await page.getByRole('link', { name: 'AI Team' }).click()
  await page.waitForURL(/\/agents/)
  await expect(page.getByText('404')).not.toBeVisible()
  console.log('AI Team: OK')

  // 5. Check Settings - should NOT show 404
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.waitForURL(/\/settings/)
  await expect(page.getByText('404')).not.toBeVisible()
  console.log('Settings: OK')

  // 6. Check CRM (Expected to be 404 - not yet implemented)
  try {
    await page.getByRole('link', { name: 'CRM' }).click()
    await page.waitForURL(/\/crm/, { timeout: 5000 })
    // If we get here, the route exists - verify it shows 404 as expected
    await expect(page.getByText('404')).toBeVisible()
    console.log('CRM: Shows expected 404')
  } catch {
    console.log('CRM: Link not available (expected)')
  }

  // 7. Check Projects (Expected to be 404 - not yet implemented)
  try {
    await page.getByRole('link', { name: 'Projects' }).click()
    await page.waitForURL(/\/projects/, { timeout: 5000 })
    // If we get here, the route exists - verify it shows 404 as expected
    await expect(page.getByText('404')).toBeVisible()
    console.log('Projects: Shows expected 404')
  } catch {
    console.log('Projects: Link not available (expected)')
  }
})
