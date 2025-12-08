import { test, expect } from '../support/fixtures'

const SESSION_COOKIE_NAME = 'hyvve.session_token'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('OAuth Flow - Google (E2E test mode)', () => {
  test('happy path uses app callback to set session and land on dashboard', async ({ page, context }) => {
    let capturedState: string | null = null

    await page.route('**://accounts.google.com/**', async (route) => {
      const url = new URL(route.request().url())
      capturedState = url.searchParams.get('state')
      expect(capturedState).toBeTruthy()

      if (capturedState) {
        await context.addCookies([
          {
            name: 'e2e_oauth_state',
            value: capturedState,
            url: BASE_URL,
          },
        ])
      }

      const callbackUrl = new URL('/api/auth/callback/google', BASE_URL)
      callbackUrl.searchParams.set('code', 'test-code')
      if (capturedState) {
        callbackUrl.searchParams.set('state', capturedState)
      }

      await route.fulfill({
        status: 302,
        headers: {
          location: callbackUrl.toString(),
        },
      })
    })

    await page.goto('/sign-in')

    const providerRequest = page.waitForRequest((req) => req.url().includes('accounts.google.com'))

    await page.getByTestId('google-sign-in-button').click()
    await providerRequest
    await page.waitForURL(/\/dashboard/)

    const cookies = await context.cookies()
    const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME)

    expect(sessionCookie).toBeTruthy()
    expect(capturedState).toBeTruthy()
  })

  test('mismatched state is rejected by app and session is not issued', async ({ page, context }) => {
    let capturedState: string | null = null

    await page.route('**://accounts.google.com/**', async (route) => {
      const url = new URL(route.request().url())
      capturedState = url.searchParams.get('state')
      expect(capturedState).toBeTruthy()

      await context.addCookies([
        {
          name: 'e2e_oauth_state',
          value: 'expected-state',
          url: BASE_URL,
        },
      ])

      const callbackUrl = new URL('/api/auth/callback/google', BASE_URL)
      callbackUrl.searchParams.set('code', 'test-code')
      callbackUrl.searchParams.set('state', 'invalid-state')

      await route.fulfill({
        status: 302,
        headers: {
          location: callbackUrl.toString(),
        },
      })
    })

    await page.goto('/sign-in')

    const callbackResponse = page.waitForResponse((resp) => resp.url().includes('/api/auth/callback/google'))

    await page.getByTestId('google-sign-in-button').click()
    const response = await callbackResponse

    expect(response.status()).toBe(400)
    await expect(page).toHaveURL(/\/api\/auth\/callback\/google/)
    await expect(page.locator('body')).toContainText(/invalid_state/i)

    const cookies = await context.cookies()
    const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME)

    expect(sessionCookie).toBeUndefined()
  })
})
