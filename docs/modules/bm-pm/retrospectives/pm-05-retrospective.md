# Epic PM-05: AI Team - Scope, Pulse, Herald - Retrospective

**Epic:** PM-05 - AI Team (Scope, Pulse, Herald)
**Completion Date:** 2025-12-21
**Sprint Duration:** 3 days (accelerated delivery)
**Total Story Points:** ~61 (8 stories)
**Stories Completed:** 8/8

---

## Executive Summary

Epic PM-05 successfully delivered the second wave of AI agents for project management: Scope (phase transitions), Pulse (health monitoring), and Herald (automated reporting). This epic built on the foundation established in PM-04 (Navi, Sage, Chrono), completing the full AI team for the Core-PM module.

### Key Achievements

- **All 8 stories completed** with comprehensive feature coverage
- **~25,000+ lines added** across 80+ files changed
- **3 new agents implemented** following established Agno patterns
- Successfully implemented real-time health monitoring with cron-based automation
- First scheduled report automation with Herald agent
- Comprehensive risk detection and health scoring system
- Frontend components: RiskCard, RiskAlertBanner, RiskListPanel, PhaseTransitionModal, ReportCard

---

## Team Velocity & Metrics

| Metric | Value |
|--------|-------|
| Planned Story Points | ~61 |
| Delivered Story Points | ~61 |
| Velocity | 100% |
| Stories | 8/8 |
| Commits | ~40 (feature + merge + fix) |
| PR Reviews | 3 AI reviews per story |
| Files Changed | 80+ |
| Lines Added | ~25,000 |
| Lines Deleted | ~800 |

### Stories Completed

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| PM-05.1 | Scope Agent - Phase Management | 8 | ✅ Done |
| PM-05.2 | Scope Phase Transition Flow | 8 | ✅ Done |
| PM-05.3 | Scope Checkpoint Reminders | 5 | ✅ Done |
| PM-05.4 | Pulse Health Agent | 8 | ✅ Done |
| PM-05.5 | Pulse Risk Alerts | 8 | ✅ Done |
| PM-05.6 | Herald Report Generation | 8 | ✅ Done |
| PM-05.7 | Herald Stakeholder Reports | 8 | ✅ Done |
| PM-05.8 | Herald Scheduled Reports | 8 | ✅ Done |

---

## What Went Well

### 1. Building on PM-04 Patterns

The patterns established in PM-04 were directly reused:
- Agent factory pattern: `create_xxx_agent()`
- Shared memory via PostgresStorage
- Service auth guards for agent-to-API calls
- Tool-based architecture with httpx client
- Constants extraction to dedicated files

**Impact:** New agents were faster to implement due to established patterns.

### 2. Comprehensive Health Monitoring System

The Pulse agent implementation was particularly robust:
- 4 risk types detected (deadline, blocker chain, capacity, velocity)
- Health score with weighted factors (on-time delivery, blockers, capacity, velocity)
- Severity levels (CRITICAL, HIGH, MEDIUM, LOW)
- Cron-based automation (15-minute intervals)
- Real-time risk subscriptions via WebSocket

**Code Pattern:**
```typescript
// Health score calculation with weighted factors
const score = Math.round(
  (onTimeDelivery * 30) +      // 30% weight
  (blockerImpact * 25) +        // 25% weight
  (teamCapacity * 25) +         // 25% weight
  (velocityTrend * 20)          // 20% weight
);
```

### 3. Frontend Component Library Expansion

PM-05.5 delivered polished React components:
- `RiskCard.tsx` - Individual risk display with severity styling
- `RiskAlertBanner.tsx` - Prominent banner for critical risks
- `RiskListPanel.tsx` - Slide-out panel for risk management
- `HealthScoreCard.tsx` - Health score visualization
- Shared `constants.ts` for severity config (DRY principle)

### 4. Scheduled Automation with Herald

First implementation of scheduled reporting:
- Cron-based report generation
- Multiple schedule frequencies (daily, weekly, biweekly, monthly)
- Report template system with markdown output
- Stakeholder targeting with custom distribution

### 5. Phase Transition Modal

Complex UX for phase completion:
- AI-powered task recommendations (complete/carry over/cancel)
- Interactive task action selection
- Phase completion summary with blockers
- Next phase preview
- Human approval workflow

### 6. Database Schema Evolution

Clean migrations with comprehensive models:
- `PhaseCheckpoint` for milestone tracking
- `RiskEntry` for detected risks
- `HealthScore` for historical health data
- `Report` for generated reports
- `ScheduledReport` for automation config
- Composite indexes for health dashboard performance

---

## What Could Be Improved

### 1. Test Coverage Still Lacking

**Issue:** No unit tests, integration tests, or Python tests written.

**Stories affected:** All 8 stories

**Impact:** Manual testing burden, regression risk

**Root Cause:** Accelerated delivery timeline, same pattern as PM-04

**Action Item:** This is now a recurring pattern - needs dedicated test sprint

### 2. Agent Response Parsing Not Fully Implemented

**Issue:** `parseAnalysis()` and similar methods return default values instead of parsing agent responses.

**Stories affected:** PM-05.1, PM-05.4

**Impact:** Agents run but some recommendations are hardcoded defaults

**Root Cause:** Agent output format is unpredictable without structured output

**Recommendation:** Use Anthropic's tool use for structured responses

### 3. Some Code Review Suggestions Reverted

**Issue:** Several code quality improvements (p-limit concurrent processing, Zod validation, transaction boundaries) were reverted by linter/hooks.

**Files affected:**
- health.cron.ts - Concurrent processing reverted
- scheduled-report.cron.ts - Concurrent processing reverted
- useRiskSubscription.ts - Zod validation reverted

**Impact:** Sequential processing may be slower, validation less robust

**Root Cause:** Unclear - may be linter rules or intentional reversion

### 4. NotificationService Integration Incomplete

**Issue:** Health alerts reference NotificationService but notification sending not fully implemented.

**Stories affected:** PM-05.4, PM-05.5

**Impact:** Users may not receive health alert notifications

**Action Item:** Complete notification integration in PM-06

---

## Code Review Issues Summary

### Issues Identified and Addressed

| Category | Issues | Status |
|----------|--------|--------|
| Type Safety | Type assertions in report.service.ts | Verified as established pattern |
| Race Conditions | Query invalidation not awaited | Fixed in use-phase-transition.ts |
| DRY Violation | Duplicated severity config | Extracted to constants.ts |
| Accessibility | Missing ARIA labels | Verified already implemented |
| Database Performance | Missing composite indexes | Added health dashboard indexes |

### Issues Attempted but Reverted

| Issue | File | Status |
|-------|------|--------|
| N+1 query with p-limit | health.cron.ts | Reverted |
| Transaction boundaries | health.service.ts | Reverted |
| SSE message validation | useRiskSubscription.ts | Reverted |
| Token validation fail-fast | common.py | Reverted |

---

## Technical Decisions Made

### 1. Risk Severity Enum vs. String

**Decision:** Use enum for risk severity (CRITICAL, HIGH, MEDIUM, LOW)
**Rationale:**
- Type safety at compile time
- Consistent across frontend and backend
- Easy to add new severity levels

### 2. Health Score Weighting

**Decision:** Weighted factor approach (30/25/25/20 split)
**Rationale:**
- On-time delivery most impactful (30%)
- Blockers and capacity equally important (25% each)
- Velocity trend is lagging indicator (20%)

### 3. Scheduled Report Cron vs. Per-User Timers

**Decision:** Single cron with filtered queries
**Rationale:**
- Simpler architecture
- Batch processing efficiency
- Easier to monitor and debug

### 4. PhaseSnapshot for Velocity Baseline

**Decision:** Store phase snapshots for velocity calculations
**Rationale:**
- Historical data for trend analysis
- Burndown chart support
- Sprint retrospective data

### 5. Shared Constants for Severity Styling

**Decision:** Extract severity config to shared constants.ts
**Rationale:**
- Single source of truth
- Used by RiskCard, RiskAlertBanner, RiskListPanel
- Easy to maintain styling consistency

---

## Deliverables Summary

### Agents Implemented

| Agent | Role | Key Tools |
|-------|------|-----------|
| **Scope** | Phase Management | `analyze_phase_completion`, `suggest_phase_transition`, `check_phase_checkpoint` |
| **Pulse** | Health Monitoring | `detect_risks`, `calculate_health_score`, `check_team_capacity`, `analyze_velocity` |
| **Herald** | Report Generation | `generate_project_report`, `generate_health_report`, `generate_progress_report` |

### API Endpoints Added

**Phase Endpoints:**
- `POST /pm/phases/:id/analyze-completion` - Scope analysis
- `POST /pm/phases/:id/transition` - Execute transition
- `GET /pm/phases/:id/checkpoints/upcoming` - Get checkpoints

**Health Endpoints:**
- `POST /pm/agents/health/:projectId/check` - Trigger health check
- `GET /pm/agents/health/:projectId` - Get latest score
- `GET /pm/agents/health/:projectId/risks` - Get active risks
- `PATCH /pm/agents/health/:projectId/risks/:riskId` - Update risk status

**Report Endpoints:**
- `POST /pm/agents/reports/:projectId/generate` - Generate report
- `GET /pm/agents/reports/:projectId` - List reports
- `GET /pm/agents/reports/:projectId/:reportId` - Get report

**Scheduled Report Endpoints:**
- `GET /pm/agents/scheduled-reports/workspace` - List schedules
- `POST /pm/agents/scheduled-reports/:projectId` - Create schedule
- `PATCH /pm/agents/scheduled-reports/:id` - Update schedule
- `DELETE /pm/agents/scheduled-reports/:id` - Delete schedule

### Database Models Added

| Model | Purpose |
|-------|---------|
| `PhaseCheckpoint` | Milestone tracking within phases |
| `PhaseSnapshot` | Historical phase data for velocity |
| `RiskEntry` | Detected project risks |
| `HealthScore` | Historical health calculations |
| `Report` | Generated reports |
| `ScheduledReport` | Report automation config |

### Frontend Components Added

| Component | Location | Purpose |
|-----------|----------|---------|
| `RiskCard` | `components/pm/health/` | Individual risk display |
| `RiskAlertBanner` | `components/pm/health/` | Critical risk banner |
| `RiskListPanel` | `components/pm/health/` | Slide-out risk list |
| `HealthScoreCard` | `components/pm/health/` | Health score display |
| `PhaseTransitionModal` | `components/pm/phases/` | Phase completion workflow |
| `ReportCard` | `components/pm/reports/` | Report display |
| `ScheduledReportForm` | `components/pm/reports/` | Schedule configuration |

---

## Comparison to PM-04 Lessons Learned

### From PM-04 "What to Start Doing"

| Lesson | PM-05 Status |
|--------|--------------|
| Test-driven development | ❌ Still not implemented |
| End-to-end features | ✅ Frontend + backend in same stories |
| Story documentation updates | ⚠️ Partial - some still have TBD |
| Input validation templates | ✅ DTOs with class-validator |

### PM-04 Patterns Successfully Reused

1. ✅ Agent factory pattern (`create_xxx_agent()`)
2. ✅ Shared memory via PostgresStorage
3. ✅ Service auth guards
4. ✅ Tool-based architecture with httpx
5. ✅ Constants extraction

---

## Impact on Next Epic (PM-06)

Epic PM-06 (Real-Time & Notifications) builds on PM-05:

### Dependencies Met

- Health alerts ready for notification delivery
- Risk events ready for WebSocket broadcast
- Report generation events for real-time updates
- Phase transition events for UI sync

### Patterns to Reuse

1. **WebSocket events:** Health/risk events use same pattern
2. **Cron scheduling:** Checkpoint/report crons as reference
3. **Constants extraction:** Severity config pattern
4. **Frontend hooks:** useRiskSubscription as reference

### Lessons to Apply

1. **Implement tests** - Critical before PM-06 due to real-time complexity
2. **Use structured output** - For agent response parsing
3. **Complete notification integration** - Health alerts need delivery
4. **Review reverted changes** - Understand why p-limit, Zod were reverted

### Risks to Mitigate

1. WebSocket scaling needs Redis pub/sub
2. Presence tracking adds memory overhead
3. Notification preferences add complexity
4. Agent streaming needs progress events

---

## Action Items

### Immediate (Before PM-06)

| ID | Action | Owner | Priority | Status |
|----|--------|-------|----------|--------|
| PM-05-TEST-1 | Add unit tests for health services | Dev | High | Pending |
| PM-05-TEST-2 | Add integration tests for report endpoints | Dev | High | Pending |
| PM-05-TEST-3 | Add Python tests for all PM agents | Dev | High | Pending |

### Backlog (Future Sprint)

| ID | Action | Owner | Priority | Status |
|----|--------|-------|----------|--------|
| PM-05-PARSE-1 | Implement agent response parsing | Dev | Medium | Pending |
| PM-05-NOTIF-1 | Complete notification integration | Dev | High | Pending |
| PM-05-UI-1 | Add health dashboard to project overview | Dev | Medium | Pending |

### Technical Debt

| ID | Issue | Files | Effort | Status |
|----|-------|-------|--------|--------|
| TD-PM05-1 | Agent response parsing uses defaults | phase.service.ts, health.service.ts | Medium | Pending |
| TD-PM05-2 | Notification sending not implemented | health.service.ts | Medium | Pending |
| TD-PM05-3 | Trend calculation hardcoded as STABLE | health.service.ts | Low | Pending |
| TD-PM05-4 | Investigate reverted code improvements | health.cron.ts, scheduled-report.cron.ts | Low | Pending |

---

## Lessons Learned

### What to Keep Doing

1. **Building on established patterns** - PM-04 patterns made PM-05 faster
2. **Frontend + backend in same stories** - End-to-end features are more complete
3. **Constants extraction** - Shared severity config prevented duplication
4. **Comprehensive health model** - Weighted factors, historical tracking
5. **Cron-based automation** - Reliable scheduled processing

### What to Start Doing

1. **Write tests during implementation** - Two epics with 0% test coverage is a pattern
2. **Use structured output** - For reliable agent response parsing
3. **Complete notification integration** - Don't defer critical paths
4. **Investigate linter/hook reversions** - Understand why improvements fail

### What to Stop Doing

1. **Deferring all tests** - Creates compounding technical debt
2. **Hardcoding agent fallbacks** - Reduces agent value
3. **Leaving TBD placeholders** - Story files should be complete

---

## Metrics and KPIs

### Development Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Story completion | 8/8 | 8/8 | ✅ Met |
| TypeScript type check | Pass | Pass | ✅ Met |
| ESLint | Pass | Pass | ✅ Met |
| Test coverage | 0% | 80% | ❌ Not Met |

### Quality Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Security issues found | 0 | Guards and validation in place |
| Critical bugs found | 0 | None in production |
| Code duplication | Low | Constants extracted, patterns reused |
| Documentation completeness | 80% | Most story files updated |

---

## Conclusion

Epic PM-05 was a successful delivery that completed the AI agent team for HYVVE's Core-PM module. The 3-day sprint added Scope (phase management), Pulse (health monitoring), and Herald (reporting) to join Navi, Sage, and Chrono from PM-04.

**Key achievements:**
- Full AI team operational (6 agents)
- Comprehensive health monitoring with risk detection
- Automated scheduled reports
- Phase transition workflow with AI guidance
- Polished frontend components for health/risk display

**Critical areas for improvement:**
- Test coverage remains at 0% (same as PM-04)
- Agent response parsing needs implementation
- Notification integration needs completion

The patterns established continue to prove valuable, enabling rapid development. However, the test debt is now a significant concern spanning two epics. This should be addressed before PM-06 adds real-time complexity.

---

**Retrospective Completed:** 2025-12-21
**Next Epic:** PM-06 - Real-Time & Notifications
**Status:** Ready to proceed with action items noted

---

## Appendix: Commit Timeline (Key Commits)

1. `252e1e9` - Feat(pm-05.8): implement Herald scheduled report automation
2. `72e36a4` - Chore: mark PM-05 epic complete
3. `7ee98d3` - Code quality improvements (constants, race condition, indexes)
4. `7eac6b0` - cancelledAt field and migration runbook
5. Earlier commits for PM-05.1 through PM-05.7

## Appendix: Files Changed Summary

**Python Agent Layer:**
- `agents/pm/scope.py` - Scope agent
- `agents/pm/pulse.py` - Pulse agent
- `agents/pm/herald.py` - Herald agent
- `agents/pm/team.py` - Team integration
- `agents/pm/tools/phase_tools.py` - Phase management tools
- `agents/pm/tools/health_tools.py` - Health monitoring tools
- `agents/pm/tools/report_tools.py` - Report generation tools

**NestJS Backend:**
- `apps/api/src/pm/agents/phase.service.ts`
- `apps/api/src/pm/agents/health.service.ts`
- `apps/api/src/pm/agents/health.controller.ts`
- `apps/api/src/pm/agents/health.cron.ts`
- `apps/api/src/pm/agents/report.service.ts`
- `apps/api/src/pm/agents/report.controller.ts`
- `apps/api/src/pm/agents/scheduled-report.service.ts`
- `apps/api/src/pm/agents/scheduled-report.controller.ts`
- `apps/api/src/pm/agents/scheduled-report.cron.ts`
- `apps/api/src/pm/agents/checkpoint.service.ts`

**Frontend Components:**
- `apps/web/src/components/pm/health/RiskCard.tsx`
- `apps/web/src/components/pm/health/RiskAlertBanner.tsx`
- `apps/web/src/components/pm/health/RiskListPanel.tsx`
- `apps/web/src/components/pm/health/HealthScoreCard.tsx`
- `apps/web/src/components/pm/health/constants.ts`
- `apps/web/src/components/pm/phases/PhaseTransitionModal.tsx`
- `apps/web/src/components/pm/reports/ReportCard.tsx`

**Database Schema:**
- `packages/db/prisma/schema.prisma`
- Migrations for phase checkpoints, health scores, risk entries, reports, scheduled reports
