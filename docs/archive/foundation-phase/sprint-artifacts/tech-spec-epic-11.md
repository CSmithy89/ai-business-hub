# Epic 11 Technical Specification: Agent Integration

**Epic ID:** EPIC-11
**Status:** Contexted
**Priority:** P0 - Critical
**Total Stories:** 5
**Total Points:** 13

---

## Overview

Epic 11 wires existing Agno agent teams (Validation, Planning, Branding) to FastAPI endpoints and connects frontend workflow pages to real agent APIs. The agent code already exists (~55K lines across 3 teams with 16 agents) - this epic exposes it via API and integrates it with the frontend.

**Business Value:** Unlocks the full AI-powered platform promise. 16 agents across 3 teams become operational, enabling the core business onboarding workflows that differentiate HYVVE in the market.

---

## Architecture

### Current State

The AgentOS runtime (`agents/main.py`) currently exposes:

```python
# Existing endpoint pattern (ApprovalAgent)
@app.post("/agents/approval/runs", response_model=AgentRunResponse)
async def run_approval_agent(request_data: AgentRunRequest, req: Request):
    """
    Run the ApprovalAgent with a user message.

    Security:
    - Requires valid JWT token (validated by TenantMiddleware)
    - Workspace context extracted from JWT
    - All tool calls use workspace-scoped permissions

    Request Body:
    - message: User's message/query for the agent
    - session_id: Optional session ID for conversation continuity
    - model_override: Optional model override (default: gpt-4o)
    """
    # Extract workspace context from middleware
    workspace_id = getattr(req.state, "workspace_id", None)
    user_id = getattr(req.state, "user_id", None)
    jwt_token = getattr(req.state, "jwt_token", None)

    # Run agent
    response = await approval_agent.run(
        message=request_data.message,
        workspace_id=workspace_id,
        user_id=user_id,
        jwt_token=jwt_token,
        model_override=request_data.model_override,
        session_id=request_data.session_id,
    )

    return AgentRunResponse(**response)
```

**Key Patterns:**
- **TenantMiddleware** extracts `workspace_id` and `user_id` from JWT token
- **Request/Response Models** using Pydantic (AgentRunRequest, AgentRunResponse)
- **SSE Streaming** not yet implemented (but needed for real-time chat)
- **Agent Initialization** happens at module level
- **PostgresStorage** configured for session persistence

### Target State

Add 3 new team endpoints following the same pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Validation  │  │   Planning   │  │   Branding   │      │
│  │    Page      │  │    Page      │  │    Page      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              agent-client.ts (SSE Client)                    │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI (agents/main.py)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /validation  │  │  /planning   │  │  /branding   │      │
│  │    /runs     │  │    /runs     │  │    /runs     │      │
│  │   /health    │  │   /health    │  │   /health    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agno Agent Teams                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Vera's Team  │  │ Blake's Team │  │ Bella's Team │      │
│  │  5 agents    │  │  5 agents    │  │  6 agents    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Decisions

### API Design

#### Endpoint Pattern

Follow the existing ApprovalAgent pattern:

```python
# POST /agents/{team_type}/runs
# - team_type: validation | planning | branding

class TeamRunRequest(BaseModel):
    """Request model for team run endpoint."""
    message: str
    session_id: Optional[str] = None
    business_id: str  # Required for team context
    model_override: Optional[str] = None
    context: Optional[Dict[str, Any]] = None  # For workflow handoff data

class TeamRunResponse(BaseModel):
    """Response model for team run endpoint."""
    success: bool
    content: Optional[str] = None
    session_id: str
    agent_name: Optional[str] = None  # Which agent responded
    error: Optional[str] = None
    metadata: Dict[str, Any] = {}
```

#### SSE Streaming Approach

For real-time chat updates, implement Server-Sent Events (SSE):

```python
from fastapi.responses import StreamingResponse
from agno.agent import Agent, RunResponse

async def run_team_stream(
    team: Team,
    message: str,
    session_id: str,
    workspace_id: str,
    user_id: str,
):
    """Stream team responses via SSE."""

    async def event_generator():
        # Use Agno's async streaming
        async for chunk in team.astream(
            message=message,
            session_id=session_id,
            user_id=user_id,
        ):
            # Convert chunk to SSE format
            yield f"data: {chunk.model_dump_json()}\n\n"

        # Send completion signal
        yield f"data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

#### Team Initialization

Teams are stateless - create on-demand per request:

```python
# At module level, import team factories
from validation.team import create_validation_team
from planning.team import create_planning_team
from branding.team import create_branding_team

# Per-request team creation
def get_team_instance(
    team_type: str,
    session_id: str,
    user_id: str,
    business_id: str,
    model_override: Optional[str] = None,
) -> Team:
    """Create team instance for request."""

    if team_type == "validation":
        return create_validation_team(
            session_id=session_id,
            user_id=user_id,
            business_id=business_id,
            model=model_override,
        )
    elif team_type == "planning":
        return create_planning_team(
            session_id=session_id,
            user_id=user_id,
            business_id=business_id,
            model=model_override,
        )
    elif team_type == "branding":
        return create_branding_team(
            session_id=session_id,
            user_id=user_id,
            business_id=business_id,
            model=model_override,
        )
    else:
        raise ValueError(f"Unknown team type: {team_type}")
```

### Integration Points

#### Frontend → FastAPI

**Authentication:**
- JWT token in `Authorization: Bearer <token>` header
- TenantMiddleware extracts `workspace_id` and `user_id`
- All requests scoped to workspace

**Request Flow:**
```
User sends message → ChatPanel component
  → agent-client.ts (SSE client)
    → POST /agents/validation/runs
      → TenantMiddleware validates JWT
        → Extract workspace_id, user_id
          → Create validation team instance
            → team.astream(message)
              → SSE chunks → frontend
```

#### Tenant Isolation

**Database Level:**
- Each team uses PostgresStorage with separate tables:
  - `bmv_validation_sessions`
  - `bmp_planning_sessions`
  - `bmb_branding_sessions`
- RLS policies enforce workspace_id filtering

**Application Level:**
- TenantMiddleware injects `workspace_id` into request.state
- All team instances created with `user_id` for session isolation
- Business context scoped to workspace via `business_id`

---

## Story Implementation Details

### Story 11.1: Wire Validation Team API Endpoint

**Files to Modify:**
- `agents/main.py` (add endpoints)

**Files to Verify:**
- `agents/validation/team.py` (exists, exports `create_validation_team`)
- `agents/validation/__init__.py` (verify exports)

**Implementation:**

```python
# agents/main.py

# Add import at top
from validation.team import create_validation_team

# Add endpoint
@app.post("/agents/validation/runs", response_model=TeamRunResponse)
async def run_validation_team(request_data: TeamRunRequest, req: Request):
    """
    Run the Validation Team (Vera + specialists).

    Validates business ideas through market sizing, competitor analysis,
    customer discovery, and feasibility assessment.
    """
    workspace_id = getattr(req.state, "workspace_id", None)
    user_id = getattr(req.state, "user_id", None)

    if not workspace_id or not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    logger.info(
        f"ValidationTeam run: workspace={workspace_id}, "
        f"user={user_id}, business={request_data.business_id}"
    )

    try:
        # Create team instance
        team = create_validation_team(
            session_id=request_data.session_id or f"val_{user_id}_{int(time.time())}",
            user_id=user_id,
            business_id=request_data.business_id,
            model=request_data.model_override,
        )

        # Run team
        response = await team.arun(message=request_data.message)

        return TeamRunResponse(
            success=True,
            content=response.content,
            session_id=team.session_id,
            agent_name=response.agent_name if hasattr(response, 'agent_name') else "Vera",
            metadata={
                "business_id": request_data.business_id,
                "team": "validation",
            }
        )
    except Exception as e:
        logger.error(f"ValidationTeam run failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/agents/validation/health")
async def validation_team_health():
    """Health check for validation team."""
    try:
        # Quick validation that team can be created
        team = create_validation_team(
            session_id="health_check",
            user_id="system",
        )
        return {
            "status": "ok",
            "team": "validation",
            "leader": "Vera",
            "members": ["Marco", "Cipher", "Persona", "Risk"],
            "version": "0.1.0"
        }
    except Exception as e:
        logger.error(f"Validation health check failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e)
        }
```

**Acceptance Criteria:**
- ✅ AC1: POST `/agents/validation/runs` endpoint added
- ✅ AC2: Imports `create_validation_team` from `agents/validation/team.py`
- ✅ AC3: Accepts request body with `businessId`, `sessionId`, `message`, `context`
- ✅ AC4: Returns streaming response (will be Story 11.4 for frontend)
- ✅ AC5: Includes tenant isolation via `workspace_id` from TenantMiddleware
- ✅ AC6: Error handling with 401/500 status codes
- ✅ AC7: Health check at `/agents/validation/health`

---

### Story 11.2: Wire Planning Team API Endpoint

**Files to Modify:**
- `agents/main.py` (add endpoints)

**Implementation:** Same pattern as Story 11.1, but for planning team.

```python
# Import
from planning.team import create_planning_team

# Endpoint
@app.post("/agents/planning/runs", response_model=TeamRunResponse)
async def run_planning_team(request_data: TeamRunRequest, req: Request):
    """
    Run the Planning Team (Blake + specialists).

    Creates business plans through BMC, financial projections,
    pricing strategy, and growth forecasts.
    """
    # Same pattern as validation endpoint
    # ...
    team = create_planning_team(
        session_id=request_data.session_id or f"plan_{user_id}_{int(time.time())}",
        user_id=user_id,
        business_id=request_data.business_id,
        model=request_data.model_override,
    )
    # ...

@app.get("/agents/planning/health")
async def planning_team_health():
    """Health check for planning team."""
    # Same pattern as validation health
    # ...
```

**Key Notes:**
- Planning team accepts `validationData` in context field for workflow continuity
- Session IDs use `plan_` prefix for clarity in logs/database

**Acceptance Criteria:**
- ✅ AC1: POST `/agents/planning/runs` endpoint added
- ✅ AC2: Imports `create_planning_team`
- ✅ AC3: Accepts `validationData` in context field
- ✅ AC4: Streaming response (Story 11.4)
- ✅ AC5: Validation output passed as context
- ✅ AC6: Tenant isolation
- ✅ AC7: Health check at `/agents/planning/health`

---

### Story 11.3: Wire Branding Team API Endpoint

**Files to Modify:**
- `agents/main.py` (add endpoints)

**Implementation:** Same pattern as Stories 11.1 and 11.2.

```python
# Import
from branding.team import create_branding_team

# Endpoint
@app.post("/agents/branding/runs", response_model=TeamRunResponse)
async def run_branding_team(request_data: TeamRunRequest, req: Request):
    """
    Run the Branding Team (Bella + specialists).

    Creates brand identity through strategy, voice, visual design,
    and asset generation.
    """
    # Same pattern as validation/planning
    # ...
    team = create_branding_team(
        session_id=request_data.session_id or f"brand_{user_id}_{int(time.time())}",
        user_id=user_id,
        business_id=request_data.business_id,
        model=request_data.model_override,
        business_context=request_data.context,  # Planning output
    )
    # ...

@app.get("/agents/branding/health")
async def branding_team_health():
    """Health check for branding team."""
    # ...
```

**Key Notes:**
- Branding team has extra `business_context` parameter for planning handoff
- Session IDs use `brand_` prefix

**Acceptance Criteria:**
- ✅ AC1: POST `/agents/branding/runs` endpoint added
- ✅ AC2: Imports `create_branding_team`
- ✅ AC3: Accepts `planningData` in context field
- ✅ AC4: Streaming response
- ✅ AC5: Planning output passed as context
- ✅ AC6: Tenant isolation
- ✅ AC7: Health check at `/agents/branding/health`

---

### Story 11.4: Connect Frontend Workflow Pages

**Files to Create:**
- `apps/web/src/lib/agent-client.ts` (SSE client)

**Files to Modify:**
- `apps/web/src/app/(onboarding)/onboarding/[businessId]/validation/page.tsx`
- `apps/web/src/app/(onboarding)/onboarding/[businessId]/planning/page.tsx`
- `apps/web/src/app/(onboarding)/onboarding/[businessId]/branding/page.tsx`
- `apps/web/src/components/chat/ChatPanel.tsx`

**Implementation:**

#### 1. Create SSE Agent Client

```typescript
// apps/web/src/lib/agent-client.ts

const AGENTOS_URL = process.env.NEXT_PUBLIC_AGENTOS_URL || '/agents';

export interface TeamRunRequest {
  message: string;
  businessId: string;
  sessionId?: string;
  modelOverride?: string;
  context?: Record<string, any>;
}

export interface TeamRunChunk {
  content?: string;
  agentName?: string;
  type: 'message' | 'tool_call' | 'error' | 'done';
  metadata?: Record<string, any>;
}

export class AgentClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Stream team responses via SSE.
   */
  async streamTeam(
    teamType: 'validation' | 'planning' | 'branding',
    request: TeamRunRequest,
    onChunk: (chunk: TeamRunChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
  ): Promise<() => void> {
    const url = `${AGENTOS_URL}/${teamType}/runs/stream`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        message: request.message,
        business_id: request.businessId,
        session_id: request.sessionId,
        model_override: request.modelOverride,
        context: request.context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Team request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    const readStream = async () => {
      if (!reader) return;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            onComplete?.();
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                onComplete?.();
                return;
              }

              try {
                const chunk = JSON.parse(data) as TeamRunChunk;
                onChunk(chunk);
              } catch (e) {
                console.error('Failed to parse SSE chunk:', e);
              }
            }
          }
        }
      } catch (error) {
        onError?.(error as Error);
      }
    };

    readStream();

    // Return cleanup function
    return () => {
      reader?.cancel();
    };
  }

  /**
   * Non-streaming team run (for simple cases).
   */
  async runTeam(
    teamType: 'validation' | 'planning' | 'branding',
    request: TeamRunRequest,
  ): Promise<{ content: string; sessionId: string; agentName?: string }> {
    const url = `${AGENTOS_URL}/${teamType}/runs`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        message: request.message,
        business_id: request.businessId,
        session_id: request.sessionId,
        model_override: request.modelOverride,
        context: request.context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Team request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Team run failed');
    }

    return {
      content: data.content,
      sessionId: data.session_id,
      agentName: data.agent_name,
    };
  }

  /**
   * Health check for a team.
   */
  async checkTeamHealth(
    teamType: 'validation' | 'planning' | 'branding'
  ): Promise<{ status: string; leader: string; members: string[] }> {
    const url = `${AGENTOS_URL}/${teamType}/health`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    return response.json();
  }
}
```

#### 2. Update Validation Page

```typescript
// apps/web/src/app/(onboarding)/onboarding/[businessId]/validation/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { AgentClient } from '@/lib/agent-client';
import { ChatPanel } from '@/components/chat/ChatPanel';

export default function ValidationPage({ params }: { params: { businessId: string } }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; agentName?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!session?.token) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);
    setIsLoading(true);

    const client = new AgentClient(session.token);

    try {
      // Stream agent response
      await client.streamTeam(
        'validation',
        {
          message: content,
          businessId: params.businessId,
        },
        (chunk) => {
          if (chunk.type === 'message' && chunk.content) {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];

              // Update last agent message or create new one
              if (lastMessage?.role === 'agent' && lastMessage.agentName === chunk.agentName) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: lastMessage.content + chunk.content }
                ];
              } else {
                return [...prev, { role: 'agent', content: chunk.content, agentName: chunk.agentName }];
              }
            });
          }
        },
        (error) => {
          console.error('Agent streaming error:', error);
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Business Validation</h1>
        <p className="text-muted-foreground mb-6">
          Chat with Vera and her team to validate your business idea
        </p>

        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder="Describe your business idea..."
        />
      </div>
    </div>
  );
}
```

#### 3. Update Planning & Branding Pages

Same pattern as validation page, but:
- Planning: `teamType='planning'`, leader "Blake"
- Branding: `teamType='branding'`, leader "Bella"

#### 4. Update ChatPanel Component

```typescript
// apps/web/src/components/chat/ChatPanel.tsx

interface Message {
  role: 'user' | 'agent';
  content: string;
  agentName?: string;
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatPanel({ messages, onSendMessage, isLoading, placeholder }: ChatPanelProps) {
  // Show agent name badge for multi-agent teams
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === 'user' ? 'ml-auto' : 'mr-auto'}>
            {msg.agentName && (
              <div className="text-xs text-muted-foreground mb-1">
                {msg.agentName}
              </div>
            )}
            <div className={msg.role === 'user' ? 'bg-primary text-white' : 'bg-muted'}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ AC1: `agent-client.ts` created with SSE streaming
- ✅ AC2: SSE streaming handler implemented
- ✅ AC3: Validation page calls `/agents/validation/runs`
- ✅ AC4: Planning page calls `/agents/planning/runs`
- ✅ AC5: Branding page calls `/agents/branding/runs`
- ✅ AC6: Real agent names shown (Vera, Blake, Bella, etc.)
- ✅ AC7: Business context passed (businessId, sessionId)
- ✅ AC8: Loading, error, success states handled

---

### Story 11.5: Agent Integration E2E Tests

**Files to Create:**
- `apps/web/e2e/agents.spec.ts`
- `apps/web/e2e/fixtures/agent-mocks.ts`

**Implementation:**

#### 1. Agent Mocks for Deterministic Tests

```typescript
// apps/web/e2e/fixtures/agent-mocks.ts

export const mockValidationResponse = {
  success: true,
  content: `# Validation Summary

## Market Analysis (Marco)
- TAM: $50B [Verified - Gartner 2024]
- SAM: $5B [Verified - Forrester 2024]
- SOM: $50M [Estimated]

## Competitive Landscape (Cipher)
- 3 direct competitors identified
- Market gap: AI-powered automation for SMBs

## Customer Discovery (Persona)
- ICP: SMB operations managers, 10-50 employees
- Willingness to pay: $200-500/month

## Validation Score: 78/100
**Recommendation:** CONDITIONAL GO
`,
  session_id: 'test_val_123',
  agent_name: 'Vera',
  metadata: {
    business_id: 'biz_123',
    team: 'validation',
  },
};

export const mockPlanningResponse = {
  success: true,
  content: `# Business Model Canvas

## Value Proposition
AI-powered operations automation platform...

## Financial Projections
- Year 1 Revenue: $500K
- Year 3 Revenue: $5M
- Break-even: Month 18
`,
  session_id: 'test_plan_123',
  agent_name: 'Blake',
  metadata: {
    business_id: 'biz_123',
    team: 'planning',
  },
};

export const mockBrandingResponse = {
  success: true,
  content: `# Brand Strategy

## Brand Archetype: The Innovator

## Core Values
1. Simplicity
2. Empowerment
3. Innovation
`,
  session_id: 'test_brand_123',
  agent_name: 'Bella',
  metadata: {
    business_id: 'biz_123',
    team: 'branding',
  },
};
```

#### 2. E2E Tests

```typescript
// apps/web/e2e/agents.spec.ts

import { test, expect } from '@playwright/test';
import { mockValidationResponse, mockPlanningResponse, mockBrandingResponse } from './fixtures/agent-mocks';

test.describe('Agent Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        json: {
          user: { id: 'user_123', email: 'test@example.com' },
          session: { token: 'test_token_123' },
        },
      });
    });
  });

  test('AC2: validation endpoint health check returns 200', async ({ page }) => {
    const response = await page.request.get('/agents/validation/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.team).toBe('validation');
    expect(body.leader).toBe('Vera');
  });

  test('AC3: planning endpoint health check returns 200', async ({ page }) => {
    const response = await page.request.get('/agents/planning/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.team).toBe('planning');
    expect(body.leader).toBe('Blake');
  });

  test('AC4: branding endpoint health check returns 200', async ({ page }) => {
    const response = await page.request.get('/agents/branding/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.team).toBe('branding');
    expect(body.leader).toBe('Bella');
  });

  test('AC5: full workflow validation → planning → branding handoff', async ({ page }) => {
    // Mock validation response
    await page.route('**/agents/validation/runs', async (route) => {
      await route.fulfill({ json: mockValidationResponse });
    });

    // Mock planning response (receives validation context)
    await page.route('**/agents/planning/runs', async (route) => {
      const request = await route.request().postDataJSON();
      expect(request.context?.validationData).toBeDefined();

      await route.fulfill({ json: mockPlanningResponse });
    });

    // Mock branding response (receives planning context)
    await page.route('**/agents/branding/runs', async (route) => {
      const request = await route.request().postDataJSON();
      expect(request.context?.planningData).toBeDefined();

      await route.fulfill({ json: mockBrandingResponse });
    });

    // Navigate through workflow
    await page.goto('/onboarding/biz_123/validation');
    await page.fill('[data-testid="chat-input"]', 'Validate my SaaS idea');
    await page.click('[data-testid="send-button"]');

    // Wait for validation response
    await expect(page.locator('text=Validation Score: 78/100')).toBeVisible();

    // Navigate to planning with validation context
    await page.goto('/onboarding/biz_123/planning');
    await page.fill('[data-testid="chat-input"]', 'Create business plan');
    await page.click('[data-testid="send-button"]');

    // Wait for planning response
    await expect(page.locator('text=Business Model Canvas')).toBeVisible();

    // Navigate to branding with planning context
    await page.goto('/onboarding/biz_123/branding');
    await page.fill('[data-testid="chat-input"]', 'Create brand strategy');
    await page.click('[data-testid="send-button"]');

    // Wait for branding response
    await expect(page.locator('text=Brand Strategy')).toBeVisible();
  });

  test('AC6: error handling for invalid requests (400 errors)', async ({ page }) => {
    await page.route('**/agents/validation/runs', async (route) => {
      await route.fulfill({
        status: 400,
        json: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'business_id is required',
          },
        },
      });
    });

    await page.goto('/onboarding/biz_123/validation');

    // Send invalid request (no business_id in mock)
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');

    // Expect error message
    await expect(page.locator('text=business_id is required')).toBeVisible();
  });

  test('AC7: tenant isolation (cross-tenant access denied with 403)', async ({ page }) => {
    await page.route('**/agents/validation/runs', async (route) => {
      const request = await route.request();
      const auth = request.headers()['authorization'];

      // Simulate cross-tenant access attempt
      if (auth === 'Bearer invalid_tenant_token') {
        await route.fulfill({
          status: 403,
          json: {
            error: {
              code: 'FORBIDDEN',
              message: 'Access to this business is denied',
            },
          },
        });
      } else {
        await route.fulfill({ json: mockValidationResponse });
      }
    });

    // Mock invalid tenant token
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        json: {
          user: { id: 'user_999', email: 'other@example.com' },
          session: { token: 'invalid_tenant_token' },
        },
      });
    });

    await page.goto('/onboarding/biz_123/validation');
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="send-button"]');

    // Expect 403 error
    await expect(page.locator('text=Access to this business is denied')).toBeVisible();
  });
});
```

**Acceptance Criteria:**
- ✅ AC1: `apps/web/e2e/agents.spec.ts` created
- ✅ AC2: Validation endpoint health check test passes
- ✅ AC3: Planning endpoint health check test passes
- ✅ AC4: Branding endpoint health check test passes
- ✅ AC5: Full workflow test (validation → planning → branding)
- ✅ AC6: Error handling test (400 errors)
- ✅ AC7: Tenant isolation test (403 errors)
- ✅ AC8: Mock fixtures for deterministic responses

---

## Dependencies & Prerequisites

### External Dependencies

**Required:**
- None - all agent code exists

**Optional:**
- Control Plane at os.agno.com (for agent monitoring, already configured in EPIC-04)

### Internal Dependencies

**Required (Already Complete):**
- EPIC-04: ApprovalAgent pattern established
- EPIC-08: Agent teams implemented (validation, planning, branding)
- TenantMiddleware: JWT validation and workspace extraction

**Parallel:**
- EPIC-10: Platform Hardening (rate limiting, security)
- EPIC-12: UX Polish (chat streaming UI)

**Enables:**
- EPIC-13: AI Agent Management (dashboard to monitor these teams)
- EPIC-14: Testing & Observability (agent-specific metrics)

---

## Risks & Mitigations

### Risk 1: SSE Streaming Performance

**Risk:** Server-Sent Events may not scale well under load.

**Impact:** High - affects user experience in real-time chat.

**Mitigation:**
- Use Agno's built-in async streaming (`team.astream()`)
- Implement connection limits per workspace
- Add rate limiting for streaming endpoints
- Monitor connection counts and streaming duration

**Fallback:** Non-streaming mode (`team.arun()`) with polling.

### Risk 2: Session State Management

**Risk:** Session state may not persist correctly across requests.

**Impact:** Medium - users lose conversation context.

**Mitigation:**
- PostgresStorage handles persistence automatically
- Each team has dedicated session table
- Session IDs use predictable pattern with timestamps
- Health checks verify storage connectivity

**Fallback:** Ephemeral sessions (no persistence) for demo mode.

### Risk 3: Agent Response Time

**Risk:** Complex agent workflows may take 30+ seconds.

**Impact:** Medium - users perceive slowness.

**Mitigation:**
- SSE streaming shows incremental progress
- Add timeout configuration (60s default)
- Show "thinking" indicators for each agent
- Implement agent response caching for common queries

**Monitoring:** Track agent response time metrics in EPIC-14.

### Risk 4: Model Provider Failures

**Risk:** Claude API may be unavailable or rate-limited.

**Impact:** High - agents cannot function.

**Mitigation:**
- BYOAI allows workspace-level provider selection
- Support for OpenAI, Gemini, DeepSeek as fallbacks
- Graceful error messages for provider failures
- Retry logic with exponential backoff

**Monitoring:** Provider health checks in EPIC-06.

### Risk 5: Tenant Isolation Breach

**Risk:** Bug in TenantMiddleware could expose cross-tenant data.

**Impact:** Critical - data privacy violation.

**Mitigation:**
- E2E test for cross-tenant access (Story 11.5 AC7)
- RLS policies at database level (defense-in-depth)
- Security audit of middleware in EPIC-10
- All agent tools use workspace_id filtering

**Testing:** Comprehensive tenant isolation tests in Story 11.5.

---

## Testing Strategy

### Unit Tests

**Not required** - teams are integration of existing agents.

### Integration Tests

**Story 11.5** covers:
- Health check endpoints (AC2-4)
- Request/response format validation
- Error handling (AC6)
- Tenant isolation (AC7)

### E2E Tests

**Story 11.5** covers:
- Full workflow: validation → planning → branding (AC5)
- Context handoff between teams
- Frontend → FastAPI → Agno integration
- SSE streaming in browser

### Manual Testing Checklist

- [ ] Create business via wizard
- [ ] Navigate to validation page
- [ ] Send message to Vera, verify response
- [ ] Verify agent names appear (Vera, Marco, Cipher, Persona, Risk)
- [ ] Check session persists across page refresh
- [ ] Navigate to planning page
- [ ] Verify validation context available to Blake
- [ ] Navigate to branding page
- [ ] Verify planning context available to Bella
- [ ] Test all 3 health check endpoints
- [ ] Verify Control Plane shows sessions (if enabled)

---

## Deployment Notes

### Environment Variables

No new environment variables required. Existing variables:

```bash
# Database (already configured)
DATABASE_URL="postgresql://..."

# AgentOS (already configured)
AGENTOS_PORT=7777
AGENTOS_HOST=0.0.0.0

# Frontend (already configured)
NEXT_PUBLIC_AGENTOS_URL="http://localhost:7777/agents"
```

### Migration Requirements

**Database Migrations:**

Session tables already created in EPIC-08:
- `bmv_validation_sessions`
- `bmp_planning_sessions`
- `bmb_branding_sessions`

No new migrations required.

### Deployment Order

1. Deploy AgentOS with new endpoints (`agents/main.py`)
2. Deploy Next.js with new agent-client and updated pages
3. Run E2E tests against staging
4. Deploy to production

### Rollback Plan

If issues occur:
1. Revert frontend to previous version (keeps old mock data)
2. Revert AgentOS to previous version (removes new endpoints)
3. Teams continue to work in isolation (EPIC-08 agents unaffected)

---

## Performance Considerations

### Response Time Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Health check | < 100ms | Simple team creation |
| Agent first response | < 5s | SSE stream starts |
| Full workflow completion | < 60s | Complex multi-agent |

### Scaling Considerations

**Current Scale (MVP):**
- 10-50 concurrent users
- ~100 agent sessions/day
- Single AgentOS instance

**Future Scale (Growth):**
- 1000+ concurrent users
- ~10K agent sessions/day
- Horizontal scaling with load balancer

**Bottlenecks:**
- Claude API rate limits (BYOAI mitigates)
- PostgreSQL connection pool (PgBouncer handles)
- SSE connection limits (nginx can proxy)

---

## Documentation Updates

### Files to Update

**After Epic 11 Complete:**

1. `docs/architecture.md`
   - Add agent endpoint documentation
   - Update integration diagrams

2. `docs/RUNBOOK.md` (EPIC-14)
   - Add agent troubleshooting section
   - Document SSE connection debugging

3. `README.md`
   - Update "Getting Started" with agent examples
   - Add agent endpoint documentation

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| All health checks green | 100% | CI/CD checks |
| E2E tests passing | 100% | Playwright reports |
| Agent response time | < 5s p95 | APM metrics (EPIC-14) |
| SSE connection success | > 98% | Error logs |
| Zero cross-tenant leaks | 100% | Security audit |

---

## Appendix A: Request/Response Examples

### Validation Team Request

```json
POST /agents/validation/runs
Authorization: Bearer <jwt_token>

{
  "message": "Validate this business idea: An AI-powered vertical gardening platform for urban homes",
  "business_id": "biz_123",
  "session_id": "val_user456_1701234567",
  "model_override": null,
  "context": {}
}
```

### Validation Team Response (Non-Streaming)

```json
{
  "success": true,
  "content": "# Validation Summary\n\n## Market Analysis (Marco)\n- TAM: $15B...",
  "session_id": "val_user456_1701234567",
  "agent_name": "Vera",
  "metadata": {
    "business_id": "biz_123",
    "team": "validation"
  }
}
```

### SSE Stream Chunk

```
data: {"type":"message","content":"## Market Analysis\n\n","agentName":"Marco"}

data: {"type":"message","content":"TAM: $15B [Verified - Grand View Research 2024]\n","agentName":"Marco"}

data: [DONE]
```

---

## Appendix B: Database Schema Reference

### Session Tables

Already created in EPIC-08. Schema:

```sql
-- Validation sessions
CREATE TABLE bmv_validation_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    workspace_id VARCHAR(255),
    business_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Planning sessions
CREATE TABLE bmp_planning_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    workspace_id VARCHAR(255),
    business_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Branding sessions
CREATE TABLE bmb_branding_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    workspace_id VARCHAR(255),
    business_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_bmv_sessions_user ON bmv_validation_sessions(user_id);
CREATE INDEX idx_bmv_sessions_business ON bmv_validation_sessions(business_id);

CREATE INDEX idx_bmp_sessions_user ON bmp_planning_sessions(user_id);
CREATE INDEX idx_bmp_sessions_business ON bmp_planning_sessions(business_id);

CREATE INDEX idx_bmb_sessions_user ON bmb_branding_sessions(user_id);
CREATE INDEX idx_bmb_sessions_business ON bmb_branding_sessions(business_id);
```

---

_Generated by /bmad:bmm:workflows:epic-tech-context_
_Date: 2025-12-06_
_For: chris_
_Epic: EPIC-11 - Agent Integration_
