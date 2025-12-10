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

  // 3. Check Approvals
  await page.getByRole('link', { name: 'Approvals' }).click()
  await page.waitForURL(/\/approvals/)
  // Check for 404 or empty content
  const approvalsTitle = await page.title()
  console.log(`Approvals: ${approvalsTitle}`)
  if (await page.getByText('404').isVisible()) console.error('Approvals: 404 Not Found')

  // 4. Check AI Team
  await page.getByRole('link', { name: 'AI Team' }).click()
  await page.waitForURL(/\/agents/)
  const agentsTitle = await page.title()
  console.log(`AI Team: ${agentsTitle}`)
  if (await page.getByText('404').isVisible()) console.error('AI Team: 404 Not Found')

  // 5. Check Settings
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.waitForURL(/\/settings/)
  const settingsTitle = await page.title()
  console.log(`Settings: ${settingsTitle}`)
  if (await page.getByText('404').isVisible()) console.error('Settings: 404 Not Found')

  // 6. Check CRM (Expect fail)
  try {
    await page.getByRole('link', { name: 'CRM' }).click()
    await page.waitForURL(/\/crm/)
    console.log('CRM: Route exists')
    if (await page.getByText('404').isVisible()) console.error('CRM: 404 Not Found (Expected)')
  } catch (e) {
    console.log('CRM: Link not working or timed out')
  }

  // 7. Check Projects (Expect fail)
  try {
    await page.getByRole('link', { name: 'Projects' }).click()
    await page.waitForURL(/\/projects/)
    console.log('Projects: Route exists')
    if (await page.getByText('404').isVisible()) console.error('Projects: 404 Not Found (Expected)')
  } catch (e) {
    console.log('Projects: Link not working or timed out')
  }
})
