# BATCH-13: Core-PM Knowledge Base Wireframes (Part 2)

**Batch Number:** 13
**Module:** Core-PM (Platform Core)
**Focus:** Knowledge Base - Advanced Features
**Total Wireframes:** 6 (KB-07 to KB-12)
**Priority:** P1-P2 (High to Medium)

---

## References

| Document | Path | Purpose |
|----------|------|---------|
| KB Specification | `docs/modules/bm-pm/kb-specification.md` | Technical requirements |
| Core-PM PRD | `docs/modules/bm-pm/prd.md` | Feature requirements |
| Wireframe Audit | `docs/design/wireframes/CORE-PM-WIREFRAME-AUDIT.md` | Gap analysis |
| BATCH-12 | `docs/design/wireframes/prompts/BATCH-12-CORE-PM-KB-PART1.md` | Part 1 (KB-01 to KB-06) |
| Style Guide | `docs/design/STYLE-GUIDE.md` | Brand guidelines |

---

## Wireframe List

| ID | Name | File | Priority | Description |
|----|------|------|----------|-------------|
| KB-07 | Page Comments | `kb-page-comments.excalidraw` | P1 | Comment threads, inline comments, resolved/open states |
| KB-08 | Project Linking | `kb-project-linking.excalidraw` | P1 | Link pages to projects, bidirectional navigation |
| KB-09 | Presence Cursors | `kb-presence-cursors.excalidraw` | P2 | Multi-user editing with cursor visibility |
| KB-10 | Scribe Panel | `kb-scribe-panel.excalidraw` | P2 | Scribe agent suggestions and automation |
| KB-11 | Embed Blocks | `kb-embed-blocks.excalidraw` | P2 | Embedded content: diagrams, tables, task lists |
| KB-12 | Page Templates | `kb-templates.excalidraw` | P2 | Template gallery with categories |

---

## Shared Design Context

### Color Palette
```
Primary Background:     #FFFBF5 (Warm Cream)
Card Background:        #FFFFFF (Pure White)
Border Color:           #f1ebe4 (Warm Border)
Text Primary:           #1a1a2e (Deep Navy)
Text Secondary:         #6b7280 (Gray 500)

KB Theme Color:         #20B2AA (Teal) - Scribe agent
Verified Badge:         #2ECC71 (Green)
Comment Thread:         #3B82F6 (Blue 500)
Resolved Comment:       #9CA3AF (Gray 400)
Presence Cursor 1:      #FF6B6B (Coral)
Presence Cursor 2:      #10B981 (Emerald)
Presence Cursor 3:      #8B5CF6 (Violet)
Presence Cursor 4:      #F59E0B (Amber)

Focus Ring:             #FF6B6B (Coral)
Error State:            #EF4444 (Red 500)
Success State:          #22C55E (Green 500)
Warning State:          #F59E0B (Amber 500)
```

### Typography
```
Font Family:            Inter
Page Title:             24px / 700 weight / #1a1a2e
Section Heading:        18px / 600 weight / #1a1a2e
Body Text:              14px / 400 weight / #374151
Caption/Meta:           12px / 400 weight / #6b7280
Comment Text:           13px / 400 weight / #374151
User Name:              13px / 500 weight / #1a1a2e
Timestamp:              11px / 400 weight / #9CA3AF
```

### Component Tokens
```
Border Radius (Cards):  16px
Border Radius (Buttons): 10px
Border Radius (Inputs): 8px
Border Radius (Avatars): 50% (circular)
Spacing Unit:           4px base (4/8/12/16/24/32)
Shadow (Elevated):      0 4px 12px rgba(0,0,0,0.08)
Shadow (Comment):       0 2px 8px rgba(0,0,0,0.06)
Transition:             150ms ease-out
```

### Agent Identity - Scribe
```
Agent Name:             Scribe
Agent Color:            #20B2AA (Teal)
Agent Icon:             📝 (or quill pen SVG)
Agent Role:             Knowledge Base Manager
Agent Tagline:          "Let me help organize your knowledge."
```

---

## KB-07: Page Comments

**File:** `kb-page-comments.excalidraw`
**Priority:** P1 (High)
**Goal:** Design the commenting system for KB pages including inline comments, thread discussions, and resolution workflow.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Page                                            [Resolved ▾] [+] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ INLINE COMMENT HIGHLIGHT (in page content)                              ││
│  │                                                                         ││
│  │  The deployment process involves [highlighted text with comment        ││
│  │  indicator] several steps that must be followed carefully.             ││
│  │                                                                         ││
│  │                                              ┌─────────────────────────┐││
│  │                                              │ 💬 2 comments           │││
│  │                                              │ Click to view thread    │││
│  │                                              └─────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  COMMENT THREAD PANEL (Right side or overlay)                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ┌───────────────────────────────────────────────────────────────────┐  ││
│  │ │ OPEN THREAD                                              [•••]    │  ││
│  │ │ ─────────────────────────────────────────────────────────────────│  ││
│  │ │ 👤 Sarah Chen                                     2 hours ago     │  ││
│  │ │ ┌─────────────────────────────────────────────────────────────┐  │  ││
│  │ │ │ "deployment process"                                        │  │  ││
│  │ │ └─────────────────────────────────────────────────────────────┘  │  ││
│  │ │                                                                   │  ││
│  │ │ Should we add more detail about the CI/CD pipeline here?         │  ││
│  │ │ I think new team members might need more context.                │  ││
│  │ │                                                                   │  ││
│  │ │ 💬 Reply    👍 2    [Resolve]                                    │  ││
│  │ │                                                                   │  ││
│  │ │ ┌─────────────────────────────────────────────────────────────┐  │  ││
│  │ │ │ REPLY                                                       │  │  ││
│  │ │ │ ─────────────────────────────────────────────────────────── │  │  ││
│  │ │ │ 👤 John Martinez                              1 hour ago    │  │  ││
│  │ │ │                                                             │  │  ││
│  │ │ │ Good point! I'll add a section about our GitHub Actions    │  │  ││
│  │ │ │ workflow. @Sarah Chen I'll tag you when it's ready.        │  │  ││
│  │ │ │                                                             │  │  ││
│  │ │ │ 👍 1                                                        │  │  ││
│  │ │ └─────────────────────────────────────────────────────────────┘  │  ││
│  │ │                                                                   │  ││
│  │ │ ┌─────────────────────────────────────────────────────────────┐  │  ││
│  │ │ │ 👤 Write a reply...                              [Send]     │  │  ││
│  │ │ └─────────────────────────────────────────────────────────────┘  │  ││
│  │ └───────────────────────────────────────────────────────────────────┘  ││
│  │                                                                         ││
│  │ ┌───────────────────────────────────────────────────────────────────┐  ││
│  │ │ RESOLVED THREAD                               [Reopen] [Delete]   │  ││
│  │ │ ─────────────────────────────────────────────────────────────────│  ││
│  │ │ 👤 Maya Johnson                                   Yesterday       │  ││
│  │ │ ┌─────────────────────────────────────────────────────────────┐  │  ││
│  │ │ │ "configure the environment"                                 │  │  ││
│  │ │ └─────────────────────────────────────────────────────────────┘  │  ││
│  │ │                                                                   │  ││
│  │ │ Typo: "enviroment" should be "environment"                       │  ││
│  │ │                                                                   │  ││
│  │ │ ✅ Resolved by John Martinez                      2 hours ago    │  ││
│  │ │ "Fixed the typo. Thanks for catching that!"                      │  ││
│  │ └───────────────────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Elements

1. **Comment Creation Flow**
   - Select text in editor to trigger comment popover
   - Popover shows: "Add comment" button with 💬 icon
   - Click opens inline comment composer
   - Composer has: text area (auto-expand), mention support (@user), [Cancel] [Comment] buttons
   - Submitted comment creates thread attached to text selection

2. **Inline Comment Indicators**
   - Highlighted text with light blue background (#DBEAFE)
   - Right margin shows comment bubble icon with count
   - Hover state: deeper blue background (#BFDBFE)
   - Clicking indicator opens thread panel/popover
   - Multiple overlapping comments: stacked indicators

3. **Comment Thread Card**
   - Card background: White (#FFFFFF)
   - Border: 1px solid #E5E7EB
   - Border-left: 3px solid #3B82F6 (Blue 500) for open threads
   - Border-left: 3px solid #9CA3AF (Gray 400) for resolved threads
   - Shadow: 0 2px 8px rgba(0,0,0,0.06)
   - Padding: 16px

4. **Thread Header**
   - Status badge: "Open" (blue) or "Resolved" (gray)
   - Menu button (•••): Edit, Delete, Copy link
   - Quoted text block showing highlighted content
   - Light gray background (#F9FAFB) for quote

5. **Comment Item**
   - Avatar: 32px circular with user initials or photo
   - Name: 13px semibold #1a1a2e
   - Timestamp: 11px #9CA3AF, relative time ("2 hours ago")
   - Comment body: 13px #374151
   - @mentions: blue links (#3B82F6)
   - Action row: Reply link, reaction count, Resolve button (for thread starter)

6. **Reply Composer**
   - Inline within thread (no modal)
   - Avatar placeholder on left
   - Text input: "Write a reply..."
   - Expand on focus to show [Cancel] [Send] buttons
   - @ mention autocomplete dropdown
   - 📎 attachment icon (optional)

7. **Resolved Thread State**
   - Gray left border (#9CA3AF)
   - "Resolved by [Name]" footer with timestamp
   - Resolution comment shown
   - [Reopen] [Delete] actions in header
   - Entire thread slightly muted (opacity 0.8)

8. **Thread Panel (Sidebar Mode)**
   - Width: 380px
   - Header: "Comments" with count, filter dropdown (All/Open/Resolved)
   - Scrollable list of all threads
   - Sorted by: Most recent first (or by position in document)
   - Click thread to scroll to highlighted text

9. **Empty State**
   - Illustration: Document with speech bubbles
   - Text: "No comments yet"
   - Subtext: "Select text to add a comment"
   - Teal accent color for illustration

10. **Mobile Adaptation**
    - Full-screen comment panel
    - Swipe to dismiss
    - Fixed compose bar at bottom
    - Thread cards stack vertically

### Style Notes

- Comment highlight uses soft blue that doesn't interfere with readability
- Thread cards have subtle hover state (background #F9FAFB)
- Resolved threads are visually de-emphasized but still accessible
- @mentions trigger autocomplete with user avatars
- Reactions are emoji-based with count (keep minimal: 👍 only for simplicity)
- Keyboard shortcut: Cmd/Ctrl+Shift+M for new comment

---

## KB-08: Project Linking

**File:** `kb-project-linking.excalidraw`
**Priority:** P1 (High)
**Goal:** Design the UI for linking KB pages to Core-PM projects, enabling bidirectional navigation and project-scoped documentation.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 📄 Deployment Runbook                                                    ││
│  │                                                                          ││
│  │ 🏷️ Tags: devops, deployment, ci-cd                                      ││
│  │                                                                          ││
│  │ 🔗 LINKED PROJECTS                                          [+ Link]    ││
│  │ ┌─────────────────────────────────────────────────────────────────────┐ ││
│  │ │ 🗂️ Website Redesign v2.0        Phase: Implementation    [×]       │ ││
│  │ │ 🗂️ Mobile App Launch            Phase: Testing           [×]       │ ││
│  │ └─────────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  LINK PROJECT MODAL                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                              [×]         ││
│  │   🔗 Link Page to Project                                               ││
│  │                                                                          ││
│  │   ┌─────────────────────────────────────────────────────────────────┐   ││
│  │   │ 🔍 Search projects...                                           │   ││
│  │   └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                          ││
│  │   RECENT PROJECTS                                                        ││
│  │   ┌─────────────────────────────────────────────────────────────────┐   ││
│  │   │ ○ 🗂️ Website Redesign v2.0                                      │   ││
│  │   │     Phase: Implementation • 12 team members                      │   ││
│  │   ├─────────────────────────────────────────────────────────────────┤   ││
│  │   │ ○ 🗂️ Mobile App Launch                                          │   ││
│  │   │     Phase: Testing • 8 team members                              │   ││
│  │   ├─────────────────────────────────────────────────────────────────┤   ││
│  │   │ ○ 🗂️ Q1 Marketing Campaign                                      │   ││
│  │   │     Phase: Planning • 5 team members                             │   ││
│  │   ├─────────────────────────────────────────────────────────────────┤   ││
│  │   │ ● 🗂️ API Integration Project       ← SELECTED                   │   ││
│  │   │     Phase: Design • 6 team members                               │   ││
│  │   └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                          ││
│  │   Link Reason (optional)                                                 ││
│  │   ┌─────────────────────────────────────────────────────────────────┐   ││
│  │   │ Reference documentation for deployment process                   │   ││
│  │   └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                          ││
│  │                                    [Cancel]  [Link to Project]           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  PROJECT DETAIL - KB PAGES TAB (in Core-PM)                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🗂️ Website Redesign v2.0                                                ││
│  │ ─────────────────────────────────────────────────────────────────────── ││
│  │ [Overview] [Tasks] [Timeline] [Team] [📚 KB Pages] [Files] [Settings]   ││
│  │                                        ^^^^^^^^ ACTIVE TAB              ││
│  │ ─────────────────────────────────────────────────────────────────────── ││
│  │                                                                          ││
│  │ 📚 LINKED KNOWLEDGE BASE PAGES                          [+ Link Page]   ││
│  │                                                                          ││
│  │ ┌─────────────────────────────────────────────────────────────────────┐ ││
│  │ │  📄 Deployment Runbook                              ✓ Verified      │ ││
│  │ │     Last updated 2 days ago by Sarah Chen                           │ ││
│  │ │     "Reference documentation for deployment process"                │ ││
│  │ │                                                    [Open] [Unlink]  │ ││
│  │ ├─────────────────────────────────────────────────────────────────────┤ ││
│  │ │  📄 API Integration Guide                                           │ ││
│  │ │     Last updated 1 week ago by John Martinez                        │ ││
│  │ │     "Technical specification for API endpoints"                     │ ││
│  │ │                                                    [Open] [Unlink]  │ ││
│  │ ├─────────────────────────────────────────────────────────────────────┤ ││
│  │ │  📄 Design System Documentation                     ✓ Verified      │ ││
│  │ │     Last updated 3 days ago by Maya Johnson                         │ ││
│  │ │     No link reason provided                                         │ ││
│  │ │                                                    [Open] [Unlink]  │ ││
│  │ └─────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                          ││
│  │ QUICK ACTIONS                                                            ││
│  │ ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ││
│  │ │ 📝 Create New Page │  │ 🔍 Search KB       │  │ 📋 Suggest Pages   │  ││
│  │ │    for Project     │  │    for Related     │  │    via Scribe      │  ││
│  │ └────────────────────┘  └────────────────────┘  └────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Elements

1. **Page Header - Linked Projects Section**
   - Section title: "Linked Projects" with 🔗 icon
   - [+ Link] button: Coral outline, 10px radius
   - Project chips: Inline pills showing project name, phase
   - Remove button (×) on each chip
   - Chips background: #F3F4F6, hover: #E5E7EB

2. **Project Chip Design**
   - Height: 32px
   - Background: #F3F4F6 (Gray 100)
   - Border: 1px solid #E5E7EB
   - Border-radius: 16px (pill shape)
   - Icon: 🗂️ folder emoji
   - Text: 13px semibold #374151
   - Phase badge: Small text, color coded by BMAD phase
   - Remove (×): 16px, gray, hover: red

3. **Link Project Modal**
   - Width: 480px
   - Title: "Link Page to Project" with 🔗 icon
   - Search input with 🔍 icon
   - Project list: Radio selection
   - Each row: Folder icon, name, phase, team count
   - Selected state: Filled radio, blue background highlight
   - Optional link reason textarea
   - Actions: [Cancel] ghost, [Link to Project] primary coral

4. **Project Search Behavior**
   - Debounced search (300ms)
   - Shows recent projects first
   - Search filters by name
   - Highlights matching text
   - Empty results: "No projects found" with search icon

5. **Project Detail - KB Pages Tab**
   - Tab label: "📚 KB Pages" with page count badge
   - Tab indicator: 2px coral underline when active
   - Page list: Cards with page details
   - Each card shows: title, verified badge, last updated, author, link reason
   - Actions: [Open] to navigate to KB, [Unlink] to remove

6. **Linked Page Card**
   - Background: White
   - Border: 1px solid #E5E7EB
   - Border-radius: 12px
   - Padding: 16px
   - Page icon: 📄
   - Title: 16px semibold
   - Verified badge: ✓ green checkmark + "Verified" text
   - Meta: 12px gray - "Last updated X by [Author]"
   - Link reason: 13px italic gray (if provided)
   - Actions: Ghost buttons, right-aligned

7. **Quick Actions**
   - Three action cards in row
   - Each card: 160px width
   - Icon on left, text description
   - Hover: Lift effect with shadow
   - "Create New Page" - opens KB editor with project pre-linked
   - "Search KB" - opens search filtered to project-related terms
   - "Suggest Pages via Scribe" - invokes Scribe agent

8. **Bidirectional Link Visualization**
   - From KB page: See all linked projects in header
   - From Project: See all linked pages in dedicated tab
   - Links stored in join table with optional reason
   - Both sides can add/remove links

9. **Scribe Suggestions**
   - When "Suggest Pages" clicked, Scribe analyzes:
     - Project name, description, tasks
     - Existing linked pages
   - Returns suggested pages with relevance score
   - User can accept/reject suggestions

10. **Empty State (No Linked Pages)**
    - Illustration: Document connecting to folder
    - Text: "No pages linked yet"
    - Subtext: "Link relevant knowledge base pages to this project"
    - Primary action: [+ Link Page] button

### Style Notes

- Use consistent project iconography (🗂️ folder or custom SVG)
- Phase badges use BMAD phase colors (see PM-17 for phase color spec)
- Verified badge always visible on verified pages
- Link reasons are optional but encouraged for context
- Transitions: 150ms for hover states, 200ms for modal open/close

---

## KB-09: Presence Cursors

**File:** `kb-presence-cursors.excalidraw`
**Priority:** P2 (Medium)
**Goal:** Design real-time multi-user editing experience with visible cursors, selections, and typing indicators powered by Yjs/Hocuspocus.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EDITOR HEADER WITH PRESENCE BAR                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 📄 Deployment Runbook                    ┌──────────────────────────┐   ││
│  │                                          │ 👤👤👤 3 editing • Saved ✓│   ││
│  │                                          └──────────────────────────┘   ││
│  │                                                                          ││
│  │ PRESENCE AVATARS (expanded on hover)                                     ││
│  │ ┌────────────────────────────────────────────────────────────────────┐  ││
│  │ │  🔵 Sarah Chen (you)    🟢 John Martinez    🟣 Maya Johnson        │  ││
│  │ │  Editing                 At line 42          Viewing                │  ││
│  │ └────────────────────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  EDITOR CONTENT WITH CURSORS                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  # Deployment Process                                                    ││
│  │                                                                          ││
│  │  The deployment process involves several critical steps that             ││
│  │  must be followed carefully to ensure a successful release.              ││
│  │                                                                          ││
│  │  ## Prerequisites                                                        ││
│  │                                                                          ││
│  │  Before starting the deployment, ensure that:│                           ││
│  │                                              └──┬──┘                     ││
│  │                                                 │                        ││
│  │                                    ┌────────────┴────────────┐           ││
│  │                                    │ 🟢 John Martinez        │           ││
│  │                                    │    typing...            │           ││
│  │                                    └─────────────────────────┘           ││
│  │                                                                          ││
│  │  1. All tests are passing in CI                                          ││
│  │  2. The staging environment [████████████████] has been verified         ││
│  │                              └────────┬───────┘                          ││
│  │                    ┌──────────────────┴──────────────────┐               ││
│  │                    │ 🟣 Maya Johnson - selecting text    │               ││
│  │                    └─────────────────────────────────────┘               ││
│  │  3. All stakeholders have approved the release                           ││
│  │                                                                          ││
│  │  ## Deployment Steps                                                     ││
│  │                                                                          ││
│  │  Follow these steps in order:█                                           ││
│  │                              └──┬──┘                                     ││
│  │                                 │                                        ││
│  │                    ┌────────────┴────────────┐                           ││
│  │                    │ 🔵 You                  │                           ││
│  │                    │    (your cursor)        │                           ││
│  │                    └─────────────────────────┘                           ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  CURSOR LABEL VARIANTS                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  VARIANT 1: Cursor with flag label                                       ││
│  │  ┌─────────────────┐                                                     ││
│  │  │ Sarah Chen      │←── Flag pointing to cursor                          ││
│  │  └────────┬────────┘                                                     ││
│  │           █ ←── Blinking cursor (user's color)                           ││
│  │                                                                          ││
│  │  VARIANT 2: Cursor with inline label (fades after 3s)                    ││
│  │           █ John ←── Compact label, same color                           ││
│  │                                                                          ││
│  │  VARIANT 3: Selection highlight                                          ││
│  │  ██████████████████ ←── User's color at 30% opacity                      ││
│  │        └── Maya     ←── Label at end of selection                        ││
│  │                                                                          ││
│  │  VARIANT 4: Typing indicator                                             ││
│  │           █ John •••  ←── Animated dots while typing                     ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Elements

1. **Presence Bar (Header)**
   - Location: Right side of editor header
   - Shows: Avatar stack + "X editing" text + sync status
   - Avatars: 28px circular, stacked with -8px overlap
   - Max visible: 3 avatars, then "+N" indicator
   - Border: 2px solid white for separation
   - Click expands to show full presence list

2. **Expanded Presence Panel**
   - Dropdown below avatar stack
   - Width: 280px
   - Shows all connected users
   - Each row: Color dot, name, status (Editing/Viewing/At line X)
   - Your entry marked with "(you)"
   - Real-time update as users join/leave

3. **User Color Assignment**
   - Colors assigned from predefined palette on join:
     - Coral (#FF6B6B)
     - Emerald (#10B981)
     - Violet (#8B5CF6)
     - Amber (#F59E0B)
     - Cyan (#06B6D4)
     - Pink (#EC4899)
   - Color persists for session
   - Colors recycle when users leave

4. **Remote Cursor Design**
   - Cursor line: 2px wide, user's color
   - Height: Line height of text
   - Blink animation: 530ms on, 530ms off (CSS animation)
   - Cursor flag: Above cursor, pointing down
   - Flag background: User's color
   - Flag text: 11px white, user's first name

5. **Cursor Flag Behavior**
   - Appears when cursor moves
   - Fades after 3 seconds of inactivity
   - Reappears on any cursor activity
   - Position: Above and to the right of cursor
   - Border-radius: 4px
   - Padding: 4px 8px

6. **Selection Highlight**
   - Background: User's color at 30% opacity
   - Stacks correctly with multiple selections
   - Label: Shown at end of selection
   - Label design: Small pill with user's name
   - Multiple users selecting same text: Show both colors

7. **Typing Indicator**
   - Shown next to cursor when user is actively typing
   - Three animated dots (•••)
   - Animation: Bounce sequence, 1.4s loop
   - Disappears 1 second after typing stops
   - Alternative: Show "typing..." text

8. **Your Own Cursor**
   - Standard browser cursor (no custom styling)
   - No label needed for your own cursor
   - Selection uses standard browser blue or system accent

9. **Presence Status Icons**
   - 🟢 Editing (has cursor in doc)
   - 👁️ Viewing (reading, no cursor)
   - 💤 Idle (no activity 5+ minutes)
   - Away indicator after 10 minutes inactive

10. **Connection Status**
    - "Saved ✓" - All changes synced
    - "Saving..." - Changes being synced
    - "Offline" - Red dot, reconnection pending
    - "Reconnecting..." - With spinner
    - Yjs handles offline edits, merge on reconnect

### Style Notes

- Cursor colors should have good contrast on both light and dark backgrounds
- Use Yjs awareness API for presence state
- Cursor positions update at 50-100ms intervals (configurable)
- Debounce typing indicator to prevent flicker
- Implement smooth cursor movement (animate between positions)
- Consider reduced motion preference for animations

---

## KB-10: Scribe Panel

**File:** `kb-scribe-panel.excalidraw`
**Priority:** P2 (Medium)
**Goal:** Design the Scribe agent assistance panel that provides AI-powered suggestions for KB content including summarization, related content, stale detection, and writing improvements.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EDITOR WITH SCRIBE PANEL                                                    │
│                                                                              │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │                                  │  │ 📝 SCRIBE                [−] [×] │ │
│  │                                  │  │ ─────────────────────────────── │ │
│  │                                  │  │                                  │ │
│  │      PAGE EDITOR CONTENT         │  │ 👋 Hi! I'm Scribe, your KB      │ │
│  │                                  │  │    assistant. How can I help?   │ │
│  │                                  │  │                                  │ │
│  │                                  │  │ ─────────────────────────────── │ │
│  │                                  │  │                                  │ │
│  │                                  │  │ 💡 SUGGESTIONS FOR THIS PAGE     │ │
│  │                                  │  │                                  │ │
│  │                                  │  │ ┌────────────────────────────┐  │ │
│  │                                  │  │ │ 📊 Generate Summary         │  │ │
│  │                                  │  │ │ Create an executive summary │  │ │
│  │                                  │  │ │ of this page's key points   │  │ │
│  │                                  │  │ │                    [Apply]  │  │ │
│  │                                  │  │ └────────────────────────────┘  │ │
│  │                                  │  │                                  │ │
│  │                                  │  │ ┌────────────────────────────┐  │ │
│  │                                  │  │ │ 🔗 Add Related Pages        │  │ │
│  │                                  │  │ │ Found 3 pages that might   │  │ │
│  │                                  │  │ │ be relevant to link         │  │ │
│  │                                  │  │ │                   [Review]  │  │ │
│  │                                  │  │ └────────────────────────────┘  │ │
│  │                                  │  │                                  │ │
│  │                                  │  │ ┌────────────────────────────┐  │ │
│  │                                  │  │ │ ⚠️ Content May Be Stale     │  │ │
│  │                                  │  │ │ This page hasn't been      │  │ │
│  │                                  │  │ │ updated in 45 days          │  │ │
│  │                                  │  │ │            [Review] [OK]   │  │ │
│  │                                  │  │ └────────────────────────────┘  │ │
│  │                                  │  │                                  │ │
│  │                                  │  │ ─────────────────────────────── │ │
│  │                                  │  │                                  │ │
│  │                                  │  │ 🎯 QUICK ACTIONS                 │ │
│  │                                  │  │                                  │ │
│  │                                  │  │ [✍️ Improve Writing]             │ │
│  │                                  │  │ [📋 Format as List]              │ │
│  │                                  │  │ [🏷️ Suggest Tags]                │ │
│  │                                  │  │ [📝 Generate Table of Contents]  │ │
│  │                                  │  │                                  │ │
│  │                                  │  │ ─────────────────────────────── │ │
│  │                                  │  │                                  │ │
│  │                                  │  │ 💬 ASK SCRIBE                    │ │
│  │                                  │  │ ┌────────────────────────────┐  │ │
│  │                                  │  │ │ How can I improve this...  │  │ │
│  │                                  │  │ └────────────────────────────┘  │ │
│  │                                  │  │                         [Send]  │ │
│  │                                  │  │                                  │ │
│  └──────────────────────────────────┘  └──────────────────────────────────┘ │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  SUGGESTION DETAIL MODAL                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                              [×]         ││
│  │  🔗 Related Pages Found                                                  ││
│  │                                                                          ││
│  │  Scribe found these pages that might be relevant to "Deployment         ││
│  │  Runbook":                                                               ││
│  │                                                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │ ☑️  📄 CI/CD Pipeline Guide                                      │    ││
│  │  │     Relevance: 92% • Mentions: "deployment", "pipeline"          │    ││
│  │  │     "Comprehensive guide to our CI/CD setup..."                  │    ││
│  │  ├─────────────────────────────────────────────────────────────────┤    ││
│  │  │ ☑️  📄 Staging Environment Setup                                 │    ││
│  │  │     Relevance: 87% • Mentions: "staging", "environment"          │    ││
│  │  │     "How to configure and use the staging..."                    │    ││
│  │  ├─────────────────────────────────────────────────────────────────┤    ││
│  │  │ ☐  📄 Release Notes Template                                     │    ││
│  │  │     Relevance: 68% • Mentions: "release"                         │    ││
│  │  │     "Template for writing release notes..."                      │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  │                                                                          ││
│  │  How to add:                                                             ││
│  │  ○ Add as backlinks (related pages section)                              ││
│  │  ● Add as inline references (in text where relevant)                     ││
│  │                                                                          ││
│  │                                          [Cancel]  [Add 2 Selected]      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Elements

1. **Scribe Panel Container**
   - Position: Right sidebar, 320px width
   - Background: White (#FFFFFF)
   - Border-left: 1px solid #E5E7EB
   - Header: Scribe icon (📝), name, minimize/close buttons
   - Header background: Teal (#20B2AA) at 10% opacity
   - Scrollable content area

2. **Scribe Identity Header**
   - Icon: 📝 emoji or custom quill illustration
   - Name: "SCRIBE" in caps, 14px semibold
   - Color accent: Teal (#20B2AA)
   - Greeting: Friendly, first-person voice
   - Minimize button: Collapses to icon-only strip

3. **Suggestions Section**
   - Section header: "💡 SUGGESTIONS FOR THIS PAGE"
   - Suggestion cards: White background, teal left border
   - Each card has: Icon, title, description, action button
   - Cards are generated based on page analysis
   - Dismiss (×) on each card
   - Cards animate in with subtle fade

4. **Suggestion Card Types**
   - **Generate Summary**: 📊 icon, creates executive summary
   - **Add Related Pages**: 🔗 icon, shows found connections
   - **Content Stale Warning**: ⚠️ icon, amber accent
   - **Improve Writing**: ✍️ icon, grammar/style fixes
   - **Add Table of Contents**: 📝 icon, auto-generate TOC
   - **Link to Tasks**: ✅ icon, connect to PM tasks

5. **Quick Actions Grid**
   - Section header: "🎯 QUICK ACTIONS"
   - Button list: Full-width buttons, stacked
   - Icon + label on each button
   - Hover: Subtle background highlight
   - Actions execute immediately or open detail modal

6. **Ask Scribe Input**
   - Section header: "💬 ASK SCRIBE"
   - Text input: "How can I improve this..."
   - Send button: Right aligned
   - Supports natural language queries
   - Response appears below input

7. **Stale Content Warning**
   - Triggered: Page not updated in 30+ days
   - Card shows: Days since update, warning icon
   - Actions: [Review] opens page for editing, [OK] dismisses
   - Can configure stale threshold in settings
   - Scribe can analyze if content is still accurate

8. **Related Pages Modal**
   - Shows pages Scribe found as potentially related
   - Each page: Checkbox, title, relevance %, matched terms
   - Preview snippet from each page
   - Selection mode: Backlinks vs inline references
   - Apply adds selected pages to Related section

9. **Writing Improvement Flow**
   - Scribe analyzes page content
   - Shows list of suggestions: typos, clarity, formatting
   - Each suggestion: Original → Suggested change
   - Accept/reject each suggestion
   - Bulk accept all button

10. **Panel States**
    - **Default**: Full sidebar visible
    - **Minimized**: Collapsed to 48px strip with 📝 icon
    - **Hidden**: Completely hidden, toggle in toolbar
    - **Loading**: Skeleton UI while analyzing
    - **Empty**: "No suggestions right now" message

### Style Notes

- Scribe's voice: Helpful, not intrusive, asks before making changes
- Suggestion cards use subtle animations (fade in, slide)
- All AI actions are reversible/undoable
- Show confidence levels on suggestions where applicable
- Rate limit suggestions to avoid overwhelming users
- Teal accent (#20B2AA) for all Scribe-related UI elements

---

## KB-11: Embed Blocks

**File:** `kb-embed-blocks.excalidraw`
**Priority:** P2 (Medium)
**Goal:** Design the embed block system for KB pages including diagrams (Excalidraw), tables, task lists, code blocks, and other rich content types.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SLASH COMMAND MENU FOR EMBEDS                                               │
│                                                                              │
│  Text content here...                                                        │
│  /                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🔍 Search or type a command...                                          ││
│  │                                                                          ││
│  │ BASIC BLOCKS                                                             ││
│  │ ├─ 📝 Text           Plain text block                                   ││
│  │ ├─ 📋 Heading        Section heading (H1-H3)                            ││
│  │ └─ 📃 List           Bulleted, numbered, or todo                        ││
│  │                                                                          ││
│  │ EMBEDS              ← HIGHLIGHTED SECTION                                ││
│  │ ├─ 📊 Table          Create a data table                     ← ACTIVE   ││
│  │ ├─ ✅ Task List       Checkable task items                               ││
│  │ ├─ 🎨 Diagram        Excalidraw drawing                                  ││
│  │ ├─ 💻 Code Block     Syntax-highlighted code                             ││
│  │ ├─ 📸 Image          Upload or embed image                               ││
│  │ ├─ 🔗 Bookmark       Link preview card                                   ││
│  │ └─ 📁 File           Attach a file                                       ││
│  │                                                                          ││
│  │ INTEGRATIONS                                                             ││
│  │ ├─ 🎯 Task Reference  Link to PM task                                    ││
│  │ └─ 📄 Page Embed      Embed another KB page                              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  EMBED BLOCK: TABLE                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ [⋮⋮] Table                                            [−] [⚙️] [×]      ││
│  │ ─────────────────────────────────────────────────────────────────────── ││
│  │                                                                          ││
│  │ ┌──────────────┬──────────────┬──────────────┬──────────────┐           ││
│  │ │ Name         │ Status       │ Assigned     │ Due Date     │  [+ Col] ││
│  │ ├──────────────┼──────────────┼──────────────┼──────────────┤           ││
│  │ │ Task A       │ ● In Prog    │ Sarah        │ Dec 20       │           ││
│  │ ├──────────────┼──────────────┼──────────────┼──────────────┤           ││
│  │ │ Task B       │ ● Done       │ John         │ Dec 18       │           ││
│  │ ├──────────────┼──────────────┼──────────────┼──────────────┤           ││
│  │ │ Task C       │ ○ Todo       │ Maya         │ Dec 25       │           ││
│  │ └──────────────┴──────────────┴──────────────┴──────────────┘           ││
│  │                                                           [+ Row]        ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  EMBED BLOCK: EXCALIDRAW DIAGRAM                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ [⋮⋮] Diagram                                          [✏️] [⤢] [×]     ││
│  │ ─────────────────────────────────────────────────────────────────────── ││
│  │                                                                          ││
│  │ ┌─────────────────────────────────────────────────────────────────────┐ ││
│  │ │                                                                      │ ││
│  │ │                    ┌─────────┐                                       │ ││
│  │ │                    │ Server  │                                       │ ││
│  │ │                    └────┬────┘                                       │ ││
│  │ │                         │                                            │ ││
│  │ │              ┌──────────┼──────────┐                                 │ ││
│  │ │              ▼          ▼          ▼                                 │ ││
│  │ │         ┌────────┐ ┌────────┐ ┌────────┐                             │ ││
│  │ │         │ DB     │ │ Cache  │ │ Queue  │                             │ ││
│  │ │         └────────┘ └────────┘ └────────┘                             │ ││
│  │ │                                                                      │ ││
│  │ └─────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                          ││
│  │ Click to edit • Last edited by Sarah, 2 hours ago                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  EMBED BLOCK: CODE                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ [⋮⋮] Code                              [TypeScript ▾] [📋 Copy] [×]     ││
│  │ ─────────────────────────────────────────────────────────────────────── ││
│  │ ┌─────────────────────────────────────────────────────────────────────┐ ││
│  │ │  1 │ async function deployApplication(config: DeployConfig) {      │ ││
│  │ │  2 │   const { environment, version } = config;                    │ ││
│  │ │  3 │                                                               │ ││
│  │ │  4 │   // Validate configuration                                   │ ││
│  │ │  5 │   if (!isValidEnvironment(environment)) {                     │ ││
│  │ │  6 │     throw new Error(`Invalid environment: ${environment}`);   │ ││
│  │ │  7 │   }                                                           │ ││
│  │ │  8 │                                                               │ ││
│  │ │  9 │   return await deploy(environment, version);                  │ ││
│  │ │ 10 │ }                                                             │ ││
│  │ └─────────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  EMBED BLOCK: TASK LIST                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ [⋮⋮] Task List                                                [×]      ││
│  │ ─────────────────────────────────────────────────────────────────────── ││
│  │                                                                          ││
│  │  ☑️ Set up CI/CD pipeline                                    ✓ Done     ││
│  │  ☑️ Configure staging environment                            ✓ Done     ││
│  │  ☐ Run integration tests                                     ○ Todo     ││
│  │  ☐ Deploy to production                                      ○ Todo     ││
│  │  ☐ Monitor metrics for 24 hours                              ○ Todo     ││
│  │                                                                          ││
│  │  [+ Add task]                                                            ││
│  │                                                                          ││
│  │  Progress: 2 of 5 complete                        ▓▓▓▓▓▓▓░░░░░░░ 40%    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Elements

1. **Slash Command Menu**
   - Triggered by typing "/" in editor
   - Fuzzy search for commands
   - Categorized: Basic Blocks, Embeds, Integrations
   - Keyboard navigation: Arrow keys + Enter
   - Shows shortcut hints (e.g., "/table")
   - Max height: 400px, scrollable

2. **Embed Block Container (Shared)**
   - Drag handle: [⋮⋮] on left for reordering
   - Block type label: Icon + name
   - Action buttons: Edit, Fullscreen, Settings, Delete
   - Selection state: Coral border when selected
   - Hover state: Light gray background (#F9FAFB)

3. **Table Block**
   - Header row: Bold text, gray background (#F3F4F6)
   - Cell editing: Click to edit inline
   - Add column: [+ Col] button on right
   - Add row: [+ Row] button below
   - Column resize: Drag borders
   - Column menu: Sort, Hide, Delete
   - Minimum dimensions: 2×2

4. **Excalidraw Diagram Block**
   - Preview mode: Shows diagram render
   - Edit button: Opens Excalidraw editor
   - Fullscreen button: Expands to modal
   - Footer: "Click to edit" hint, last editor info
   - Collaborative: Multiple users can edit
   - Export: PNG, SVG options in menu

5. **Code Block**
   - Language selector dropdown (100+ languages)
   - Syntax highlighting (Shiki or Prism)
   - Line numbers: Optional, on by default
   - Copy button: Copies code to clipboard
   - Wrap lines toggle in settings
   - Dark theme option
   - Font: JetBrains Mono or similar monospace

6. **Task List Block**
   - Checkbox: Custom styled, coral when checked
   - Strike-through on completed items
   - Drag to reorder tasks
   - Add task input at bottom
   - Progress bar showing completion %
   - Syncs with PM tasks if linked

7. **Image Block**
   - Upload: Drag-drop or file picker
   - Embed: Paste URL
   - Resize handles on corners
   - Caption field below image
   - Alt text in settings
   - Lazy loading for performance

8. **Bookmark Block**
   - Paste URL to create
   - Fetches: Title, description, favicon, image
   - Link card style: Image left, content right
   - Click opens URL in new tab
   - Edit to change URL

9. **Task Reference Block**
   - Search PM tasks by name or ID
   - Shows: Task title, status, assignee
   - Click navigates to task in PM
   - Real-time status sync
   - Color-coded by task status

10. **Page Embed Block**
    - Search KB pages by title
    - Shows: Page title, excerpt, last updated
    - Two modes: Summary card or full embed
    - Click navigates to full page
    - Real-time content sync

### Style Notes

- All blocks have consistent container styling
- Drag handles use 6-dot grid icon
- Delete confirms before removing (unless empty)
- Undo available for all block operations (Cmd/Ctrl+Z)
- Blocks support copy/paste between pages
- Mobile: Blocks stack vertically, full width

---

## KB-12: Page Templates

**File:** `kb-templates.excalidraw`
**Priority:** P2 (Medium)
**Goal:** Design the template gallery for creating new KB pages with pre-built structures for common documentation needs.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CREATE NEW PAGE MODAL                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                              [×]         ││
│  │  📄 Create New Page                                                      ││
│  │                                                                          ││
│  │  Page Title                                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │ Untitled                                                        │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  │                                                                          ││
│  │  Parent Page (optional)                                                  ││
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │ 🔍 Search pages...                              [Root ▾]        │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  │                                                                          ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                          ││
│  │  Choose a Template                                                       ││
│  │                                                                          ││
│  │  ┌───────────────────────┐  CATEGORIES                                   ││
│  │  │ 🔍 Search templates   │  [All] [Project] [Meeting] [Process] [Dev]   ││
│  │  └───────────────────────┘                                               ││
│  │                                                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  FEATURED TEMPLATES                                                  │││
│  │  │                                                                      │││
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │││
│  │  │  │  📄         │ │  📋         │ │  📊         │ │  🎯         │   │││
│  │  │  │             │ │             │ │             │ │             │   │││
│  │  │  │ Blank       │ │ Meeting     │ │ Project     │ │ Technical   │   │││
│  │  │  │ Page        │ │ Notes       │ │ Charter     │ │ Spec        │   │││
│  │  │  │             │ │             │ │             │ │             │   │││
│  │  │  │ Start fresh │ │ Agenda,     │ │ Goals,      │ │ Overview,   │   │││
│  │  │  │             │ │ attendees   │ │ milestones  │ │ requirements│   │││
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │││
│  │  │                                                                      │││
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │││
│  │  │  │  📚         │ │  🔧         │ │  📝         │ │  🚀         │   │││
│  │  │  │             │ │             │ │             │ │             │   │││
│  │  │  │ API         │ │ Runbook     │ │ Decision    │ │ Release     │   │││
│  │  │  │ Reference   │ │             │ │ Record      │ │ Notes       │   │││
│  │  │  │             │ │             │ │             │ │             │   │││
│  │  │  │ Endpoints,  │ │ Steps,      │ │ Context,    │ │ Features,   │   │││
│  │  │  │ schemas     │ │ troubleshoot│ │ options     │ │ fixes       │   │││
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │││
│  │  │                                                                      │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │                                                                          ││
│  │                                      [Cancel]  [Create Page]             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  TEMPLATE PREVIEW (on hover/click)                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  📋 Meeting Notes                                           [Use This] ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  # Meeting: [Topic]                                                  │││
│  │  │                                                                      │││
│  │  │  **Date:** [Date]                                                    │││
│  │  │  **Attendees:** @mention participants                                │││
│  │  │  **Facilitator:** @mention                                           │││
│  │  │                                                                      │││
│  │  │  ---                                                                 │││
│  │  │                                                                      │││
│  │  │  ## Agenda                                                           │││
│  │  │  1. Topic 1                                                          │││
│  │  │  2. Topic 2                                                          │││
│  │  │                                                                      │││
│  │  │  ## Discussion Notes                                                 │││
│  │  │  - Key point                                                         │││
│  │  │                                                                      │││
│  │  │  ## Action Items                                                     │││
│  │  │  - [ ] Action for @person                                            │││
│  │  │                                                                      │││
│  │  │  ## Next Steps                                                       │││
│  │  │  - Follow-up meeting: [Date]                                         │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │                                                                          ││
│  │  Includes: Heading placeholders, @mention fields, task checklist         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│  TEMPLATE MANAGEMENT (Settings)                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  📁 TEMPLATE LIBRARY                                    [+ New Template]││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                          ││
│  │  WORKSPACE TEMPLATES                                                     ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  📋 Weekly Status Report                              [Edit] [⋮]    │││
│  │  │      Custom • Created by Sarah Chen                                  │││
│  │  ├─────────────────────────────────────────────────────────────────────┤││
│  │  │  🔧 Service Incident Report                           [Edit] [⋮]    │││
│  │  │      Custom • Created by John Martinez                               │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │                                                                          ││
│  │  BUILT-IN TEMPLATES                                                      ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  📄 Blank Page                                            [View]    │││
│  │  │  📋 Meeting Notes                                         [View]    │││
│  │  │  📊 Project Charter                                       [View]    │││
│  │  │  🎯 Technical Spec                                        [View]    │││
│  │  │  📚 API Reference                                         [View]    │││
│  │  │  🔧 Runbook                                               [View]    │││
│  │  │  📝 Decision Record (ADR)                                 [View]    │││
│  │  │  🚀 Release Notes                                         [View]    │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Elements

1. **Create New Page Modal**
   - Width: 640px
   - Title input at top (auto-focused)
   - Parent page selector (optional, for hierarchy)
   - Template grid below
   - Actions: [Cancel] ghost, [Create Page] primary coral

2. **Template Search & Filters**
   - Search input with 🔍 icon
   - Category pills: All, Project, Meeting, Process, Dev
   - Active filter: Coral background, white text
   - Inactive filter: Gray background
   - Filter counts shown in parentheses

3. **Template Card Grid**
   - Grid: 4 columns on desktop, 2 on tablet, 1 on mobile
   - Card size: 140px × 160px
   - Card contains: Large icon, name, brief description
   - Hover state: Coral border, slight lift
   - Selected state: Coral border, checkmark overlay

4. **Template Card Design**
   - Background: White (#FFFFFF)
   - Border: 1px solid #E5E7EB
   - Border-radius: 12px
   - Padding: 16px
   - Icon: 32px emoji or custom illustration
   - Title: 14px semibold, centered
   - Description: 12px gray, 2 lines max

5. **Template Preview Panel**
   - Opens on card click (or hover on desktop)
   - Shows: Full template name, preview of content
   - Content preview: Scrollable, read-only
   - "Includes" section: Lists template features
   - [Use This] button to select and apply

6. **Placeholder Syntax**
   - `[Topic]` - Text placeholder, shows hint
   - `@mention` - User mention field
   - `[Date]` - Date picker trigger
   - `- [ ]` - Task checkbox
   - Templates use markdown with smart fields

7. **Built-in Templates**
   - **Blank Page**: Empty, just title field
   - **Meeting Notes**: Date, attendees, agenda, action items
   - **Project Charter**: Goals, scope, milestones, risks
   - **Technical Spec**: Overview, requirements, design, API
   - **API Reference**: Endpoint table, schemas, examples
   - **Runbook**: Procedure steps, troubleshooting, rollback
   - **Decision Record (ADR)**: Context, options, decision, consequences
   - **Release Notes**: Version, features, fixes, breaking changes

8. **Custom Template Creation**
   - [+ New Template] opens editor
   - Start from blank or duplicate built-in
   - Define: Name, icon, category, description
   - Edit content with all KB block types
   - Save to workspace templates

9. **Template Management**
   - Access from KB settings or template modal
   - Workspace templates: Full control (edit, delete)
   - Built-in templates: View-only (can duplicate)
   - Template usage analytics (optional)
   - Template versioning for updates

10. **Template Application**
    - On create: Copies template content to new page
    - Replaces placeholders with smart fields
    - Positions cursor at first editable field
    - Shows "Created from [Template Name]" toast

### Style Notes

- Template icons use emojis for consistency and ease
- Preview panel matches actual KB page styling
- Category filters are scrollable on mobile
- Templates support all embed block types
- Encourage teams to create custom templates
- Scribe can suggest templates based on page title

---

## Next Batch

**BATCH-14:** Core-PM Wireframe Updates & New Features
- PM-02: Project Detail Overview (UPDATE)
- PM-05: Task Detail Modal (UPDATE)
- PM-08: Files & Documents (UPDATE)
- PM-09: Team & Permissions (UPDATE)
- PM-14: Project Templates (UPDATE)
- PM-17: BMAD Phase View (NEW)
- PM-18: Agent Team Panel (NEW)
- PM-19: Hybrid Assignment (NEW)
- PM-20: Planning Poker (NEW)

---

_End of BATCH-13: Core-PM Knowledge Base Wireframes (Part 2)_
