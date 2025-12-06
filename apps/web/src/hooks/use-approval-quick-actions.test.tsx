import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import * as apiClient from '@/lib/api-client'
import {
  buildOptimisticReviewedItem,
  performApprovalAction,
  useApprovalQuickActions,
} from './use-approval-quick-actions'
import { API_ENDPOINTS } from '@/lib/api-config'

import { toast } from 'sonner'

vi.mock('@/lib/api-client', () => ({
  apiPost: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const createApprovalItem = () => ({
  id: 'a1',
  workspaceId: 'ws1',
  type: 'email',
  title: 'Test',
  description: 'Desc',
  confidenceScore: 80,
  confidenceLevel: 'medium',
  status: 'pending' as const,
  data: {},
  createdBy: 'agent',
  priority: 1,
  createdAt: new Date(),
  reviewedAt: undefined as any,
})

const renderHookWithClient = () => {
  const ct = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={ct}>{children}</QueryClientProvider>
  )

  const hook = renderHook(() => useApprovalQuickActions(), { wrapper })
  return { client: ct, hook }
}

vi.mock('@/lib/api-client', () => ({
  apiPost: vi.fn(),
}))

describe('use-approval-quick-actions URL centralization (Story 14-11)', () => {
  it('uses centralized approval endpoints', async () => {
    const mockResponse = { ok: true, json: async () => ({ data: { id: 'a1' } }) } as Response
    vi.mocked(apiClient.apiPost).mockResolvedValueOnce(mockResponse)

    await performApprovalAction('a1', 'approve')

    expect(apiClient.apiPost).toHaveBeenCalledWith(API_ENDPOINTS.approvals.approve('a1'), {}, { baseURL: '' })
  })
})

describe('Optimistic update type safety (Story 14-12)', () => {
  it('marks reviewedAt as Date instance', () => {
    const baseItem = {
      id: 'a1',
      workspaceId: 'ws',
      type: 'email',
      title: 'Test',
      confidenceScore: 0,
      confidenceLevel: 'medium',
      createdBy: 'agent',
      status: 'pending' as const,
      data: {},
      priority: 1,
      createdAt: new Date(),
    }

    const updated = buildOptimisticReviewedItem(baseItem as any, 'approved')
    expect(updated.reviewedAt instanceof Date).toBe(true)
    if (updated.reviewedAt instanceof Date) {
      expect(updated.reviewedAt.getTime()).toBeGreaterThan(0)
    } else {
      throw new Error('reviewedAt should be a Date')
    }
  })
})

describe('Approval quick actions regressions (Story 14-13)', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(apiClient.apiPost).mockReset()
  })

  it('calls API and toast on successful approval', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ data: { id: 'a1', title: 'Test' } }),
    } as Response
    vi.mocked(apiClient.apiPost).mockResolvedValueOnce(mockResponse)

    const { hook } = renderHookWithClient()
    await hook.result.current.approveAsync({ id: 'a1' })

    expect(apiClient.apiPost).toHaveBeenCalledWith(
      API_ENDPOINTS.approvals.approve('a1'),
      {},
      { baseURL: '' }
    )
    expect(toast.success).toHaveBeenCalled()
  })

  it('rolls back optimistic update when approval fails', async () => {
    const failingResponse = {
      ok: false,
      status: 500,
      json: async () => ({ message: 'boom' }),
    } as Response
    vi.mocked(apiClient.apiPost).mockResolvedValueOnce(failingResponse)

    const { client, hook } = renderHookWithClient()
    const baseline = {
      data: [createApprovalItem()],
      meta: {},
    }
    client.setQueryData(['approvals'], baseline)

    await expect(hook.result.current.approveAsync({ id: 'a1' })).rejects.toThrow(
      'Failed to approve'
    )

    const after = client.getQueryData<{ data: ReturnType<typeof createApprovalItem>[] }>(['approvals'])
    expect(after?.data[0].status).toBe('pending')
    expect(after?.data[0].reviewedAt).toBeUndefined()
    expect(toast.error).toHaveBeenCalled()
  })
})
