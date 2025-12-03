# AgentOS Module

NestJS HTTP client for communicating with the Python AgentOS (FastAPI) service.

## Overview

The AgentOS module provides a bridge between the NestJS backend and the Python-based AgentOS service. It enables the NestJS API to invoke AI agents, retrieve results, and stream responses.

## Architecture

```
NestJS Backend (apps/api)
       |
       | HTTP/SSE
       v
AgentOS Service (FastAPI)
       |
       | Agno SDK
       v
AI Agents (Python)
```

## Installation

Dependencies are already installed:
```bash
pnpm add @nestjs/axios axios rxjs uuid
pnpm add -D @types/uuid
```

## Configuration

Add to your `.env` file:

```bash
# AgentOS Configuration
AGENTOS_URL=http://localhost:7777
AGENTOS_TIMEOUT_MS=60000
AGENTOS_RETRY_ATTEMPTS=3
```

## Usage

### Import the Module

```typescript
import { AgentOSModule } from './agentos/agentos.module';

@Module({
  imports: [
    // ... other imports
    AgentOSModule,
  ],
})
export class AppModule {}
```

### Inject the Service

```typescript
import { AgentOSService } from './agentos/agentos.service';

@Injectable()
export class MyService {
  constructor(private readonly agentOS: AgentOSService) {}
}
```

### Invoke an Agent

```typescript
const run = await this.agentOS.invokeAgent(
  'approval',                    // agentId
  {
    message: 'Should we approve this PR?',
    params: { prNumber: 123 },
  },
  'workspace-123',               // workspaceId
  'user-456',                    // userId
  'jwt-token',                   // optional JWT token
);

console.log(run.runId);          // Use this to poll for results
```

### Get Agent Run Status

```typescript
const result = await this.agentOS.getAgentRun(
  'approval',                    // agentId
  run.runId,                     // runId from invokeAgent
  'workspace-123',               // workspaceId
  'jwt-token',                   // optional JWT token
);

console.log(result.status);      // 'running' | 'completed' | 'failed'
console.log(result.content);     // Agent response (when completed)
```

### Poll Until Complete

```typescript
async pollUntilComplete(agentId: string, runId: string, workspaceId: string) {
  let result = await this.agentOS.getAgentRun(agentId, runId, workspaceId);

  while (result.status === 'running' || result.status === 'pending') {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    result = await this.agentOS.getAgentRun(agentId, runId, workspaceId);
  }

  if (result.status === 'failed') {
    throw new Error(result.error || 'Agent execution failed');
  }

  return result;
}
```

### Stream Agent Response (SSE)

```typescript
this.agentOS.streamAgentResponse(
  'approval',
  run.runId,
  'workspace-123',
  'jwt-token',
).subscribe({
  next: (event) => {
    switch (event.type) {
      case 'start':
        console.log('Stream started:', event.runId);
        break;
      case 'chunk':
        console.log('Content chunk:', event.content);
        break;
      case 'end':
        console.log('Stream complete:', event.data);
        break;
      case 'error':
        console.error('Stream error:', event.error);
        break;
    }
  },
  error: (err) => console.error('Stream connection error:', err),
  complete: () => console.log('Stream closed'),
});
```

## DTOs

### InvokeAgentDto

Request payload for invoking an agent:

```typescript
{
  message: string;              // Message or instruction for the agent
  params?: Record<string, any>; // Additional parameters
  userId?: string;              // User ID for audit logging
  sessionId?: string;           // Session ID for multi-turn conversations
  stream?: boolean;             // Whether to stream the response
}
```

### AgentRunResponse

Response from agent invocation or status check:

```typescript
{
  runId: string;                // Unique run identifier
  agentId: string;              // Agent identifier
  sessionId?: string;           // Session identifier
  status: 'running' | 'completed' | 'failed' | 'pending';
  content?: string;             // Agent response (when completed)
  data?: Record<string, any>;   // Structured response data
  error?: string;               // Error message (when failed)
  metadata?: {
    startedAt?: string;
    completedAt?: string;
    durationMs?: number;
    model?: string;
    tokensUsed?: number;
  };
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
}
```

### AgentStreamEvent

Server-Sent Event from streaming responses:

```typescript
{
  type: 'start' | 'chunk' | 'end' | 'error';
  runId: string;
  content?: string;             // Content chunk (for chunk events)
  data?: Record<string, any>;   // Complete data (for end events)
  error?: string;               // Error message (for error events)
  timestamp: string;
}
```

## Error Handling

The service automatically handles and transforms AgentOS errors:

| HTTP Status | NestJS Exception | Description |
|------------|------------------|-------------|
| No response | `ServiceUnavailableException` | AgentOS is down or unreachable |
| 401/403 | `UnauthorizedException` | Authentication failed |
| 503 | `ServiceUnavailableException` | AgentOS is unavailable |
| 504 | `GatewayTimeoutException` | Request timed out |
| Timeout | `GatewayTimeoutException` | Exceeded configured timeout |
| Other 5xx | `InternalServerErrorException` | Generic server error |

### Retry Logic

- Automatic retry with exponential backoff: **1s, 2s, 4s** (3 attempts total)
- Only retries on:
  - Network errors (no response)
  - 5xx server errors
  - 429 rate limit errors
- Never retries on 4xx client errors

### Example Error Handling

```typescript
try {
  const result = await this.agentOS.invokeAgent(...);
  return result;
} catch (error) {
  if (error instanceof ServiceUnavailableException) {
    // AgentOS is down - queue for later?
  } else if (error instanceof UnauthorizedException) {
    // Auth failed - refresh token?
  } else if (error instanceof GatewayTimeoutException) {
    // Timeout - try again or use shorter timeout?
  }
  throw error;
}
```

## Logging

The service logs all operations with correlation IDs for tracing:

```
[AgentOSService] Invoking agent: agentId=approval, workspaceId=ws-123, userId=user-456, correlationId=uuid
[AgentOSService] Agent invoked successfully: runId=run-789, duration=234ms, correlationId=uuid
[AgentOSService] Retrying agent invocation (attempt 2/3) after 2000ms
[AgentOSService] Agent invocation failed: agentId=approval, duration=5234ms, correlationId=uuid, error=Connection refused
```

## Advanced Features

### Correlation ID Tracking

All requests include a `x-correlation-id` header for distributed tracing:

```typescript
const headers = {
  'x-correlation-id': uuid(),    // Automatically generated
  'x-workspace-id': workspaceId, // For multi-tenancy
  'Authorization': `Bearer ${token}`, // If provided
};
```

### Multi-Tenant Isolation

All requests include the workspace ID for tenant isolation:

```typescript
headers['x-workspace-id'] = workspaceId;
```

### JWT Passthrough

JWT tokens are passed through from the incoming request:

```typescript
await this.agentOS.invokeAgent(
  'approval',
  params,
  workspaceId,
  userId,
  request.headers.authorization?.replace('Bearer ', ''), // Pass through token
);
```

## Testing

### Prerequisites

1. Start AgentOS service:
   ```bash
   cd agents
   python -m agents.platform.main
   ```

2. Verify it's running:
   ```bash
   curl http://localhost:7777/health
   ```

### Manual Testing

```typescript
// Test basic invocation
const run = await agentOS.invokeAgent('approval', {
  message: 'Test message',
}, 'test-workspace', 'test-user');

// Test status retrieval
const status = await agentOS.getAgentRun('approval', run.runId, 'test-workspace');

// Test streaming
agentOS.streamAgentResponse('approval', run.runId, 'test-workspace').subscribe(...);
```

### Error Scenarios

1. **AgentOS Down:**
   - Stop the AgentOS service
   - Try to invoke an agent
   - Should throw `ServiceUnavailableException`
   - Should retry 3 times with backoff

2. **Timeout:**
   - Set `AGENTOS_TIMEOUT_MS=1000`
   - Invoke a slow agent
   - Should throw `GatewayTimeoutException`

3. **Invalid Auth:**
   - Provide invalid JWT token
   - Should throw `UnauthorizedException`

## Integration Points

- **Story 04-10:** AgentOS Base Infrastructure (Python FastAPI)
- **Story 04-11:** Control Plane Connection (Session storage)
- **Story 04-13:** Approval Decision Agent (First consumer)

## Circuit Breaker

The service includes a circuit breaker pattern for resilience:

### States

| State | Behavior |
|-------|----------|
| `closed` | Normal operation, all requests allowed |
| `open` | All requests rejected with `ServiceUnavailableException` |
| `half-open` | Testing recovery - next successful request closes circuit |

### Configuration

```typescript
// Circuit breaker settings (hardcoded, not configurable via env)
const failureThreshold = 5;      // Opens after 5 consecutive failures
const circuitResetTimeMs = 30000; // 30 seconds before trying to recover
```

### Behavior

1. **Failure Tracking:** Each failed request increments failure count
2. **Opening:** After 5 failures, circuit opens
3. **Rejection:** Open circuit rejects all requests for 30 seconds
4. **Recovery Testing:** After 30s, circuit enters half-open state
5. **Closing:** First successful request in half-open state closes circuit

### Health Check

Use the health check method to verify AgentOS connectivity:

```typescript
const health = await this.agentOS.checkHealth();
console.log(health.healthy);        // true/false
console.log(health.status);         // 'ok' or error message
console.log(health.circuitState);   // 'closed' | 'open' | 'half-open'
console.log(health.responseTimeMs); // Response time in ms
```

## Control Plane Connection

Story 04-11: Configure Control Plane Connection

### Overview

The Control Plane manages agent session state, run history, and coordination between the NestJS API and Python AgentOS service.

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      NestJS Backend                          │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ AgentOSService  │────│  PrismaService  │                 │
│  │ (HTTP Client)   │    │  (Session Store)│                 │
│  └────────┬────────┘    └────────┬────────┘                 │
│           │                      │                          │
└───────────┼──────────────────────┼──────────────────────────┘
            │                      │
            │ HTTP/SSE             │ PostgreSQL
            │                      │
┌───────────┼──────────────────────┼──────────────────────────┐
│           ▼                      ▼                          │
│  ┌────────────────────────────────────────┐                 │
│  │           Python AgentOS               │                 │
│  │  ┌────────────┐  ┌────────────────┐    │                 │
│  │  │ FastAPI    │  │ Session Manager │   │                 │
│  │  │ Endpoints  │  │ (Redis/Memory)  │   │                 │
│  │  └────────────┘  └────────────────┘    │                 │
│  │           │                            │                 │
│  │           ▼                            │                 │
│  │  ┌────────────────────────────────┐    │                 │
│  │  │        Agno Agents             │    │                 │
│  │  │  - ApprovalAgent               │    │                 │
│  │  │  - (future agents)             │    │                 │
│  │  └────────────────────────────────┘    │                 │
│  └────────────────────────────────────────┘                 │
│              AgentOS Service                                │
└─────────────────────────────────────────────────────────────┘
```

### Session Management

Agent sessions enable multi-turn conversations with context persistence:

```typescript
// Start a new session
const run = await this.agentOS.invokeAgent(
  'approval',
  {
    message: 'Should we approve this social media post?',
    sessionId: 'session-123',  // Optional: reuse existing session
  },
  workspaceId,
  userId,
  token,
);

// Continue the conversation in same session
const followUp = await this.agentOS.invokeAgent(
  'approval',
  {
    message: 'What about the tone? Is it professional?',
    sessionId: run.sessionId,  // Same session = context preserved
  },
  workspaceId,
  userId,
  token,
);
```

### Run History

All agent runs are tracked for audit and debugging:

```typescript
// Get run details
const run = await this.agentOS.getAgentRun(
  'approval',
  runId,
  workspaceId,
  token,
);

// Run metadata includes:
// - startedAt, completedAt, durationMs
// - model used, tokens consumed
// - Full message history
// - Structured response data
```

### Confirmation Flow

For high-impact actions, agents can request human confirmation:

```typescript
// Agent response may include confirmation request
if (run.data?.requiresConfirmation) {
  // Present confirmation UI to user
  const confirmed = await presentConfirmation(run.data.confirmationDetails);

  // Submit confirmation to continue agent execution
  await this.agentOS.submitConfirmation(
    'approval',
    runId,
    run.data.confirmationId,
    confirmed,
    workspaceId,
    token,
  );
}
```

### Environment Variables

```bash
# Control Plane Configuration
AGENTOS_URL=http://localhost:7777     # AgentOS service URL
AGENTOS_TIMEOUT_MS=60000              # Request timeout
AGENTOS_RETRY_ATTEMPTS=3              # Retry count

# Session Storage (AgentOS side)
# Configured in agents/.env
REDIS_URL=redis://localhost:6379      # Session state storage
```

### Request Headers

All requests include these headers for control plane coordination:

| Header | Purpose |
|--------|---------|
| `x-workspace-id` | Multi-tenant isolation |
| `x-correlation-id` | Distributed tracing |
| `Authorization` | JWT passthrough for authentication |
| `Content-Type` | Always `application/json` |

### Error Recovery

The Control Plane handles these failure scenarios:

1. **Session Not Found:** Start new session automatically
2. **Stale Session:** Refresh session state from persistent storage
3. **Agent Failure:** Mark run as failed, preserve error context
4. **Network Partition:** Circuit breaker prevents cascade failures

## Future Enhancements

- [ ] WebSocket support for bi-directional communication
- [x] Circuit breaker pattern for resilience *(Implemented)*
- [ ] Request caching for identical requests
- [ ] Metrics collection (request count, latency, errors)
- [x] Health check endpoint integration *(Implemented)*
- [ ] Agent capability discovery

## Troubleshooting

### Connection Refused

**Problem:** `ECONNREFUSED` error when invoking agents

**Solution:**
1. Verify AgentOS is running: `curl http://localhost:7777/health`
2. Check `AGENTOS_URL` in `.env`
3. Ensure firewall allows connections to port 7777

### Timeout Errors

**Problem:** Requests time out frequently

**Solution:**
1. Increase `AGENTOS_TIMEOUT_MS` in `.env`
2. Check AgentOS performance (slow LLM responses?)
3. Consider using streaming for long-running agents

### Authentication Failures

**Problem:** 401/403 errors when invoking agents

**Solution:**
1. Verify JWT token is valid
2. Check token expiration
3. Ensure workspace ID matches token claims
4. Verify AgentOS authentication configuration

## Related Documentation

- [Story 04-12: Implement NestJS-AgentOS Bridge](/docs/stories/04-12-implement-nestjs-agentos-bridge.md)
- [AgentOS API Documentation](http://localhost:7777/docs)
- [Agno Framework Documentation](https://github.com/agno-agi/agno)
