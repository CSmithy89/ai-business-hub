# Story 04-12: Implement NestJS-AgentOS Bridge

**Story ID:** 04-12
**Epic:** EPIC-04 - Approval Queue System
**Points:** 5
**Priority:** P0
**Status:** done

---

## User Story

**As a** backend developer
**I want** a NestJS service to communicate with AgentOS
**So that** the NestJS API can invoke Python agents and retrieve results

---

## Acceptance Criteria

- [x] Create `AgentOSModule` at `apps/api/src/agentos/`
- [x] Create `AgentOSService` with HTTP client for AgentOS communication
- [x] Create DTOs for agent invocation requests and responses
- [x] Implement `invokeAgent()` method with retry logic
- [x] Implement `getAgentRun()` method to retrieve run status
- [x] Implement `streamAgentResponse()` for SSE streaming
- [x] Add error handling for all failure scenarios
- [x] Add exponential backoff retry logic (1s, 2s, 4s)
- [x] Add correlation ID tracking for requests
- [x] Add comprehensive logging for debugging
- [x] Configure environment variables in `.env.example`
- [x] Import `AgentOSModule` in `AppModule`
- [x] Install required dependencies (@nestjs/axios, axios, uuid)

---

## Technical Implementation

### Backend Changes

#### 1. AgentOS Module Structure

**Directory:** `apps/api/src/agentos/`

```
apps/api/src/agentos/
├── agentos.module.ts          # Module definition with HttpModule
├── agentos.service.ts         # HTTP client service
├── dto/
│   ├── invoke-agent.dto.ts    # Request DTOs
│   └── agent-response.dto.ts  # Response DTOs
└── index.ts                   # Barrel export
```

#### 2. AgentOSService Methods

**File:** `apps/api/src/agentos/agentos.service.ts`

**Core Methods:**

1. **invokeAgent()**
   - POST to `/agents/{agentId}/runs`
   - Returns `AgentRunResponse` with runId
   - Includes retry logic with exponential backoff
   - Timeout: 60 seconds (configurable)
   - Headers: Authorization, Content-Type, x-workspace-id, x-correlation-id

2. **getAgentRun()**
   - GET from `/agents/{agentId}/runs/{runId}`
   - Returns current run status and response
   - Includes retry logic
   - Used to poll for completion

3. **streamAgentResponse()**
   - GET from `/agents/{agentId}/runs/{runId}/stream`
   - Returns Observable<AgentStreamEvent>
   - Server-Sent Events (SSE) streaming
   - Timeout: 120 seconds (2x normal)

#### 3. Error Handling

**Error Mapping:**

| HTTP Status | NestJS Exception | Retry? |
|------------|------------------|--------|
| No response | ServiceUnavailableException | Yes |
| 401/403 | UnauthorizedException | No |
| 429 | (retry) | Yes |
| 5xx | ServiceUnavailableException | Yes |
| Timeout | GatewayTimeoutException | No |
| Other | InternalServerErrorException | No |

**Retry Logic:**
- Exponential backoff: 1s, 2s, 4s (3 attempts total)
- Only retry on network errors and 5xx responses
- Never retry on 4xx client errors

#### 4. DTOs

**InvokeAgentDto:**
```typescript
{
  message: string;
  params?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  stream?: boolean;
}
```

**AgentRunResponse:**
```typescript
{
  runId: string;
  agentId: string;
  sessionId?: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  content?: string;
  data?: Record<string, any>;
  error?: string;
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

**AgentStreamEvent:**
```typescript
{
  type: 'start' | 'chunk' | 'end' | 'error';
  runId: string;
  content?: string;
  data?: Record<string, any>;
  error?: string;
  timestamp: string;
}
```

#### 5. Configuration

**Environment Variables (`.env.example`):**
```bash
# AgentOS Configuration (Story 04-12)
AGENTOS_URL=http://localhost:7777
AGENTOS_TIMEOUT_MS=60000
AGENTOS_RETRY_ATTEMPTS=3
```

**Module Configuration:**
- HttpModule with 60s timeout
- ConfigModule for environment variables
- Export AgentOSService for use in other modules

#### 6. Logging

**Log Events:**
- Agent invocation start (with correlation ID)
- Agent invocation success (with duration)
- Agent invocation failure (with error details)
- Retry attempts (with attempt number and delay)
- Stream start/end events
- All errors with full context

**Log Format:**
```typescript
this.logger.log(
  `Invoking agent: agentId=${agentId}, workspaceId=${workspaceId}, userId=${userId}, correlationId=${correlationId}`
);
```

---

## Dependencies

**Installed:**
- `@nestjs/axios` - NestJS wrapper for axios HTTP client
- `axios` - HTTP client for making requests
- `rxjs` - Reactive programming for streams
- `uuid` - Generate correlation IDs
- `@types/uuid` - TypeScript types for uuid

---

## Integration with AppModule

**File:** `apps/api/src/app.module.ts`

```typescript
import { AgentOSModule } from './agentos/agentos.module';

@Module({
  imports: [
    // ... existing imports
    AgentOSModule,
  ],
})
export class AppModule {}
```

---

## Usage Example

```typescript
import { AgentOSService } from './agentos/agentos.service';

@Injectable()
export class SomeService {
  constructor(private readonly agentOS: AgentOSService) {}

  async callAgent() {
    // Invoke agent
    const run = await this.agentOS.invokeAgent(
      'approval',
      {
        message: 'Should we approve this PR?',
        params: { prNumber: 123 },
      },
      'workspace-123',
      'user-456',
      'jwt-token',
    );

    // Poll for completion
    let result = await this.agentOS.getAgentRun(
      'approval',
      run.runId,
      'workspace-123',
      'jwt-token',
    );

    while (result.status === 'running') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      result = await this.agentOS.getAgentRun(
        'approval',
        run.runId,
        'workspace-123',
        'jwt-token',
      );
    }

    return result;
  }

  streamAgent() {
    // Stream response
    return this.agentOS.streamAgentResponse(
      'approval',
      'run-123',
      'workspace-123',
      'jwt-token',
    ).subscribe({
      next: (event) => console.log('Event:', event),
      error: (err) => console.error('Error:', err),
      complete: () => console.log('Stream complete'),
    });
  }
}
```

---

## Testing Notes

**Manual Testing:**
1. Ensure AgentOS is running at `http://localhost:7777`
2. Test agent invocation with valid parameters
3. Test error handling (stop AgentOS, test timeout)
4. Test retry logic (return 503 from AgentOS)
5. Test streaming responses

**Integration Points:**
- Story 04-10: AgentOS Python service must be running
- Story 04-11: Session storage in PostgreSQL
- Future stories will use this service to invoke approval agents

---

## Related Stories

- **04-10:** Create AgentOS Base Infrastructure (Python FastAPI)
- **04-11:** Configure Control Plane Connection (Session storage)
- **04-13:** Implement Approval Decision Agent (Uses this bridge)

---

## Files Created

1. `apps/api/src/agentos/agentos.module.ts` - Module definition
2. `apps/api/src/agentos/agentos.service.ts` - HTTP client service
3. `apps/api/src/agentos/dto/invoke-agent.dto.ts` - Request DTOs
4. `apps/api/src/agentos/dto/agent-response.dto.ts` - Response DTOs
5. `apps/api/src/agentos/index.ts` - Barrel exports

## Files Modified

1. `apps/api/src/app.module.ts` - Added AgentOSModule import
2. `apps/api/.env.example` - Added AGENTOS_* configuration variables
3. `apps/api/package.json` - Added dependencies (@nestjs/axios, axios, uuid)

---

## Story Completion

**Status:** DONE ✓

All acceptance criteria met:
- ✓ AgentOSModule created with full HTTP client implementation
- ✓ AgentOSService with all three methods (invoke, get, stream)
- ✓ Complete DTOs for requests and responses
- ✓ Exponential backoff retry logic (1s, 2s, 4s)
- ✓ Comprehensive error handling and mapping
- ✓ Correlation ID tracking for all requests
- ✓ Detailed logging for debugging
- ✓ Environment variables configured
- ✓ Module integrated into AppModule
- ✓ Dependencies installed and verified

**Implementation Date:** December 3, 2025
**Developer:** Claude Code
