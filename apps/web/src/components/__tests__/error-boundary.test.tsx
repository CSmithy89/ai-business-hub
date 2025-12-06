import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { ErrorBoundary } from '../error-boundary'
import * as telemetry from '@/lib/telemetry/error-tracking'

describe('ErrorBoundary telemetry integration', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports errors via captureException and breadcrumb', async () => {
    const captureSpy = vi.spyOn(telemetry, 'captureException').mockImplementation(() => undefined)
    const breadcrumbSpy = vi.spyOn(telemetry, 'addBreadcrumb').mockImplementation(() => undefined)

    const Bomb = () => {
      throw new Error('boom')
    }

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(captureSpy).toHaveBeenCalled()
      expect(breadcrumbSpy).toHaveBeenCalled()
    })
  })
})
