import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ApprovalItem } from '@hyvve/shared'
import { useApprovalQuickActions, buildOptimisticReviewedItem } from '@/hooks/use-approval-quick-actions'
import * as apiClient from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-config'
import { toast } from 'sonner'

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
    vi.clearAllMocks()
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

  it('rolls back on approve failure and surfaces error feedback', async () => {
    const { wrapper, queryClient } = createWrapper()

    queryClient.setQueryData(['approvals'], { data: [sampleItem], meta: {} })

    vi.spyOn(apiClient, 'apiPost').mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(JSON.stringify({ message: 'approve failed' })),
    } as any)

    const { result } = renderHook(() => useApprovalQuickActions(), { wrapper })

    await act(async () => {
      await expect(result.current.approveAsync({ id: sampleItem.id })).rejects.toThrow('approve failed')
    })

    const afterError = queryClient.getQueryData<{ data: ApprovalItem[] }>(['approvals'])
    expect(afterError?.data[0].status).toBe('pending')
    expect(toast.error).toHaveBeenCalled()
  })

  it('uses CSRF-enabled apiPost for approve and reject endpoints', async () => {
    const { wrapper } = createWrapper()

    const approveResponse = {
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { ...sampleItem, status: 'approved' } })),
    } as any
    const rejectResponse = {
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: { ...sampleItem, status: 'rejected' } })),
    } as any

    const spy = vi.spyOn(apiClient, 'apiPost')
    spy.mockResolvedValueOnce(approveResponse).mockResolvedValueOnce(rejectResponse)

    const { result } = renderHook(() => useApprovalQuickActions(), { wrapper })

    await act(async () => {
      await result.current.approveAsync({ id: sampleItem.id })
      await result.current.rejectAsync({ id: sampleItem.id })
    })

    expect(spy).toHaveBeenNthCalledWith(1, API_ENDPOINTS.approvals.approve(sampleItem.id), {})
    expect(spy).toHaveBeenNthCalledWith(2, API_ENDPOINTS.approvals.reject(sampleItem.id), {})
  })

  it('buildOptimisticReviewedItem sets status and reviewedAt', () => {
    const reviewed = buildOptimisticReviewedItem(sampleItem, 'approved')
    expect(reviewed.status).toBe('approved')
    expect(reviewed.reviewedAt).toBeTruthy()
  })
})
