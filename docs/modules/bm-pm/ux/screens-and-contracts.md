# Core-PM Screens & Data Contracts (Phase 1 build-ready)

This document defines the screen inventory and the minimum data contracts required to implement `/dashboard/pm` experiences without ambiguity.

---

## Wireframe Reference

All wireframes are located in `/docs/design/wireframes/Finished wireframes and html files/`.

### Project Management Wireframes (PM-01 to PM-37)

| ID | Screen | Route | Wireframe Assets |
|----|--------|-------|------------------|
| PM-01 | Projects List | `/dashboard/pm/projects` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-01_projects_list_view/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-01_projects_list_view/screen.png) |
| PM-02 | Project Detail | `/dashboard/pm/projects/:id` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-02_project_detail_overview/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-02_project_detail_overview/screen.png) |
| PM-03 | Task Board (Kanban) | `/dashboard/pm/projects/:id/tasks/kanban` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-03_task_board_(kanban_view)_/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-03_task_board_(kanban_view)_/screen.png) |
| PM-04 | Task List View | `/dashboard/pm/projects/:id/tasks/list` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-04_task_list_view/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-04_task_list_view/screen.png) |
| PM-05 | Task Detail Modal | Task slide-out panel | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-05_task_detail_modal/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-05_task_detail_modal/screen.png) |
| PM-06 | Timeline/Gantt | `/dashboard/pm/projects/:id/tasks/timeline` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-06_timeline/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-06_timeline/screen.png) |
| PM-07 | Calendar View | `/dashboard/pm/projects/:id/tasks/calendar` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-07_project_calendar_view/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-07_project_calendar_view/screen.png) |
| PM-08 | Files & Documents | `/dashboard/pm/projects/:id/files` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-08_project_files_%26_documents/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-08_project_files_%26_documents/screen.png) |
| PM-09 | Team & Permissions | `/dashboard/pm/projects/:id/team` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-09_project_team_%26_permissions/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-09_project_team_%26_permissions/screen.png) |
| PM-10 | Project Settings | `/dashboard/pm/projects/:id/settings` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-10_project_settings/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-10_project_settings/screen.png) |
| PM-11 | Milestones | `/dashboard/pm/projects/:id/milestones` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-11_milestones_view/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-11_milestones_view/screen.png) |
| PM-12 | Time Tracking | `/dashboard/pm/projects/:id/time` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-12_time_tracking/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-12_time_tracking/screen.png) |
| PM-13 | Resource Management | `/dashboard/pm/resources` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-13_resource_management/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-13_resource_management/screen.png) |
| PM-14 | Project Templates | `/dashboard/pm/templates` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-14_project_templates/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-14_project_templates/screen.png) |
| PM-15 | Reports Dashboard | `/dashboard/pm/reports` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-15_project_reports/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-15_project_reports/screen.png) |
| PM-16 | Notifications | `/dashboard/pm/notifications` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-16_notifications_center/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-16_notifications_center/screen.png) |
| PM-17 | Global Search | `Cmd+K` command bar | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-17_global_search/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-17_global_search/screen.png) |
| PM-18 | User Profile | `/settings/profile` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-18_user_profile_%26_account/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-18_user_profile_%26_account/screen.png) |
| PM-19 | Onboarding Flow | First-time user setup | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-19_onboarding_flow/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-19_onboarding_flow/screen.png) |
| PM-20 | Help & Support | `/help` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-20_help_%26_support_center/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-20_help_%26_support_center/screen.png) |
| PM-21 | BMAD Phase View | BMAD workflow visualization | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-21_bmad_phase_view/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-21_bmad_phase_view/screen.png) |
| PM-25 | Dependency Editor | Visual dependency graph | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-25_visual_dependency_editor/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-25_visual_dependency_editor/screen.png) |
| PM-26 | Saved Views Manager | View management | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-26_saved_views_manager/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-26_saved_views_manager/screen.png) |
| PM-27 | Portfolio Dashboard | `/dashboard/pm/portfolio` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-27_executive_portfolio_dashboard/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-27_executive_portfolio_dashboard/screen.png) |
| PM-28 | Daily Briefing (Navi) | Agent daily briefing | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-28_daily_briefing_(navi)/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-28_daily_briefing_(navi)/screen.png) |
| PM-29 | GitHub Integration | `/settings/integrations/github` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-29_github/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-29_github/screen.png) |
| PM-30 | CSV Import Wizard | Import workflow | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-30_csv_import_wizard/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-30_csv_import_wizard/screen.png) |
| PM-31 | Sprint Dashboard | Sprint enhancements view | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-31_sprint_enhancements_dashboard/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-31_sprint_enhancements_dashboard/screen.png) |
| PM-32 | Workflow Builder | Custom workflow states | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-32_workflow_builder/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-32_workflow_builder/screen.png) |
| PM-33 | Predictive Analytics (Prism) | Risk and forecasting | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-33_predictive_analytics_(prism)/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-33_predictive_analytics_(prism)/screen.png) |
| PM-34 | API & Webhooks | `/settings/api` | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-34_api_%26_webhooks_configuration/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-34_api_%26_webhooks_configuration/screen.png) |
| PM-35 | Task Templates | Task template library | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-35_task_templates_library/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-35_task_templates_library/screen.png) |
| PM-36 | OKR & Goals | Goal tracking | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-36_okr_%26_goals_tracking/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-36_okr_%26_goals_tracking/screen.png) |
| PM-37 | Audit & Compliance | Enterprise audit dashboard | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-37_enterprise_audit_%26_compliance/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-37_enterprise_audit_%26_compliance/screen.png) |

### Knowledge Base Wireframes (KB-01 to KB-16)

| ID | Screen | Description | Wireframe Assets |
|----|--------|-------------|------------------|
| KB-01 | Page Tree Navigation | Sidebar tree with hierarchy | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-01_page_tree_navigation/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-01_page_tree_navigation/screen.png) |
| KB-02 | Page Editor | Rich text editor with blocks | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-02_page_editor/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-02_page_editor/screen.png) |
| KB-03 | Page Viewer | Read-only view with TOC | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-03_page_viewer/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-03_page_viewer/screen.png) |
| KB-04 | Search Results | Full-text search with filters | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-04_search_results/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-04_search_results/screen.png) |
| KB-05 | Verified Content | Verification badges & workflow | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-05_verified_content_management/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-05_verified_content_management/screen.png) |
| KB-06 | Version History | Page versions with diff | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-06_page_version_history/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-06_page_version_history/screen.png) |
| KB-07 | Page Comments | Inline comments with threads | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-07_page_comments/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-07_page_comments/screen.png) |
| KB-08 | Project Linking | KB-to-project links | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-08_project_linking/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-08_project_linking/screen.png) |
| KB-09 | Presence Cursors | Real-time user cursors | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-09_presence_cursors/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-09_presence_cursors/screen.png) |
| KB-10 | Scribe Panel | AI writing assistant | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-10_scribe_panel/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-10_scribe_panel/screen.png) |
| KB-11 | Embed Blocks | Code, diagrams, videos | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-11_embed_blocks/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-11_embed_blocks/screen.png) |
| KB-12 | Page Templates | Template library | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-12_page_templates/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-12_page_templates/screen.png) |
| KB-13 | AI Q&A Chat | KB chat interface | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-13_ai_q%26a_chat_interface/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-13_ai_q%26a_chat_interface/screen.png) |
| KB-14 | KB Analytics | Usage and engagement | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-14_kb_analytics_dashboard/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-14_kb_analytics_dashboard/screen.png) |
| KB-15 | Governance | Permissions management | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-15_kb_governance_%26_permissions/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-15_kb_governance_%26_permissions/screen.png) |
| KB-16 | External Sync | Notion/Confluence sync | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-16_external_kb_sync_settings/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-16_external_kb_sync_settings/screen.png) |

### Real-time Collaboration Wireframes (RT-01 to RT-03)

| ID | Feature | Description | Wireframe Assets |
|----|---------|-------------|------------------|
| RT-01 | Real-time Cursors | User cursors with avatars | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/rt-01_real-time_cursors/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/rt-01_real-time_cursors/screen.png) |
| RT-02 | Presence Bar | Active users indicator | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/rt-02_presence_bar/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/rt-02_presence_bar/screen.png) |
| RT-03 | Conflict Resolution | Edit conflict handling | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/rt-03_conflict_resolution/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/rt-03_conflict_resolution/screen.png) |

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
