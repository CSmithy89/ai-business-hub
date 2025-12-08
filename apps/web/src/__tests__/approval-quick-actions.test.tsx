import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ApprovalItem } from '@hyvve/shared'
import { useApprovalQuickActions, buildOptimisticReviewedItem } from '@/hooks/use-approval-quick-actions'
import * as apiClient from '@/lib/api-client'

const createWrapper = () => {
  const queryClient = new QueryClient()
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper, queryClient }
}

const sampleItem: ApprovalItem = {
  id: 'appr-1',
  workspaceId: 'ws-1',
  type: 'content',
  title: 'Approval A',
  description: 'Sample approval item',
  confidenceScore: 80,
  confidenceLevel: 'medium',
  status: 'pending',
  data: {},
  createdBy: 'agent-1',
  createdAt: new Date(),
  reviewedAt: undefined,
  dueAt: undefined,
  priority: 1,
}

describe('useApprovalQuickActions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('performs optimistic approve and rolls back on error', async () => {
    const { wrapper, queryClient } = createWrapper()

    // Seed cache
    queryClient.setQueryData(['approvals'], { data: [sampleItem], meta: {} })

    const approveResponse = {
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ data: { ...sampleItem, status: 'approved' } })),
      status: 200,
      json: () => Promise.resolve({ data: { ...sampleItem, status: 'approved' } }),
    } as any

    vi.spyOn(apiClient, 'apiPost')
      .mockResolvedValueOnce(approveResponse)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({ message: 'fail' })),
      } as any)

    const { result } = renderHook(() => useApprovalQuickActions(), { wrapper })

    // Approve optimistic
    await act(async () => {
      result.current.approve({ id: sampleItem.id })
    })

    // Optimistic state applied
    const afterOptimistic = queryClient.getQueryData<{ data: ApprovalItem[] }>(['approvals'])
    expect(afterOptimistic?.data[0].status).toBe('approved')

    // Reject action triggers failure and rollback
    await act(async () => {
      result.current.reject({ id: sampleItem.id })
    })

    await waitFor(() => {
      const afterRollback = queryClient.getQueryData<{ data: ApprovalItem[] }>(['approvals'])
      expect(afterRollback?.data[0].status).toBe('approved') // stays approved because reject failed and rollback restored last snapshot
    })
  })

  it('buildOptimisticReviewedItem sets status and reviewedAt', () => {
    const reviewed = buildOptimisticReviewedItem(sampleItem, 'approved')
    expect(reviewed.status).toBe('approved')
    expect(reviewed.reviewedAt).toBeTruthy()
  })
})
