# Batch 12: Core-PM Knowledge Base (Part 1)

**Epic:** Core-PM - Platform Core Project Management & Knowledge Base
**Date:** 2025-12-16
**Total Prompts:** 6 (KB-01 through KB-06)
**Component:** Knowledge Base - Foundation & Core Features

---

## Design Context (Use for all prompts)

**Brand Colors:**
- Primary: Coral (#FF6B6B)
- Secondary: Teal (#20B2AA)
- Background Light: Cream (#FFFBF5)
- Background Dark: Near-black (#0a0a0b)
- Text Primary: Slate 800 (#1e293b)
- Text Secondary: Slate 500 (#64748b)

**Agent Colors (Core-PM Team):**
- Navi (Orchestrator): Coral (#FF6B6B)
- Sage (Estimation): Forest Green (#2ECC71)
- Scribe (KB Manager): Teal (#20B2AA) - **Primary KB agent**
- Atlas (PM Lead): Sunny Orange (#FF9F43)

**Typography:**
- Headings: Inter Semi-Bold/Bold
- Body: Inter Regular
- Editor: Inter Regular (16px base)
- Monospace: JetBrains Mono (for code blocks)

**Layout:**
- Three-panel layout: Page Tree (240-280px), Main Editor (flexible), Context Panel (280-320px)
- Card-based UI with subtle shadows (0 1px 3px rgba(0,0,0,0.04))
- Rounded corners: 16px for cards, 10px for inputs, 6px for small elements

**KB-Specific Design Notes:**
- Editor uses Tiptap/ProseMirror with JSON content storage
- Real-time collaboration via Yjs/Hocuspocus
- Verified content badge: Green checkmark with "#2ECC71" accent
- Scribe agent suggestions appear in teal-bordered cards

---

## References

- `/docs/modules/bm-pm/PRD.md` (Core-PM v2.0 - KB specifications)
- `/docs/modules/bm-pm/kb-specification.md` (Detailed KB technical spec)
- `/docs/modules/bm-pm/architecture.md` (Core-PM v2.0 architecture)
- `/docs/design/STYLE-GUIDE.md` (Forms, Cards, Typography)
- `/docs/design/BRAND-GUIDELINES.md` (Agent identities, color palette)

---

## Wireframe List

| ID | Wireframe | Description | Priority |
|----|-----------|-------------|----------|
| KB-01 | `kb-page-tree.excalidraw` | Sidebar navigation with hierarchical page tree, recent pages, favorites, search | P0 |
| KB-02 | `kb-page-editor.excalidraw` | Tiptap rich text editor with formatting toolbar, @mentions, #task-references, slash commands | P0 |
| KB-03 | `kb-page-viewer.excalidraw` | Read-only page view with table of contents, backlinks, related pages, metadata | P0 |
| KB-04 | `kb-search-results.excalidraw` | RAG-powered semantic search with verified content indicators, relevance scores, filters | P0 |
| KB-05 | `kb-verified-content.excalidraw` | Verification workflow: verify button, expiration date, verification badge, owner display | P1 |
| KB-06 | `kb-page-history.excalidraw` | Version history timeline with diff view, restore capability, author attribution | P1 |

---

## KB-01: Knowledge Base Page Tree Navigation

**Goal:** Create an intuitive sidebar navigation for browsing the hierarchical wiki structure, with quick access to recent pages and favorites.

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo] HYVVE                           🔔(3)  [User ▼]  [?]  [⚙]          │
├────────────────┬───────────────────────────────────────────┬────────────────┤
│                │                                           │                │
│  PAGE TREE     │           MAIN CONTENT                    │  CONTEXT       │
│  SIDEBAR       │           (Editor/Viewer)                 │  PANEL         │
│  (240-280px)   │                                           │  (280-320px)   │
│                │                                           │                │
└────────────────┴───────────────────────────────────────────┴────────────────┘
```

**Key Elements:**

1. **Sidebar Header:**
   - Knowledge Base icon + "Knowledge Base" title
   - "New Page" button (+ icon, coral background)
   - Search toggle icon (magnifying glass)

2. **Quick Search Bar (Collapsible):**
   - Input with placeholder "Search pages..."
   - Search icon left, keyboard shortcut hint right (⌘K)
   - Searches page titles and content
   - Shows 3-5 results dropdown with page icons

3. **Favorites Section (Collapsible):**
   - Star icon + "Favorites" header
   - Chevron to collapse/expand
   - List of favorited pages (max 5 visible)
   - Each row: Page icon (📄), page title (truncated), star icon (filled, gold)
   - Empty state: "Star pages to add them here"

4. **Recent Pages Section:**
   - Clock icon + "Recent" header
   - Shows 5 most recently visited pages
   - Each row: Page icon, title, relative timestamp ("2h ago")
   - "View all recent" link at bottom

5. **Page Tree (Main Section):**
   - "All Pages" header with count badge (e.g., "47")
   - Hierarchical tree structure with expand/collapse

   **Tree Item Design:**
   ```
   ▼ 📁 Product Development (folder)
      ├── 📄 Roadmap 2025
      ├── 📄 Technical Specs
      ├── ▼ 📁 Feature Docs
      │      ├── 📄 Authentication ✓ (verified badge)
      │      └── 📄 Payment Integration
      └── 📄 Release Notes
   ```

   - Expand/collapse chevron (▼/▶)
   - Page icon: 📄 for page, 📁 for folder/container
   - Verified badge (✓ green checkmark) for verified pages
   - Active page: teal left border, light teal background
   - Hover state: light gray background
   - Drag handle appears on hover (for reordering)

6. **Tree Actions (On Hover):**
   - Three-dot menu (⋮) appears on hover
   - Options: New subpage, Rename, Move to, Delete, Add to favorites

7. **Empty State:**
   - Illustration placeholder (Scribe character waving)
   - "Your knowledge base is empty"
   - "Create your first page to get started"
   - "Create Page" button (coral)

8. **Footer Section:**
   - "Settings" link (gear icon)
   - Trash/Archive link with count
   - Storage usage indicator (if applicable)

**Interaction States:**
- Collapsed tree items show child count badge
- Dragging pages shows drop indicator line
- Right-click shows context menu
- Keyboard navigation (↑↓ to move, Enter to select, → to expand)

**Style Notes:**
- Use warm cream background (#FFFBF5) for sidebar
- Subtle separator line between sections
- 14px font size for tree items, 12px for metadata
- Teal highlight for selected/active page
- Scribe agent color (teal) for KB-related accents

---

## KB-02: Knowledge Base Page Editor

**Goal:** Create a powerful yet intuitive rich text editor for collaborative wiki editing with Tiptap/ProseMirror, supporting @mentions, #references, slash commands, and real-time collaboration.

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Page Tree     │                    EDITOR                    │  Context    │
│  (collapsed)   │                                               │  Panel      │
├────────────────┼───────────────────────────────────────────────┼─────────────┤
│                │  ┌─ Breadcrumb: All Pages > Features > Auth ─┐│ Scribe     │
│                │  │                                            ││ Suggestions│
│                │  │  [⭐] [📤] [⋮]      [✓ Verify] [Publish]  ││            │
│                │  │                                            ││ Backlinks  │
│                │  │  ════════════════════════════════════════  ││            │
│                │  │  [B][I][U][S] │ H1 H2 H3 │ • ○ ✓ │ 📎 🔗 💻││ Comments   │
│                │  │  ════════════════════════════════════════  ││            │
│                │  │                                            ││            │
│                │  │  # Authentication System                   ││            │
│                │  │                                            ││            │
│                │  │  This document covers the authentication   ││            │
│                │  │  implementation for @john.doe's project.   ││            │
│                │  │                                            ││            │
│                │  │  Related task: #PM-123                     ││            │
│                │  │                                            ││            │
│                │  └────────────────────────────────────────────┘│            │
└────────────────┴───────────────────────────────────────────────┴─────────────┘
```

**Key Elements:**

1. **Page Header Section:**
   - Breadcrumb navigation: "All Pages > Parent > Current Page"
   - Page title (editable, large heading - 32px)
   - Last edited timestamp + author: "Edited 2 hours ago by @sarah"
   - Presence indicators (colored dots with initials for other editors)

2. **Action Bar:**
   - Left side:
     - Favorite toggle (star icon - filled if favorited)
     - Share button (📤)
     - More menu (⋮): Export, Copy link, Move to, Delete
   - Right side:
     - Verify button (if not verified): "✓ Verify" (green border)
     - Verified badge (if verified): "✓ Verified until Dec 2025"
     - "Viewing" / "Editing" mode toggle
     - Publish/Save indicator

3. **Formatting Toolbar (Sticky on scroll):**
   ```
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ [B] [I] [U] [S] │ H1 H2 H3 │ • ○ ✓ 1. │ " │ — │ 📎 🔗 📷 💻 📊 │ ⋮ │
   └─────────────────────────────────────────────────────────────────────────┘
   ```

   Groups:
   - **Text formatting:** Bold, Italic, Underline, Strikethrough
   - **Headings:** H1, H2, H3 dropdown
   - **Lists:** Bullet, Ordered, Checkbox/Todo
   - **Blocks:** Quote, Divider
   - **Insert:** Attachment, Link, Image, Code block, Table
   - **More:** Full-screen, Focus mode

4. **Editor Canvas:**
   - White background (#FFFFFF)
   - Max-width: 720px, centered
   - Generous line height (1.6-1.8)
   - Placeholder: "Start typing or press / for commands..."
   - Focus indicator: subtle teal left border on active block

5. **Slash Command Menu (/ trigger):**
   ```
   ┌───────────────────────────────┐
   │ / heading                     │
   ├───────────────────────────────┤
   │ 🅗 Heading 1                  │
   │ 🅗 Heading 2                  │
   │ 🅗 Heading 3                  │
   │ ─────────────────────────────│
   │ • Bullet List                 │
   │ 1. Numbered List              │
   │ ✓ Todo / Checklist            │
   │ ─────────────────────────────│
   │ " Quote                       │
   │ 💻 Code Block                 │
   │ 📊 Table                      │
   │ — Divider                     │
   │ ─────────────────────────────│
   │ 📄 Link to Page              │
   │ 📌 Task Reference (#PM-123)   │
   │ 👤 Mention User (@name)       │
   │ ─────────────────────────────│
   │ ✨ Ask Scribe (AI assist)     │
   └───────────────────────────────┘
   ```

6. **@Mention Picker (@ trigger):**
   ```
   ┌───────────────────────────────┐
   │ @jo                           │
   ├───────────────────────────────┤
   │ 👤 John Doe (@john.doe)       │
   │ 👤 Jordan Smith (@jordan)     │
   │ ─────────────────────────────│
   │ 🤖 Scribe (AI Agent)         │
   │ 🤖 Navi (PM Lead)            │
   └───────────────────────────────┘
   ```

7. **#Task Reference Picker (# trigger):**
   ```
   ┌───────────────────────────────┐
   │ #PM-                          │
   ├───────────────────────────────┤
   │ 📌 PM-123: Implement OAuth    │
   │ 📌 PM-124: Add 2FA support    │
   │ 📌 PM-125: Session management │
   └───────────────────────────────┘
   ```

8. **[[Page Link]] Picker (typing [[):**
   - Search pages by title
   - Shows page hierarchy path
   - Creates internal wiki link

9. **Block Selection & Actions:**
   - Click block shows selection outline
   - Drag handle appears (⠿) for reordering
   - Block menu (⋮): Duplicate, Delete, Convert to, Comment

10. **Scribe AI Assist (inline):**
    - Type `/ask Scribe` or select text + right-click "Ask Scribe"
    - Options: "Summarize", "Expand", "Fix grammar", "Translate"
    - Shows Scribe avatar with teal border during generation

**Content Block Types:**
- Paragraphs with inline formatting
- Headings (H1-H3)
- Bullet/Ordered/Todo lists
- Code blocks with syntax highlighting
- Tables (resizable columns)
- Images with captions
- Embeds (YouTube, Figma, etc.)
- Callout boxes (info, warning, tip)
- Collapsible sections

**Style Notes:**
- Clean, distraction-free writing experience
- Toolbar appears on text selection (floating)
- Smooth animations for menu appearances
- Teal accents for KB-specific features
- Real-time save indicator (cloud icon with checkmark)
- Character count in footer (optional)

---

## KB-03: Knowledge Base Page Viewer

**Goal:** Create an optimized read-only view for consuming wiki content with easy navigation, related content discovery, and quick actions.

**Layout Structure:**
```
┌────────────────┬───────────────────────────────────────────┬────────────────┐
│  Page Tree     │               PAGE VIEWER                 │  Context       │
│  (sidebar)     │                                           │  Panel         │
├────────────────┼───────────────────────────────────────────┼────────────────┤
│                │  ┌─ Breadcrumb ─────────────────────────┐ │ Table of       │
│  ...           │  │                                       │ │ Contents       │
│                │  │  Authentication System        [Edit]  │ │ ────────────── │
│                │  │  ✓ Verified • Updated 2h ago         │ │ 1. Overview    │
│                │  │                                       │ │ 2. OAuth Flow  │
│                │  │  ═══════════════════════════════════ │ │ 3. JWT Tokens  │
│                │  │                                       │ │ 4. Sessions    │
│                │  │  ## 1. Overview                       │ │                │
│                │  │                                       │ │ ────────────── │
│                │  │  The authentication system provides   │ │ Backlinks (3)  │
│                │  │  secure access control for...         │ │ • API Docs     │
│                │  │                                       │ │ • Security     │
│                │  │  ## 2. OAuth Flow                     │ │ • Onboarding   │
│                │  │                                       │ │                │
│                │  │  See task #PM-123 for implementation  │ │ ────────────── │
│                │  │                                       │ │ Related Pages  │
│                │  └───────────────────────────────────────┘ │                │
└────────────────┴───────────────────────────────────────────┴────────────────┘
```

**Key Elements:**

1. **Page Header:**
   - Breadcrumb: "Knowledge Base > Security > Authentication"
   - Page title (large, 32px, non-editable in view mode)
   - Metadata row:
     - Verified badge (if verified): "✓ Verified" (green)
     - Last updated: "Updated 2 hours ago by @sarah"
     - Read time estimate: "5 min read"
   - Action buttons:
     - "Edit" button (primary, coral)
     - Star/Favorite toggle
     - Share dropdown
     - More menu (⋮)

2. **Page Content Area:**
   - Max-width 720px, centered
   - Typography optimized for reading:
     - Body: 16px, line-height 1.75
     - Headings: Clear hierarchy (H1: 28px, H2: 24px, H3: 20px)
   - Code blocks with syntax highlighting + copy button
   - Images with lightbox on click
   - Internal links styled distinctively (teal, underline on hover)
   - Task references (#PM-123) as clickable chips with status icon
   - @mentions as clickable user pills

3. **Context Panel - Table of Contents:**
   - "On this page" header
   - Auto-generated from H2/H3 headings
   - Current section highlighted
   - Click to jump (smooth scroll)
   - Sticky on scroll (follows viewport)

   ```
   ┌─────────────────────────┐
   │ On this page            │
   │ ─────────────────────── │
   │ 1. Overview             │
   │ 2. OAuth Flow      ●    │ ← Current section
   │    2.1 Google OAuth     │
   │    2.2 Microsoft OAuth  │
   │ 3. JWT Tokens           │
   │ 4. Session Management   │
   └─────────────────────────┘
   ```

4. **Backlinks Section:**
   - "Backlinks (3)" header with count
   - List of pages that link to this page:
     ```
     ┌─────────────────────────┐
     │ Backlinks (3)           │
     │ ─────────────────────── │
     │ 📄 API Documentation    │
     │    "...uses the auth    │
     │    system described..." │
     │                         │
     │ 📄 Security Overview    │
     │    "...see Auth for..." │
     │                         │
     │ 📄 Onboarding Guide     │
     └─────────────────────────┘
     ```
   - Shows snippet of linking context
   - Click to navigate

5. **Related Pages Section:**
   - AI-suggested related content (via RAG)
   - "Related Pages" header with Scribe icon
   - 3-5 related page cards:
     ```
     ┌─────────────────────────┐
     │ Related Pages           │
     │ ─────────────────────── │
     │ 📄 User Permissions     │
     │ 📄 API Security         │
     │ 📄 Password Policies    │
     │                         │
     │ Suggested by Scribe 🤖  │
     └─────────────────────────┘
     ```

6. **Page Footer:**
   - Divider line
   - Author/contributors avatars
   - "Was this helpful?" feedback: 👍 👎
   - "Last edited by @sarah on Dec 15, 2025"
   - "Report an issue" link

7. **Floating Action Button (optional):**
   - "Edit this page" fab on mobile
   - Quick scroll to top

**Verified Page Indicators:**
- Green "✓ Verified" badge next to title
- Verification expiration date if set
- Verifier name on hover
- Subtle green left border on entire content

**Style Notes:**
- Prioritize readability (ample whitespace)
- Smooth scroll animations for TOC links
- Code blocks have "Copy" button on hover
- Images have subtle border radius
- Links use teal color (#20B2AA)
- Verified pages have subtle green accent

---

## KB-04: Knowledge Base Search Results

**Goal:** Create a powerful RAG-powered semantic search interface that helps users find relevant knowledge quickly, with special treatment for verified/authoritative content.

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [🔍] Search Knowledge Base...                          [×] Close Search    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Filters ─────────────────────────────────────────────────────────────┐  │
│  │ [All Pages ▼]  [Any Date ▼]  [☑ Verified First]  [Any Author ▼]       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  42 results for "authentication setup"                    Sort: Relevance ▼ │
│                                                                              │
│  ┌─ VERIFIED RESULTS ─────────────────────────────────────────────────────┐ │
│  │ ✓ Authentication System                                    95% match   │ │
│  │   Security > Auth                                                      │ │
│  │   "The **authentication setup** process involves configuring OAuth..." │ │
│  │   Updated 2 days ago • Verified by @admin                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ ALL RESULTS ──────────────────────────────────────────────────────────┐ │
│  │ 📄 Getting Started Guide                                    87% match  │ │
│  │   Onboarding > Setup                                                   │ │
│  │   "...first step is **authentication setup** using your..."           │ │
│  │   Updated 1 week ago                                                   │ │
│  │ ──────────────────────────────────────────────────────────────────────│ │
│  │ 📄 API Security Best Practices                              82% match  │ │
│  │   ...                                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**

1. **Search Bar (Hero):**
   - Full-width search input
   - Large text (18px)
   - Search icon (left)
   - Clear button (right, appears when typing)
   - Keyboard shortcut hint: "⌘K to search anywhere"
   - Auto-focus on open

2. **Search Filters Row:**
   - Filter dropdowns:
     - **Scope:** "All Pages" | "Specific Folder..." | "Favorites"
     - **Date:** "Any Date" | "Last 7 days" | "Last 30 days" | "Last 90 days"
     - **Author:** "Any Author" | specific user picker
     - **Verified:** "☑ Show Verified First" toggle (on by default)
   - "Clear filters" link

3. **Results Summary:**
   - Result count: "42 results for 'authentication setup'"
   - Sort dropdown: "Relevance" | "Last Updated" | "Title A-Z"
   - Time taken (subtle): "0.23 seconds"

4. **Verified Results Section (Priority):**
   - Section header: "✓ Verified Results" with green accent
   - Verified results appear first with visual distinction
   - Green left border or background tint

   **Verified Result Card:**
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ✓ Authentication System                         95% match  │
   │ ──────────────────────────────────────────────────────────│
   │ 📁 Security > Authentication                               │
   │                                                             │
   │ "The **authentication setup** process involves configuring │
   │ OAuth providers, setting up JWT token validation, and..."   │
   │                                                             │
   │ Updated 2 days ago • Verified by @admin until Mar 2026     │
   │ [Open] [Copy Link]                                          │
   └─────────────────────────────────────────────────────────────┘
   ```

5. **All Results Section:**
   - Standard result cards
   - No verified badge
   - Same structure but neutral styling

   **Standard Result Card:**
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ 📄 Getting Started Guide                        87% match  │
   │ ──────────────────────────────────────────────────────────│
   │ 📁 Onboarding > Setup                                      │
   │                                                             │
   │ "...first step is **authentication setup** using your      │
   │ company credentials. Navigate to Settings and..."          │
   │                                                             │
   │ Updated 1 week ago by @sarah                               │
   └─────────────────────────────────────────────────────────────┘
   ```

6. **Result Card Elements:**
   - Page icon (📄 or ✓ for verified)
   - Page title (link, 18px, bold)
   - Relevance score badge (e.g., "95% match")
   - Breadcrumb path (smaller, gray)
   - Content snippet with **highlighted** matches
   - Metadata: Updated date, author, verified status
   - Quick actions on hover: Open, Copy link

7. **No Results State:**
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │                                                             │
   │           🔍 No results for "foobar123"                    │
   │                                                             │
   │           Try different keywords or check spelling          │
   │                                                             │
   │           Suggestions:                                      │
   │           • authentication                                  │
   │           • setup guide                                     │
   │           • getting started                                 │
   │                                                             │
   │           [Create a page about "foobar123" →]              │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
   ```

8. **Loading State:**
   - Skeleton cards (3-4)
   - Scribe thinking indicator: "🤖 Scribe is searching..."
   - Progress indicator for RAG processing

9. **Keyboard Navigation:**
   - ↑↓ to navigate results
   - Enter to open selected
   - Tab to move between filter controls

**RAG-Specific Features:**
- Semantic understanding (not just keyword matching)
- Relevance scores visible (percentage)
- Verified content boosted in ranking
- Content snippet shows most relevant section
- "Did you mean..." suggestions for typos

**Style Notes:**
- Search modal overlays page content
- Subtle backdrop blur on background
- Green accent for verified content
- Bold/highlight matched terms in snippets
- Smooth result loading animation
- Teal accents for KB-specific elements

---

## KB-05: Verified Content Management

**Goal:** Create an intuitive interface for marking pages as verified/authoritative, managing verification status, and displaying verification workflow.

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERIFICATION PANEL                                    │
│                    (Slide-out or Modal - 480px wide)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Verification Status ──────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────┐                          │ │
│  │  │           ✓ VERIFIED                     │                          │ │
│  │  │       Valid until Mar 15, 2026           │                          │ │
│  │  │     Verified by @admin on Dec 16, 2025   │                          │ │
│  │  └──────────────────────────────────────────┘                          │ │
│  │                                                                         │ │
│  │  [Remove Verification]                                                  │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ Verification History ─────────────────────────────────────────────────┐ │
│  │  Dec 16, 2025 - Verified by @admin (90 days)                           │ │
│  │  Sep 10, 2025 - Verified by @sarah (60 days)                           │ │
│  │  Jun 15, 2025 - Verification expired                                   │ │
│  │  Jun 01, 2025 - Verified by @admin (14 days)                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**

1. **Verification Badge (In Page Header):**
   - **Unverified:** No badge, shows "Verify" button
   - **Verified:** "✓ Verified" badge (green background)
   - **Expiring Soon:** "✓ Verified (Expiring in 7 days)" (amber)
   - **Expired:** "⚠ Verification Expired" (red)

   ```
   Unverified:
   ┌──────────────────────────────────┐
   │ Page Title              [✓ Verify] │
   └──────────────────────────────────┘

   Verified:
   ┌──────────────────────────────────┐
   │ Page Title   ✓ Verified    [⋮]  │
   │              until Mar 2026      │
   └──────────────────────────────────┘
   ```

2. **Verify Button Action (Unverified Pages):**
   Click opens verification modal:
   ```
   ┌──────────────────────────────────────────────────────┐
   │ ✓ Verify This Page                              [×] │
   ├──────────────────────────────────────────────────────┤
   │                                                      │
   │ Marking content as verified means:                   │
   │ • This content is accurate and up-to-date           │
   │ • AI agents will prioritize this in responses       │
   │ • It will appear first in search results            │
   │                                                      │
   │ ─────────────────────────────────────────────────── │
   │                                                      │
   │ Verification Duration:                               │
   │ ┌─────────────────────────────────────────────────┐ │
   │ │ ○ 30 days                                        │ │
   │ │ ● 90 days (Recommended)                          │ │
   │ │ ○ 180 days                                       │ │
   │ │ ○ 1 year                                         │ │
   │ │ ○ No expiration (requires admin approval)        │ │
   │ └─────────────────────────────────────────────────┘ │
   │                                                      │
   │ Notes (optional):                                    │
   │ ┌─────────────────────────────────────────────────┐ │
   │ │ Reviewed after Q4 security audit                │ │
   │ └─────────────────────────────────────────────────┘ │
   │                                                      │
   │              [Cancel]    [✓ Verify Page]            │
   │                                                      │
   └──────────────────────────────────────────────────────┘
   ```

3. **Verification Details Panel (Click on badge):**
   ```
   ┌──────────────────────────────────────────────────────┐
   │ Verification Details                            [×] │
   ├──────────────────────────────────────────────────────┤
   │                                                      │
   │  ┌────────────────────────────────────────────────┐ │
   │  │            ✓ VERIFIED                          │ │
   │  │                                                │ │
   │  │  Valid until: March 15, 2026                   │ │
   │  │  Days remaining: 89 days                       │ │
   │  │                                                │ │
   │  │  Verified by: @admin (Chris Smith)             │ │
   │  │  Verified on: December 16, 2025                │ │
   │  │                                                │ │
   │  │  Notes: "Reviewed after Q4 security audit"     │ │
   │  └────────────────────────────────────────────────┘ │
   │                                                      │
   │  ─────────────────────────────────────────────────  │
   │                                                      │
   │  Actions:                                            │
   │  [🔄 Extend Verification]  [❌ Remove Verification] │
   │                                                      │
   │  ─────────────────────────────────────────────────  │
   │                                                      │
   │  History:                                            │
   │  • Dec 16, 2025 - Verified by @admin (90 days)      │
   │  • Sep 10, 2025 - Verified by @sarah (60 days)      │
   │  • Jun 15, 2025 - Verification expired              │
   │                                                      │
   └──────────────────────────────────────────────────────┘
   ```

4. **Verification Reminder (Before Expiration):**
   - Banner appears 7 days before expiration
   - Toast notification to verifier

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ⚠️ Verification expires in 7 days. [Extend] [Dismiss]      │
   └─────────────────────────────────────────────────────────────┘
   ```

5. **Verified Pages List (Settings View):**
   - Table of all verified pages in workspace
   - Columns: Page, Verified By, Expires, Status, Actions
   - Filter: "Active" | "Expiring Soon" | "Expired"
   - Bulk actions: Extend, Remove verification

   ```
   ┌────────────────────────────────────────────────────────────────────────┐
   │ Verified Content                                    [+ Verify Page]   │
   ├───────────────┬──────────────┬──────────────┬──────────┬─────────────┤
   │ Page          │ Verified By  │ Expires      │ Status   │ Actions     │
   ├───────────────┼──────────────┼──────────────┼──────────┼─────────────┤
   │ Auth System   │ @admin       │ Mar 15, 2026 │ ✓ Active │ [Extend][×] │
   │ API Docs      │ @sarah       │ Dec 20, 2025 │ ⚠ Soon   │ [Extend][×] │
   │ Security      │ @admin       │ Nov 30, 2025 │ ❌ Expired│ [Verify][×] │
   └───────────────┴──────────────┴──────────────┴──────────┴─────────────┘
   ```

6. **Scribe Verification Suggestions:**
   - Scribe can suggest pages for verification
   - Based on: high view count, frequently referenced, stale

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ 🤖 Scribe Suggestion                                       │
   │                                                             │
   │ "Authentication System" is frequently referenced but not    │
   │ verified. Would you like to review and verify it?           │
   │                                                             │
   │ [Review Page]  [Dismiss]  [Don't suggest again]            │
   └─────────────────────────────────────────────────────────────┘
   ```

**Style Notes:**
- Green (#2ECC71) for verified status
- Amber (#F59E0B) for expiring soon
- Red (#EF4444) for expired
- Verification badge is always visible in page header
- Use forest green (Sage color) for verification UI
- Clear hierarchy between verified and unverified content

---

## KB-06: Page Version History

**Goal:** Create a comprehensive version history interface allowing users to view changes over time, compare versions, and restore previous versions.

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Page Title > History                                              [× Close]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ VERSION TIMELINE ────────────────────┐  ┌─ VERSION PREVIEW ───────────┐ │
│  │                                       │  │                              │ │
│  │  ● Dec 16, 2:34 PM - @admin     [Current] │  │  [Page content preview]      │ │
│  │    "Updated authentication flow"      │  │                              │ │
│  │    +24 / -8 lines                     │  │                              │ │
│  │  │                                    │  │                              │ │
│  │  ○ Dec 15, 4:12 PM - @sarah           │  │                              │ │
│  │    "Added OAuth examples"             │  │                              │ │
│  │    +156 / -2 lines                    │  │                              │ │
│  │  │                                    │  │                              │ │
│  │  ○ Dec 14, 10:30 AM - @john           │  │                              │ │
│  │    "Initial draft"                    │  │                              │ │
│  │    +89 / -0 lines                     │  │                              │ │
│  │                                       │  │                              │ │
│  │  [Load older versions...]             │  │  ───────────────────────────  │
│  │                                       │  │  [Compare to Current] [Restore]│
│  └───────────────────────────────────────┘  └──────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**

1. **History Header:**
   - Page title with " > History" suffix
   - Close button (×)
   - "History" icon indicator

2. **Version Timeline (Left Panel - 320px):**
   - Chronological list, newest first
   - Connected by vertical timeline line

   **Version Entry Design:**
   ```
   ● Dec 16, 2025 2:34 PM                    [Current]
     @admin (Chris Smith)
     "Updated authentication flow"
     +24 lines / -8 lines
   │
   ○ Dec 15, 2025 4:12 PM
     @sarah (Sarah Jones)
     "Added OAuth examples"
     +156 lines / -2 lines
   ```

   **Entry Elements:**
   - Dot indicator: ● for current, ○ for past
   - Timestamp (date + time)
   - Author avatar + name
   - Edit summary/commit message (if provided)
   - Change stats: lines added (green) / removed (red)
   - Click to select version

3. **Version Preview (Right Panel):**
   - Read-only render of selected version
   - Full page content as it appeared
   - "Current" badge if viewing current version
   - Scroll independent of timeline

4. **Version Actions:**
   - **Compare to Current:** Opens diff view
   - **Restore This Version:** Restores selected version
   - **Download:** Export as markdown/PDF

5. **Diff View (Comparison Mode):**
   ```
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  Comparing: Dec 15, 4:12 PM → Dec 16, 2:34 PM (Current)        [× Exit] │
   ├─────────────────────────────────────────────────────────────────────────┤
   │                                                                          │
   │  ┌─ Side-by-Side / Unified Toggle ──────────────────────────────────┐   │
   │  │ [Side by Side] [Unified]                                          │   │
   │  └───────────────────────────────────────────────────────────────────┘   │
   │                                                                          │
   │  ┌─ BEFORE (Dec 15) ─────────────────┐ ┌─ AFTER (Dec 16) ─────────────┐ │
   │  │                                   │ │                               │ │
   │  │  ## Authentication                │ │  ## Authentication            │ │
   │  │                                   │ │                               │ │
   │  │  The auth system uses OAuth.     │ │  The auth system uses OAuth   │ │
   │  │ -                                │ │ + for secure token exchange.   │ │
   │  │                                   │ │                               │ │
   │  │  ### Configuration               │ │  ### Configuration            │ │
   │  │                                   │ │ + #### Environment Variables  │ │
   │  │                                   │ │ + AUTH_SECRET=...             │ │
   │  │                                   │ │                               │ │
   │  └───────────────────────────────────┘ └───────────────────────────────┘ │
   │                                                                          │
   │  Legend: + Added (green)  - Removed (red)  ~ Modified (amber)           │
   │                                                                          │
   └─────────────────────────────────────────────────────────────────────────┘
   ```

   **Diff Elements:**
   - Toggle: Side-by-side vs Unified view
   - Line numbers
   - Added lines: Green background (#E8F8EF)
   - Removed lines: Red background (#FEE8E8)
   - Modified lines: Amber highlight
   - Legend at bottom

6. **Restore Confirmation Modal:**
   ```
   ┌──────────────────────────────────────────────────────┐
   │ ⚠️ Restore Previous Version?                    [×] │
   ├──────────────────────────────────────────────────────┤
   │                                                      │
   │ You're about to restore the version from:            │
   │                                                      │
   │ December 15, 2025 at 4:12 PM                         │
   │ by @sarah                                            │
   │                                                      │
   │ This will:                                           │
   │ • Replace current content with this version          │
   │ • Create a new version entry (current is preserved)  │
   │ • Not affect verification status                     │
   │                                                      │
   │ Note: This action can be undone by restoring again.  │
   │                                                      │
   │              [Cancel]    [Restore Version]           │
   │                                                      │
   └──────────────────────────────────────────────────────┘
   ```

7. **Auto-Save Indicators:**
   - Minor edits grouped (e.g., "5 auto-saves" collapsed)
   - Expand to see individual saves
   - Major saves (explicit save or significant changes) shown individually

8. **Filtering & Search:**
   - Filter by author dropdown
   - Date range picker
   - Search within history summaries

**Style Notes:**
- Timeline uses subtle vertical line connection
- Current version highlighted with teal accent
- Diff colors: Green for additions, red for removals
- Smooth transitions when switching versions
- Preserve scroll position in preview when switching
- Version entries show relative time ("2 hours ago") with full date on hover

---

## Usage Notes

1. **Generation Order:** Create wireframes in order KB-01 through KB-06
2. **Reference Design Context** at the top for consistent styling
3. **Export Settings:**
   - Light mode only for initial wireframes
   - 1440px width for desktop views
   - Include mobile responsive notes in annotations
4. **Naming Convention:** `kb-01_page_tree_navigation.excalidraw`
5. **Agent Integration:** Include Scribe agent suggestions where noted

---

## Next Batch

**BATCH-13:** Core-PM Knowledge Base (Part 2) - KB-07 through KB-12
- KB-07: Page Comments
- KB-08: Project Linking
- KB-09: Presence Cursors
- KB-10: Scribe Panel
- KB-11: Embed Blocks
- KB-12: Page Templates
