import { describe, expect, it, vi } from 'vitest'
import * as apiClient from '@/lib/api-client'
import { performApprovalAction } from './use-approval-quick-actions'
import { API_ENDPOINTS } from '@/lib/api-config'

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
