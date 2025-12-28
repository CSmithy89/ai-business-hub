# Epic PM-12: Consolidated Follow-ups from PM-04/PM-05

## Overview

This epic consolidates all remaining action items, technical debt, and enhancements identified in the PM-04 and PM-05 retrospectives. These items were deferred to allow focus on core functionality delivery.

## Scope

### From PM-04 (Navi, Sage, Chrono)

| ID | Item | Priority | Effort |
| --- | --- | --- | --- |
| PM-04-TEST-2 | Integration tests for agent endpoints | High | Medium |
| PM-04-TEST-3 | Python tests for agent tools | Medium | Medium |
| PM-04-UI-1 | AgentPanel component | High | High |
| PM-04-UI-2 | SuggestionCard component | High | Medium |
| PM-04-UI-3 | TimeTracker component | Medium | Medium |
| PM-04-UI-4 | EstimationDisplay component | Medium | Medium |
| TD-PM04-1 | E2E tests for agent flows | High | High |
| TD-PM04-2 | WebSocket agent responses | Medium | Medium |
| TD-PM04-3 | Agent response streaming | Medium | Medium |
| TD-PM04-4 | KB RAG integration tests | Medium | Medium |

### From PM-05 (Scope, Pulse, Herald)

| ID | Item | Priority | Effort |
| --- | --- | --- | --- |
| PM-05-TEST-2 | Integration tests for report endpoints | High | Medium |
| PM-05-TEST-3 | Python tests for all PM agents | High | High |
| PM-05-PARSE-1 | Agent response parsing (structured output) | Medium | High |
| PM-05-NOTIF-1 | Complete notification integration | High | Medium |
| PM-05-UI-1 | Health dashboard in project overview | Medium | Medium |
| TD-PM05-1 | Agent response parsing defaults | Medium | High |
| TD-PM05-2 | Notification sending implementation | Medium | Medium |
| TD-PM05-7 | Python task_actions validation | Low | Low |
| TD-PM05-9 | Per-project health check frequency | Medium | Medium |
| TD-PM05-10 | SYSTEM_USERS prefix convention | Low | Low |
| PERF-01 | Per-project health frequency config | Medium | Medium |
| PERF-04 | N+1 query profiling for team members | Low | Low |
| SEC-01 | SYSTEM_USERS reserved prefix | Low | Low |

## Proposed Stories

### Story PM-12.1: Agent UI Components

Implement frontend components for agent interactions:
- AgentPanel (chat interface)
- SuggestionCard (action suggestions)
- TimeTracker (time logging)
- EstimationDisplay (estimation results)
- Health dashboard integration

**Points:** 13

### Story PM-12.2: Agent Response Parsing

Implement structured output parsing for Python agents:
- Use Anthropic tool_use for structured responses
- Parse phase analysis recommendations
- Parse health check insights
- Remove hardcoded defaults

**Points:** 8

### Story PM-12.3: Notification Integration

Complete notification delivery for agent events:
- Health alert notifications
- Risk threshold notifications
- Report generation notifications
- User preference respect

**Points:** 5

### Story PM-12.4: Integration & E2E Tests

Add comprehensive test coverage:
- Agent endpoint integration tests
- Report endpoint integration tests
- E2E agent workflow tests
- KB RAG integration tests

**Points:** 13

### Story PM-12.5: Python Agent Tests

Add Python test coverage:
- Unit tests for all agent tools
- Mock API responses
- Input validation tests
- Error handling tests

**Points:** 8

### Story PM-12.6: Real-time Agent Features

Implement WebSocket-based agent features:
- Agent response streaming
- Real-time suggestion updates
- Live health score changes

**Points:** 8

### Story PM-12.7: Performance & Security Hardening

Address remaining performance and security items:
- Per-project health check frequency
- SYSTEM_USERS prefix convention
- N+1 query optimization
- Python input validation

**Points:** 5

## Total Points: 60

## Dependencies

- PM-06 (Real-time & Notifications) - For notification infrastructure
- PM-11 (External API Governance) - For API patterns

## Risks

1. **Structured Output Migration** - Changing agent output format may require coordination with existing integrations
2. **Test Infrastructure** - E2E tests may need additional tooling setup
3. **UI Scope Creep** - Agent UI components could expand significantly

## Success Criteria

- All agent UI components implemented and integrated
- Agent responses properly parsed (no hardcoded defaults)
- Notifications delivered for all agent events
- 80%+ test coverage for agent services
- Python agents have comprehensive test suite
- Real-time features working via WebSocket

## References

- [PM-04 Retrospective](../retrospectives/pm-04-retrospective.md)
- [PM-05 Retrospective](../retrospectives/pm-05-retrospective.md)
- [Health Score Algorithm](../../architecture/health-score-algorithm.md)
- [Cron Scheduling Strategy](../../architecture/cron-job-scheduling.md)
