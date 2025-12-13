'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { getCurrentSessionToken } from '@/lib/auth-client'
import type { AgentTeam } from '@/lib/agent-client'

// ============================================================================
// AG-UI Event Types (matches backend ag_ui/encoder.py)
// ============================================================================

/**
 * AG-UI Event Types from the protocol specification
 * @see docs/architecture/ag-ui-protocol.md
 */
export enum AGUIEventType {
  // Lifecycle Events
  RUN_STARTED = 'RUN_STARTED',
  RUN_FINISHED = 'RUN_FINISHED',

  // Text Streaming Events
  TEXT_MESSAGE_CHUNK = 'TEXT_MESSAGE_CHUNK',

  // Reasoning/Thinking Events
  THOUGHT_CHUNK = 'THOUGHT_CHUNK',

  // Tool Execution Events
  TOOL_CALL_START = 'TOOL_CALL_START',
  TOOL_CALL_ARGS = 'TOOL_CALL_ARGS',
  TOOL_CALL_RESULT = 'TOOL_CALL_RESULT',

  // Rich UI Events
  UI_RENDER_HINT = 'UI_RENDER_HINT',

  // Error Events
  ERROR = 'ERROR',
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface RunStartedEvent {
  type: AGUIEventType.RUN_STARTED
  runId: string
  agentId?: string
  timestamp?: number
}

export interface RunFinishedEvent {
  type: AGUIEventType.RUN_FINISHED
  runId: string
  status: 'success' | 'error'
}

export interface TextMessageChunkEvent {
  type: AGUIEventType.TEXT_MESSAGE_CHUNK
  delta: string
  messageId: string
}

export interface ThoughtChunkEvent {
  type: AGUIEventType.THOUGHT_CHUNK
  delta: string
  messageId: string
}

export interface ToolCallStartEvent {
  type: AGUIEventType.TOOL_CALL_START
  toolCallId: string
  toolName: string
  args?: Record<string, unknown>
}

export interface ToolCallArgsEvent {
  type: AGUIEventType.TOOL_CALL_ARGS
  toolCallId: string
  argsDelta: string
}

export interface ToolCallResultEvent {
  type: AGUIEventType.TOOL_CALL_RESULT
  toolCallId: string
  result: string
  isError?: boolean
}

export interface UIRenderHintEvent {
  type: AGUIEventType.UI_RENDER_HINT
  component: string
  props: Record<string, unknown>
}

export interface ErrorEvent {
  type: AGUIEventType.ERROR
  code: string
  message: string
}

export type AGUIEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | TextMessageChunkEvent
  | ThoughtChunkEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallResultEvent
  | UIRenderHintEvent
  | ErrorEvent

// ============================================================================
// Tool Call State
// ============================================================================

export interface ToolCallState {
  id: string
  name: string
  args: string
  result?: string
  isError?: boolean
  status: 'pending' | 'running' | 'completed' | 'error'
}

// ============================================================================
// Stream State
// ============================================================================

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error'

export interface AgentStreamState {
  // Connection status
  status: StreamStatus
  runId: string | null

  // Accumulated text content
  content: string

  // Accumulated thinking/reasoning
  thinking: string

  // Tool calls in progress
  toolCalls: Map<string, ToolCallState>

  // UI render hints received
  renderHints: UIRenderHintEvent[]

  // Error if any
  error: Error | null

  // Raw events for debugging
  events: AGUIEvent[]
}

// ============================================================================
// Hook Options
// ============================================================================

export interface UseAgentStreamOptions {
  /**
   * Callback fired for each event received
   */
  onEvent?: (event: AGUIEvent) => void

  /**
   * Callback fired when streaming completes
   */
  onComplete?: (content: string) => void

  /**
   * Callback fired on error
   */
  onError?: (error: Error) => void

  /**
   * Whether to collect raw events (for debugging)
   * @default false
   */
  collectEvents?: boolean

  /**
   * Agent API base URL
   * @default process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:8001'
   */
  baseURL?: string
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseAgentStreamReturn {
  /**
   * Current stream state
   */
  state: AgentStreamState

  /**
   * Start streaming from an agent team
   */
  stream: (
    team: AgentTeam,
    request: {
      message: string
      business_id: string
      session_id?: string
      model_override?: string
      context?: Record<string, unknown>
    }
  ) => void

  /**
   * Abort the current stream
   */
  abort: () => void

  /**
   * Reset state to initial values
   */
  reset: () => void

  /**
   * Whether currently streaming
   */
  isStreaming: boolean

  /**
   * Accumulated content text
   */
  content: string

  /**
   * Accumulated thinking text
   */
  thinking: string
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: AgentStreamState = {
  status: 'idle',
  runId: null,
  content: '',
  thinking: '',
  toolCalls: new Map(),
  renderHints: [],
  error: null,
  events: [],
}

// ============================================================================
// useAgentStream Hook
// ============================================================================

/**
 * useAgentStream - SSE streaming hook for AG-UI protocol
 *
 * Connects to agent endpoints with stream=true and processes AG-UI events
 * in real-time. Provides accumulated content, thinking, and tool call states.
 *
 * @param options - Hook options
 * @returns Stream state and control functions
 *
 * @example
 * ```tsx
 * const { stream, content, isStreaming, abort } = useAgentStream({
 *   onComplete: (content) => console.log('Done:', content),
 * })
 *
 * // Start streaming
 * stream('validation', {
 *   message: 'Validate this business idea...',
 *   business_id: 'biz_123',
 * })
 *
 * // Display content as it streams
 * return <div>{content}</div>
 * ```
 *
 * @see docs/architecture/ag-ui-protocol.md
 */
export function useAgentStream(options: UseAgentStreamOptions = {}): UseAgentStreamReturn {
  const {
    onEvent,
    onComplete,
    onError,
    collectEvents = false,
    baseURL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:8001',
  } = options

  const [state, setState] = useState<AgentStreamState>(initialState)
  const abortControllerRef = useRef<AbortController | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  /**
   * Abort current stream
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (readerRef.current) {
      readerRef.current.cancel()
      readerRef.current = null
    }
    setState(prev => ({
      ...prev,
      status: 'idle',
    }))
  }, [])

  /**
   * Process a single AG-UI event
   */
  const processEvent = useCallback(
    (event: AGUIEvent) => {
      // Call onEvent callback if provided
      onEvent?.(event)

      setState(prev => {
        const newState = { ...prev }

        // Collect raw events if enabled
        if (collectEvents) {
          newState.events = [...prev.events, event]
        }

        switch (event.type) {
          case AGUIEventType.RUN_STARTED:
            newState.status = 'streaming'
            newState.runId = event.runId
            break

          case AGUIEventType.RUN_FINISHED:
            newState.status = event.status === 'success' ? 'completed' : 'error'
            if (event.status === 'success') {
              onComplete?.(prev.content)
            }
            break

          case AGUIEventType.TEXT_MESSAGE_CHUNK:
            newState.content = prev.content + event.delta
            break

          case AGUIEventType.THOUGHT_CHUNK:
            newState.thinking = prev.thinking + event.delta
            break

          case AGUIEventType.TOOL_CALL_START: {
            const newToolCalls = new Map(prev.toolCalls)
            newToolCalls.set(event.toolCallId, {
              id: event.toolCallId,
              name: event.toolName,
              args: event.args ? JSON.stringify(event.args) : '',
              status: 'running',
            })
            newState.toolCalls = newToolCalls
            break
          }

          case AGUIEventType.TOOL_CALL_ARGS: {
            const newToolCalls = new Map(prev.toolCalls)
            const existing = newToolCalls.get(event.toolCallId)
            if (existing) {
              newToolCalls.set(event.toolCallId, {
                ...existing,
                args: existing.args + event.argsDelta,
              })
            }
            newState.toolCalls = newToolCalls
            break
          }

          case AGUIEventType.TOOL_CALL_RESULT: {
            const newToolCalls = new Map(prev.toolCalls)
            const existing = newToolCalls.get(event.toolCallId)
            if (existing) {
              newToolCalls.set(event.toolCallId, {
                ...existing,
                result: event.result,
                isError: event.isError,
                status: event.isError ? 'error' : 'completed',
              })
            }
            newState.toolCalls = newToolCalls
            break
          }

          case AGUIEventType.UI_RENDER_HINT:
            newState.renderHints = [...prev.renderHints, event]
            break

          case AGUIEventType.ERROR: {
            const error = new Error(event.message)
            error.name = event.code
            newState.error = error
            newState.status = 'error'
            onError?.(error)
            break
          }
        }

        return newState
      })
    },
    [onEvent, onComplete, onError, collectEvents]
  )

  /**
   * Parse SSE data line into event
   */
  const parseSSELine = useCallback((line: string): AGUIEvent | null => {
    // SSE format: "data: {...}\n\n"
    if (!line.startsWith('data: ')) {
      return null
    }

    try {
      const jsonStr = line.slice(6) // Remove "data: " prefix
      return JSON.parse(jsonStr) as AGUIEvent
    } catch (err) {
      console.error('[useAgentStream] Failed to parse SSE event:', err, line)
      return null
    }
  }, [])

  /**
   * Start streaming from an agent team
   */
  const stream = useCallback(
    async (
      team: AgentTeam,
      request: {
        message: string
        business_id: string
        session_id?: string
        model_override?: string
        context?: Record<string, unknown>
      }
    ) => {
      // Abort any existing stream
      abort()

      // Reset state
      setState({
        ...initialState,
        status: 'connecting',
      })

      // Get auth token
      const token = getCurrentSessionToken()
      if (!token) {
        const error = new Error('No authentication token found. Please sign in.')
        setState(prev => ({
          ...prev,
          status: 'error',
          error,
        }))
        onError?.(error)
        return
      }

      // Create abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      const url = `${baseURL}/agents/${team}/runs`

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            ...request,
            stream: true, // Enable SSE streaming
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Agent API error (${response.status}): ${errorText}`)
        }

        // Check if we got a streaming response
        const contentType = response.headers.get('content-type')
        if (!contentType?.includes('text/event-stream')) {
          // Non-streaming response - parse as JSON
          const data = await response.json()
          if (data.content) {
            processEvent({
              type: AGUIEventType.RUN_STARTED,
              runId: data.session_id || 'unknown',
            })
            processEvent({
              type: AGUIEventType.TEXT_MESSAGE_CHUNK,
              delta: data.content,
              messageId: 'msg_1',
            })
            processEvent({
              type: AGUIEventType.RUN_FINISHED,
              runId: data.session_id || 'unknown',
              status: 'success',
            })
          }
          return
        }

        // Process streaming response
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('Response body is not readable')
        }
        readerRef.current = reader

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true })

          // Process complete events (separated by double newline)
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || '' // Keep incomplete part in buffer

          for (const part of parts) {
            const lines = part.split('\n')
            for (const line of lines) {
              const event = parseSSELine(line)
              if (event) {
                processEvent(event)
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          const event = parseSSELine(buffer)
          if (event) {
            processEvent(event)
          }
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        const error = err instanceof Error ? err : new Error('Unknown streaming error')
        setState(prev => ({
          ...prev,
          status: 'error',
          error,
        }))
        onError?.(error)
      } finally {
        abortControllerRef.current = null
        readerRef.current = null
      }
    },
    [abort, baseURL, processEvent, parseSSELine, onError]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort()
    }
  }, [abort])

  return {
    state,
    stream,
    abort,
    reset,
    isStreaming: state.status === 'connecting' || state.status === 'streaming',
    content: state.content,
    thinking: state.thinking,
  }
}
