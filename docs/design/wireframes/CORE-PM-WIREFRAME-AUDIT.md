# Core-PM Wireframe Audit Report

**Audit Date:** 2025-12-16
**Auditor:** AI Business Hub Team
**PRD Version:** Core-PM v2.0
**Architecture Version:** v2.0
**Status:** Audit Complete - Action Required

**UX alignment note (Phase 1–3):** For UX pack alignment (routes, hierarchy, approvals overlay, BMAD sub-state display), see `docs/design/wireframes/CORE-PM-UX-WIREFRAME-ALIGNMENT.md`.

---

## Executive Summary

This audit reviews the existing BM-PM wireframes against the updated Core-PM v2.0 PRD and Architecture documents. The transformation of PM from an optional module to Platform Core, combined with the addition of the Knowledge Base component, creates significant wireframe gaps.

### Key Findings

| Category | Status | Details |
|----------|--------|---------|
| **Existing PM Wireframes** | 🟡 Partial Alignment | 16 wireframes exist, ~70% aligned |
| **Knowledge Base** | 🔴 Critical Gap | 0 of ~12 required wireframes exist |
| **Agent Team Updates** | 🟡 Needs Update | 9 agents (was 8), missing Scribe |
| **Real-time Collaboration** | 🔴 Missing | No Yjs/presence wireframes |
| **Brand/Style Compliance** | 🟢 Good | Existing wireframes follow guidelines |

### Recommended Actions

1. **Priority 1 (Critical):** Create 12 Knowledge Base wireframes
2. **Priority 2 (High):** Update 5 existing PM wireframes for Core-PM alignment
3. **Priority 3 (Medium):** Add 4 new PM enhancement wireframes
4. **Priority 4 (Low):** Create 3 real-time collaboration wireframes

**Total New Wireframes Needed:** ~19

---

## Part 1: Existing PM Wireframe Audit

### Wireframes Reviewed (16 total)

| ID | Wireframe | Core-PM Alignment | Issues | Action |
|----|-----------|-------------------|--------|--------|
| PM-01 | Projects List View | 🟢 Aligned | None | Keep as-is |
| PM-02 | Project Detail Overview | 🟡 Partial | Missing KB sidebar, BMAD phase indicator | **Update** |
| PM-03 | Task Board (Kanban) | 🟢 Aligned | None | Keep as-is |
| PM-04 | Task List View | 🟢 Aligned | None | Keep as-is |
| PM-05 | Task Detail Modal | 🟡 Partial | Missing KB link, Scribe suggestions | **Update** |
| PM-06 | Timeline (Gantt) | 🟢 Aligned | None | Keep as-is |
| PM-07 | Calendar View | 🟢 Aligned | None | Keep as-is |
| PM-08 | Files & Documents | 🟡 Partial | Should integrate with KB pages | **Update** |
| PM-09 | Team & Permissions | 🟡 Partial | Missing hybrid human+AI assignment | **Update** |
| PM-10 | Project Settings | 🟢 Aligned | None | Keep as-is |
| PM-11 | Milestones View | 🟢 Aligned | None | Keep as-is |
| PM-12 | Time Tracking | 🟢 Aligned | None | Keep as-is |
| PM-13 | Resource Management | 🟢 Aligned | None | Keep as-is |
| PM-14 | Project Templates | 🟡 Partial | Should include KB page templates | **Update** |
| PM-15 | Project Reports | 🟢 Aligned | None | Keep as-is |
| PM-16 | Notifications Center | 🟢 Aligned | None | Keep as-is |

### Wireframes Requiring Updates (5)

#### PM-02: Project Detail Overview
**Current State:** Shows basic project info, team, progress
**Required Updates:**
- Add Knowledge Base sidebar panel (collapsible)
- Add BMAD phase indicator (BUILD/OPERATE mode)
- Add "Linked KB Pages" section
- Add Scribe agent quick actions
- Update agent team to show 9 agents

#### PM-05: Task Detail Modal
**Current State:** Task properties, description, activity, subtasks
**Required Updates:**
- Add "Link KB Page" action
- Add "KB References" section (pages that mention this task)
- Add Scribe suggestions panel ("Generate documentation for this task")
- Add RAG context indicator

#### PM-08: Files & Documents
**Current State:** File upload and management
**Required Updates:**
- Integrate with KB pages (show linked wiki pages)
- Add "Create KB Page from Document" action
- Show KB page previews inline

#### PM-09: Team & Permissions
**Current State:** Team roles and access control
**Required Updates:**
- Add "Hybrid Assignment" toggle (human + AI assist)
- Show 9-agent PM team (add Scribe)
- Add capacity allocation between humans and AI
- Add "Agent Assist" role option

#### PM-14: Project Templates
**Current State:** Project structure templates
**Required Updates:**
- Add KB page template selection
- Show "Create starter KB pages" option
- Include BMAD workflow template options (BUILD vs Quick Kanban)

---

## Part 2: Missing Knowledge Base Wireframes

### Critical Gap: No KB Wireframes Exist

The Knowledge Base is a major component of Core-PM with no existing wireframes. Based on the PRD and KB Specification, the following wireframes are required:

### Required KB Wireframes (12)

| ID | Wireframe | Description | Priority | Reference |
|----|-----------|-------------|----------|-----------|
| **KB-01** | `kb-page-tree.excalidraw` | Sidebar navigation with hierarchical page tree, recent pages, favorites | P0 | PRD F9.1 |
| **KB-02** | `kb-page-editor.excalidraw` | Tiptap/ProseMirror editor with formatting toolbar, @mentions, #references | P0 | PRD F9.2, KB-Spec |
| **KB-03** | `kb-page-viewer.excalidraw` | Read-only page view with TOC, backlinks, related pages | P0 | PRD F9.1 |
| **KB-04** | `kb-search-results.excalidraw` | RAG-powered search with verified content indicators, relevance scores | P0 | PRD F8 |
| **KB-05** | `kb-verified-content.excalidraw` | Verification workflow: verify button, expiration date, verification badge | P1 | PRD F8.2 |
| **KB-06** | `kb-page-history.excalidraw` | Version history with diff view, restore capability | P1 | PRD F9.1 |
| **KB-07** | `kb-page-comments.excalidraw` | Comment threads, inline comments, resolved/open states | P1 | KB-Spec |
| **KB-08** | `kb-project-linking.excalidraw` | Link pages to projects UI, "Pages for this project" panel | P1 | PRD F10 |
| **KB-09** | `kb-presence-cursors.excalidraw` | Multi-user editing: cursor presence, user avatars, typing indicators | P2 | KB-Spec Yjs |
| **KB-10** | `kb-scribe-panel.excalidraw` | Scribe agent suggestions: summarize, related content, stale detection | P2 | PRD F8.3 |
| **KB-11** | `kb-embed-blocks.excalidraw` | Embedded content: diagrams, tables, task lists, Excalidraw | P2 | KB-Spec F7 |
| **KB-12** | `kb-templates.excalidraw` | Page template gallery: meeting notes, project charter, runbook | P2 | PRD P2 |

### KB Wireframe Design Specs

**Layout Pattern:** Notion/Plane-inspired three-column
```
┌────────┬────────────────────────────────────┬──────────┐
│        │                                    │          │
│  Page  │         Editor / Viewer            │  Context │
│  Tree  │                                    │  Panel   │
│        │  ┌────────────────────────────┐   │          │
│ Recent │  │ [Formatting Toolbar]       │   │ Backlinks│
│ Pages  │  │                            │   │          │
│        │  │                            │   │ Related  │
│ Favs   │  │  Rich text content         │   │ Pages    │
│        │  │  with @mentions and        │   │          │
│        │  │  #task-references          │   │ Scribe   │
│        │  │                            │   │ Suggest  │
│        │  │                            │   │          │
│        │  └────────────────────────────┘   │ Comments │
│        │                                    │          │
└────────┴────────────────────────────────────┴──────────┘
```

**Brand Colors:**
- Page tree background: Warm cream (#FFFBF5)
- Editor background: White (#FFFFFF)
- Verified badge: Green (#2ECC71) with checkmark
- Scribe agent suggestions: Teal border (#20B2AA)
- Presence cursors: User-specific colors from palette

**Scribe Agent Identity:**
- Icon: 📝 (or custom quill illustration)
- Color: Teal (#20B2AA) - matches KB theme
- Role: "Knowledge Base Manager"
- Tagline: "Let me help organize your knowledge."

---

## Part 3: New PM Enhancement Wireframes

### Additional PM Wireframes Needed (4)

| ID | Wireframe | Description | Priority |
|----|-----------|-------------|----------|
| **PM-21** | `pm-bmad-phase-view.excalidraw` | BMAD 7-phase timeline with BUILD/OPERATE mode toggle | P1 |
| **PM-22** | `pm-agent-team-panel.excalidraw` | Core-PM 9-agent team overview (not platform AI team) | P1 |
| **PM-23** | `pm-hybrid-assignment.excalidraw` | Human + AI hybrid task assignment UI | P2 |
| **PM-24** | `pm-planning-poker.excalidraw` | Real-time collaborative estimation session | P2 |

### PM-21: BMAD Phase View
**Description:** Visualization of BMAD methodology phases with current phase highlighting

**Design Elements:**
```
BUILD Mode:
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│BRIEF│BRSTR│ REQ │DSGN │IMPL │TEST │DPLY │  ← 7 BUILD phases
│ ✓   │ ✓   │ ●   │     │     │     │     │  ← Current: Requirements
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

OPERATE Mode:
┌───────────────┬───────────────┬───────────────┐
│    GROW       │   OPTIMIZE    │    SCALE      │  ← 3 OPERATE loops
│   (active)    │               │               │
└───────────────┴───────────────┴───────────────┘
```

### PM-22: Agent Team Panel
**Description:** Core-PM's 9-agent team overview (different from platform AI-01)

**Agents to Display:**
1. **Navi** (Coral) - Orchestrator, team lead
2. **Sage** (Green) - Estimation specialist
3. **Herald** (Blue) - Reporting & communication
4. **Chrono** (Orange) - Time tracking & deadlines
5. **Scope** (Purple) - Sprint planning & backlog
6. **Pulse** (Red) - Risk detection & health
7. **Bridge** (Teal) - Integrations (GitHub/GitLab)
8. **Prism** (Pink) - Analytics & predictions
9. **Scribe** (Teal) - Knowledge Base manager **← NEW**

---

## Part 4: Real-Time Collaboration Wireframes

### Yjs/Presence Wireframes Needed (3)

| ID | Wireframe | Description | Priority |
|----|-----------|-------------|----------|
| **RT-01** | `realtime-cursors.excalidraw` | Multi-user cursor presence in KB editor | P2 |
| **RT-02** | `realtime-presence-bar.excalidraw` | "3 others editing" indicator bar | P2 |
| **RT-03** | `realtime-conflict.excalidraw` | Conflict resolution UI (rare, but needed) | P3 |

### RT-01: Real-Time Cursors
**Design Elements:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  The deployment process involves several step│     │
│                                       ▲────────────│
│                                       │ Sarah (🔵) │
│                                       └────────────│
│                                                     │
│  1. First, we need to configure the│               │
│                              ▲─────────────────────│
│                              │ John (🟢) typing... │
│                              └─────────────────────│
│                                                     │
└─────────────────────────────────────────────────────┘

[Sarah 🔵] [John 🟢] [Maya 🟠]  ← Presence avatars at top
```

---

## Part 5: Style & Brand Compliance Check

### Existing Wireframes Compliance

| Aspect | Status | Notes |
|--------|--------|-------|
| **Color Palette** | 🟢 Compliant | Uses warm cream, coral, teal correctly |
| **Typography** | 🟢 Compliant | Inter font family, correct weights |
| **Agent Colors** | 🟢 Compliant | Each agent uses designated color |
| **Spacing** | 🟢 Compliant | Follows 4px/8px/16px/24px system |
| **Border Radius** | 🟢 Compliant | 10px buttons, 16px cards |
| **Iconography** | 🟢 Compliant | Lucide icons throughout |
| **Agent Voice** | 🟢 Compliant | First person, friendly tone |

### New Wireframe Guidelines

For new KB and PM wireframes, ensure:

1. **Atlas Agent Color:** Use Sunny Orange (#FF9F43) for PM features
2. **Scribe Agent Color:** Use Teal (#20B2AA) for KB features
3. **Background:** Warm cream (#FFFBF5) for sidebars
4. **Cards:** White (#FFFFFF) with subtle border (#f1ebe4)
5. **Verified Badge:** Green (#2ECC71) checkmark icon
6. **Focus States:** Coral (#FF6B6B) ring
7. **Empty States:** Character illustrations with helpful text

---

## Part 6: Wireframe Priority Matrix

### Phase 1: Critical (Before Implementation)

| Wireframe | Type | Est. Time |
|-----------|------|-----------|
| KB-01 Page Tree | New | 2 hours |
| KB-02 Page Editor | New | 4 hours |
| KB-03 Page Viewer | New | 2 hours |
| KB-04 Search Results | New | 2 hours |
| PM-02 Project Detail (update) | Update | 1 hour |
| PM-05 Task Detail (update) | Update | 1 hour |

**Phase 1 Total:** 12 hours (~1.5 days)

### Phase 2: High Priority

| Wireframe | Type | Est. Time |
|-----------|------|-----------|
| KB-05 Verified Content | New | 2 hours |
| KB-06 Page History | New | 2 hours |
| KB-08 Project Linking | New | 2 hours |
| PM-17 BMAD Phase View | New | 2 hours |
| PM-18 Agent Team Panel | New | 2 hours |
| PM-09 Team & Permissions (update) | Update | 1 hour |

**Phase 2 Total:** 11 hours (~1.5 days)

### Phase 3: Medium Priority

| Wireframe | Type | Est. Time |
|-----------|------|-----------|
| KB-07 Page Comments | New | 2 hours |
| KB-09 Presence Cursors | New | 2 hours |
| KB-10 Scribe Panel | New | 2 hours |
| PM-08 Files & Documents (update) | Update | 1 hour |
| PM-14 Project Templates (update) | Update | 1 hour |
| PM-19 Hybrid Assignment | New | 2 hours |

**Phase 3 Total:** 10 hours (~1.25 days)

### Phase 4: Low Priority

| Wireframe | Type | Est. Time |
|-----------|------|-----------|
| KB-11 Embed Blocks | New | 2 hours |
| KB-12 Templates | New | 2 hours |
| PM-20 Planning Poker | New | 2 hours |
| RT-02 Presence Bar | New | 1 hour |
| RT-03 Conflict UI | New | 1 hour |

**Phase 4 Total:** 8 hours (~1 day)

---

## Summary: Complete Wireframe List

### Existing (Keep)
- PM-01, PM-03, PM-04, PM-06, PM-07, PM-10, PM-11, PM-12, PM-13, PM-15, PM-16 (11 wireframes)

### Existing (Update)
- PM-02, PM-05, PM-08, PM-09, PM-14 (5 wireframes)

### New Required
- KB-01 to KB-12 (12 wireframes)
- PM-21 to PM-24 (4 wireframes)
- RT-01 to RT-03 (3 wireframes)

### Grand Total
- **Existing to keep:** 11
- **Existing to update:** 5
- **New to create:** 19
- **Total Core-PM wireframes:** 35

---

## Next Steps

1. **Update WIREFRAME-INDEX.md** - Add new KB and PM sections
2. **Create Phase 1 wireframes** - Critical path for implementation
3. **Generate prompts** - Create wireframe generation prompts for each batch
4. **Review with stakeholders** - Validate wireframe priorities

---

_Audit complete. Ready for wireframe development._
