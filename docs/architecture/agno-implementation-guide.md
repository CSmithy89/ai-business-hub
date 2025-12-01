# Agno Implementation Guide for HYVVE Platform

**Version:** 1.0.0
**Date:** 2025-12-01
**Status:** Reference Implementation
**Based On:** Agno Docs v1.5.x + BMAD Module Specifications

---

## Executive Summary

This guide consolidates all Agno-related research and provides implementation patterns for HYVVE's Foundation Modules (BMV, BMP, BM-Brand). It serves as the single source of truth for agent team implementation.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Runtime** | AgentOS (Python/FastAPI) as microservice | Native Agno runtime, Control Plane integration |
| **Team Pattern** | Leader-based coordination | Aligns with BMAD orchestrator pattern |
| **Storage** | PostgreSQL (shared with app) | Single database, separate tables |
| **Multi-Tenancy** | Custom middleware for workspace_id | Extends Agno's user_id model |
| **HITL** | Agno's `requires_confirmation` + HYVVE approval queue | Best of both worlds |

---

## Architecture Overview

### System Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HYVVE PLATFORM                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 15)                                                        │
│  ├── /dashboard - Portfolio & Business dashboards                             │
│  ├── /business/[id]/validation - Validation chat interface                    │
│  ├── /business/[id]/planning - Planning chat interface                        │
│  └── /business/[id]/branding - Branding chat interface                        │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │      API Gateway (nginx)      │
                        └───────────────┬───────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│     NestJS        │       │     AgentOS       │       │  Control Plane    │
│   (Main API)      │       │  (Agent Runtime)  │       │  (os.agno.com)    │
│                   │       │                   │       │                   │
│ - Auth (better-   │  HTTP │ - Validation Team │       │ - Session Monitor │
│   auth)           │◄─────►│ - Planning Team   │       │ - Memory View     │
│ - Business CRUD   │       │ - Branding Team   │       │ - Chat Debug UI   │
│ - Approval Queue  │       │ - Workflows       │       │                   │
│ - Event Bus       │       │ - Memory/Sessions │       │                   │
└─────────┬─────────┘       └─────────┬─────────┘       └───────────────────┘
          │                           │
          └─────────────┬─────────────┘
                        │
                ┌───────▼───────┐
                │  PostgreSQL   │
                │               │
                │ Prisma tables │
                │ Agno tables   │
                └───────────────┘
```

### Service Communication

```yaml
# API Routes Configuration
routes:
  # NestJS handles business logic
  /api/businesses/*: nestjs:3000
  /api/approvals/*: nestjs:3000
  /api/auth/*: nestjs:3000

  # AgentOS handles agent interactions
  /api/agents/*: agentos:8000
  /api/teams/*: agentos:8000
  /api/workflows/*: agentos:8000
  /api/chat/*: agentos:8000
```

---

## Agno Core Concepts

### 1. Agent Definition

```python
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.models.openai import OpenAIChat
from agno.storage.postgres import PostgresStorage
from pydantic import BaseModel, Field
from typing import Optional
import os

# Structured output for validation findings
class MarketSizingOutput(BaseModel):
    """Structured output for market sizing results."""
    tam: dict = Field(description="Total Addressable Market")
    sam: dict = Field(description="Serviceable Available Market")
    som: dict = Field(description="Serviceable Obtainable Market")
    sources: list[dict] = Field(description="Data sources with URLs and dates")
    confidence: str = Field(description="high | medium | low")
    methodology: str = Field(description="Calculation methodology used")

# Agent with full configuration
market_researcher = Agent(
    name="Marco",
    role="Market Researcher",
    description="TAM/SAM/SOM calculations and market intelligence specialist",

    # Model selection (BYOAI - user's API key)
    model=Claude(
        id="claude-sonnet-4-20250514",
        api_key=lambda: get_user_api_key("anthropic"),  # Dynamic key lookup
    ),

    # Tools available to this agent
    tools=[
        WebSearchTool(),
        CalculatorTool(),
        DatabaseQueryTool(),
    ],

    # Agent persona and instructions
    instructions=[
        "You are Marco, an expert market researcher specializing in TAM/SAM/SOM analysis.",
        "Always use at least 2 independent sources for market size claims.",
        "Sources must be from credible analysts (Gartner, Forrester, govt data).",
        "Sources must be less than 24 months old.",
        "Include confidence levels: high (2+ sources), medium (1 source), low (estimate).",
        "Never fabricate data - if you can't find reliable sources, say so.",
    ],

    # Structured output
    response_model=MarketSizingOutput,

    # Memory and context
    storage=PostgresStorage(
        table_name="agent_sessions",
        db_url=os.getenv("DATABASE_URL"),
    ),
    add_history_to_context=True,
    num_history_runs=5,
    enable_agentic_memory=True,

    # Response formatting
    markdown=True,
    reasoning=True,  # Enable extended thinking for complex analysis
)
```

### 2. Team Definition

```python
from agno.team import Team
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.storage.postgres import PostgresStorage

def create_validation_team(business_id: str, tenant_id: str, user_id: str):
    """
    Creates a Validation Team instance for a specific business.

    The team uses leader-based coordination where Vera (orchestrator)
    delegates to specialists as needed.
    """

    # Team Leader
    vera = Agent(
        name="Vera",
        role="Validation Orchestrator",
        description="Coordinates all validation activities and synthesizes findings",
        model=Claude(id="claude-sonnet-4-20250514"),
        instructions=[
            "You are Vera, the Validation Team lead.",
            "Guide users through business idea validation step by step.",
            "Delegate research tasks to your team specialists:",
            "- Marco: Market sizing and TAM/SAM/SOM",
            "- Cipher: Competitor analysis and positioning",
            "- Persona: Customer profiling and ICP development",
            "- Risk: Feasibility assessment and go/no-go",
            "Synthesize findings into clear recommendations.",
            "Be encouraging but honest - if an idea has problems, say so.",
        ],
    )

    # Specialist Agents
    marco = Agent(
        name="Marco",
        role="Market Researcher",
        description="TAM/SAM/SOM calculations and market intelligence",
        model=Claude(id="claude-sonnet-4-20250514"),
        tools=[WebSearchTool(), CalculatorTool()],
        instructions=[
            "Calculate market sizes using multiple methodologies.",
            "Top-down: Industry reports → segment calculations",
            "Bottom-up: Customer counts × average spend",
            "Always cite sources with URLs and publication dates.",
            "Confidence: high (2+ sources), medium (1 source), low (estimate).",
        ],
    )

    cipher = Agent(
        name="Cipher",
        role="Competitor Analyst",
        description="Competitive intelligence and positioning analysis",
        model=Claude(id="claude-sonnet-4-20250514"),
        tools=[WebSearchTool()],
        instructions=[
            "Identify direct and indirect competitors.",
            "Analyze: pricing, features, positioning, strengths, weaknesses.",
            "Create positioning maps showing opportunity gaps.",
            "All competitor claims must have source URLs.",
        ],
    )

    persona = Agent(
        name="Persona",
        role="Customer Profiler",
        description="ICP development and Jobs-to-be-Done analysis",
        model=Claude(id="claude-sonnet-4-20250514"),
        instructions=[
            "Develop detailed Ideal Customer Profiles (ICPs).",
            "Include demographics, psychographics, behaviors.",
            "Map Jobs-to-be-Done for each persona.",
            "Identify pain points and desired outcomes.",
        ],
    )

    risk = Agent(
        name="Risk",
        role="Feasibility Assessor",
        description="Risk assessment and go/no-go recommendations",
        model=Claude(id="claude-sonnet-4-20250514"),
        instructions=[
            "Assess technical, market, and financial feasibility.",
            "Identify key risks and mitigation strategies.",
            "Provide clear go/no-go recommendation with reasoning.",
            "Score overall validation (0-100) based on all factors.",
        ],
    )

    # Create Team
    team = Team(
        name="Validation Team",
        mode="coordinate",  # Leader coordinates, delegates to specialists
        model=Claude(id="claude-sonnet-4-20250514"),

        # Leadership
        leader=vera,

        # Specialists
        members=[marco, cipher, persona, risk],

        # Team behavior
        delegate_task_to_all_members=False,  # Leader chooses who to delegate to
        respond_directly=True,  # Leader always responds to user
        share_member_interactions=True,  # Members can see each other's work

        # Storage with multi-tenant context
        storage=PostgresStorage(
            table_name="validation_sessions",
            db_url=os.getenv("DATABASE_URL"),
        ),

        # Session context (critical for multi-tenancy)
        session_id=f"val_{business_id}",
        user_id=user_id,

        # Additional context
        additional_context={
            "business_id": business_id,
            "tenant_id": tenant_id,
            "module": "bmv",
        },
    )

    return team
```

### 3. Session Management

```python
from agno.storage.postgres import PostgresStorage
from agno.memory import AgentMemory

class SessionManager:
    """
    Manages Agno sessions with HYVVE multi-tenancy.
    """

    def __init__(self, db_url: str):
        self.storage = PostgresStorage(
            table_name="agent_sessions",
            db_url=db_url,
        )

    def create_session(
        self,
        business_id: str,
        tenant_id: str,
        user_id: str,
        module: str,  # bmv | bmp | branding
    ) -> str:
        """Create a new agent session for a business module."""
        session_id = f"{module}_{business_id}_{uuid4().hex[:8]}"

        # Store session metadata
        self.storage.create_session(
            session_id=session_id,
            user_id=user_id,
            metadata={
                "business_id": business_id,
                "tenant_id": tenant_id,
                "module": module,
                "created_at": datetime.utcnow().isoformat(),
            },
        )

        return session_id

    def get_session(self, session_id: str) -> dict:
        """Retrieve session with validation."""
        session = self.storage.get_session(session_id)
        if not session:
            raise SessionNotFoundError(session_id)
        return session

    def validate_access(
        self,
        session_id: str,
        tenant_id: str,
        user_id: str,
    ) -> bool:
        """Verify user has access to this session."""
        session = self.get_session(session_id)
        return (
            session["metadata"]["tenant_id"] == tenant_id and
            session["user_id"] == user_id
        )
```

### 4. HITL (Human-in-the-Loop) Integration

```python
from agno.tools import Tool
from typing import Optional
import httpx

class ApprovalTool(Tool):
    """
    Tool for requesting human approval through HYVVE's approval queue.

    Used for strategic decisions that require human oversight.
    """

    name = "request_approval"
    description = "Request human approval for a strategic decision"
    requires_confirmation = True  # Agno's built-in HITL

    def __init__(self, nestjs_url: str):
        self.nestjs_url = nestjs_url

    async def run(
        self,
        decision_type: str,
        title: str,
        description: str,
        options: list[str],
        confidence: float,
        context: dict,
    ) -> dict:
        """
        Route decision to appropriate approval queue based on confidence.

        Confidence-based routing (per HYVVE 90/5 Promise):
        - >= 85%: Auto-execute with logging
        - 60-84%: Quick approval (swipe UI)
        - < 60%: Full review required
        """

        if confidence >= 0.85:
            # Auto-execute with audit log
            await self._log_auto_approval(decision_type, title, confidence, context)
            return {
                "status": "auto_approved",
                "confidence": confidence,
                "message": f"Auto-approved with {confidence:.0%} confidence",
            }

        elif confidence >= 0.60:
            # Quick approval queue
            approval_id = await self._create_approval_item(
                queue="quick",
                decision_type=decision_type,
                title=title,
                description=description,
                options=options,
                confidence=confidence,
                context=context,
            )
            return {
                "status": "pending_quick_approval",
                "approval_id": approval_id,
                "message": "Sent to quick approval queue",
            }

        else:
            # Full review required
            approval_id = await self._create_approval_item(
                queue="strategic",
                decision_type=decision_type,
                title=title,
                description=description,
                options=options,
                confidence=confidence,
                context=context,
            )
            return {
                "status": "pending_full_review",
                "approval_id": approval_id,
                "message": "Sent to strategic review queue",
            }

    async def _create_approval_item(self, queue: str, **kwargs) -> str:
        """Create approval item in NestJS backend."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.nestjs_url}/api/approvals",
                json={
                    "queue": queue,
                    **kwargs,
                },
            )
            return response.json()["id"]

    async def _log_auto_approval(
        self,
        decision_type: str,
        title: str,
        confidence: float,
        context: dict,
    ):
        """Log auto-approved decisions for audit trail."""
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{self.nestjs_url}/api/approvals/audit",
                json={
                    "action": "auto_approved",
                    "decision_type": decision_type,
                    "title": title,
                    "confidence": confidence,
                    "context": context,
                },
            )
```

### 5. Workflow Definition

```python
from agno.workflow import Workflow, Task, Condition
from agno.tools import Tool

class ValidationWorkflow(Workflow):
    """
    Complete validation workflow that orchestrates all BMV steps.

    Workflow Sequence:
    1. idea-intake → Capture business idea
    2. market-sizing → Calculate TAM/SAM/SOM (parallel)
    3. competitor-mapping → Analyze competitors (parallel)
    4. customer-discovery → Develop ICPs (parallel)
    5. validation-synthesis → Synthesize and recommend (sequential, after all above)
    """

    name = "validation_workflow"
    description = "Complete business idea validation"

    def __init__(self, validation_team: Team):
        self.team = validation_team

        # Define workflow tasks
        self.tasks = [
            Task(
                id="idea_intake",
                name="Capture Business Idea",
                agent=self.team.leader,
                inputs=["user_idea"],
                outputs=["structured_idea", "clarifying_questions"],
            ),
            Task(
                id="market_sizing",
                name="Market Sizing Analysis",
                agent=self.team.get_member("Marco"),
                inputs=["structured_idea"],
                outputs=["tam", "sam", "som", "sources"],
                depends_on=["idea_intake"],
            ),
            Task(
                id="competitor_mapping",
                name="Competitor Analysis",
                agent=self.team.get_member("Cipher"),
                inputs=["structured_idea"],
                outputs=["competitors", "positioning_map"],
                depends_on=["idea_intake"],
                parallel_with=["market_sizing", "customer_discovery"],
            ),
            Task(
                id="customer_discovery",
                name="Customer Profiling",
                agent=self.team.get_member("Persona"),
                inputs=["structured_idea"],
                outputs=["icps", "jtbd"],
                depends_on=["idea_intake"],
                parallel_with=["market_sizing", "competitor_mapping"],
            ),
            Task(
                id="validation_synthesis",
                name="Synthesize Findings",
                agent=self.team.get_member("Risk"),
                inputs=["tam", "sam", "som", "competitors", "icps"],
                outputs=["validation_score", "recommendation", "risks"],
                depends_on=["market_sizing", "competitor_mapping", "customer_discovery"],
                requires_approval=True,  # HITL checkpoint
            ),
        ]

    async def run(self, user_idea: str, session_id: str) -> dict:
        """Execute the validation workflow."""
        context = {"user_idea": user_idea}

        for task in self.tasks:
            if task.can_run(context):
                result = await task.execute(context)
                context.update(result)

                # Check for HITL requirement
                if task.requires_approval:
                    approval = await self._request_approval(task, result)
                    if approval["status"] != "approved":
                        return {"status": "pending_approval", "task": task.id}

        return {
            "status": "complete",
            "validation_score": context["validation_score"],
            "recommendation": context["recommendation"],
            "full_context": context,
        }
```

---

## BMAD-to-Agno Mapping

### BMV Module → Validation Team

| BMAD Component | Agno Implementation |
|----------------|---------------------|
| **validation-orchestrator-agent** | Team leader (Vera) |
| **market-researcher-agent** | Team member (Marco) |
| **competitor-analyst-agent** | Team member (Cipher) |
| **customer-profiler-agent** | Team member (Persona) |
| **feasibility-assessor-agent** | Team member (Risk) |
| **idea-intake workflow** | Task in ValidationWorkflow |
| **market-sizing workflow** | Task with parallel execution |
| **competitor-mapping workflow** | Task with parallel execution |
| **customer-discovery workflow** | Task with parallel execution |
| **validation-synthesis workflow** | Final task with HITL |
| **market-data-validation checklist** | Validation rules in agent instructions |
| **go-no-go-criteria checklist** | Approval criteria in Risk agent |

### BMP Module → Planning Team

| BMAD Component | Agno Implementation |
|----------------|---------------------|
| **planning-orchestrator-agent** | Team leader (Blake/Blueprint) |
| **business-model-architect-agent** | Team member (Model) |
| **financial-analyst-agent** | Team member (Finance) |
| **monetization-strategist-agent** | Team member (Revenue) |
| **growth-forecaster-agent** | Team member (Forecast) |
| **business-model-canvas workflow** | Task in PlanningWorkflow |
| **financial-projections workflow** | Task with structured output |
| **pricing-strategy workflow** | Task delegated to Revenue |
| **business-plan workflow** | Synthesis task requiring prior tasks |

### BM-Brand Module → Branding Team

| BMAD Component | Agno Implementation |
|----------------|---------------------|
| **brand-orchestrator-agent** | Team leader (Bella) |
| **brand-strategist-agent** | Team member (Sage) |
| **voice-architect-agent** | Team member (Vox) |
| **visual-identity-designer-agent** | Team member (Iris) |
| **asset-generator-agent** | Team member (Artisan) |
| **brand-auditor-agent** | Team member (Audit) |
| **brand-strategy workflow** | Task for positioning/archetype |
| **brand-voice workflow** | Task for verbal identity |
| **visual-identity workflow** | Task for logo/colors/typography |
| **asset-generation workflow** | Production task with file output |

---

## API Endpoints

### AgentOS Routes

```python
from fastapi import APIRouter, Depends, HTTPException
from agno.team import Team
from pydantic import BaseModel

router = APIRouter(prefix="/api")

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

class ChatResponse(BaseModel):
    response: str
    agent_name: str
    session_id: str
    suggested_actions: list[str] | None = None
    approval_required: dict | None = None

@router.post("/teams/{team_id}/chat", response_model=ChatResponse)
async def chat_with_team(
    team_id: str,
    request: ChatRequest,
    business_id: str = Depends(get_business_id),
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
):
    """
    Chat with a team (validation, planning, branding).
    """
    # Get or create team instance
    team = get_team_instance(team_id, business_id, tenant_id, user_id)

    # Get or create session
    session_id = request.session_id or create_session(team_id, business_id)

    # Run chat interaction
    response = await team.arun(
        message=request.message,
        session_id=session_id,
        stream=False,
    )

    return ChatResponse(
        response=response.content,
        agent_name=response.agent_name,
        session_id=session_id,
        suggested_actions=extract_suggested_actions(response),
        approval_required=extract_approval_request(response),
    )


@router.get("/teams/{team_id}/sessions/{session_id}/history")
async def get_session_history(
    team_id: str,
    session_id: str,
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
):
    """Get conversation history for a session."""
    # Validate access
    if not validate_session_access(session_id, tenant_id, user_id):
        raise HTTPException(403, "Access denied")

    history = get_session_messages(session_id)
    return {"messages": history}


@router.post("/workflows/{workflow_id}/start")
async def start_workflow(
    workflow_id: str,
    business_id: str = Depends(get_business_id),
    tenant_id: str = Depends(get_tenant_id),
):
    """Start a specific workflow (e.g., market-sizing, competitor-mapping)."""
    workflow = get_workflow_instance(workflow_id, business_id, tenant_id)
    session_id = await workflow.start()
    return {"session_id": session_id, "status": "started"}


@router.get("/workflows/{workflow_id}/status")
async def get_workflow_status(
    workflow_id: str,
    session_id: str,
):
    """Get workflow execution status."""
    status = get_workflow_status(workflow_id, session_id)
    return status
```

### SSE Streaming

```python
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio

@router.post("/teams/{team_id}/chat/stream")
async def chat_stream(
    team_id: str,
    request: ChatRequest,
    business_id: str = Depends(get_business_id),
    tenant_id: str = Depends(get_tenant_id),
    user_id: str = Depends(get_user_id),
):
    """
    Stream chat response using Server-Sent Events.
    """
    team = get_team_instance(team_id, business_id, tenant_id, user_id)
    session_id = request.session_id or create_session(team_id, business_id)

    async def event_generator():
        async for chunk in team.astream(
            message=request.message,
            session_id=session_id,
        ):
            yield f"data: {chunk.model_dump_json()}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )
```

---

## Multi-Tenancy Middleware

```python
from fastapi import Request, HTTPException
from functools import wraps

class TenantMiddleware:
    """
    Middleware to inject tenant context into Agno operations.

    Extends Agno's user_id model with HYVVE's workspace_id/tenant_id.
    """

    async def __call__(self, request: Request, call_next):
        # Extract tenant from JWT (set by NestJS auth)
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            raise HTTPException(401, "Missing authorization")

        # Decode and validate (NestJS already validated, we just extract)
        payload = decode_jwt(token)

        # Set tenant context
        request.state.tenant_id = payload["workspace_id"]
        request.state.user_id = payload["sub"]

        response = await call_next(request)
        return response


def require_tenant(func):
    """Decorator to ensure tenant context is set."""
    @wraps(func)
    async def wrapper(*args, request: Request, **kwargs):
        if not hasattr(request.state, "tenant_id"):
            raise HTTPException(403, "Tenant context required")
        return await func(*args, request=request, **kwargs)
    return wrapper
```

---

## Database Schema (Agno Tables)

```sql
-- Agno session storage (auto-created by PostgresStorage)
CREATE TABLE agent_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_sessions_user ON agent_sessions(user_id);

-- Agno memory storage
CREATE TABLE agent_memories (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES agent_sessions(id),
    memory_type VARCHAR(50), -- 'message', 'tool_call', 'summary'
    content JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_memories_session ON agent_memories(session_id);

-- Custom: HYVVE multi-tenant extension
ALTER TABLE agent_sessions ADD COLUMN tenant_id VARCHAR(255);
ALTER TABLE agent_sessions ADD COLUMN business_id VARCHAR(255);
CREATE INDEX idx_agent_sessions_tenant ON agent_sessions(tenant_id);
CREATE INDEX idx_agent_sessions_business ON agent_sessions(business_id);

-- RLS policies
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON agent_sessions
    USING (tenant_id = current_setting('app.tenant_id', true));
```

---

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  # AgentOS Runtime
  agentos:
    build:
      context: ./agents
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - NESTJS_URL=http://api:3000
      - AGNO_API_KEY=${AGNO_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}  # For platform operations
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    networks:
      - hyvve-network

  # NestJS API
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - AGENTOS_URL=http://agentos:8000
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - hyvve-network

  # Next.js Frontend
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    environment:
      - API_URL=http://api:3000
      - AGENTOS_URL=http://agentos:8000
    ports:
      - "3001:3000"
    depends_on:
      - api
      - agentos
    networks:
      - hyvve-network

  # nginx API Gateway
  nginx:
    image: nginx:alpine
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - web
      - api
      - agentos
    networks:
      - hyvve-network

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_USER=hyvve
      - POSTGRES_PASSWORD=hyvve
      - POSTGRES_DB=hyvve
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - hyvve-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - hyvve-network

volumes:
  postgres-data:

networks:
  hyvve-network:
    driver: bridge
```

---

## Testing Patterns

```python
import pytest
from unittest.mock import AsyncMock, patch
from agno.team import Team

@pytest.fixture
def mock_validation_team():
    """Create a mock validation team for testing."""
    with patch("agno.models.anthropic.Claude") as mock_model:
        mock_model.return_value.arun = AsyncMock(
            return_value={"content": "Test response"}
        )
        team = create_validation_team(
            business_id="test_biz",
            tenant_id="test_tenant",
            user_id="test_user",
        )
        yield team


@pytest.mark.asyncio
async def test_validation_team_chat(mock_validation_team):
    """Test basic chat with validation team."""
    response = await mock_validation_team.arun(
        message="I have an idea for an AI-powered CRM",
        session_id="test_session",
    )
    assert response["content"]


@pytest.mark.asyncio
async def test_validation_workflow():
    """Test complete validation workflow execution."""
    workflow = ValidationWorkflow(mock_validation_team)
    result = await workflow.run(
        user_idea="AI-powered CRM for SMBs",
        session_id="test_session",
    )
    assert result["status"] in ["complete", "pending_approval"]
```

---

## Monitoring & Observability

```python
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from helicone.opentelemetry import HeliconeInstrumentor

# Initialize tracing
tracer = trace.get_tracer(__name__)

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)

# Instrument LLM calls for Helicone
HeliconeInstrumentor().instrument()

# Custom spans for agent operations
async def traced_agent_call(agent, message, session_id):
    with tracer.start_as_current_span(
        "agent_call",
        attributes={
            "agent.name": agent.name,
            "session.id": session_id,
        },
    ) as span:
        response = await agent.arun(message)
        span.set_attribute("response.length", len(response.content))
        return response
```

---

## References

- [Agno Documentation](https://docs.agno.com)
- [Agno GitHub](https://github.com/agno-agi/agno)
- [HYVVE Architecture](./business-onboarding-architecture.md)
- [BMAD Module Specifications](/.bmad/)
- [Agno Analysis (Internal)](../research/agno-analysis.md)
- [AgentOS Integration (Internal)](../research/agentos-integration-analysis.md)
