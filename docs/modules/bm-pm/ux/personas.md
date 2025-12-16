# Core-PM Personas (Founder/Operator, Team Lead/PM, Admin)

## Shared Assumptions

1. `workspaceId` is the isolation boundary; everything shown or mutated is workspace-scoped.
2. Approvals are a **platform overlay**: Core-PM tasks can be blocked by an approval item without creating a second status workflow.
3. "Business → Project → Phase → Task" is the canonical work hierarchy in Core-PM.

---

## Persona A: Founder / Operator (Primary)

### Goals (Jobs-to-be-Done)

1. Set direction quickly: define the Business context, create Projects, and plan Phases.
2. Maintain clarity: see what is blocked, what is progressing, and what needs decisions.
3. Control risk: require approvals for high-impact changes (scope, priority, due dates, budgets).
4. Keep knowledge usable: ensure key decisions and system knowledge are captured in the KB.

### Typical Day Loop

1. Open `/dashboard/pm` and review "Today" (blocked items, approvals, due soon).
2. Review active Project and current Phase.
3. Adjust priorities/assignments.
4. Approve or reject gated actions.
5. Capture decisions in KB and link to tasks.

### Key UX Needs

1. Fast “what do I need to decide?” visibility (Approvals + blocked-on-approval).
2. Minimal clicks to create Project/Phase/Task.
3. Strong defaults and templates (Phase templates, task presets).
4. High signal-to-noise reporting (lightweight by default; deeper analytics later).

---

## Persona B: Team Lead / PM (Primary)

### Goals (Jobs-to-be-Done)

1. Plan and execute work: break scope into tasks, keep statuses accurate, remove blockers.
2. Orchestrate people + agents: manage assignment, workload, and handoffs.
3. Ensure process compliance: BMAD story states are preserved; approvals are requested when required.
4. Maintain traceability: link requirements ⇄ tasks ⇄ KB decisions.

### Typical Day Loop

1. Review "My projects" and active Phase boards (Kanban + List).
2. Groom backlog for the next Phase; ensure tasks are “ready-for-dev”.
3. Move work through statuses; request approvals where needed.
4. Update KB for decisions, runbooks, and references used by agents/humans.

### Key UX Needs

1. Excellent bulk operations (reorder, assign, status change with validations).
2. Powerful filtering and search (by status, assignee, label, due date, priority).
3. Tight status transition rules (don’t allow invalid transitions silently).
4. Clear blocked states and resolution paths (why blocked, who can unblock).

---

## Persona D: Admin (Primary)

### Goals (Jobs-to-be-Done)

1. Govern access: define roles/permissions and ensure workspace safety.
2. Monitor compliance: approvals, audit logs, data retention, exports.
3. Ensure operational stability: configuration, templates, and guardrails.

### Typical Day Loop

1. Review approvals queue (workspace-wide) and audit events related to Core-PM.
2. Update roles/permissions for teams, vendors, and agents.
3. Configure Phase templates, required approvals, and workspace policies.

### Key UX Needs

1. A single Admin surface for governance (not scattered settings).
2. Transparency: “who did what” across tasks/KB (audit and diffing where relevant).
3. Safety: guardrails for destructive operations (delete/archive/export).

