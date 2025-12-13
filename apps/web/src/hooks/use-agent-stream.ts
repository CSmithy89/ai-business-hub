'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { z } from 'zod'
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
// Zod Schemas for Runtime Validation
// ============================================================================

const RunStartedEventSchema = z.object({
  type: z.literal(AGUIEventType.RUN_STARTED),
  runId: z.string(),
  agentId: z.string().optional(),
  timestamp: z.number().optional(),
})

const RunFinishedEventSchema = z.object({
  type: z.literal(AGUIEventType.RUN_FINISHED),
  runId: z.string(),
  status: z.enum(['success', 'error']),
})

const TextMessageChunkEventSchema = z.object({
  type: z.literal(AGUIEventType.TEXT_MESSAGE_CHUNK),
  delta: z.string(),
  messageId: z.string(),
})

const ThoughtChunkEventSchema = z.object({
  type: z.literal(AGUIEventType.THOUGHT_CHUNK),
  delta: z.string(),
  messageId: z.string(),
})

const ToolCallStartEventSchema = z.object({
  type: z.literal(AGUIEventType.TOOL_CALL_START),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
})

const ToolCallArgsEventSchema = z.object({
  type: z.literal(AGUIEventType.TOOL_CALL_ARGS),
  toolCallId: z.string(),
  argsDelta: z.string(),
})

const ToolCallResultEventSchema = z.object({
  type: z.literal(AGUIEventType.TOOL_CALL_RESULT),
  toolCallId: z.string(),
  result: z.string(),
  isError: z.boolean().optional(),
})

const UIRenderHintEventSchema = z.object({
  type: z.literal(AGUIEventType.UI_RENDER_HINT),
  component: z.string(),
  props: z.record(z.string(), z.unknown()),
})

const ErrorEventSchema = z.object({
  type: z.literal(AGUIEventType.ERROR),
  code: z.string(),
  message: z.string(),
})

const AGUIEventSchema = z.discriminatedUnion('type', [
  RunStartedEventSchema,
  RunFinishedEventSchema,
  TextMessageChunkEventSchema,
  ThoughtChunkEventSchema,
  ToolCallStartEventSchema,
  ToolCallArgsEventSchema,
  ToolCallResultEventSchema,
  UIRenderHintEventSchema,
  ErrorEventSchema,
])

// ============================================================================
// Event Payload Types (inferred from Zod schemas)
// ============================================================================

export type RunStartedEvent = z.infer<typeof RunStartedEventSchema>
export type RunFinishedEvent = z.infer<typeof RunFinishedEventSchema>
export type TextMessageChunkEvent = z.infer<typeof TextMessageChunkEventSchema>
export type ThoughtChunkEvent = z.infer<typeof ThoughtChunkEventSchema>
export type ToolCallStartEvent = z.infer<typeof ToolCallStartEventSchema>
export type ToolCallArgsEvent = z.infer<typeof ToolCallArgsEventSchema>
export type ToolCallResultEvent = z.infer<typeof ToolCallResultEventSchema>
export type UIRenderHintEvent = z.infer<typeof UIRenderHintEventSchema>
export type ErrorEvent = z.infer<typeof ErrorEventSchema>
export type AGUIEvent = z.infer<typeof AGUIEventSchema>

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

  // Tool calls in progress (using Record for serializability)
  toolCalls: Record<string, ToolCallState>

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

const createInitialState = (): AgentStreamState => ({
  status: 'idle',
  runId: null,
  content: '',
  thinking: '',
  toolCalls: {},
  renderHints: [],
  error: null,
  events: [],
})

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

  const [state, setState] = useState<AgentStreamState>(createInitialState)

  // Refs for cleanup and race condition prevention
  const abortControllerRef = useRef<AbortController | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const streamIdRef = useRef<number>(0) // Unique ID for each stream to prevent race conditions
  const contentRef = useRef<string>('') // Track content for onComplete callback

  // Store callbacks in refs to avoid stale closures
  const onEventRef = useRef(onEvent)
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onEventRef.current = onEvent
    onCompleteRef.current = onComplete
    onErrorRef.current = onError
  }, [onEvent, onComplete, onError])

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    contentRef.current = ''
    setState(createInitialState())
  }, [])

  /**
   * Abort current stream
   */
  const abort = useCallback(() => {
    // Invalidate current stream ID to prevent race conditions
    streamIdRef.current += 1

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (readerRef.current) {
      readerRef.current.cancel().catch(() => {
        // Ignore cancel errors
      })
      readerRef.current = null
    }
    setState(prev => ({
      ...prev,
      status: 'idle',
    }))
  }, [])

  /**
   * Parse and validate SSE data line into event
   */
  const parseSSELine = useCallback((line: string): AGUIEvent | null => {
    // SSE format: "data: {...}\n\n"
    if (!line.startsWith('data: ')) {
      return null
    }

    try {
      const jsonStr = line.slice(6) // Remove "data: " prefix
      const parsed = JSON.parse(jsonStr)

      // Validate with Zod schema
      const result = AGUIEventSchema.safeParse(parsed)
      if (!result.success) {
        console.warn('[useAgentStream] Invalid event structure:', result.error.issues)
        return null
      }

      return result.data
    } catch (err) {
      console.error('[useAgentStream] Failed to parse SSE event:', err, line)
      return null
    }
  }, [])

  /**
   * Process a single AG-UI event
   * Returns the new content value for tracking
   */
  const processEvent = useCallback(
    (event: AGUIEvent, currentStreamId: number): void => {
      // Prevent processing events from stale streams
      if (currentStreamId !== streamIdRef.current) {
        return
      }

      // Call onEvent callback if provided (use ref to avoid stale closure)
      onEventRef.current?.(event)

      setState(prev => {
        // Double-check stream ID hasn't changed during setState
        if (currentStreamId !== streamIdRef.current) {
          return prev
        }

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
              // Use ref for current content to avoid stale closure
              onCompleteRef.current?.(contentRef.current)
            }
            break

          case AGUIEventType.TEXT_MESSAGE_CHUNK:
            newState.content = prev.content + event.delta
            // Update ref for onComplete callback
            contentRef.current = newState.content
            break

          case AGUIEventType.THOUGHT_CHUNK:
            newState.thinking = prev.thinking + event.delta
            break

          case AGUIEventType.TOOL_CALL_START: {
            newState.toolCalls = {
              ...prev.toolCalls,
              [event.toolCallId]: {
                id: event.toolCallId,
                name: event.toolName,
                args: event.args ? JSON.stringify(event.args) : '',
                status: 'running',
              },
            }
            break
          }

          case AGUIEventType.TOOL_CALL_ARGS: {
            const existing = prev.toolCalls[event.toolCallId]
            if (existing) {
              newState.toolCalls = {
                ...prev.toolCalls,
                [event.toolCallId]: {
                  ...existing,
                  args: existing.args + event.argsDelta,
                },
              }
            }
            break
          }

          case AGUIEventType.TOOL_CALL_RESULT: {
            const existing = prev.toolCalls[event.toolCallId]
            if (existing) {
              newState.toolCalls = {
                ...prev.toolCalls,
                [event.toolCallId]: {
                  ...existing,
                  result: event.result,
                  isError: event.isError,
                  status: event.isError ? 'error' : 'completed',
                },
              }
            }
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
            onErrorRef.current?.(error)
            break
          }
        }

        return newState
      })
    },
    [collectEvents]
  )

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

      // Generate new stream ID for race condition prevention
      streamIdRef.current += 1
      const currentStreamId = streamIdRef.current

      // Reset content ref
      contentRef.current = ''

      // Reset state
      setState({
        ...createInitialState(),
        status: 'connecting',
      })

      // Get auth token
      const token = getCurrentSessionToken()
      if (!token) {
        const error = new Error('No authentication token found. Please sign in.')
        if (currentStreamId === streamIdRef.current) {
          setState(prev => ({
            ...prev,
            status: 'error',
            error,
          }))
          onErrorRef.current?.(error)
        }
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

        // Check if stream was aborted while waiting for response
        if (currentStreamId !== streamIdRef.current) {
          return
        }

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Agent API error (${response.status}): ${errorText}`)
        }

        // Check if we got a streaming response
        const contentType = response.headers.get('content-type')
        if (!contentType?.includes('text/event-stream')) {
          // Non-streaming response - parse as JSON
          const data = await response.json()
          if (currentStreamId !== streamIdRef.current) {
            return
          }
          if (data.content) {
            processEvent(
              {
                type: AGUIEventType.RUN_STARTED,
                runId: data.session_id || 'unknown',
              },
              currentStreamId
            )
            processEvent(
              {
                type: AGUIEventType.TEXT_MESSAGE_CHUNK,
                delta: data.content,
                messageId: 'msg_1',
              },
              currentStreamId
            )
            processEvent(
              {
                type: AGUIEventType.RUN_FINISHED,
                runId: data.session_id || 'unknown',
                status: 'success',
              },
              currentStreamId
            )
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
          // Check for abort before each read
          if (currentStreamId !== streamIdRef.current) {
            reader.cancel().catch(() => {})
            break
          }

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
                processEvent(event, currentStreamId)
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim() && currentStreamId === streamIdRef.current) {
          const event = parseSSELine(buffer)
          if (event) {
            processEvent(event, currentStreamId)
          }
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        // Ignore errors from stale streams
        if (currentStreamId !== streamIdRef.current) {
          return
        }

        const error = err instanceof Error ? err : new Error('Unknown streaming error')
        setState(prev => ({
          ...prev,
          status: 'error',
          error,
        }))
        onErrorRef.current?.(error)
      } finally {
        // Only clean up if this is still the current stream
        if (currentStreamId === streamIdRef.current) {
          abortControllerRef.current = null
          readerRef.current = null
        }
      }
    },
    [abort, baseURL, processEvent, parseSSELine]
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
