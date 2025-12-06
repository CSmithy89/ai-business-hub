import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ErrorBoundary } from '../error-boundary'
import * as telemetry from '@/lib/telemetry/error-tracking'

describe('ErrorBoundary telemetry integration', () => {
  it('reports errors via captureException and breadcrumb', () => {
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
    expect(captureSpy).toHaveBeenCalled()
    expect(breadcrumbSpy).toHaveBeenCalled()
  })
})
