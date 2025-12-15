# Epic 13: AI Agent Management

**Epic ID:** EPIC-13
**Status:** Backlog
**Priority:** P1/P2 - High/Medium
**Phase:** Post-Foundation Enhancement

---

## Epic Overview

Implement the full AI agent management system from wireframes AI-02 through AI-05. This epic builds the UI for viewing, configuring, and monitoring all AI agents in the platform.

### Business Value
Complete visibility and control over AI agents. Users can customize agent behavior, monitor performance, and configure BYOAI settings per agent. Essential for enterprise adoption.

### Success Criteria
- [ ] Agent dashboard shows all 16+ agents with status
- [ ] Agent detail modal provides full configuration access
- [ ] Activity feed shows real-time agent actions
- [ ] Agent configuration page enables BYOAI customization
- [ ] Confidence breakdown shows detailed AI reasoning

### Dependencies
- **Requires:** EPIC-11 (Agent Integration) - Agent APIs must be wired first
- **Parallel with:** EPIC-14 (Testing & Observability)

### Reference
- See wireframes: AI-02, AI-03, AI-04, AI-05
- Location: `docs/design/wireframes/Finished wireframes and html files/`

---

## Stories

### Story 13.1: Agent Card Components

**Points:** 3
**Priority:** P1 High

**As a** user
**I want** to see agent cards with status and stats
**So that** I can quickly understand agent availability

**Acceptance Criteria:**
- [ ] AC1: Create AgentCardCompact component (avatar + name + status dot)
- [ ] AC2: Create AgentCardStandard component (with performance stats)
- [ ] AC3: Create AgentCardExpanded component (with action buttons)
- [ ] AC4: Create AgentAvatar component with status indicator
- [ ] AC5: Pulsing green dot animation for online status
- [ ] AC6: Display performance stats (tasks completed, success rate)
- [ ] AC7: "Chat with Agent" button on expanded card
- [ ] AC8: Full dark mode support

**Wireframes:** AI-02

**Files:**
- `apps/web/src/components/agents/AgentCard.tsx` (create)
- `apps/web/src/components/agents/AgentCardCompact.tsx` (create)
- `apps/web/src/components/agents/AgentCardStandard.tsx` (create)
- `apps/web/src/components/agents/AgentCardExpanded.tsx` (create)
- `apps/web/src/components/agents/AgentAvatar.tsx` (create)
- `apps/web/src/components/agents/AgentStatusBadge.tsx` (create)

**Technical Notes:**
- Status options: online (green), busy (yellow), offline (gray), error (red)
- Cards should be composable for different contexts

---

### Story 13.2: Agent Detail Modal

**Points:** 5
**Priority:** P1 High

**As a** manager
**I want** to see detailed agent information in a modal
**So that** I can understand and configure agent behavior

**Acceptance Criteria:**
- [ ] AC1: Create AgentDetailModal with 5-tab interface
- [ ] AC2: Overview tab: agent info, 30-day metrics, capabilities list
- [ ] AC3: Activity tab: recent actions timeline with timestamps
- [ ] AC4: Configuration tab: model settings, behavior controls
- [ ] AC5: Permissions tab: data access toggles, module restrictions
- [ ] AC6: Analytics tab: performance charts (tasks, success rate, response time)
- [ ] AC7: Edit button to modify settings from modal
- [ ] AC8: Responsive design for mobile/tablet

**Wireframes:** AI-03

**Files:**
- `apps/web/src/components/agents/AgentDetailModal.tsx` (create)
- `apps/web/src/components/agents/tabs/OverviewTab.tsx` (create)
- `apps/web/src/components/agents/tabs/ActivityTab.tsx` (create)
- `apps/web/src/components/agents/tabs/ConfigurationTab.tsx` (create)
- `apps/web/src/components/agents/tabs/PermissionsTab.tsx` (create)
- `apps/web/src/components/agents/tabs/AnalyticsTab.tsx` (create)

**Technical Notes:**
- Capabilities checklist shows what agent can do
- Charts use recharts or similar library

---

### Story 13.3: Agent Activity Feed

**Points:** 4
**Priority:** P2 Medium

**As a** operator
**I want** a real-time feed of all agent activity
**So that** I can monitor what agents are doing across the platform

**Acceptance Criteria:**
- [ ] AC1: Create `/agents/activity` page with full-page layout
- [ ] AC2: Filter controls: Agent dropdown, Type dropdown, Status dropdown
- [ ] AC3: "Live" indicator with pulsing dot animation
- [ ] AC4: "X new activities" notification banner that scrolls to new items
- [ ] AC5: Activity cards with inline action buttons
- [ ] AC6: Right sidebar showing recent activity summary
- [ ] AC7: Real-time updates via WebSocket or SSE
- [ ] AC8: Pagination or infinite scroll for history

**Wireframes:** AI-04

**Files:**
- `apps/web/src/app/agents/activity/page.tsx` (create)
- `apps/web/src/components/agents/ActivityFeed.tsx` (create)
- `apps/web/src/components/agents/ActivityCard.tsx` (create)
- `apps/web/src/components/agents/ActivityFilters.tsx` (create)
- `apps/web/src/hooks/use-agent-activity.ts` (create)

**Technical Notes:**
- Consider using event bus for real-time updates
- Activity types: task_started, task_completed, approval_requested, error

---

### Story 13.4: Agent Configuration Page

**Points:** 5
**Priority:** P1 High

**As a** admin
**I want** to configure agent settings in detail
**So that** I can customize agent behavior for my organization

**Acceptance Criteria:**
- [ ] AC1: Create `/agents/[id]/configure` page with sidebar navigation
- [ ] AC2: 8-section sidebar: General, AI Model, Behavior, Memory, Integrations, Notifications, Advanced, Danger Zone
- [ ] AC3: General settings: display name, role description, avatar (emoji or image), theme color picker
- [ ] AC4: AI Model settings: primary model dropdown, fallback model, temperature slider (0-2), max tokens input, context window radio (4K/8K/16K)
- [ ] AC5: Behavior settings: automation level (Manual/Smart/Full Auto), confidence threshold slider, tone slider (Professional to Casual), custom instructions textarea
- [ ] AC6: Integrations section: connected services toggles
- [ ] AC7: Danger zone: Reset to defaults, Disable agent, Delete agent
- [ ] AC8: Save/Cancel buttons with unsaved changes detection
- [ ] AC9: Form validation for all inputs

**Wireframes:** AI-05

**Files:**
- `apps/web/src/app/agents/[id]/configure/page.tsx` (create)
- `apps/web/src/components/agents/config/ConfigSidebar.tsx` (create)
- `apps/web/src/components/agents/config/GeneralSettings.tsx` (create)
- `apps/web/src/components/agents/config/AIModelSettings.tsx` (create)
- `apps/web/src/components/agents/config/BehaviorSettings.tsx` (create)
- `apps/web/src/components/agents/config/IntegrationsSettings.tsx` (create)
- `apps/web/src/components/agents/config/DangerZone.tsx` (create)

**Technical Notes:**
- Temperature: 0 = deterministic, 2 = creative
- Confidence threshold affects approval routing

---

### Story 13.5: Agent Dashboard Page

**Points:** 4
**Priority:** P2 Medium

**As a** user
**I want** a dashboard showing all my agents
**So that** I can see status and access any agent quickly

**Acceptance Criteria:**
- [ ] AC1: Create `/agents` page with card grid layout
- [ ] AC2: Display all 16+ agents using AgentCard components
- [ ] AC3: Group agents by team (Validation, Planning, Branding, Approval)
- [ ] AC4: Search input to filter agents by name
- [ ] AC5: Click card to open AgentDetailModal
- [ ] AC6: Status summary header: "X online, Y busy, Z offline"
- [ ] AC7: Link to Activity Feed in header
- [ ] AC8: Responsive grid: 4 columns on desktop, 2 on tablet, 1 on mobile

**Wireframes:** Based on AI-02 grid layout

**Files:**
- `apps/web/src/app/agents/page.tsx` (create)
- `apps/web/src/components/agents/AgentGrid.tsx` (create)
- `apps/web/src/components/agents/AgentFilters.tsx` (create)
- `apps/web/src/components/agents/AgentStatusSummary.tsx` (create)

**Technical Notes:**
- Group headers: "Vera's Validation Team", "Blake's Planning Team", "Bella's Branding Team", "Approval Team"

---

### Story 13.6: Confidence Breakdown System

**Points:** 4
**Priority:** P2 Medium

**As a** reviewer
**I want** to see detailed confidence breakdown
**So that** I understand why AI gave a certain confidence score

**Acceptance Criteria:**
- [ ] AC1: Add ConfidenceBreakdown component to ApprovalDetailModal
- [ ] AC2: Display Content Quality score with progress bar
- [ ] AC3: Display Brand Alignment score with progress bar
- [ ] AC4: Display Recipient Match score with progress bar
- [ ] AC5: Display Timing Score with progress bar
- [ ] AC6: AI Reasoning section with bullet points for low-confidence items
- [ ] AC7: Suggested Actions section (e.g., "Schedule Review Call", "Request Legal Review")
- [ ] AC8: Create backend API for factor calculation

**Wireframes:** AP-02, AP-03

**Files:**
- `apps/web/src/components/approval/ConfidenceBreakdown.tsx` (create)
- `apps/web/src/components/approval/ConfidenceFactorBar.tsx` (create)
- `apps/web/src/components/approval/AIReasoning.tsx` (create)
- `apps/web/src/components/approval/SuggestedActions.tsx` (create)
- `apps/web/src/components/approval/approval-detail-modal.tsx` (modify)
- `apps/web/src/app/api/approvals/[id]/confidence/route.ts` (create)

**Technical Notes:**
- Factors are calculated by AI during confidence scoring
- Low confidence (<60%) items should always show reasoning

---

## Summary

| Metric | Value |
|--------|-------|
| Total Stories | 6 |
| Total Points | 25 |
| P1 High | 3 stories (13 points) |
| P2 Medium | 3 stories (12 points) |
| Dependencies | EPIC-11 |
| Parallel with | EPIC-14 |

---

## Wireframe Gaps Addressed

From `docs/wireframe-gap-analysis.md`:

| Gap | Wireframe | Status After Epic |
|-----|-----------|-------------------|
| Agent Card Component variants | AI-02 | Resolved |
| Agent Detail Modal (5 tabs) | AI-03 | Resolved |
| Agent Activity Feed | AI-04 | Resolved |
| Agent Configuration Page | AI-05 | Resolved |
| Confidence Breakdown Bars | AP-02, AP-03 | Resolved |
| AI Reasoning Section | AP-02 | Resolved |
| Suggested Actions | AP-02 | Resolved |

---

## Component Architecture

```
/agents
├── page.tsx                    # Agent Dashboard (Story 13.5)
├── activity/
│   └── page.tsx               # Activity Feed (Story 13.3)
└── [id]/
    └── configure/
        └── page.tsx           # Configuration Page (Story 13.4)

/components/agents/
├── AgentCard.tsx              # Base card (Story 13.1)
├── AgentCardCompact.tsx
├── AgentCardStandard.tsx
├── AgentCardExpanded.tsx
├── AgentAvatar.tsx
├── AgentStatusBadge.tsx
├── AgentDetailModal.tsx       # Modal (Story 13.2)
├── AgentGrid.tsx
├── AgentFilters.tsx
├── ActivityFeed.tsx           # Feed (Story 13.3)
├── ActivityCard.tsx
├── config/                    # Config components (Story 13.4)
│   ├── ConfigSidebar.tsx
│   ├── GeneralSettings.tsx
│   ├── AIModelSettings.tsx
│   ├── BehaviorSettings.tsx
│   └── DangerZone.tsx
└── tabs/                      # Modal tabs (Story 13.2)
    ├── OverviewTab.tsx
    ├── ActivityTab.tsx
    ├── ConfigurationTab.tsx
    ├── PermissionsTab.tsx
    └── AnalyticsTab.tsx

/components/approval/
├── ConfidenceBreakdown.tsx    # Breakdown (Story 13.6)
├── ConfidenceFactorBar.tsx
├── AIReasoning.tsx
└── SuggestedActions.tsx
```

---

_Generated by BMAD Party Mode Planning Session_
_Date: 2025-12-05_
