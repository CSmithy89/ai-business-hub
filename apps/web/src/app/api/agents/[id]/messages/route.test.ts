/**
 * Agent Messages API Route Tests
 *
 * Tests for the chat messages API including SSE streaming.
 *
 * Story: 15.4 - Connect Chat Panel to Agno Backend
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET } from './route'

// Mock the auth module
vi.mock('@/lib/auth-server', () => ({
  getSession: vi.fn(),
}))

import { getSession } from '@/lib/auth-server'

const mockGetSession = vi.mocked(getSession)

describe('Agent Messages API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/agents/[id]/messages', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetSession.mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/agents/hub/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('Unauthorized')
      })
    })

    describe('Validation', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          user: { id: 'user-1', email: 'test@example.com' },
          session: { activeWorkspaceId: 'workspace-1' },
        } as Awaited<ReturnType<typeof getSession>>)
      })

      it('should return 400 when content is empty', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages', {
          method: 'POST',
          body: JSON.stringify({ content: '' }),
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('Message content is required')
      })

      it('should return 400 when content is whitespace only', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages', {
          method: 'POST',
          body: JSON.stringify({ content: '   ' }),
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('Message content is required')
      })

      it('should return 400 for invalid agent ID', async () => {
        const request = new NextRequest('http://localhost/api/agents/invalid/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'invalid' }) })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('Invalid agent ID')
      })

      it('should accept valid agent IDs', async () => {
        const validAgentIds = ['hub', 'maya', 'atlas', 'nova', 'echo']

        for (const agentId of validAgentIds) {
          const request = new NextRequest(`http://localhost/api/agents/${agentId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: 'Hello' }),
          })

          const response = await POST(request, { params: Promise.resolve({ id: agentId }) })

          // Should not be a validation error (400)
          expect(response.status).not.toBe(400)
        }
      })
    })

    describe('Non-streaming response', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          user: { id: 'user-1', email: 'test@example.com' },
          session: { activeWorkspaceId: 'workspace-1' },
        } as Awaited<ReturnType<typeof getSession>>)
      })

      it('should return JSON response when stream is false', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello', stream: false }),
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data).toHaveProperty('id')
        expect(data).toHaveProperty('agentId', 'hub')
        expect(data).toHaveProperty('content')
        expect(data).toHaveProperty('timestamp')
        expect(data).toHaveProperty('workspaceId', 'workspace-1')
      })

      it('should return JSON response when stream is not specified', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data).toHaveProperty('content')
      })

      it('should generate agent-specific responses', async () => {
        const agents = [
          { id: 'hub', keywords: ['orchestrator', 'coordinate'] },
          { id: 'maya', keywords: ['CRM', 'customer'] },
          { id: 'atlas', keywords: ['project', 'task'] },
          { id: 'nova', keywords: ['marketing', 'content'] },
          { id: 'echo', keywords: ['analytics', 'data'] },
        ]

        for (const agent of agents) {
          const request = new NextRequest(`http://localhost/api/agents/${agent.id}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: 'Test message' }),
          })

          const response = await POST(request, { params: Promise.resolve({ id: agent.id }) })
          const data = await response.json()

          // Check that response contains at least one keyword for the agent
          const hasKeyword = agent.keywords.some((kw) =>
            data.content.toLowerCase().includes(kw.toLowerCase())
          )
          expect(hasKeyword).toBe(true)
        }
      })
    })

    describe('Streaming response (SSE)', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          user: { id: 'user-1', email: 'test@example.com' },
          session: { activeWorkspaceId: 'workspace-1' },
        } as Awaited<ReturnType<typeof getSession>>)
      })

      it('should return SSE stream when stream is true', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello', stream: true }),
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.headers.get('content-type')).toBe('text/event-stream')
        expect(response.headers.get('cache-control')).toBe('no-cache')
        expect(response.headers.get('connection')).toBe('keep-alive')
      })

      it('should include workspace ID header in streaming response', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello', stream: true }),
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.headers.get('x-workspace-id')).toBe('workspace-1')
      })

      it('should include business ID header when provided', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello', stream: true, businessId: 'biz-123' }),
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.headers.get('x-business-id')).toBe('biz-123')
      })

      it('should stream content in SSE format', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello', stream: true }),
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'hub' }) })
        const reader = response.body?.getReader()
        expect(reader).toBeDefined()

        if (!reader) return

        const decoder = new TextDecoder()
        let _fullContent = ''
        let hasDataEvents = false
        let hasDoneEvent = false

        // Read the stream
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          _fullContent += chunk

          // Check for SSE data events
          if (chunk.includes('data: ')) {
            hasDataEvents = true
          }
          if (chunk.includes('[DONE]')) {
            hasDoneEvent = true
          }
        }

        expect(hasDataEvents).toBe(true)
        expect(hasDoneEvent).toBe(true)
      })

      it('should handle abort signal', async () => {
        const abortController = new AbortController()

        const request = new NextRequest('http://localhost/api/agents/hub/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello', stream: true }),
          signal: abortController.signal,
        })

        const response = await POST(request, { params: Promise.resolve({ id: 'hub' }) })
        const reader = response.body?.getReader()
        expect(reader).toBeDefined()

        if (!reader) return

        // Abort after first chunk
        const { done } = await reader.read()
        if (!done) {
          abortController.abort()
          // Stream should handle abort gracefully
          await reader.cancel()
        }

        // Test passes if no error is thrown
        expect(true).toBe(true)
      })
    })
  })

  describe('GET /api/agents/[id]/messages', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockGetSession.mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/agents/hub/messages')

        const response = await GET(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toBe('Unauthorized')
      })
    })

    describe('Validation', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          user: { id: 'user-1', email: 'test@example.com' },
          session: { activeWorkspaceId: 'workspace-1' },
        } as Awaited<ReturnType<typeof getSession>>)
      })

      it('should return 400 for invalid agent ID', async () => {
        const request = new NextRequest('http://localhost/api/agents/invalid/messages')

        const response = await GET(request, { params: Promise.resolve({ id: 'invalid' }) })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBe('Invalid agent ID')
      })
    })

    describe('Response', () => {
      beforeEach(() => {
        mockGetSession.mockResolvedValue({
          user: { id: 'user-1', email: 'test@example.com' },
          session: { activeWorkspaceId: 'workspace-1' },
        } as Awaited<ReturnType<typeof getSession>>)
      })

      it('should return message list structure', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages')

        const response = await GET(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data).toHaveProperty('data')
        expect(data).toHaveProperty('agentId', 'hub')
        expect(data).toHaveProperty('limit')
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should respect limit query parameter', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages?limit=25')

        const response = await GET(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.limit).toBe(25)
      })

      it('should default limit to 50', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages')

        const response = await GET(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.limit).toBe(50)
      })

      it('should handle invalid limit gracefully', async () => {
        const request = new NextRequest('http://localhost/api/agents/hub/messages?limit=invalid')

        const response = await GET(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.limit).toBe(50) // Falls back to default
      })

      it('should include businessId when provided', async () => {
        const request = new NextRequest(
          'http://localhost/api/agents/hub/messages?businessId=biz-123'
        )

        const response = await GET(request, { params: Promise.resolve({ id: 'hub' }) })

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.businessId).toBe('biz-123')
      })
    })
  })
})
