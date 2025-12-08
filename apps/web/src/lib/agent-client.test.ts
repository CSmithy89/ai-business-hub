import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AgentClient, AgentAPIError } from './agent-client'

describe('AgentClient runtime validation (Story 14-10)', () => {
  const baseURL = 'http://agent.test'
  let client: AgentClient

  beforeEach(() => {
    client = new AgentClient(baseURL, 5000)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllTimers()
  })

  function mockFetchOnce(status: number, body: unknown, ok = status >= 200 && status < 300) {
    global.fetch = vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
    }) as any
  }

  it('accepts valid response', async () => {
    mockFetchOnce(200, {
      success: true,
      content: 'ok',
      session_id: 'sess1',
      agent_name: 'validation',
      metadata: { business_id: 'biz1', team: 'validation' },
    })

    const res = await client.runValidation({ message: 'hi', business_id: 'biz1' })
    expect(res.content).toBe('ok')
    expect(res.session_id).toBe('sess1')
  })

  it('rejects missing required fields', async () => {
    mockFetchOnce(200, {
      success: true,
      content: 'ok',
      // session_id missing
      metadata: { business_id: 'biz1', team: 'validation' },
    })

    await expect(client.runValidation({ message: 'hi', business_id: 'biz1' })).rejects.toThrow(
      AgentAPIError
    )
  })

  it('rejects wrong types', async () => {
    mockFetchOnce(200, {
      success: 'yes',
      content: 'ok',
      session_id: 'sess1',
      metadata: { business_id: 'biz1', team: 'validation' },
    })

    await expect(client.runValidation({ message: 'hi', business_id: 'biz1' })).rejects.toThrow(
      AgentAPIError
    )
  })

  it('propagates agent error payloads', async () => {
    mockFetchOnce(200, {
      success: false,
      error: 'failed',
      session_id: 'sess1',
      metadata: { business_id: 'biz1', team: 'validation' },
    })

    await expect(client.runValidation({ message: 'hi', business_id: 'biz1' })).rejects.toThrow(
      /failed/
    )
  })

  it('handles non-JSON response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('bad json')
      },
      text: async () => '<html>bad</html>',
    }) as any

    await expect(client.runValidation({ message: 'hi', business_id: 'biz1' })).rejects.toThrow(
      AgentAPIError
    )
  })
})
