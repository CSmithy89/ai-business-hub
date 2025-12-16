# Core-PM Information Architecture (IA) & Navigation

**Entry route:** `/dashboard/pm`

---

## Primary Navigation Model

Core-PM should be reachable as a top-level dashboard area:

1. **PM Home** (`/dashboard/pm`)
2. **Projects** (`/dashboard/pm/projects`)
3. **Phases** (contextual under Project)
4. **Tasks** (contextual under Project/Phase)
5. **Knowledge Base** (`/dashboard/pm/kb`)
6. **Approvals** (`/dashboard/pm/approvals`) (can link to platform-wide approvals if that exists)
7. **Admin** (`/dashboard/pm/admin`) (role/permission gated)

---

## Object Hierarchy + URL Conventions

Canonical hierarchy:

`workspaceId → businessId → projectId → phaseId → taskId`

Proposed route structure (App Router friendly, stable, and bookmarkable):

1. Business context
   1. `/dashboard/pm/businesses`
   2. `/dashboard/pm/businesses/:businessId`
2. Projects
   1. `/dashboard/pm/projects`
   2. `/dashboard/pm/projects/:projectId`
3. Phases (under project)
   1. `/dashboard/pm/projects/:projectId/phases`
   2. `/dashboard/pm/projects/:projectId/phases/:phaseId`
4. Tasks
   1. `/dashboard/pm/projects/:projectId/tasks` (global list)
   2. `/dashboard/pm/projects/:projectId/phases/:phaseId/board` (kanban)
   3. `/dashboard/pm/projects/:projectId/tasks/:taskId` (task detail)
5. Knowledge Base (workspace-wide with project scoping filters)
   1. `/dashboard/pm/kb`
   2. `/dashboard/pm/kb/pages/:pageId`
6. Admin
   1. `/dashboard/pm/admin`
   2. `/dashboard/pm/admin/roles`
   3. `/dashboard/pm/admin/policies`

---

## Page Layout Conventions

1. **Context header**: breadcrumb + primary entity selector (Project, Phase).
2. **Primary actions**: create/edit actions in top right (with permission gating).
3. **Secondary actions**: filters, sort, views (List/Kanban).
4. **Detail surfaces**:
   1. Drawer for quick edits (fast + non-disruptive).
   2. Full page for deep context (task detail, kb page).

---

## Cross-Linking Rules

1. From a task, show “Related KB Pages” and allow linking/unlinking.
2. From a KB page, show “Referenced Tasks” and allow navigation.
3. Use stable IDs in links; avoid name-based routing for canonical pages.

