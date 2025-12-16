# Core-PM UI Rules (Interaction + Consistency)

## Core Principles

1. **Clarity over cleverness:** always show why an action is blocked.
2. **Friction only for risk:** approvals only where configured; don’t slow common flows.
3. **Consistency across views:** List/Kanban/Details must share the same status and permission rules.
4. **Traceability by default:** every major change should be linkable (task ↔ kb ↔ approval).

---

## Global Interaction Patterns

1. **Create flows**: use a single “Create” button with type selector (Product/Phase/Task/KB page) in context.
2. **Edit flows**:
   1. Quick edits in a drawer (title/status/assignee/priority).
   2. Full edits on detail pages.
3. **Status transitions**:
   1. Validate allowed transitions (server-authoritative).
   2. If approval required, show an interstitial explaining the rule and the approval request action.
4. **Bulk actions** (P1):
   1. Multi-select in list view.
   2. Bulk status/assignee/priority update with a preview of impacted items.
5. **Error handling**:
   1. Inline field validation for forms.
   2. Toast for transient errors; full-page for fatal load errors.

---

## List vs Kanban

1. **List view** is for filtering, bulk actions, and high-density triage.
2. **Kanban** is for phase execution and quick status movement.
3. Both views must:
   1. Show blocked-on-approval states.
   2. Provide consistent task detail access.
   3. Respect permissions identically.

---

## Workflow State Display (BMAD Compatibility)

1. Task cards/rows should display both:
   1. **Primary status** (Core-PM `TaskStatus`, e.g., `BACKLOG`, `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`)
   2. **BMAD sub-state** (from `task.metadata.bmadState`, e.g., `drafted`, `ready-for-dev`)
2. Filters should support:
   1. Primary status
   2. BMAD sub-state (optional advanced filter)
3. UI must never invent new core statuses to represent BMAD; it should preserve BMAD precision in metadata.

---

## Knowledge Base UI

1. “Draft vs Verified” should be explicit and visible.
2. References:
   1. Tasks and KB pages are linkable entities.
   2. The UI should make it easy to add/remove references.
3. Search UX:
   1. Communicate whether search is exact/FTS (P1) vs semantic (later).
