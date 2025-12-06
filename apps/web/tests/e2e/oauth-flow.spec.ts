import { test, expect } from '../support/fixtures'

const SESSION_COOKIE_NAME = 'session_token'

test.describe('OAuth Flow - Google', () => {
  test('happy path redirects through callback, sets session, and lands on dashboard', async ({ page, context }) => {
    let capturedState: string | null = null

    // Intercept provider redirect and bounce back to local callback with the same state
    await page.route('**://accounts.google.com/**', async (route) => {
      const url = new URL(route.request().url())
      capturedState = url.searchParams.get('state')

      expect(capturedState).toBeTruthy()

      const callbackUrl = new URL('/api/auth/callback/google', process.env.BASE_URL || 'http://localhost:3000')
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

    // Intercept callback to simulate successful token exchange and session issuance
    await page.route('**/api/auth/callback/google**', async (route) => {
      const url = new URL(route.request().url())
      const state = url.searchParams.get('state')

      if (!state || state !== capturedState) {
        await route.fulfill({ status: 400, body: 'invalid_state' })
        return
      }

      await route.fulfill({
        status: 302,
        headers: {
          location: '/dashboard',
          'set-cookie': 'hyvve.session_token=test-session; Path=/; HttpOnly; SameSite=Lax',
        },
      })
    })

    await page.goto('/sign-in')

    const providerRequest = page.waitForRequest((req) => req.url().includes('accounts.google.com'))

    await page.getByTestId('google-sign-in-button').click()
    await providerRequest
    await page.waitForURL(/\/dashboard/)

    const cookies = await context.cookies()
    const sessionCookie = cookies.find((c) => c.name.includes(SESSION_COOKIE_NAME))

    expect(sessionCookie).toBeTruthy()
    expect(capturedState).toBeTruthy()
  })

  test('rejects mismatched state and does not set session', async ({ page, context }) => {
    let capturedState: string | null = null

    await page.route('**://accounts.google.com/**', async (route) => {
      const url = new URL(route.request().url())
      capturedState = url.searchParams.get('state')

      const callbackUrl = new URL('/api/auth/callback/google', process.env.BASE_URL || 'http://localhost:3000')
      callbackUrl.searchParams.set('code', 'test-code')
      callbackUrl.searchParams.set('state', 'invalid-state')

      await route.fulfill({
        status: 302,
        headers: {
          location: callbackUrl.toString(),
        },
      })
    })

    await page.route('**/api/auth/callback/google**', async (route) => {
      const url = new URL(route.request().url())
      const state = url.searchParams.get('state')

      if (!state || state === capturedState) {
        await route.fulfill({ status: 500, body: 'unexpected_state' })
        return
      }

      await route.fulfill({
        status: 400,
        body: 'invalid_state',
      })
    })

    await page.goto('/sign-in')

    const callbackResponse = page.waitForResponse((resp) => resp.url().includes('/api/auth/callback/google'))

    await page.getByTestId('google-sign-in-button').click()
    const response = await callbackResponse

    expect(response.status()).toBe(400)

    const cookies = await context.cookies()
    const sessionCookie = cookies.find((c) => c.name.includes(SESSION_COOKIE_NAME))

    expect(sessionCookie).toBeUndefined()
    expect(page.url()).toContain('/api/auth/callback/google')
  })
})
