# Epic KB-01: Knowledge Base Foundation - Technical Specification

**Epic:** KB-01 - Knowledge Base Foundation
**FRs Covered:** KB-F1, KB-F2, KB-F3
**Stories:** 10 (KB-01.1 to KB-01.10)
**Created:** 2025-12-17
**Status:** Technical Context

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Integration Points](#integration-points)
7. [Technical Decisions](#technical-decisions)
8. [File Structure](#file-structure)
9. [Story Implementation Guide](#story-implementation-guide)
10. [Testing Strategy](#testing-strategy)

---

## Overview

### Epic Goal

Enable users to create wiki pages, organize them hierarchically, and link them to projects. This provides the foundation for the Knowledge Base system that will support RAG-powered search and AI agent context in Phase 2.

### Scope

**In Scope (Phase 1/MVP):**
- KB page CRUD with Tiptap rich text editor
- Hierarchical page organization (parent-child relationships)
- Version history with restore capability
- Auto-save with unsaved changes detection
- Collapsible page tree navigation with drag-drop reordering
- Breadcrumb navigation
- Full-text search using PostgreSQL tsvector
- Recent pages and favorites
- Project-to-KB page linking (many-to-many)
- Project Docs tab showing linked pages

**Out of Scope (Phase 2+):**
- Real-time collaboration (Yjs/Hocuspocus)
- RAG/semantic search with embeddings
- Verified content system
- @mentions and #task references
- Scribe agent for KB management

### Dependencies

- Existing PM-01 implementation (Project model, API patterns)
- Tiptap editor library
- PostgreSQL full-text search (tsvector)
- Event bus for KB events

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Knowledge Base (Phase 1)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Frontend (Next.js)                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  KB Routes                                                            │  │
│   │  • /kb                    - KB Home (recent, favorites)              │  │
│   │  • /kb/search             - Search results                            │  │
│   │  • /kb/new                - Create new page                           │  │
│   │  • /kb/[pageSlug]         - Page view/edit                            │  │
│   │  • /kb/[pageSlug]/history - Version history                           │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Components                                                           │  │
│   │  • KBHome                 - Home dashboard                            │  │
│   │  • PageTree               - Hierarchical sidebar                      │  │
│   │  • PageEditor             - Tiptap editor with auto-save             │  │
│   │  • PageHeader             - Breadcrumbs, actions, metadata           │  │
│   │  • VersionHistory         - Version list and restore                  │  │
│   │  • SearchResults          - FTS results with snippets                │  │
│   │  • ProjectDocsTab         - Linked pages in project view             │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Backend (NestJS)                                                           │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  API Module: apps/api/src/kb/                                        │  │
│   │  • kb.module.ts           - Module definition                         │  │
│   │  • pages/                                                             │  │
│   │    ├── pages.service.ts   - Page CRUD, FTS, tree operations         │  │
│   │    ├── pages.controller.ts - REST endpoints                          │  │
│   │    └── dto/               - Request/response validation              │  │
│   │  • versions/                                                          │  │
│   │    ├── versions.service.ts - Version snapshots, restore             │  │
│   │    ├── versions.controller.ts - Version endpoints                    │  │
│   │  • search/                                                            │  │
│   │    ├── search.service.ts  - FTS implementation                       │  │
│   │    ├── search.controller.ts - Search endpoints                       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Data Layer (Prisma + PostgreSQL)                                          │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Models: packages/db/prisma/schema.prisma                            │  │
│   │  • KnowledgePage          - Main page model                          │  │
│   │  • PageVersion            - Version snapshots                         │  │
│   │  • ProjectPage            - Many-to-many join (Project ↔ Page)      │  │
│   │  • PageActivity           - Activity log                              │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Creating a Page

```
User clicks "New Page" in KB
         ↓
Frontend: POST /api/kb/pages { title, parentId }
         ↓
Backend: PagesService.create()
  1. Generate unique slug from title
  2. Create KnowledgePage record
  3. Create initial PageVersion (v1)
  4. Create PageActivity (CREATED)
  5. Publish kb.page.created event
         ↓
Frontend: Navigate to /kb/[pageSlug]
  → Load PageEditor component
  → User types content
  → Auto-save every 2 seconds (debounced)
         ↓
Frontend: PATCH /api/kb/pages/:id { content }
         ↓
Backend: PagesService.update()
  1. Update content JSON
  2. Extract plain text → contentText
  3. Create PageVersion on manual save
  4. Update updatedAt timestamp
  5. Publish kb.page.updated event
```

### Data Flow: Full-Text Search

```
User types in search box
         ↓
Frontend: GET /api/kb/search?q=deployment
         ↓
Backend: SearchService.search()
  1. Build PostgreSQL FTS query with tsvector
  2. Rank by ts_rank relevance
  3. Generate highlighted snippets (ts_headline)
  4. Filter by workspace/deleted status
  5. Return top 20 results
         ↓
Frontend: Display SearchResults component
  → Page title (clickable)
  → Highlighted snippet with <mark> tags
  → Last updated timestamp
  → Click → navigate to /kb/[pageSlug]
```

---

## Data Models

### Prisma Schema Additions

Add the following models to `packages/db/prisma/schema.prisma`:

```prisma
// ============================================
// KNOWLEDGE BASE (KB-01)
// ============================================

/// KnowledgePage - Wiki page with hierarchical organization
model KnowledgePage {
  id          String @id @default(cuid())
  workspaceId String @map("workspace_id")

  // Hierarchy
  parentId String? @map("parent_id")

  // Content
  title       String
  slug        String @db.VarChar(255)
  content     Json   // Tiptap/ProseMirror JSON structure
  contentText String @db.Text // Plain text extracted for FTS

  // Ownership
  ownerId String @map("owner_id") // User who created the page

  // Analytics
  viewCount    Int       @default(0) @map("view_count")
  lastViewedAt DateTime? @map("last_viewed_at")

  // Favorites (stored as JSON array of user IDs for MVP)
  // In Phase 2, move to separate UserFavorite table
  favoritedBy String[] @default([]) @map("favorited_by")

  // Timestamps
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at") // Soft delete (30-day recovery)

  // Relations
  parent     KnowledgePage?  @relation("PageHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children   KnowledgePage[] @relation("PageHierarchy")
  versions   PageVersion[]
  projects   ProjectPage[]
  activities PageActivity[]

  @@unique([workspaceId, slug])
  @@index([workspaceId])
  @@index([parentId])
  @@index([ownerId])
  @@index([deletedAt])
  @@index([updatedAt])
  // Full-text search index created via migration:
  // CREATE INDEX idx_page_fts ON "knowledge_pages" USING GIN (to_tsvector('english', content_text));
  @@map("knowledge_pages")
}

/// PageVersion - Version history snapshots
model PageVersion {
  id      String @id @default(cuid())
  pageId  String @map("page_id")
  version Int    // Sequential version number (1, 2, 3, ...)

  // Snapshot
  content     Json   // Content at this version
  contentText String @db.Text // Plain text at this version

  // Metadata
  changeNote  String? @db.VarChar(500) // Optional change description
  createdById String  @map("created_by_id")
  createdAt   DateTime @default(now()) @map("created_at")

  page KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@unique([pageId, version])
  @@index([pageId])
  @@index([createdAt])
  @@map("page_versions")
}

/// ProjectPage - Many-to-many relationship between projects and KB pages
model ProjectPage {
  id        String @id @default(cuid())
  projectId String @map("project_id")
  pageId    String @map("page_id")

  // Primary doc flag (one page per project can be marked as primary/main doc)
  isPrimary Boolean  @default(false) @map("is_primary")
  linkedBy  String   @map("linked_by") // User who created the link
  createdAt DateTime @default(now()) @map("created_at")

  project Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  page    KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@unique([projectId, pageId])
  @@index([projectId])
  @@index([pageId])
  @@index([isPrimary])
  @@map("project_pages")
}

/// PageActivity - Activity log for KB pages
model PageActivity {
  id     String           @id @default(cuid())
  pageId String           @map("page_id")
  userId String           @map("user_id")
  type   PageActivityType
  data   Json?            // Additional context (e.g., { version: 3, restored: true })

  createdAt DateTime @default(now()) @map("created_at")

  page KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId])
  @@index([userId])
  @@index([type])
  @@index([createdAt])
  @@map("page_activities")
}

// Enums
enum PageActivityType {
  CREATED
  UPDATED
  DELETED
  RESTORED
  VIEWED
  MOVED              // Parent changed
  LINKED_TO_PROJECT
  UNLINKED_FROM_PROJECT
  FAVORITED
  UNFAVORITED
}
```

### Tiptap Content Structure

Content is stored as Tiptap/ProseMirror JSON:

```typescript
interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

interface TiptapNode {
  type: string; // 'paragraph', 'heading', 'bulletList', etc.
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

interface TiptapMark {
  type: string; // 'bold', 'italic', 'link', etc.
  attrs?: Record<string, any>;
}

// Example
const exampleContent: TiptapDocument = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Deployment Guide' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Run ' },
        {
          type: 'text',
          marks: [{ type: 'code' }],
          text: 'npm install'
        },
        { type: 'text', text: ' to install dependencies.' }
      ]
    }
  ]
};
```

Plain text is extracted from JSON for full-text search:

```typescript
function extractPlainText(content: TiptapDocument): string {
  function traverse(node: TiptapNode): string {
    if (node.text) return node.text;
    if (node.content) {
      return node.content.map(traverse).join(' ');
    }
    return '';
  }
  return traverse(content).trim();
}
```

---

## API Endpoints

### Pages Endpoints

```yaml
# Base path: /api/kb/pages

GET /api/kb/pages
  Description: List pages (tree or flat)
  Query params:
    parentId?: string     # Filter by parent (null = root level)
    flat?: boolean        # Return flat list instead of tree
    includeDeleted?: boolean # Include soft-deleted pages
  Response: KnowledgePage[] | PageTreeNode[]

POST /api/kb/pages
  Description: Create new page
  Body:
    title: string
    parentId?: string
    content?: TiptapDocument  # Default: empty doc
  Response: KnowledgePage
  Events: kb.page.created

GET /api/kb/pages/:id
  Description: Get page by ID
  Response: KnowledgePage (with relations: children, projects)
  Side effect: Increment viewCount, update lastViewedAt

PATCH /api/kb/pages/:id
  Description: Update page
  Body:
    title?: string
    content?: TiptapDocument
    parentId?: string
  Response: KnowledgePage
  Events: kb.page.updated
  Note: contentText extracted automatically

DELETE /api/kb/pages/:id
  Description: Soft delete page (sets deletedAt)
  Response: { success: true }
  Events: kb.page.deleted
  Note: 30-day recovery window

POST /api/kb/pages/:id/restore
  Description: Restore soft-deleted page
  Response: KnowledgePage
  Events: kb.page.restored

PATCH /api/kb/pages/:id/move
  Description: Move page to different parent
  Body:
    parentId: string | null
  Response: KnowledgePage
  Events: kb.page.moved

POST /api/kb/pages/:id/favorite
  Description: Add page to user's favorites
  Response: KnowledgePage
  Events: kb.page.favorited

DELETE /api/kb/pages/:id/favorite
  Description: Remove page from favorites
  Response: KnowledgePage
  Events: kb.page.unfavorited
```

### Versions Endpoints

```yaml
# Base path: /api/kb/pages/:pageId/versions

GET /api/kb/pages/:pageId/versions
  Description: List all versions for a page
  Response: PageVersion[]

POST /api/kb/pages/:pageId/versions
  Description: Create version snapshot (manual save)
  Body:
    changeNote?: string
  Response: PageVersion
  Note: Auto-increments version number

GET /api/kb/pages/:pageId/versions/:version
  Description: Get specific version
  Response: PageVersion

POST /api/kb/pages/:pageId/versions/:version/restore
  Description: Restore page to this version
  Response: KnowledgePage (updated to restored content)
  Events: kb.page.updated
  Note: Creates new version after restore
```

### Search Endpoints

```yaml
# Base path: /api/kb/search

GET /api/kb/search
  Description: Full-text search across pages
  Query params:
    q: string             # Search query
    limit?: number        # Default: 20
    offset?: number       # For pagination
  Response: SearchResult[]

interface SearchResult {
  pageId: string;
  title: string;
  slug: string;
  snippet: string;      # Highlighted excerpt with <mark> tags
  rank: number;         # Relevance score from ts_rank
  updatedAt: string;
  path: string[];       # Breadcrumb path to page
}
```

### Project Linking Endpoints

```yaml
# Base path: /api/kb/pages/:pageId/projects

POST /api/kb/pages/:pageId/projects
  Description: Link page to project
  Body:
    projectId: string
    isPrimary?: boolean   # Mark as primary doc for project
  Response: ProjectPage
  Events: kb.page.linked_to_project

DELETE /api/kb/pages/:pageId/projects/:projectId
  Description: Unlink page from project
  Response: { success: true }
  Events: kb.page.unlinked_from_project

GET /api/kb/pages/:pageId/projects
  Description: Get all projects linked to this page
  Response: ProjectPage[] (with project details)
```

### Project Docs Tab

```yaml
# Base path: /api/pm/projects/:projectId/docs

GET /api/pm/projects/:projectId/docs
  Description: Get all KB pages linked to this project
  Response: ProjectPage[] (with page details, primary flag)
```

---

## Frontend Components

### Component Tree

```
apps/web/src/app/kb/
├── layout.tsx              # KB layout with sidebar
├── page.tsx                # KB Home (KBHome component)
├── search/
│   └── page.tsx            # Search results (SearchResults component)
├── new/
│   └── page.tsx            # Create new page form
└── [pageSlug]/
    ├── page.tsx            # Page view/edit (PageEditor component)
    └── history/
        └── page.tsx        # Version history (VersionHistory component)

apps/web/src/components/kb/
├── KBHome.tsx              # Home dashboard with recent and favorites
├── PageTree.tsx            # Hierarchical sidebar navigation
├── PageEditor.tsx          # Tiptap editor with auto-save
├── PageHeader.tsx          # Title, breadcrumbs, actions
├── VersionHistory.tsx      # Version list with restore
├── SearchResults.tsx       # FTS results display
├── ProjectDocsTab.tsx      # Project docs tab content
├── editor/
│   ├── TiptapEditor.tsx    # Core Tiptap editor setup
│   ├── Toolbar.tsx         # Editor toolbar
│   ├── BubbleMenu.tsx      # Floating formatting menu
│   └── extensions/         # Custom Tiptap extensions (Phase 2)
└── tree/
    ├── TreeNode.tsx        # Individual tree node
    ├── TreeDragLayer.tsx   # Drag-drop preview
    └── useTreeDragDrop.ts  # Drag-drop logic hook
```

### Key Components Implementation

#### PageEditor Component

```typescript
// apps/web/src/components/kb/PageEditor.tsx

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Toolbar } from './editor/Toolbar';
import { cn } from '@/lib/utils';

interface PageEditorProps {
  pageId: string;
  initialContent?: any;
  onSave: (content: any) => Promise<void>;
}

export function PageEditor({ pageId, initialContent, onSave }: PageEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
    },
  });

  // Debounced auto-save (2 seconds after typing stops)
  const debouncedSave = useDebounce(async () => {
    if (!editor || !hasUnsavedChanges) return;

    setSaveStatus('saving');
    try {
      await onSave(editor.getJSON());
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('unsaved');
    }
  }, 2000);

  useEffect(() => {
    if (hasUnsavedChanges) {
      debouncedSave();
    }
  }, [editor?.state.doc, hasUnsavedChanges, debouncedSave]);

  // Manual save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editor && hasUnsavedChanges) {
          setSaveStatus('saving');
          onSave(editor.getJSON())
            .then(() => {
              setSaveStatus('saved');
              setHasUnsavedChanges(false);
            })
            .catch((error) => {
              console.error('Manual save failed:', error);
              setSaveStatus('unsaved');
            });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, hasUnsavedChanges, onSave]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar editor={editor} />

      <div className="flex-1 overflow-y-auto p-8">
        <EditorContent
          editor={editor}
          className={cn(
            "prose prose-slate max-w-none",
            "focus:outline-none"
          )}
        />
      </div>

      <div className="flex items-center justify-end px-4 py-2 border-t bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saveStatus === 'saving' && (
            <>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Unsaved changes</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### PageTree Component

```typescript
// apps/web/src/components/kb/PageTree.tsx

'use client';

import { useState } from 'react';
import { ChevronRight, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface PageTreeNode {
  id: string;
  title: string;
  slug: string;
  children: PageTreeNode[];
}

interface PageTreeProps {
  pages: PageTreeNode[];
  currentPageId?: string;
  onMove?: (pageId: string, newParentId: string | null) => void;
}

export function PageTree({ pages, currentPageId, onMove }: PageTreeProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (pageId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const renderNode = (node: PageTreeNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isCurrent = node.id === currentPageId;

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
            isCurrent && "bg-accent font-medium"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-0.5 hover:bg-accent-foreground/10 rounded"
            >
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <span
            onClick={() => router.push(`/kb/${node.slug}`)}
            className="flex-1 truncate text-sm"
          >
            {node.title}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-2 py-2">
        <h3 className="text-sm font-semibold">Pages</h3>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={() => router.push('/kb/new')}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-0.5">
        {pages.map((page) => renderNode(page))}
      </div>
    </div>
  );
}
```

#### SearchResults Component

```typescript
// apps/web/src/components/kb/SearchResults.tsx

'use client';

import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  pageId: string;
  title: string;
  slug: string;
  snippet: string; // HTML string with <mark> tags
  rank: number;
  updatedAt: string;
  path: string[]; // Breadcrumb path
}

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  totalResults: number;
}

export function SearchResults({ query, results, totalResults }: SearchResultsProps) {
  const router = useRouter();

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search query
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.pageId}
            onClick={() => router.push(`/kb/${result.slug}`)}
            className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-1 truncate">
                  {result.title}
                </h3>

                {result.path.length > 0 && (
                  <div className="text-xs text-muted-foreground mb-2">
                    {result.path.join(' › ')}
                  </div>
                )}

                <div
                  className="text-sm text-muted-foreground line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: result.snippet }}
                />
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Integration Points

### Integration with PM Module

1. **ProjectPage Join Table**
   - Many-to-many relationship between Project and KnowledgePage
   - Allows one page to be linked to multiple projects
   - Allows one project to have multiple linked docs
   - `isPrimary` flag marks one page as the main doc for a project

2. **Project Docs Tab**
   - New tab in Project detail page
   - Shows all KB pages linked to the project
   - Primary doc displayed prominently
   - "Link Existing Page" and "Create New Page" actions

3. **Quick Links from Tasks**
   - Task detail panel can link to KB pages (Phase 2)
   - Uses similar pattern to ProjectPage

### Event Bus Integration

KB publishes events that other modules can consume:

```typescript
// Published by KB module
export const KBEvents = {
  PAGE_CREATED: 'kb.page.created',
  PAGE_UPDATED: 'kb.page.updated',
  PAGE_DELETED: 'kb.page.deleted',
  PAGE_RESTORED: 'kb.page.restored',
  PAGE_MOVED: 'kb.page.moved',
  PAGE_LINKED_TO_PROJECT: 'kb.page.linked_to_project',
  PAGE_UNLINKED_FROM_PROJECT: 'kb.page.unlinked_from_project',
  PAGE_FAVORITED: 'kb.page.favorited',
  PAGE_UNFAVORITED: 'kb.page.unfavorited',
} as const;

// Event payload examples
interface KBPageCreatedEvent {
  pageId: string;
  workspaceId: string;
  title: string;
  slug: string;
  ownerId: string;
  parentId: string | null;
}

interface KBPageLinkedEvent {
  pageId: string;
  projectId: string;
  workspaceId: string;
  isPrimary: boolean;
  linkedBy: string;
}
```

### Shared Types

Define shared types in `packages/shared/src/types/kb.ts`:

```typescript
export interface KnowledgePage {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  slug: string;
  content: TiptapDocument;
  contentText: string;
  ownerId: string;
  viewCount: number;
  lastViewedAt: string | null;
  favoritedBy: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PageVersion {
  id: string;
  pageId: string;
  version: number;
  content: TiptapDocument;
  contentText: string;
  changeNote: string | null;
  createdById: string;
  createdAt: string;
}

export interface ProjectPage {
  id: string;
  projectId: string;
  pageId: string;
  isPrimary: boolean;
  linkedBy: string;
  createdAt: string;
}

export interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}
```

---

## Technical Decisions

### ADR-KB-001: Tiptap for Rich Text Editing

**Context:** Need a rich text editor that supports JSON storage, extensibility, and collaborative editing (Phase 2).

**Decision:** Use Tiptap (built on ProseMirror) as the rich text editor.

**Alternatives Considered:**
- Draft.js - Older, less maintained
- Slate.js - Good but less mature ecosystem
- Quill - Limited extensibility
- Tiptap - Modern, extensible, React support, collaboration-ready

**Rationale:**
- JSON-based storage works well with PostgreSQL JSONB
- Headless design allows custom UI
- Built-in extensions for common features
- Phase 2 ready: Yjs collaboration extension available
- Active community and maintenance

**Consequences:**
- (+) Future-proof for Phase 2 collaboration
- (+) Extensible for mentions, references in Phase 2
- (+) JSON storage enables version control
- (-) Learning curve for Tiptap API
- (-) Bundle size (~80KB minified + gzipped)

### ADR-KB-002: PostgreSQL Full-Text Search (FTS)

**Context:** Need search functionality for KB pages. Phase 2 will add semantic search, but MVP needs basic text search.

**Decision:** Use PostgreSQL's built-in full-text search (tsvector, tsquery).

**Alternatives Considered:**
- Elasticsearch - Overkill for MVP, separate infrastructure
- Algolia - SaaS, cost, data privacy concerns
- Client-side search - Poor performance at scale
- PostgreSQL FTS - Built-in, simple, good enough for MVP

**Rationale:**
- Already using PostgreSQL
- `tsvector` indexes provide fast searches
- `ts_rank` for relevance ranking
- `ts_headline` for highlighted snippets
- Supports stemming and stop words
- Phase 2 can add pgvector semantic search

**Consequences:**
- (+) No additional infrastructure
- (+) Good performance for 1000s of pages
- (+) RLS works on search queries
- (-) Less advanced than Elasticsearch
- (-) Query syntax not as rich as dedicated search engines

### ADR-KB-003: Hierarchical Tree Structure (Adjacency List)

**Context:** Pages need parent-child relationships for hierarchical organization.

**Decision:** Use adjacency list pattern (parentId self-reference) with recursive CTEs for tree queries.

**Alternatives Considered:**
- Nested sets - Better read performance, complex writes
- Path enumeration - Denormalization overhead
- Closure table - Extra table maintenance
- Adjacency list - Simple, flexible, good enough

**Rationale:**
- Simple schema (just parentId column)
- Easy to move pages (update parentId)
- Prisma supports self-relations
- PostgreSQL CTEs handle recursive queries efficiently
- Drag-drop reordering is straightforward

**Consequences:**
- (+) Simple data model
- (+) Easy to implement and maintain
- (+) Flexible for arbitrary depth
- (-) Recursive queries for full tree (mitigated by caching)
- (-) No built-in depth/ordering (added via application logic)

### ADR-KB-004: Soft Delete with 30-Day Recovery

**Context:** Users may accidentally delete pages. Need recoverability without complexity.

**Decision:** Soft delete using `deletedAt` timestamp with 30-day retention policy.

**Alternatives Considered:**
- Hard delete - No recovery
- Audit log only - Pages still deleted
- Soft delete - Simple, recoverable
- Trash folder - UI complexity

**Rationale:**
- Follows PM module pattern (Project soft delete)
- Simple implementation (just set deletedAt)
- 30 days gives reasonable recovery window
- Background job purges old deleted pages
- Filters exclude deleted by default

**Consequences:**
- (+) User-friendly, prevents data loss
- (+) Consistent with platform patterns
- (+) Simple implementation
- (-) Requires periodic cleanup job
- (-) Queries must filter deletedAt

---

## File Structure

### Backend Structure

```
apps/api/src/kb/
├── kb.module.ts                    # Main KB module definition
│
├── pages/
│   ├── pages.service.ts            # Page CRUD, tree operations, FTS
│   ├── pages.controller.ts         # Page REST endpoints
│   ├── pages.service.spec.ts       # Unit tests
│   └── dto/
│       ├── create-page.dto.ts      # Validation for POST /pages
│       ├── update-page.dto.ts      # Validation for PATCH /pages/:id
│       ├── list-pages.query.dto.ts # Query params for GET /pages
│       └── move-page.dto.ts        # Validation for PATCH /pages/:id/move
│
├── versions/
│   ├── versions.service.ts         # Version snapshot and restore logic
│   ├── versions.controller.ts      # Version REST endpoints
│   ├── versions.service.spec.ts    # Unit tests
│   └── dto/
│       └── create-version.dto.ts   # Validation for POST /versions
│
├── search/
│   ├── search.service.ts           # Full-text search implementation
│   ├── search.controller.ts        # Search REST endpoints
│   ├── search.service.spec.ts      # Unit tests
│   └── dto/
│       └── search-query.dto.ts     # Query params for GET /search
│
├── linking/
│   ├── linking.service.ts          # Project-page linking logic
│   ├── linking.controller.ts       # Linking REST endpoints
│   └── dto/
│       └── link-project.dto.ts     # Validation for linking operations
│
└── utils/
    ├── slug.util.ts                # Slug generation from title
    ├── text-extraction.util.ts     # Extract plain text from Tiptap JSON
    └── tree.util.ts                # Tree traversal and manipulation
```

### Frontend Structure

```
apps/web/src/app/kb/
├── layout.tsx                      # KB layout with sidebar
├── page.tsx                        # KB home page
├── search/
│   └── page.tsx                    # Search results page
├── new/
│   └── page.tsx                    # Create new page
└── [pageSlug]/
    ├── page.tsx                    # Page view/edit
    └── history/
        └── page.tsx                # Version history

apps/web/src/components/kb/
├── KBHome.tsx                      # Home dashboard
├── PageTree.tsx                    # Sidebar tree navigation
├── PageEditor.tsx                  # Main editor component
├── PageHeader.tsx                  # Page header with breadcrumbs
├── VersionHistory.tsx              # Version list and restore
├── SearchResults.tsx               # Search results display
├── ProjectDocsTab.tsx              # Project docs tab
│
├── editor/
│   ├── TiptapEditor.tsx            # Core Tiptap setup
│   ├── Toolbar.tsx                 # Editor toolbar
│   ├── BubbleMenu.tsx              # Floating formatting menu
│   └── extensions/                 # Custom Tiptap extensions (Phase 2)
│
└── tree/
    ├── TreeNode.tsx                # Individual tree node
    ├── TreeDragLayer.tsx           # Drag-drop preview overlay
    └── useTreeDragDrop.ts          # Drag-drop logic hook

apps/web/src/lib/kb/
├── api.ts                          # KB API client functions
├── queries.ts                      # React Query hooks
└── types.ts                        # Frontend-specific types
```

### Shared Types

```
packages/shared/src/types/
└── kb.ts                           # Shared KB types

packages/shared/src/schemas/
└── kb.ts                           # Zod validation schemas for KB
```

---

## Story Implementation Guide

### Story KB-01.1: KB Data Model & API

**Goal:** Create Prisma models and basic CRUD API for KB pages.

**Tasks:**
1. Add KnowledgePage, PageVersion, ProjectPage, PageActivity models to schema
2. Run migration: `pnpm prisma migrate dev --name add-kb-models`
3. Create KB module structure: `apps/api/src/kb/`
4. Implement PagesService with CRUD methods
5. Create DTOs for validation
6. Implement PagesController with REST endpoints
7. Add event publishing for page lifecycle events
8. Write unit tests for PagesService

**Acceptance Criteria:**
- Prisma models match specification
- POST /api/kb/pages creates page with unique slug
- GET /api/kb/pages returns tree or flat list
- PATCH /api/kb/pages/:id updates page
- DELETE /api/kb/pages/:id soft-deletes
- Events published on create/update/delete

**Files:**
- `packages/db/prisma/schema.prisma` (add models)
- `apps/api/src/kb/kb.module.ts`
- `apps/api/src/kb/pages/pages.service.ts`
- `apps/api/src/kb/pages/pages.controller.ts`
- `apps/api/src/kb/pages/dto/*.dto.ts`

### Story KB-01.2: Page Version History

**Goal:** Track content changes and allow restoring previous versions.

**Tasks:**
1. Implement VersionsService with snapshot creation
2. Create version on manual save (POST /versions)
3. Implement version list endpoint (GET /versions)
4. Implement version restore endpoint (POST /versions/:v/restore)
5. Add version counter to PageVersion (auto-increment)
6. Create frontend VersionHistory component
7. Add "History" button to PageHeader

**Acceptance Criteria:**
- Manual save creates new PageVersion
- Version number auto-increments (1, 2, 3, ...)
- GET /versions returns all versions for a page
- POST /versions/:v/restore reverts page content
- Restored page creates new version (not overwrite)
- UI shows version list with timestamps and change notes

**Files:**
- `apps/api/src/kb/versions/versions.service.ts`
- `apps/api/src/kb/versions/versions.controller.ts`
- `apps/web/src/components/kb/VersionHistory.tsx`

### Story KB-01.3: Rich Text Editor (Tiptap)

**Goal:** Integrate Tiptap editor with formatting options and JSON storage.

**Tasks:**
1. Install Tiptap packages: `@tiptap/react`, `@tiptap/starter-kit`, etc.
2. Create TiptapEditor component with StarterKit extensions
3. Add Toolbar component with formatting buttons
4. Store content as JSON in KnowledgePage.content
5. Extract plain text to contentText on save
6. Implement keyboard shortcuts (Cmd+B, Cmd+I, etc.)
7. Style editor with prose classes

**Acceptance Criteria:**
- Editor loads with StarterKit extensions
- Toolbar shows: bold, italic, headings, lists, links, code, tables
- Keyboard shortcuts work
- Content saved as Tiptap JSON
- Plain text extracted for FTS
- Prose styling applied

**Files:**
- `apps/web/src/components/kb/editor/TiptapEditor.tsx`
- `apps/web/src/components/kb/editor/Toolbar.tsx`
- `apps/api/src/kb/utils/text-extraction.util.ts`

### Story KB-01.4: Page Auto-Save

**Goal:** Automatically save content after user stops typing.

**Tasks:**
1. Implement debounced save in PageEditor (2 seconds)
2. Show "Saving..." / "Saved" / "Unsaved" indicator
3. Implement manual save with Cmd+S / Ctrl+S
4. Show unsaved changes warning on navigation
5. Use beforeunload event to warn on tab close
6. Prevent duplicate saves during debounce

**Acceptance Criteria:**
- Content auto-saves 2 seconds after typing stops
- Indicator shows current save status
- Cmd+S / Ctrl+S triggers manual save
- Navigation warns if unsaved changes
- Tab close warns if unsaved changes

**Files:**
- `apps/web/src/components/kb/PageEditor.tsx`
- `apps/web/src/hooks/useDebounce.ts`

### Story KB-01.5: Page Tree Navigation

**Goal:** Show hierarchical tree of pages in sidebar with drag-drop reordering.

**Tasks:**
1. Create PageTree component with recursive rendering
2. Implement expand/collapse for parent nodes
3. Highlight current page in tree
4. Add "New Page" button at root level
5. Implement drag-drop to reorder and reparent pages
6. Create PATCH /pages/:id/move endpoint
7. Update tree optimistically on drag-drop

**Acceptance Criteria:**
- Sidebar shows collapsible tree structure
- Current page highlighted
- Drag-drop moves pages (reorder siblings, change parent)
- PATCH /pages/:id/move updates parentId
- Tree updates optimistically (no full reload)
- Right-click context menu (Phase 2)

**Files:**
- `apps/web/src/components/kb/PageTree.tsx`
- `apps/web/src/components/kb/tree/TreeNode.tsx`
- `apps/web/src/components/kb/tree/useTreeDragDrop.ts`
- `apps/api/src/kb/pages/pages.controller.ts` (add move endpoint)

### Story KB-01.6: Breadcrumb Navigation

**Goal:** Show page hierarchy path at top of page.

**Tasks:**
1. Create Breadcrumbs component
2. Build path from parentId chain (recursive query)
3. Add to PageHeader component
4. Make each segment clickable
5. Truncate middle segments if path is long
6. Add "KB Home" as first segment

**Acceptance Criteria:**
- Breadcrumbs show: KB Home > Parent > Current Page
- Each segment clickable and navigates to that page
- Long paths truncate middle segments (e.g., "KB Home > ... > Current")
- Current page not clickable (plain text)

**Files:**
- `apps/web/src/components/kb/PageHeader.tsx`
- `apps/web/src/components/kb/Breadcrumbs.tsx`

### Story KB-01.7: KB Full-Text Search

**Goal:** Search page content using PostgreSQL tsvector.

**Tasks:**
1. Create FTS index migration: `CREATE INDEX idx_page_fts ON knowledge_pages USING GIN (to_tsvector('english', content_text))`
2. Implement SearchService with ts_query and ts_rank
3. Generate highlighted snippets with ts_headline
4. Create SearchResults component
5. Add search box to KB layout header
6. Implement search route: /kb/search?q=query
7. Handle empty results and errors

**Acceptance Criteria:**
- Search finds pages containing query terms
- Results ranked by relevance (ts_rank)
- Snippets show matched text with <mark> highlights
- Recent searches saved (Phase 2)
- Search box accessible from any KB page

**Files:**
- `packages/db/prisma/migrations/...` (FTS index)
- `apps/api/src/kb/search/search.service.ts`
- `apps/api/src/kb/search/search.controller.ts`
- `apps/web/src/components/kb/SearchResults.tsx`
- `apps/web/src/app/kb/search/page.tsx`

### Story KB-01.8: Recent Pages & Favorites

**Goal:** Quick access to recently viewed and favorited pages.

**Tasks:**
1. Add viewCount and lastViewedAt to KnowledgePage
2. Increment viewCount on GET /pages/:id
3. Add favoritedBy array to KnowledgePage
4. Implement POST /pages/:id/favorite endpoint
5. Create KBHome component with Recent and Favorites sections
6. Fetch recent pages (ORDER BY lastViewedAt DESC LIMIT 10)
7. Fetch favorites (WHERE id IN favoritedBy)

**Acceptance Criteria:**
- Recent section shows last 10 viewed pages
- Favorites section shows starred pages
- Star icon on pages to toggle favorite
- Both sections clickable to navigate to page
- Empty states for no recent/favorites

**Files:**
- `apps/api/src/kb/pages/pages.service.ts` (add favorite logic)
- `apps/web/src/components/kb/KBHome.tsx`

### Story KB-01.9: Project-KB Linking

**Goal:** Link KB pages to projects (many-to-many).

**Tasks:**
1. Implement LinkingService with project-page operations
2. Create POST /pages/:id/projects endpoint (link)
3. Create DELETE /pages/:id/projects/:projectId endpoint (unlink)
4. Add isPrimary flag to mark main doc for project
5. Create "Link to Project" modal in KB
6. Show backlinks section on page (projects linking to this page)
7. Publish kb.page.linked_to_project events

**Acceptance Criteria:**
- Modal shows project list to select
- POST creates ProjectPage record
- Page appears in project's Docs tab
- Can mark one page as "Primary" for project
- Backlinks section shows linked projects
- Unlinking removes association (not page)

**Files:**
- `apps/api/src/kb/linking/linking.service.ts`
- `apps/api/src/kb/linking/linking.controller.ts`
- `apps/web/src/components/kb/LinkProjectModal.tsx`

### Story KB-01.10: Project Docs Tab

**Goal:** Show linked KB pages in project detail page.

**Tasks:**
1. Add GET /pm/projects/:id/docs endpoint (returns ProjectPage[])
2. Create ProjectDocsTab component
3. Add "Docs" tab to project detail page
4. Show primary doc prominently (if set)
5. List other linked pages
6. Add "Link Existing Page" button (opens modal)
7. Add "Create New Page" button (creates and auto-links)

**Acceptance Criteria:**
- Docs tab visible in project detail
- Primary doc displayed at top with badge
- Other linked pages listed below
- "Link Existing Page" opens modal to select existing page
- "Create New Page" creates page and links to project
- Click page navigates to /kb/[pageSlug]

**Files:**
- `apps/api/src/pm/projects/projects.controller.ts` (add docs endpoint)
- `apps/web/src/components/kb/ProjectDocsTab.tsx`
- `apps/web/src/app/pm/projects/[projectId]/page.tsx` (add tab)

---

## Testing Strategy

### Unit Tests

**Backend (NestJS):**
- PagesService: CRUD operations, slug generation, tree queries
- VersionsService: Version creation, restore logic
- SearchService: FTS queries, snippet generation
- LinkingService: Project-page associations

**Frontend (Vitest + Testing Library):**
- PageEditor: Auto-save, manual save, unsaved warnings
- PageTree: Expand/collapse, current page highlight
- SearchResults: Empty states, result rendering
- VersionHistory: Version list, restore action

### Integration Tests

**API Endpoints:**
- POST /api/kb/pages → creates page with unique slug
- PATCH /api/kb/pages/:id → updates content, extracts text
- GET /api/kb/pages?flat=true → returns flat list
- GET /api/kb/search?q=test → returns FTS results
- POST /api/kb/pages/:id/projects → creates ProjectPage

**Event Publishing:**
- Verify kb.page.created event published on create
- Verify kb.page.updated event published on update
- Verify kb.page.linked_to_project event on linking

### E2E Tests (Playwright)

**User Flows:**
1. Create page → edit content → auto-save → verify saved
2. Create parent page → create child page → see in tree
3. Search for term → click result → navigate to page
4. View page → click "History" → restore old version
5. Link page to project → view project → see in Docs tab

**Critical Paths:**
- Full page lifecycle: create, edit, version, restore, delete
- Tree operations: create child, move page, reorder
- Search: query, view results, navigate
- Project linking: link, set primary, unlink

---

## Dependencies and Prerequisites

### NPM Packages (Backend)

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@prisma/client": "^6.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.0"
}
```

### NPM Packages (Frontend)

```json
{
  "@tiptap/react": "^2.1.0",
  "@tiptap/starter-kit": "^2.1.0",
  "@tiptap/extension-link": "^2.1.0",
  "@tiptap/extension-table": "^2.1.0",
  "@tiptap/extension-table-row": "^2.1.0",
  "@tiptap/extension-table-cell": "^2.1.0",
  "@tiptap/extension-table-header": "^2.1.0",
  "react-dnd": "^16.0.0",
  "react-dnd-html5-backend": "^16.0.0",
  "date-fns": "^3.0.0"
}
```

### Database Migration

```sql
-- Migration: add-kb-models

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- KnowledgePage table
CREATE TABLE "knowledge_pages" (
  "id" TEXT PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "content" JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
  "content_text" TEXT NOT NULL DEFAULT '',
  "owner_id" TEXT NOT NULL,
  "view_count" INTEGER NOT NULL DEFAULT 0,
  "last_viewed_at" TIMESTAMP,
  "favorited_by" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMP,
  CONSTRAINT "fk_parent" FOREIGN KEY ("parent_id") REFERENCES "knowledge_pages"("id") ON DELETE SET NULL
);

-- Full-text search index
CREATE INDEX "idx_page_fts" ON "knowledge_pages"
  USING GIN (to_tsvector('english', "content_text"));

-- Other indexes
CREATE UNIQUE INDEX "idx_workspace_slug" ON "knowledge_pages"("workspace_id", "slug");
CREATE INDEX "idx_workspace_id" ON "knowledge_pages"("workspace_id");
CREATE INDEX "idx_parent_id" ON "knowledge_pages"("parent_id");
CREATE INDEX "idx_owner_id" ON "knowledge_pages"("owner_id");
CREATE INDEX "idx_deleted_at" ON "knowledge_pages"("deleted_at");

-- PageVersion table
CREATE TABLE "page_versions" (
  "id" TEXT PRIMARY KEY,
  "page_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "content_text" TEXT NOT NULL,
  "change_note" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_page" FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "idx_page_version" ON "page_versions"("page_id", "version");
CREATE INDEX "idx_page_id" ON "page_versions"("page_id");

-- ProjectPage join table
CREATE TABLE "project_pages" (
  "id" TEXT PRIMARY KEY,
  "project_id" TEXT NOT NULL,
  "page_id" TEXT NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT FALSE,
  "linked_by" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_page" FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "idx_project_page" ON "project_pages"("project_id", "page_id");
CREATE INDEX "idx_project_id" ON "project_pages"("project_id");
CREATE INDEX "idx_page_id_pp" ON "project_pages"("page_id");

-- PageActivity table
CREATE TABLE "page_activities" (
  "id" TEXT PRIMARY KEY,
  "page_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "data" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_page_activity" FOREIGN KEY ("page_id") REFERENCES "knowledge_pages"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_page_id_activity" ON "page_activities"("page_id");
CREATE INDEX "idx_user_id_activity" ON "page_activities"("user_id");
CREATE INDEX "idx_created_at_activity" ON "page_activities"("created_at");
```

### Existing PM Patterns to Follow

1. **Service Layer Pattern**
   - Follow `ProjectsService` structure
   - Use Prisma transactions for multi-step operations
   - Publish events after successful operations

2. **DTO Validation**
   - Use class-validator decorators
   - Follow `CreateProjectDto` pattern
   - Optional workspaceId (extracted by TenantGuard)

3. **Slug Generation**
   - Follow `ProjectsService.generateUniqueSlug` pattern
   - Slugify title: lowercase, hyphens, alphanumeric only
   - Ensure uniqueness within workspace

4. **Event Publishing**
   - Use EventPublisherService
   - Include workspaceId (alias for tenantId)
   - Follow EventTypes pattern from @hyvve/shared

5. **Soft Delete**
   - Set deletedAt timestamp
   - Filter deletedAt IS NULL in queries
   - Background job purges after 30 days

---

## Performance Considerations

### Query Optimization

1. **Tree Queries**
   - Use recursive CTEs for full tree loading
   - Cache tree structure in Redis for hot paths
   - Lazy-load children on expand (don't fetch entire tree)

2. **Search Queries**
   - GIN index on contentText tsvector
   - Limit results to 20 per page
   - Use EXPLAIN ANALYZE to tune queries

3. **Denormalization**
   - viewCount and lastViewedAt for recent pages
   - Avoid joins where possible

### Caching Strategy

1. **Redis Cache**
   - Page tree structure (TTL: 5 minutes)
   - Recent pages list (TTL: 1 minute)
   - Search results (TTL: 30 seconds)

2. **Browser Cache**
   - Page content (stale-while-revalidate)
   - Tree structure (optimistic updates)

### Database Indexes

All indexes defined in migration above. Key indexes:
- Full-text search: GIN index on contentText
- Workspace isolation: (workspaceId, slug) unique index
- Tree queries: parentId index
- Recent pages: (lastViewedAt DESC) index

---

## Migration from Phase 1 to Phase 2

Phase 2 will add:
- Real-time collaboration (Yjs/Hocuspocus)
- RAG/semantic search (pgvector embeddings)
- Verified content system
- @mentions and #task references
- Scribe agent for KB management

**Migration Path:**
1. Add yjsState BLOB column to KnowledgePage
2. Add PageEmbedding model with pgvector
3. Add verification fields (isVerified, verifiedAt, etc.)
4. Add PageMention and PageComment models
5. Deploy Hocuspocus server for Yjs sync
6. Generate embeddings for existing pages
7. Enable Scribe agent

Phase 1 implementation should not block Phase 2 features. JSON content structure is forward-compatible with Yjs.

---

## Related Documentation

- [KB Specification](../kb-specification.md) - Full KB requirements
- [Module PRD](../PRD.md) - Core-PM product requirements
- [Module Architecture](../architecture.md) - Overall architecture
- [Sprint Status](../sprint-status.yaml) - Epic and story tracking
- [Epic Definition](./epic-kb-01-knowledge-base-foundation.md) - Epic and stories
- [PM-01 Implementation](../../../../apps/api/src/pm/) - Reference patterns

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial technical specification for Epic KB-01 |
