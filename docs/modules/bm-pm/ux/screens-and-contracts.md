# Core-PM Screens & Data Contracts (Phase 1 build-ready)

This document defines the screen inventory and the minimum data contracts required to implement `/dashboard/pm` experiences without ambiguity.

---

## Screen Inventory (Phase 1)

| Screen | Route | Primary persona(s) | Core actions | Data needs (high level) |
|--------|-------|--------------------|-------------|--------------------------|
| PM Home | `/dashboard/pm` | Founder, PM | pick project/phase, create | summary widgets + recent items |
| Businesses | `/dashboard/pm/businesses` | Founder, Admin | create/edit | business list |
| Business Detail | `/dashboard/pm/businesses/:businessId` | Founder, Admin | edit | business + linked projects |
| Projects | `/dashboard/pm/projects` | Founder, PM | create/edit/archive | project list |
| Project Hub | `/dashboard/pm/projects/:projectId` | Founder, PM | create phase/task | project summary + phase list |
| Phases List | `/dashboard/pm/projects/:projectId/phases` | Founder, PM | create/edit | phases for project |
| Phase Board (Kanban) | `/dashboard/pm/projects/:projectId/phases/:phaseId/board` | Founder, PM | create/move tasks | tasks in phase grouped by status |
| Project Task List | `/dashboard/pm/projects/:projectId/tasks` | Founder, PM | bulk edit | tasks across phases |
| Task Detail | `/dashboard/pm/projects/:projectId/tasks/:taskId` | Founder, PM | edit/move/request approval | task + comments/activity + links |
| KB Home | `/dashboard/pm/kb` | Founder, PM | search/create | KB list + search |
| KB Page | `/dashboard/pm/kb/pages/:pageId` | Founder, PM | edit/link/verify | page + history + references |
| Approvals | `/dashboard/pm/approvals` | Founder, Admin | approve/reject | approvals list + details |
| Admin | `/dashboard/pm/admin` | Admin | configure | links to roles/policies/audit |

---

## Data Contract Checklist (Phase 1)

Contracts are specified as **capabilities** rather than final API routes to stay aligned with existing Nest conventions. Each capability must be workspace-scoped.

### Businesses

1. List businesses (workspace)
2. Create business
3. Update business

### Projects

1. List projects (by business/workspace)
2. Create project
3. Update project
4. Archive/unarchive project

### Phases

1. List phases (by project)
2. Create phase (template-based optional)
3. Update phase
4. Set current phase (optional)

### Tasks

1. List tasks (by project; filters: phaseId, status, assignee, priority, dueDate, `metadata.bmadState`)
2. Create task
3. Update task (title, description, status, priority, dueDate, labels, parentId)
4. Assign/unassign task (human/agent/hybrid)
5. Move task status (validate transition; emit event; create audit entry)
6. Bulk update tasks (P1 recommended; can be gated if too risky)

### Approvals (overlay)

1. Request approval for a task change (links to platform approval item)
2. Read approval status for a task (blocked state)
3. Approve/reject (Admin/Founder depending on policy)

### Knowledge Base

1. List pages (filters: projectId optional, tags, updatedBy)
2. Create page
3. Update page content + metadata
4. Version history (minimal: list versions, view version)
5. Link/unlink tasks and pages
6. Search pages (FTS in P1)

### Search

1. Search tasks (FTS + filters)
2. Search KB pages (FTS + filters)

---

## Edge States (Phase 1 Must-Haves)

1. **Empty workspace**: no business/project → guided setup.
2. **No permission**: disable actions + explain why + who can grant.
3. **Blocked by approval**: show approval link and expected next action.
4. **Concurrency**: show last updated timestamp + conflict handling minimal path.
