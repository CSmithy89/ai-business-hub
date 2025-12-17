# Epic KB-01: Knowledge Base Foundation

**Goal:** Users can create wiki pages, organize them hierarchically, and link them to projects.

**FRs Covered:** KB-F1, KB-F2, KB-F3

## Wireframe References

| Story | Wireframe | Assets |
|-------|-----------|--------|
| KB-01.3: Rich Text Editor | KB-02 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-02_page_editor/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-02_page_editor/screen.png) |
| KB-01.5: Page Tree Navigation | KB-01 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-01_page_tree_navigation/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-01_page_tree_navigation/screen.png) |
| KB-01.7: Full-Text Search | KB-04 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-04_search_results/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-04_search_results/screen.png) |
| KB-01.9: Project-KB Linking | KB-08 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-08_project_linking/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-08_project_linking/screen.png) |
| Version History | KB-06 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-06_page_version_history/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-06_page_version_history/screen.png) |
| Page Viewer | KB-03 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-03_page_viewer/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-03_page_viewer/screen.png) |

---

### Story KB-01.1: KB Data Model & API

**As a** platform developer,
**I want** KnowledgePage CRUD API,
**So that** users can manage wiki content.

**Acceptance Criteria:**

**Given** KnowledgePage Prisma model
**When** I POST /api/kb/pages
**Then** page is created with: title, slug (auto-generated), content (empty JSON), parentId (optional)

**And** GET /api/kb/pages returns tree structure

**And** GET /api/kb/pages/:id returns page with content

**And** PATCH /api/kb/pages/:id updates fields

**And** DELETE soft-deletes (30-day recovery)

**Prerequisites:** Schema (complete)

**Technical Notes:**
- NestJS module in `apps/api/src/modules/kb/`
- Events: `kb.page.created`, `kb.page.updated`, `kb.page.deleted`

---

### Story KB-01.2: Page Version History

**As a** KB user,
**I want** page version history,
**So that** I can see changes and restore previous versions.

**Acceptance Criteria:**

**Given** page content is updated
**When** save occurs
**Then** new PageVersion record created with content snapshot

**And** GET /api/kb/pages/:id/versions returns version list

**And** GET /api/kb/pages/:id/versions/:version returns specific version

**And** POST /api/kb/pages/:id/versions/:version/restore reverts page

**Prerequisites:** KB-01.1

**Technical Notes:**
- Version created on significant changes (not every keystroke)
- Diff view between versions (Phase 2)

---

### Story KB-01.3: Rich Text Editor (Tiptap)

**As a** KB user,
**I want** a rich text editor for pages,
**So that** I can create formatted content.

**Acceptance Criteria:**

**Given** I am editing a page
**When** editor loads
**Then** I can: format text (bold, italic, underline, strike), create headings (H1-H4), create lists (bullet, numbered, checklist), add links, add code blocks, add tables (basic)

**And** toolbar shows formatting options

**And** keyboard shortcuts work (Cmd+B for bold, etc.)

**And** content saved as Tiptap JSON

**Prerequisites:** KB-01.1

**Technical Notes:**
- Tiptap with StarterKit extension
- Content stored as JSON in content field

---

### Story KB-01.4: Page Auto-Save

**As a** KB user,
**I want** automatic saving,
**So that** I don't lose work.

**Acceptance Criteria:**

**Given** I am editing a page
**When** I pause typing (2 seconds)
**Then** content auto-saves

**And** "Saving..." indicator shows during save

**And** "Saved" indicator confirms completion

**And** manual save via Cmd+S also works

**And** unsaved changes warning on navigation

**Prerequisites:** KB-01.3

**Technical Notes:**
- Debounced save (2 seconds)
- contentText extracted from JSON for FTS

---

### Story KB-01.5: Page Tree Navigation

**As a** KB user,
**I want** a sidebar tree showing page hierarchy,
**So that** I can navigate the knowledge base.

**Acceptance Criteria:**

**Given** I am on KB section
**When** sidebar loads
**Then** shows collapsible tree of pages

**And** current page highlighted

**And** drag-drop to reorder/reparent

**And** right-click context menu: New Subpage, Rename, Delete

**And** "New Page" button at root level

**Prerequisites:** KB-01.1

**Technical Notes:**
- Recursive tree component
- Optimistic reordering

---

### Story KB-01.6: Breadcrumb Navigation

**As a** KB user,
**I want** breadcrumbs showing page hierarchy,
**So that** I know where I am.

**Acceptance Criteria:**

**Given** I am viewing a nested page
**When** breadcrumbs render
**Then** shows: KB Home > Parent > Current Page

**And** each segment is clickable

**And** truncates middle segments if too long

**Prerequisites:** KB-01.5

**Technical Notes:**
- Build path from parent chain

---

### Story KB-01.7: KB Full-Text Search

**As a** KB user,
**I want** to search page content,
**So that** I can find information quickly.

**Acceptance Criteria:**

**Given** I am on KB section
**When** I type in search box
**Then** results show pages matching query

**And** highlights matching text snippets

**And** results ranked by relevance

**And** recent searches saved

**Prerequisites:** KB-01.1

**Technical Notes:**
- PostgreSQL tsvector on contentText
- ts_headline for snippets

---

### Story KB-01.8: Recent Pages & Favorites

**As a** KB user,
**I want** quick access to recent and favorite pages,
**So that** I can return to important content.

**Acceptance Criteria:**

**Given** I view the KB sidebar
**When** I look at quick access section
**Then** shows: Recent (last 10 viewed), Favorites (starred pages)

**And** star icon on page to add to favorites

**And** click recent/favorite navigates to page

**Prerequisites:** KB-01.5

**Technical Notes:**
- viewCount and lastViewedAt on KnowledgePage
- Favorites in user preferences

---

### Story KB-01.9: Project-KB Linking

**As a** project user,
**I want** to link KB pages to projects,
**So that** documentation is connected to work.

**Acceptance Criteria:**

**Given** I am on a KB page
**When** I click "Link to Project"
**Then** modal shows project list to select

**And** page appears in project Docs tab

**And** can mark one page as "Primary" for project

**And** backlinks section shows linked projects

**Prerequisites:** KB-01.1, PM-01.5

**Technical Notes:**
- ProjectPage join table
- isPrimary flag for main doc

---

### Story KB-01.10: Project Docs Tab

**As a** project user,
**I want** to see linked KB pages in project,
**So that** I access documentation in context.

**Acceptance Criteria:**

**Given** I am on project Docs tab
**When** tab loads
**Then** shows: Primary doc (if set) prominently, other linked pages list, "Link Existing Page" button, "Create New Page" button (auto-links)

**And** click opens page in KB section

**Prerequisites:** KB-01.9

**Technical Notes:**
- Tab in project detail page
- Filter ProjectPage by projectId

---
