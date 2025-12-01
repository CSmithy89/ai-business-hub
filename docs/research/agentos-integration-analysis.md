# AgentOS Integration Analysis

**Date:** 2025-12-01
**Status:** Investigation Complete
**Purpose:** Evaluate AgentOS Control Plane integration with HYVVE Platform

---

## Executive Summary

AgentOS is Agno's **production runtime** - a Python/FastAPI application that runs in your infrastructure with a hosted Control Plane UI at `os.agno.com`. Integration is **feasible but requires architectural adjustments**.

**Verdict: PROCEED WITH MICROSERVICE APPROACH**

---

## What is AgentOS?

| Aspect | Details |
|--------|---------|
| **Runtime** | Python FastAPI application |
| **Control Plane** | Hosted at os.agno.com (connects to YOUR runtime) |
| **Data Privacy** | 100% private - no data leaves your infrastructure |
| **Database** | PostgreSQL (SQLAlchemy), same as our stack |
| **Features** | Session tracking, memory management, knowledge bases, chat UI |

### Key Architecture Points

```
┌──────────────────────────────────────────────────────────────┐
│                    Control Plane (os.agno.com)               │
│  - Session monitoring    - Memory visualization              │
│  - Agent chat interface  - Knowledge management              │
└──────────────────────────┬───────────────────────────────────┘
                           │ Connects via browser
                           │ (no data sent to Agno)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  YOUR INFRASTRUCTURE                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                     AgentOS                              │ │
│  │  - FastAPI endpoints (/agents/*, /teams/*, /workflows/*) │ │
│  │  - JWT middleware (integrates with your auth)            │ │
│  │  - PostgreSQL storage (sessions, memories, knowledge)    │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Compatibility Analysis

### 1. NestJS Backend Compatibility

| Aspect | Status | Notes |
|--------|--------|-------|
| Language | ⚠️ Different | AgentOS is Python, NestJS is TypeScript |
| Can coexist | ✅ Yes | Run as separate microservice |
| Communication | ✅ Possible | HTTP/gRPC between services |
| Shared DB | ✅ Yes | Both use PostgreSQL |

**Impact:** AgentOS runs as a **separate Python service** alongside NestJS

### 2. Next.js Frontend Compatibility

| Aspect | Status | Notes |
|--------|--------|-------|
| API calls | ✅ Compatible | Can call AgentOS REST endpoints |
| SSE Streaming | ✅ Supported | AgentOS streams agent responses |
| Auth integration | ✅ JWT passthrough | Forward tokens from better-auth |

**Impact:** Frontend can call AgentOS directly or via NestJS proxy

### 3. Multi-Tenancy Compatibility

| Aspect | Status | Notes |
|--------|--------|-------|
| User isolation | ✅ Native | `user_id` parameter on all operations |
| Workspace isolation | ⚠️ Not native | No built-in `workspace_id` concept |
| RLS | ⚠️ Different pattern | Agno uses table-per-feature, not RLS |

**Impact:** Need custom middleware to inject `workspace_id` context

### 4. Database Compatibility

| Aspect | Our Plan | AgentOS | Compatible? |
|--------|----------|---------|-------------|
| DB Engine | PostgreSQL 16 | PostgreSQL | ✅ Yes |
| ORM | Prisma | SQLAlchemy | ✅ Separate tables |
| Tables | `workspace_*` | `agno_*` | ✅ No conflict |

**Impact:** Can share same database, different schemas/tables

---

## Conflicts Identified

### Critical Conflicts (None!)

No fundamental breaking conflicts found.

### Medium Conflicts

| Conflict | Description | Resolution |
|----------|-------------|------------|
| **Dual runtimes** | Python + Node.js services | Run both, use nginx/traefik routing |
| **Tenant isolation** | Agno uses `user_id` only | Extend middleware to include workspace |
| **BYOAI duplication** | Both have provider abstraction | Use Agno's - it's more mature |

### Minor Conflicts

| Conflict | Description | Resolution |
|----------|-------------|------------|
| **Event bus** | We planned Redis Streams, Agno has workflows | Can complement each other |
| **Approval routing** | Custom vs Agno HITL | Use Agno's `requires_confirmation` |

---

## Integration Architecture

### Recommended: Microservice Approach

```
                    ┌─────────────────────┐
                    │      Next.js        │
                    │     (Frontend)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   nginx/traefik     │
                    │   (API Gateway)     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼─────────┐ ┌────▼────┐ ┌────────▼────────┐
    │      NestJS       │ │ AgentOS │ │  Control Plane  │
    │   (Main API)      │ │ (Agent  │ │   (os.agno.com) │
    │                   │ │ Runtime)│ │   [Browser UI]  │
    │ - Auth (better-auth)│ │         │ └─────────────────┘
    │ - Workspaces      │ │ - Agents│
    │ - Approvals DB    │ │ - Teams │
    │ - Events bus      │ │ - Memory│
    └─────────┬─────────┘ └────┬────┘
              │                │
              └────────┬───────┘
                       │
              ┌────────▼────────┐
              │   PostgreSQL    │
              │                 │
              │ hyvve schema    │
              │ agno_* tables   │
              └─────────────────┘
```

### Routing Configuration

```nginx
# nginx.conf
location /api/ {
    proxy_pass http://nestjs:3000/;
}

location /agents/ {
    proxy_pass http://agentos:7777/agents/;
}

location /teams/ {
    proxy_pass http://agentos:7777/teams/;
}

location /workflows/ {
    proxy_pass http://agentos:7777/workflows/;
}
```

---

## Changes Required to Architecture

### 1. Add AgentOS Service

```yaml
# docker-compose.yml addition
agentos:
  build: ./agents
  ports:
    - "7777:7777"
  environment:
    DATABASE_URL: ${DATABASE_URL}
    JWT_SECRET: ${JWT_SECRET}
  depends_on:
    - postgres
```

### 2. Add ADR for AgentOS

**ADR-007: AgentOS for Agent Runtime**

- **Status:** Proposed
- **Context:** Need production runtime for Agno agents with monitoring
- **Decision:** Deploy AgentOS as microservice, use Control Plane for monitoring
- **Consequences:**
  - Additional service to deploy/maintain
  - Get monitoring "for free"
  - Simplified agent development

### 3. Update EPIC Stories

| Epic | Story to Add | Description |
|------|-------------|-------------|
| EPIC-04 | Story 04.11 | Deploy AgentOS runtime |
| EPIC-04 | Story 04.12 | Configure Control Plane connection |
| EPIC-06 | Story 06.9 | Integrate BYOAI with AgentOS providers |

### 4. Multi-Tenant Middleware

```python
# agents/middleware/tenant.py
from agno.os.middleware import BaseMiddleware
from starlette.requests import Request

class TenantMiddleware(BaseMiddleware):
    """Inject workspace_id from JWT into agent context."""

    async def dispatch(self, request: Request, call_next):
        # Extract workspace_id from JWT claims
        workspace_id = request.state.jwt_claims.get("workspace_id")

        # Inject into request state for agent tools
        request.state.workspace_id = workspace_id

        return await call_next(request)
```

---

## What AgentOS Replaces/Enhances

| Planned Component | AgentOS Provides | Action |
|-------------------|------------------|--------|
| Agent monitoring | ✅ Control Plane | **Replace** OpenTelemetry for agents |
| Session tracking | ✅ Built-in | **Use** AgentOS sessions |
| Memory UI | ✅ Control Plane | **Use** instead of building custom |
| HITL approvals | ✅ `requires_confirmation` | **Use** for agent-triggered approvals |
| BYOAI providers | ✅ 40+ providers | **Use** Agno model abstraction |
| Chat interface | ✅ Built-in | **Optional** - we have custom chat panel |

---

## Deployment Considerations

### Development
```bash
# Start AgentOS locally
cd agents
pip install -r requirements.txt
python -m agentos serve --port 7777 --reload
```

### Production (Railway)
- Deploy as separate service
- Share DATABASE_URL with NestJS
- Configure JWT_SECRET for auth passthrough

### Cost
- AgentOS is **open source** (MIT license)
- Control Plane at os.agno.com is **free** (connects to your runtime)
- No additional hosting cost beyond running the Python service

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Two runtimes complexity | Medium | Medium | Document clearly, CI/CD automation |
| Version mismatches | Low | Medium | Pin Agno version in requirements.txt |
| Control Plane availability | Low | Low | Core functionality works without it |

---

## Recommendation

**Proceed with AgentOS integration using microservice approach:**

1. **Add AgentOS as a Python microservice** alongside NestJS
2. **Use Control Plane** for agent monitoring (free, no data leaves infra)
3. **Keep NestJS** for main platform API (auth, workspaces, approvals DB)
4. **Use Agno's BYOAI** instead of building custom provider abstraction
5. **Add tenant middleware** to inject workspace_id into agent context

### Benefits

- Agent monitoring dashboard for free
- Mature BYOAI abstraction (40+ providers)
- Built-in HITL patterns
- Session/memory management UI
- Reduces custom code needed

### Next Steps

1. Add ADR-007 to architecture document
2. Add 3 new stories to relevant epics
3. Create `agents/requirements.txt` with Agno dependencies
4. Configure Docker Compose for multi-service development

---

_Analysis by: Claude Code_
_Date: 2025-12-01_
