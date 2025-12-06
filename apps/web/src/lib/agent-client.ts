/**
 * Agent API Client
 *
 * Centralized client for communicating with the FastAPI agent endpoints.
 * Handles authentication, error handling, and type-safe requests/responses.
 *
 * Story: 11.4 - Connect Frontend Workflow Pages
 */

'use client'

import { getCurrentSessionToken } from '@/lib/auth-client'
import { AgentResponseSchema, AgentResponseValidated } from './agent-schemas'

// ============================================================================
// Types
// ============================================================================

/**
 * Request payload for agent team runs
 */
export interface AgentRequest {
  message: string
  business_id: string
  session_id?: string
  model_override?: string
  context?: Record<string, unknown>
}

/**
 * Response from agent team runs
 */
export interface AgentResponse {
  success: boolean
  content?: string
  session_id: string
  agent_name?: string
  error?: string
  metadata: {
    business_id: string
    team: string
    workspace_id?: string
    [key: string]: unknown
  }
}

/**
 * Agent team types
 */
export type AgentTeam = 'validation' | 'planning' | 'branding'

/**
 * Error thrown by agent API calls
 */
export class AgentAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: AgentResponse
  ) {
    super(message)
    this.name = 'AgentAPIError'
  }
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Base URL for agent API (FastAPI on port 8001)
 * Falls back to localhost if not configured
 */
const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:8001'

/**
 * Default request timeout (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000

// ============================================================================
// Agent Client
// ============================================================================

/**
 * Centralized client for agent API calls
 */
export class AgentClient {
  private baseURL: string
  private timeout: number

  constructor(baseURL: string = AGENT_API_URL, timeout: number = DEFAULT_TIMEOUT) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  /**
   * Get JWT token from current session
   * @throws {AgentAPIError} If no valid session token found
   */
  private getAuthToken(): string {
    const token = getCurrentSessionToken()
    if (!token) {
      throw new AgentAPIError('No authentication token found. Please sign in.', 401)
    }
    return token
  }

  /**
   * Make authenticated request to agent endpoint
   *
   * @param team - Agent team to call (validation, planning, branding)
   * @param request - Request payload
   * @returns Promise<AgentResponse>
   * @throws {AgentAPIError} On authentication, network, or API errors
   */
  private async makeRequest(team: AgentTeam, request: AgentRequest): Promise<AgentResponse> {
    const token = this.getAuthToken()
    const url = `${this.baseURL}/agents/${team}/runs`

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Parse response body with error handling
      const rawText = await response.text()
      let data: AgentResponse
      try {
        data = rawText ? (JSON.parse(rawText) as AgentResponse) : ({} as AgentResponse)
      } catch {
        throw new AgentAPIError(
          rawText || `Invalid JSON response from agent API (status ${response.status})`,
          response.status
        )
      }

      // Handle non-200 responses
      if (!response.ok) {
        throw new AgentAPIError(
          data.error || `Agent API returned ${response.status}`,
          response.status,
          data
        )
      }

      // Runtime validation of response shape
      const parsed = AgentResponseSchema.safeParse(data)
      if (!parsed.success) {
        throw new AgentAPIError(
          `Invalid agent response: ${parsed.error.message}`,
          response.status,
          data
        )
      }

      const validated: AgentResponseValidated = parsed.data

      // Handle unsuccessful agent responses
      if (!validated.success) {
        throw new AgentAPIError(
          validated.error || 'Agent execution failed',
          response.status,
          validated
        )
      }

      return validated
    } catch (error) {
      clearTimeout(timeoutId)

      // Re-throw AgentAPIError as-is
      if (error instanceof AgentAPIError) {
        throw error
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AgentAPIError(`Request timeout after ${this.timeout}ms`, 408)
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new AgentAPIError(
          `Network error: Unable to reach agent API at ${this.baseURL}`,
          0
        )
      }

      // Generic error fallback
      throw new AgentAPIError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500
      )
    }
  }

  /**
   * Call validation team (Vera's team)
   *
   * @param request - Validation request
   * @returns Promise<AgentResponse>
   */
  async runValidation(request: AgentRequest): Promise<AgentResponse> {
    return this.makeRequest('validation', request)
  }

  /**
   * Call planning team (Blake's team)
   *
   * @param request - Planning request
   * @returns Promise<AgentResponse>
   */
  async runPlanning(request: AgentRequest): Promise<AgentResponse> {
    return this.makeRequest('planning', request)
  }

  /**
   * Call branding team (Bella's team)
   *
   * @param request - Branding request
   * @returns Promise<AgentResponse>
   */
  async runBranding(request: AgentRequest): Promise<AgentResponse> {
    return this.makeRequest('branding', request)
  }

  /**
   * Check health of a specific agent team
   *
   * @param team - Team to check
   * @returns Promise with health status
   */
  async checkHealth(team: AgentTeam): Promise<{ status: string; [key: string]: unknown }> {
    const url = `${this.baseURL}/agents/${team}/health`

    try {
      const response = await fetch(url)
      return await response.json()
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed',
      }
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default agent client instance
 * Use this for all agent API calls
 */
export const agentClient = new AgentClient()

// ============================================================================
// Convenience Hooks (Optional - for future enhancement)
// ============================================================================

/**
 * Note: SSE streaming support placeholder
 *
 * The FastAPI endpoints don't yet support SSE streaming (as of Story 11.3).
 * This is a placeholder for future enhancement when SSE is added to the backend.
 *
 * Future implementation would look like:
 *
 * export function useAgentStream(team: AgentTeam, request: AgentRequest) {
 *   const [messages, setMessages] = useState<string[]>([])
 *   const [isStreaming, setIsStreaming] = useState(false)
 *   const [error, setError] = useState<Error | null>(null)
 *
 *   const stream = async () => {
 *     const token = getCurrentSessionToken()
 *     const url = `${AGENT_API_URL}/agents/${team}/runs/stream`
 *     const eventSource = new EventSource(url, {
 *       headers: { Authorization: `Bearer ${token}` }
 *     })
 *
 *     eventSource.onmessage = (event) => {
 *       setMessages(prev => [...prev, event.data])
 *     }
 *
 *     eventSource.onerror = (err) => {
 *       setError(new Error('Streaming failed'))
 *       eventSource.close()
 *     }
 *   }
 *
 *   return { messages, isStreaming, error, stream }
 * }
 */
