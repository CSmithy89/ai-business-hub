/**
 * Response from an agent run
 */
export interface AgentRunResponse {
  /**
   * Unique identifier for the agent run
   */
  runId: string;

  /**
   * Agent identifier
   */
  agentId: string;

  /**
   * Session identifier (for multi-turn conversations)
   */
  sessionId?: string;

  /**
   * Current status of the agent run
   */
  status: 'running' | 'completed' | 'failed' | 'pending';

  /**
   * Agent response content (when status is completed)
   */
  content?: string;

  /**
   * Structured response data
   */
  data?: Record<string, any>;

  /**
   * Error message (when status is failed)
   */
  error?: string;

  /**
   * Agent execution metadata
   */
  metadata?: {
    startedAt?: string;
    completedAt?: string;
    durationMs?: number;
    model?: string;
    tokensUsed?: number;
  };

  /**
   * Messages in the conversation (for multi-turn agents)
   */
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
}

/**
 * Stream event from an agent
 */
export interface AgentStreamEvent {
  /**
   * Event type
   */
  type: 'start' | 'chunk' | 'end' | 'error';

  /**
   * Run identifier
   */
  runId: string;

  /**
   * Content chunk (for chunk events)
   */
  content?: string;

  /**
   * Complete data (for end events)
   */
  data?: Record<string, any>;

  /**
   * Error message (for error events)
   */
  error?: string;

  /**
   * Event timestamp
   */
  timestamp: string;
}

/**
 * Error response from AgentOS
 */
export interface AgentErrorResponse {
  /**
   * HTTP status code
   */
  statusCode: number;

  /**
   * Error message
   */
  message: string;

  /**
   * Error code
   */
  error?: string;

  /**
   * Request correlation ID
   */
  correlationId?: string;
}
