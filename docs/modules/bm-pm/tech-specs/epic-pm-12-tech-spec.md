# Epic PM-12: Consolidated Follow-ups from PM-04/PM-05 - Technical Specification

**Epic:** PM-12 - Consolidated Follow-ups from PM-04/PM-05
**Version:** 1.0
**Created:** 2025-12-28
**Status:** Ready for Implementation
**Total Points:** 60

---

## 1. Executive Summary

### 1.1 Purpose

Epic PM-12 addresses technical debt and enhancement items deferred from PM-04 (Navi, Sage, Chrono) and PM-05 (Scope, Pulse, Herald) retrospectives. These items were intentionally deferred to focus on core feature delivery but are now critical for production readiness.

### 1.2 Scope

This epic consolidates:
- **UI Components**: Agent panel, suggestion cards, time tracker, estimation display, health dashboard
- **Agent Response Parsing**: Structured output using Anthropic tool_use
- **Notification Integration**: Health alerts and risk notifications
- **Test Coverage**: Integration tests, E2E tests, Python agent tests
- **Real-time Features**: WebSocket streaming for agent responses
- **Performance/Security Hardening**: Health check frequency, SYSTEM_USERS, N+1 queries

### 1.3 Key Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Agent service test coverage | ~60% | 80%+ |
| Python agent test coverage | ~5% (1 test file) | 70%+ |
| Frontend agent components | 0 | 5 core components |
| Notification delivery | Stubbed | Fully implemented |

---

## 2. Architecture Decisions

### 2.1 ADR-PM12-001: Agent UI Component Architecture

**Decision:** Implement agent UI components as standalone React components in `apps/web/src/components/pm/agents/` with React Query for data fetching.

**Rationale:**
- Follows existing health component patterns (`RiskCard`, `RiskListPanel`)
- React Query provides caching, optimistic updates, and real-time invalidation
- Components are modular and reusable across project views

**Components:**
```
apps/web/src/components/pm/agents/
├── AgentPanel.tsx           # Chat interface with agent
├── SuggestionCard.tsx       # Action suggestion display
├── SuggestionList.tsx       # List of pending suggestions
├── TimeTracker.tsx          # Time entry widget
├── EstimationDisplay.tsx    # Story point estimation UI
├── HealthDashboard.tsx      # Project health overview
└── index.ts
```

### 2.2 ADR-PM12-002: Structured Agent Output with tool_use

**Decision:** Migrate agent response parsing to use Anthropic's `tool_use` structured output format.

**Rationale:**
- Current implementation uses hardcoded defaults when parsing fails
- `tool_use` provides typed, validated JSON responses
- Reduces parsing errors and improves reliability

**Pattern:**
```python
# Python agent tool definition
@tool
def phase_completion_analysis(
    phase_id: str,
    workspace_id: str,
) -> dict:
    """Analyze phase completion readiness and return structured recommendations."""
    # Anthropic returns structured JSON via tool_use
    return {
        "completion_percentage": 85,
        "ready_for_transition": True,
        "blocking_tasks": [],
        "recommendations": [
            {"action": "complete", "task_id": "..."}
        ]
    }
```

### 2.3 ADR-PM12-003: Test Strategy

**Decision:** Implement tiered testing strategy:
1. **Unit tests** (NestJS): Service-level mocking with Jest
2. **Integration tests** (NestJS): API endpoint testing with test database
3. **Python tests**: Pytest with httpx mocking for API calls
4. **E2E tests**: Playwright for critical agent flows

**Test Location Pattern:**
```
apps/api/src/pm/agents/__tests__/
├── agents.service.spec.ts           # Unit tests (existing)
├── health.service.spec.ts           # Unit tests (existing)
├── agents.controller.integration.ts # Integration tests (new)
├── report.controller.integration.ts # Integration tests (new)

agents/pm/tests/
├── conftest.py                      # Shared fixtures
├── test_navi.py                     # Navi agent tests
├── test_sage.py                     # Sage agent tests
├── test_chrono.py                   # Chrono agent tests
├── test_scope.py                    # Scope agent tests
├── test_pulse.py                    # Pulse agent tests
├── test_herald.py                   # Herald agent tests
├── test_common.py                   # Shared utility tests
```

### 2.4 ADR-PM12-004: Real-time Agent Streaming

**Decision:** Extend existing WebSocket infrastructure for agent response streaming.

**Rationale:**
- `RealtimeGateway` already handles PM events (task, phase, presence)
- Add `agent.*` events for streaming responses
- Use project rooms for isolation

**New Events:**
```typescript
// Add to realtime.types.ts
'pm.agent.thinking'      // Agent is processing
'pm.agent.streaming'     // Partial response chunks
'pm.agent.suggestion'    // New suggestion created
'pm.agent.completed'     // Agent response complete
```

---

## 3. Story Technical Specifications

### 3.1 PM-12.1: Agent UI Components (13 points)

#### 3.1.1 Overview

Implement frontend components for agent interactions that were deferred from PM-04.

#### 3.1.2 Components

**AgentPanel.tsx**
```typescript
interface AgentPanelProps {
  projectId: string;
  defaultAgent?: 'navi' | 'sage' | 'chrono' | 'scope' | 'pulse' | 'herald';
  collapsed?: boolean;
  onSuggestionCreated?: (suggestion: Suggestion) => void;
}

// Features:
// - Collapsible chat interface
// - Agent selector (tab or dropdown)
// - Message history with React Query
// - Real-time responses via WebSocket
// - Slash command support
```

**SuggestionCard.tsx**
```typescript
interface SuggestionCardProps {
  suggestion: {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    confidence: number;
    payload: Record<string, unknown>;
    expiresAt: string;
    status: 'pending' | 'accepted' | 'rejected' | 'snoozed';
  };
  onAccept: () => void;
  onReject: () => void;
  onSnooze: (hours: number) => void;
  isLoading?: boolean;
}

// Features:
// - Confidence indicator (color-coded)
// - Expand/collapse for details
// - Accept/Reject/Snooze actions
// - Expiration countdown
```

**TimeTracker.tsx**
```typescript
interface TimeTrackerProps {
  taskId?: string;
  projectId: string;
  onTimeLogged?: (entry: TimeEntry) => void;
}

// Features:
// - Start/stop timer
// - Manual time entry
// - Task selector (optional)
// - Current active timer display
// - Integration with Chrono agent suggestions
```

**EstimationDisplay.tsx**
```typescript
interface EstimationDisplayProps {
  taskId: string;
  estimation: {
    storyPoints: number;
    confidence: number;
    similarTasks: SimilarTask[];
    explanation: string;
  };
  onAccept: () => void;
  onAdjust: (points: number) => void;
}

// Features:
// - Fibonacci point display
// - Confidence meter
// - Similar tasks comparison
// - Accept or adjust actions
```

**HealthDashboard.tsx**
```typescript
interface HealthDashboardProps {
  projectId: string;
  compact?: boolean;
}

// Features:
// - Health score gauge (0-100)
// - Factor breakdown (on-time, blockers, capacity, velocity)
// - Trend indicator (improving/declining/stable)
// - Active risks summary
// - Link to RiskListPanel
```

#### 3.1.3 Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/components/pm/agents/AgentPanel.tsx` | Main agent chat interface |
| `apps/web/src/components/pm/agents/SuggestionCard.tsx` | Individual suggestion display |
| `apps/web/src/components/pm/agents/SuggestionList.tsx` | List container for suggestions |
| `apps/web/src/components/pm/agents/TimeTracker.tsx` | Time tracking widget |
| `apps/web/src/components/pm/agents/EstimationDisplay.tsx` | Estimation results display |
| `apps/web/src/components/pm/agents/HealthDashboard.tsx` | Health score overview |
| `apps/web/src/components/pm/agents/constants.ts` | Shared constants (agent colors, icons) |
| `apps/web/src/components/pm/agents/index.ts` | Barrel exports |
| `apps/web/src/hooks/use-agent-chat.ts` | Chat state management hook |
| `apps/web/src/hooks/use-suggestions.ts` | Suggestions query hook |
| `apps/web/src/hooks/use-time-tracking.ts` | Time tracking state hook |

#### 3.1.4 Acceptance Criteria

- [ ] AgentPanel renders with agent selector and message input
- [ ] SuggestionCard displays all suggestion types with actions
- [ ] TimeTracker supports start/stop and manual entry
- [ ] EstimationDisplay shows Fibonacci points with confidence
- [ ] HealthDashboard integrates with existing health components
- [ ] All components are mobile-responsive
- [ ] Components follow existing shadcn/ui patterns

---

### 3.2 PM-12.2: Agent Response Parsing (8 points)

#### 3.2.1 Overview

Migrate agent response parsing from regex/string matching to Anthropic tool_use structured output.

#### 3.2.2 Current Problem

From PM-05 retrospective (TD-PM05-1):
```typescript
// phase.service.ts - current implementation
private parseAnalysis(response: string): PhaseAnalysis {
  // Returns hardcoded defaults when parsing fails
  return {
    completionPercentage: 0,
    readyForTransition: false,
    recommendations: [],
  };
}
```

#### 3.2.3 Solution

**Define Tool Schemas (Python)**
```python
# agents/pm/tools/structured_outputs.py

from pydantic import BaseModel, Field
from typing import List, Optional

class TaskRecommendation(BaseModel):
    """Recommendation for a specific task."""
    task_id: str
    action: str  # 'complete', 'carry_over', 'cancel'
    reason: str

class PhaseAnalysisOutput(BaseModel):
    """Structured output for phase completion analysis."""
    completion_percentage: int = Field(ge=0, le=100)
    ready_for_transition: bool
    blocking_tasks: List[str] = []
    recommendations: List[TaskRecommendation] = []
    summary: str

class HealthInsightOutput(BaseModel):
    """Structured output for health check insights."""
    score: int = Field(ge=0, le=100)
    level: str  # 'EXCELLENT', 'GOOD', 'WARNING', 'CRITICAL'
    trend: str  # 'IMPROVING', 'STABLE', 'DECLINING'
    risk_summary: str
    recommendations: List[str]
```

**Update Agent Tools to Return Structured Data**
```python
# agents/pm/tools/phase_tools.py

from agno.tools import tool
from .structured_outputs import PhaseAnalysisOutput

@tool
def analyze_phase_completion(
    workspace_id: str,
    phase_id: str,
) -> PhaseAnalysisOutput:
    """
    Analyze phase completion readiness.

    Returns structured analysis with:
    - Completion percentage
    - Transition readiness flag
    - Blocking task IDs
    - Task-specific recommendations
    """
    # Implementation fetches data from API
    # Agent LLM returns structured PhaseAnalysisOutput
    pass
```

**Update NestJS Services to Expect Structured Data**
```typescript
// phase.service.ts - updated implementation

interface PhaseAnalysisResponse {
  completion_percentage: number;
  ready_for_transition: boolean;
  blocking_tasks: string[];
  recommendations: Array<{
    task_id: string;
    action: 'complete' | 'carry_over' | 'cancel';
    reason: string;
  }>;
  summary: string;
}

async analyzePhaseCompletion(
  workspaceId: string,
  phaseId: string,
): Promise<PhaseAnalysisResponse> {
  // Call Python agent via HTTP
  const response = await this.agentClient.post(
    '/agents/scope/analyze-phase',
    { workspace_id: workspaceId, phase_id: phaseId }
  );

  // Response is already structured JSON - validate with Zod
  return PhaseAnalysisResponseSchema.parse(response.data);
}
```

#### 3.2.4 Files to Modify

| File | Changes |
|------|---------|
| `agents/pm/tools/structured_outputs.py` | NEW: Pydantic output models |
| `agents/pm/tools/phase_tools.py` | Use structured output models |
| `agents/pm/tools/health_tools.py` | Use structured output models |
| `agents/pm/scope.py` | Configure tool_use format |
| `agents/pm/pulse.py` | Configure tool_use format |
| `apps/api/src/pm/agents/phase.service.ts` | Update parsing logic |
| `apps/api/src/pm/agents/health.service.ts` | Update parsing logic |

#### 3.2.5 Acceptance Criteria

- [ ] Python agents return Pydantic-validated structured output
- [ ] NestJS services parse structured JSON (no regex)
- [ ] Zod schemas validate API responses
- [ ] Fallback behavior is explicit (throw error, not silent default)
- [ ] Unit tests cover parsing scenarios

---

### 3.3 PM-12.3: Notification Integration (5 points)

#### 3.3.1 Overview

Complete notification delivery for agent events that was stubbed in PM-05.

#### 3.3.2 Current State

From PM-05 retrospective (TD-PM05-2):
```typescript
// health.service.ts - current stub
// TODO: Integrate with NotificationService
// this.notificationService.sendHealthAlert(...)
```

#### 3.3.3 Notification Types

| Event | Recipients | Priority | Channel |
|-------|------------|----------|---------|
| `health.critical` | Project lead, team members | High | In-app + Email |
| `health.warning` | Project lead | Medium | In-app |
| `risk.detected` | Affected users | High | In-app |
| `risk.resolved` | Acknowledger | Low | In-app |
| `report.generated` | Schedule recipients | Medium | In-app + Email |

#### 3.3.4 Implementation

**Extend NotificationService**
```typescript
// apps/api/src/pm/notifications/pm-notification.service.ts

import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

@Injectable()
export class PMNotificationService {
  constructor(
    private notifications: NotificationsService,
    private realtime: RealtimeGateway,
  ) {}

  async sendHealthAlert(
    workspaceId: string,
    projectId: string,
    healthScore: HealthScore,
  ): Promise<void> {
    // Get project team members
    const team = await this.getProjectTeam(projectId);

    // Determine notification priority based on health level
    const priority = this.getHealthPriority(healthScore.level);

    // Create in-app notification for each team member
    for (const member of team) {
      await this.notifications.create({
        workspaceId,
        userId: member.userId,
        type: 'pm.health.alert',
        title: `Project health is ${healthScore.level}`,
        body: healthScore.explanation,
        data: {
          projectId,
          score: healthScore.score,
          level: healthScore.level,
        },
        priority,
      });
    }

    // Broadcast real-time event
    this.realtime.emitToWorkspace(workspaceId, 'pm.health.critical', {
      projectId,
      score: healthScore.score,
      level: healthScore.level,
    });

    // Send email for critical alerts
    if (healthScore.level === 'CRITICAL') {
      await this.sendHealthAlertEmail(team, healthScore);
    }
  }

  async sendRiskNotification(
    workspaceId: string,
    projectId: string,
    risk: RiskEntry,
  ): Promise<void> {
    // Notify affected users
    for (const userId of risk.affectedUsers) {
      await this.notifications.create({
        workspaceId,
        userId,
        type: 'pm.risk.detected',
        title: risk.title,
        body: risk.description,
        data: {
          projectId,
          riskId: risk.id,
          severity: risk.severity,
        },
        priority: risk.severity === 'CRITICAL' ? 'high' : 'medium',
      });
    }
  }
}
```

#### 3.3.5 Files to Modify

| File | Changes |
|------|---------|
| `apps/api/src/pm/notifications/pm-notification.service.ts` | NEW: PM-specific notifications |
| `apps/api/src/pm/agents/health.service.ts` | Inject and call PMNotificationService |
| `apps/api/src/pm/agents/health.cron.ts` | Call notification on health alerts |
| `apps/api/src/pm/agents/report.service.ts` | Notify on report generation |

#### 3.3.6 Acceptance Criteria

- [ ] Health critical/warning sends in-app notification
- [ ] Risk detected notifies affected users
- [ ] Critical health sends email to project lead
- [ ] Notifications respect user preferences
- [ ] Real-time WebSocket events broadcast

---

### 3.4 PM-12.4: Integration & E2E Tests (13 points)

#### 3.4.1 Overview

Add comprehensive test coverage for agent and report endpoints.

#### 3.4.2 Integration Test Setup

```typescript
// apps/api/src/pm/agents/__tests__/test-utils.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import * as request from 'supertest';

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(/* mock external services */)
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const prisma = app.get(PrismaService);

  return { app, prisma };
}

export async function seedTestData(prisma: PrismaService) {
  // Create test workspace, project, tasks
}

export async function cleanupTestData(prisma: PrismaService) {
  // Delete test data
}
```

#### 3.4.3 Integration Test Cases

**Agent Endpoints (agents.controller.integration.ts)**
```typescript
describe('Agents Controller (Integration)', () => {
  describe('POST /pm/agents/chat', () => {
    it('should return agent response for valid request');
    it('should return 401 for unauthenticated request');
    it('should rate limit excessive requests');
  });

  describe('GET /pm/agents/briefing', () => {
    it('should return daily briefing');
    it('should respect user preferences');
  });

  describe('POST /pm/agents/suggestions/:id/accept', () => {
    it('should execute suggestion action');
    it('should update suggestion status');
    it('should fail for expired suggestion');
  });
});
```

**Report Endpoints (report.controller.integration.ts)**
```typescript
describe('Report Controller (Integration)', () => {
  describe('POST /pm/agents/reports/:projectId/generate', () => {
    it('should generate project report');
    it('should store report in database');
  });

  describe('GET /pm/agents/reports/:projectId', () => {
    it('should list project reports with pagination');
    it('should filter by report type');
  });
});
```

**KB RAG Integration (rag.integration.ts)**
```typescript
describe('KB RAG Integration', () => {
  it('should return relevant KB pages for agent query');
  it('should boost verified content in results');
  it('should respect workspace isolation');
});
```

#### 3.4.4 E2E Test Cases (Playwright)

```typescript
// e2e/agents.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Agent Chat Flow', () => {
  test('user can chat with Navi agent', async ({ page }) => {
    await page.goto('/pm/projects/test-project');
    await page.click('[data-testid="agent-panel-toggle"]');
    await page.fill('[data-testid="agent-input"]', 'What tasks are overdue?');
    await page.click('[data-testid="agent-send"]');
    await expect(page.locator('[data-testid="agent-response"]')).toBeVisible();
  });

  test('user can accept suggestion', async ({ page }) => {
    // Navigate to project with pending suggestion
    await page.goto('/pm/projects/test-project');
    await expect(page.locator('[data-testid="suggestion-card"]')).toBeVisible();
    await page.click('[data-testid="suggestion-accept"]');
    await expect(page.locator('[data-testid="suggestion-card"]')).not.toBeVisible();
  });
});
```

#### 3.4.5 Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/pm/agents/__tests__/test-utils.ts` | Shared test utilities |
| `apps/api/src/pm/agents/__tests__/agents.controller.integration.ts` | Agent endpoint tests |
| `apps/api/src/pm/agents/__tests__/report.controller.integration.ts` | Report endpoint tests |
| `apps/api/src/pm/agents/__tests__/health.controller.integration.ts` | Health endpoint tests |
| `apps/api/src/kb/rag/__tests__/rag.integration.ts` | RAG integration tests |
| `e2e/agents.spec.ts` | Agent E2E tests |
| `e2e/suggestions.spec.ts` | Suggestion E2E tests |

#### 3.4.6 Acceptance Criteria

- [ ] Agent endpoint integration tests pass
- [ ] Report endpoint integration tests pass
- [ ] KB RAG integration tests pass
- [ ] E2E tests for critical agent flows pass
- [ ] CI runs integration tests on PR

---

### 3.5 PM-12.5: Python Agent Tests (8 points)

#### 3.5.1 Overview

Add comprehensive Python test coverage for all PM agents.

#### 3.5.2 Test Structure

```
agents/pm/tests/
├── conftest.py              # Shared fixtures
├── test_navi.py             # Navi agent tests
├── test_sage.py             # Sage agent tests
├── test_chrono.py           # Chrono agent tests
├── test_scope.py            # Scope agent tests
├── test_pulse.py            # Pulse agent tests
├── test_herald.py           # Herald agent tests
├── test_prism.py            # Prism agent tests (existing)
├── test_common.py           # Common utility tests
├── test_tools/
│   ├── test_pm_tools.py
│   ├── test_estimation_tools.py
│   ├── test_time_tracking_tools.py
│   ├── test_phase_tools.py
│   ├── test_health_tools.py
│   └── test_report_tools.py
└── mocks/
    ├── api_responses.py     # Mock API responses
    └── fixtures.py          # Test data fixtures
```

#### 3.5.3 Test Implementation

**Shared Fixtures (conftest.py)**
```python
import pytest
from unittest.mock import patch, MagicMock
import httpx

@pytest.fixture
def mock_api_client():
    """Mock httpx client for API calls."""
    with patch('agents.pm.tools.common.httpx.Client') as mock:
        client_instance = MagicMock()
        mock.return_value.__enter__ = MagicMock(return_value=client_instance)
        mock.return_value.__exit__ = MagicMock(return_value=None)
        yield client_instance

@pytest.fixture
def workspace_id():
    return "test-workspace-123"

@pytest.fixture
def project_id():
    return "test-project-456"

@pytest.fixture
def sample_tasks():
    return [
        {
            "id": "task-1",
            "title": "Implement feature",
            "status": "IN_PROGRESS",
            "storyPoints": 5,
        },
        {
            "id": "task-2",
            "title": "Write tests",
            "status": "TODO",
            "storyPoints": 3,
        },
    ]
```

**Agent Tests (test_navi.py)**
```python
import pytest
from agents.pm.navi import create_navi_agent
from agents.pm.tools.pm_tools import get_project_status, list_tasks

class TestNaviAgent:
    def test_create_navi_agent(self, workspace_id, project_id):
        """Test Navi agent creation."""
        agent = create_navi_agent(workspace_id, project_id)
        assert agent.name == "Navi"
        assert len(agent.tools) > 0

    def test_get_project_status(self, mock_api_client, workspace_id, project_id):
        """Test project status tool."""
        mock_api_client.get.return_value.json.return_value = {
            "id": project_id,
            "name": "Test Project",
            "status": "ACTIVE",
        }

        result = get_project_status(workspace_id, project_id)

        assert result["id"] == project_id
        assert result["status"] == "ACTIVE"

    def test_slash_command_parsing(self, workspace_id, project_id):
        """Test slash command parsing."""
        from agents.pm.tools.slash_commands import parse_slash_command

        result = parse_slash_command("/status")
        assert result["command"] == "status"
```

**Tool Tests (test_estimation_tools.py)**
```python
import pytest
from agents.pm.tools.estimation_tools import estimate_task, get_similar_tasks

class TestEstimationTools:
    def test_estimate_task_returns_fibonacci(self, mock_api_client, workspace_id):
        """Test that estimates use Fibonacci scale."""
        mock_api_client.post.return_value.json.return_value = {
            "storyPoints": 5,
            "confidence": 0.85,
        }

        result = estimate_task(
            workspace_id=workspace_id,
            task_id="task-1",
        )

        assert result["storyPoints"] in [1, 2, 3, 5, 8, 13, 21]

    def test_get_similar_tasks_limits_results(self, mock_api_client, workspace_id):
        """Test similar tasks respects query limit."""
        # Return more than limit
        mock_api_client.get.return_value.json.return_value = {
            "tasks": [{"id": f"task-{i}"} for i in range(100)]
        }

        result = get_similar_tasks(
            workspace_id=workspace_id,
            task_description="Test task",
        )

        # Should be limited by QUERY_LIMITS.SIMILAR_TASKS
        assert len(result["tasks"]) <= 50
```

**Input Validation Tests**
```python
import pytest
from agents.pm.tools.phase_tools import transition_phase
from agents.pm.tools.common import validate_workspace_id

class TestInputValidation:
    def test_validate_workspace_id_valid(self):
        """Test valid workspace ID passes."""
        assert validate_workspace_id("ws-abc123") is True
        assert validate_workspace_id("clx1abc2def3ghi4") is True

    def test_validate_workspace_id_invalid(self):
        """Test invalid workspace ID fails."""
        assert validate_workspace_id("") is False
        assert validate_workspace_id("../etc/passwd") is False
        assert validate_workspace_id("<script>") is False

    def test_task_actions_validation(self):
        """Test task_actions parameter validation (TD-PM05-7)."""
        from agents.pm.tools.phase_tools import validate_task_actions

        valid_actions = [
            {"task_id": "task-1", "action": "complete"},
            {"task_id": "task-2", "action": "carry_over"},
        ]
        assert validate_task_actions(valid_actions) is True

        invalid_actions = [
            {"task_id": "task-1", "action": "delete"},  # Invalid action
        ]
        assert validate_task_actions(invalid_actions) is False
```

#### 3.5.4 Acceptance Criteria

- [ ] All 6 PM agents have test files
- [ ] Tool functions have unit tests
- [ ] API calls are mocked (no real HTTP)
- [ ] Input validation is tested
- [ ] Error handling is tested
- [ ] pytest runs successfully in CI

---

### 3.6 PM-12.6: Real-time Agent Features (8 points)

#### 3.6.1 Overview

Implement WebSocket streaming for agent responses and live updates.

#### 3.6.2 New WebSocket Events

```typescript
// apps/api/src/realtime/realtime.types.ts - additions

// Agent events
export const WS_EVENTS = {
  // ... existing events

  // Agent streaming events
  PM_AGENT_THINKING: 'pm.agent.thinking',
  PM_AGENT_STREAMING: 'pm.agent.streaming',
  PM_AGENT_COMPLETED: 'pm.agent.completed',
  PM_AGENT_SUGGESTION: 'pm.agent.suggestion',
} as const;

export interface AgentThinkingPayload {
  agentName: string;
  projectId: string;
  userId: string;
  timestamp: string;
}

export interface AgentStreamingPayload {
  agentName: string;
  projectId: string;
  chunk: string;
  chunkIndex: number;
  isComplete: boolean;
}

export interface AgentSuggestionPayload {
  suggestionId: string;
  projectId: string;
  type: string;
  title: string;
  confidence: number;
}
```

#### 3.6.3 Gateway Methods

```typescript
// apps/api/src/realtime/realtime.gateway.ts - additions

/**
 * Broadcast agent thinking event to project room
 */
broadcastAgentThinking(projectId: string, payload: AgentThinkingPayload): void {
  const room = getProjectRoom(projectId);
  this.server.to(room).emit(WS_EVENTS.PM_AGENT_THINKING, payload);
}

/**
 * Broadcast agent response chunk to project room
 */
broadcastAgentStreaming(projectId: string, payload: AgentStreamingPayload): void {
  const room = getProjectRoom(projectId);
  this.server.to(room).emit(WS_EVENTS.PM_AGENT_STREAMING, payload);
}

/**
 * Broadcast agent completion to project room
 */
broadcastAgentCompleted(projectId: string, payload: { agentName: string }): void {
  const room = getProjectRoom(projectId);
  this.server.to(room).emit(WS_EVENTS.PM_AGENT_COMPLETED, payload);
}

/**
 * Broadcast new suggestion to project room
 */
broadcastAgentSuggestion(projectId: string, payload: AgentSuggestionPayload): void {
  const room = getProjectRoom(projectId);
  this.server.to(room).emit(WS_EVENTS.PM_AGENT_SUGGESTION, payload);
}
```

#### 3.6.4 Service Integration

```typescript
// apps/api/src/pm/agents/agents.service.ts - updated

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  async chat(
    workspaceId: string,
    projectId: string,
    userId: string,
    message: string,
    agentName: string,
  ): Promise<AgentResponse> {
    // Broadcast thinking event
    this.realtime.broadcastAgentThinking(projectId, {
      agentName,
      projectId,
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Call Python agent (could stream in future)
      const response = await this.callPythonAgent(
        workspaceId,
        projectId,
        message,
        agentName,
      );

      // Broadcast completion
      this.realtime.broadcastAgentCompleted(projectId, { agentName });

      return response;
    } catch (error) {
      // Broadcast error state
      this.realtime.broadcastAgentCompleted(projectId, { agentName });
      throw error;
    }
  }
}
```

#### 3.6.5 Frontend Hook

```typescript
// apps/web/src/hooks/use-agent-subscription.ts

import { useEffect, useState } from 'react';
import { useSocket } from '@/providers/socket-provider';

interface AgentState {
  isThinking: boolean;
  currentAgent: string | null;
  streamedContent: string;
  pendingSuggestions: Suggestion[];
}

export function useAgentSubscription(projectId: string) {
  const { socket, isConnected } = useSocket();
  const [state, setState] = useState<AgentState>({
    isThinking: false,
    currentAgent: null,
    streamedContent: '',
    pendingSuggestions: [],
  });

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleThinking = (payload: AgentThinkingPayload) => {
      if (payload.projectId === projectId) {
        setState(prev => ({
          ...prev,
          isThinking: true,
          currentAgent: payload.agentName,
          streamedContent: '',
        }));
      }
    };

    const handleStreaming = (payload: AgentStreamingPayload) => {
      if (payload.projectId === projectId) {
        setState(prev => ({
          ...prev,
          streamedContent: prev.streamedContent + payload.chunk,
        }));
      }
    };

    const handleCompleted = (payload: { agentName: string }) => {
      setState(prev => ({
        ...prev,
        isThinking: false,
        currentAgent: null,
      }));
    };

    const handleSuggestion = (payload: AgentSuggestionPayload) => {
      if (payload.projectId === projectId) {
        setState(prev => ({
          ...prev,
          pendingSuggestions: [...prev.pendingSuggestions, payload],
        }));
      }
    };

    socket.on('pm.agent.thinking', handleThinking);
    socket.on('pm.agent.streaming', handleStreaming);
    socket.on('pm.agent.completed', handleCompleted);
    socket.on('pm.agent.suggestion', handleSuggestion);

    return () => {
      socket.off('pm.agent.thinking', handleThinking);
      socket.off('pm.agent.streaming', handleStreaming);
      socket.off('pm.agent.completed', handleCompleted);
      socket.off('pm.agent.suggestion', handleSuggestion);
    };
  }, [socket, isConnected, projectId]);

  return state;
}
```

#### 3.6.6 Acceptance Criteria

- [ ] Agent thinking state broadcasts to project room
- [ ] Response streaming shows partial content (future enhancement)
- [ ] New suggestions appear in real-time
- [ ] Frontend displays thinking indicator
- [ ] Multiple users see same agent state

---

### 3.7 PM-12.7: Performance & Security Hardening (5 points)

#### 3.7.1 Overview

Address remaining performance and security items from retrospectives.

#### 3.7.2 Per-Project Health Check Frequency

From PM-05 retrospective (TD-PM05-9, PERF-01):

```typescript
// apps/api/src/pm/agents/health.cron.ts - updated

@Injectable()
export class HealthCron {
  @Cron('*/15 * * * *')
  async runHealthChecks() {
    // Get projects with custom health check frequency
    const projects = await this.prisma.project.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        workspaceId: true,
        healthCheckFrequency: true, // New field: 15, 30, 60 minutes
        lastHealthCheck: true,
      },
    });

    const now = new Date();
    const projectsToCheck = projects.filter(p => {
      const frequency = p.healthCheckFrequency || 15; // Default 15 min
      const lastCheck = p.lastHealthCheck;
      if (!lastCheck) return true;

      const minutesSinceCheck = (now.getTime() - lastCheck.getTime()) / 60000;
      return minutesSinceCheck >= frequency;
    });

    // Process with concurrency limit
    await pLimit(CRON_SETTINGS.HEALTH_CHECK_CONCURRENCY)(
      projectsToCheck.map(p => () => this.runHealthCheck(p))
    );
  }
}
```

**Database Migration**
```prisma
// packages/db/prisma/schema.prisma

model Project {
  // ... existing fields

  // Health check configuration
  healthCheckFrequency  Int       @default(15) // Minutes: 15, 30, 60
}
```

#### 3.7.3 SYSTEM_USERS Reserved Prefix

From PM-05 retrospective (TD-PM05-10, SEC-01):

```typescript
// apps/api/src/pm/agents/constants.ts - already implemented

// System user IDs for scheduled/automated tasks
// Use reserved prefix (__system__) to avoid conflicts with real user IDs
export const SYSTEM_USERS = {
  /** System user for health check cron jobs */
  HEALTH_CHECK: '__system__health_check',
  /** System user for scheduled report generation */
  HERALD_AGENT: '__system__herald_agent',
  /** System user for checkpoint reminders */
  CHECKPOINT_REMINDER: '__system__checkpoint',
} as const;
```

**Add Validation Guard**
```typescript
// apps/api/src/common/guards/system-user.guard.ts

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SYSTEM_USERS } from '../../pm/agents/constants';

@Injectable()
export class SystemUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    // Prevent real users from impersonating system users
    if (userId && userId.startsWith('__system__')) {
      return false;
    }

    return true;
  }
}
```

#### 3.7.4 N+1 Query Profiling

From PM-05 retrospective (PERF-04):

```typescript
// apps/api/src/pm/agents/health.service.ts - optimized query

async runHealthCheck(
  workspaceId: string,
  projectId: string,
  userId: string,
): Promise<HealthScore> {
  // Single query with all needed relations (avoid N+1)
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true }, // Only needed fields
              },
            },
          },
        },
      },
      // Get tasks in same query
      phases: {
        include: {
          tasks: {
            where: { deletedAt: null },
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
              completedAt: true,
              estimatedHours: true,
              assigneeId: true,
            },
            take: HEALTH_CHECK_LIMITS.MAX_TASKS,
            orderBy: { updatedAt: 'desc' },
          },
        },
      },
    },
  });

  // Flatten tasks from phases
  const tasks = project.phases.flatMap(p => p.tasks);

  // ... rest of implementation
}
```

#### 3.7.5 Python Input Validation

From PM-05 retrospective (TD-PM05-7):

```python
# agents/pm/tools/phase_tools.py - add validation

from pydantic import BaseModel, Field, validator
from typing import List, Literal

class TaskAction(BaseModel):
    """Validated task action for phase transition."""
    task_id: str = Field(min_length=1, max_length=100)
    action: Literal['complete', 'carry_over', 'cancel']
    reason: str = Field(default='', max_length=500)

    @validator('task_id')
    def validate_task_id(cls, v):
        # Prevent injection
        if '..' in v or '/' in v or '<' in v:
            raise ValueError('Invalid task_id format')
        return v

def validate_task_actions(actions: List[dict]) -> bool:
    """Validate task_actions input."""
    try:
        for action in actions:
            TaskAction(**action)
        return True
    except Exception:
        return False
```

#### 3.7.6 Files to Modify

| File | Changes |
|------|---------|
| `packages/db/prisma/schema.prisma` | Add `healthCheckFrequency` field |
| `apps/api/src/pm/agents/health.cron.ts` | Respect per-project frequency |
| `apps/api/src/common/guards/system-user.guard.ts` | NEW: Prevent system user impersonation |
| `apps/api/src/pm/agents/health.service.ts` | Optimize N+1 queries |
| `agents/pm/tools/phase_tools.py` | Add Pydantic validation for task_actions |

#### 3.7.7 Acceptance Criteria

- [ ] Per-project health frequency is configurable
- [ ] SYSTEM_USERS prefix is validated (no impersonation)
- [ ] Health check uses single optimized query
- [ ] Python task_actions input is validated
- [ ] No N+1 queries in health check

---

## 4. Dependencies

### 4.1 External Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `pydantic` | 2.x | Python structured output validation |
| `pytest` | 8.x | Python testing |
| `pytest-asyncio` | 0.23+ | Async test support |
| `httpx` | 0.27+ | HTTP mocking in tests |
| `@playwright/test` | 1.48+ | E2E testing |

### 4.2 Internal Dependencies

| Component | Dependency |
|-----------|------------|
| PM-12.1 (UI) | PM-12.3 (Notifications) for suggestion alerts |
| PM-12.2 (Parsing) | PM-12.5 (Python Tests) for validation |
| PM-12.3 (Notifications) | PM-06 (Notification infrastructure) |
| PM-12.6 (Real-time) | PM-06 (WebSocket infrastructure) |

---

## 5. Testing Strategy

### 5.1 Test Coverage Targets

| Component | Current | Target |
|-----------|---------|--------|
| NestJS Agent Services | ~60% | 80% |
| NestJS Agent Controllers | ~30% | 80% |
| Python Agents | ~5% | 70% |
| Frontend Components | 0% | 60% |
| E2E Flows | 0% | Key flows covered |

### 5.2 Test Execution

```bash
# NestJS tests
pnpm --filter api test              # Unit tests
pnpm --filter api test:e2e          # Integration tests

# Python tests
cd agents/pm && pytest              # All Python tests
cd agents/pm && pytest -v tests/    # Verbose output

# E2E tests
pnpm exec playwright test e2e/agents.spec.ts
```

---

## 6. Risk Mitigation

### 6.1 Structured Output Migration Risk

**Risk:** Changing agent output format may break existing integrations.

**Mitigation:**
1. Implement behind feature flag initially
2. Run both parsing methods in parallel (shadow mode)
3. Validate structured output matches expected schema
4. Gradual rollout per agent

### 6.2 Test Infrastructure Risk

**Risk:** E2E tests may be flaky or slow.

**Mitigation:**
1. Use test database (not prod)
2. Implement proper test isolation
3. Use fixtures for consistent data
4. Retry flaky tests (max 2 retries)

### 6.3 UI Scope Creep Risk

**Risk:** Agent UI components could expand significantly.

**Mitigation:**
1. Define clear component boundaries
2. MVP features only (no polish)
3. Use existing patterns from health components
4. Time-box each component (max 2 days)

---

## 7. Implementation Order

### 7.1 Recommended Story Sequence

1. **PM-12.7** (Performance/Security) - Foundation for all stories
2. **PM-12.2** (Response Parsing) - Required for reliable agent output
3. **PM-12.5** (Python Tests) - Validate parsing changes
4. **PM-12.3** (Notifications) - Complete notification delivery
5. **PM-12.4** (Integration Tests) - Validate end-to-end
6. **PM-12.6** (Real-time) - Add streaming capabilities
7. **PM-12.1** (UI Components) - Frontend integration (depends on all above)

### 7.2 Parallel Work Opportunities

- PM-12.2 and PM-12.5 can be developed in parallel
- PM-12.3 and PM-12.6 share WebSocket work
- PM-12.4 E2E tests can start after PM-12.1 skeleton

---

## 8. References

- [PM-04 Retrospective](../retrospectives/pm-04-retrospective.md)
- [PM-05 Retrospective](../retrospectives/pm-05-retrospective.md)
- [Module Architecture](../architecture.md)
- [Health Score Algorithm](../../architecture/health-score-algorithm.md)
- [Cron Scheduling Strategy](../../architecture/cron-job-scheduling.md)
- [Epic Definition](../epics/epic-pm-12-consolidated-followups.md)

---

**Document Version:** 1.0
**Created:** 2025-12-28
**Author:** Claude Code
**Status:** Ready for Implementation
