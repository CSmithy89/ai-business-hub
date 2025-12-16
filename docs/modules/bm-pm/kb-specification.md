# Knowledge Base (KB) - Detailed Specification

**Component:** Core-PM / Knowledge Base
**Version:** 1.0
**Created:** 2025-12-16
**Status:** Specification Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Feature Specification](#feature-specification)
4. [Data Models](#data-models)
5. [RAG Pipeline Specification](#rag-pipeline-specification)
6. [Real-Time Collaboration (Yjs)](#real-time-collaboration-yjs)
7. [Verified Content System](#verified-content-system)
8. [Search Architecture](#search-architecture)
9. [UI/UX Specification](#uiux-specification)
10. [API Specification](#api-specification)
11. [Integration Points](#integration-points)
12. [Performance Requirements](#performance-requirements)
13. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

The Knowledge Base (KB) is a core platform component that provides:

- **Collaborative Wiki** - Real-time document editing with Yjs CRDT
- **RAG-Powered Search** - Semantic search using pgvector embeddings
- **Verified Content System** - Authoritative content flagging for AI prioritization
- **Project Integration** - Deep linking between KB pages and PM products/tasks

### Competitive Inspiration

| Feature | Inspired By | Our Enhancement |
|---------|-------------|-----------------|
| Wiki Pages | Plane, Notion | Yjs real-time collaboration |
| RAG Search | Notion AI, ClickUp Brain | Tenant BYOAI integration |
| Verified Content | ClickUp Brain Verified Wiki | Expiration + auto-review workflow |
| Page Hierarchy | Confluence, Notion | Unlimited nesting + breadcrumbs |
| @Mentions | Slack, Notion | Cross-link to tasks and pages |

---

## Design Philosophy

### Core Principles

1. **AI-First Knowledge Management**
   - Every page generates embeddings for RAG
   - Scribe agent actively manages KB quality
   - AI search is the primary discovery mechanism

2. **Real-Time Collaboration**
   - Google Docs-style concurrent editing
   - Cursor presence shows who's editing
   - Offline support with automatic sync

3. **Verified Authority**
   - Not all content is equal
   - Verified pages get priority in AI search
   - Verification expires to ensure freshness

4. **Deep Integration**
   - Pages link to products, tasks, contacts
   - @mention users, #reference tasks
   - Context flows both ways (PM ↔ KB)

### Non-Goals for MVP

- External public documentation portal
- Multi-language content
- Advanced permissions (page-level ACL)
- Real-time commenting (async only)
- PDF/export generation (Phase 2)

---

## Feature Specification

### MVP (Phase 1) Features

#### F1: Wiki Page System

| Feature | Description | Priority |
|---------|-------------|----------|
| F1.1 Page CRUD | Create, read, update, soft-delete pages | P0 |
| F1.2 Rich Text Editor | Tiptap/ProseMirror with JSON storage | P0 |
| F1.3 Page Hierarchy | Unlimited nesting with parent-child | P0 |
| F1.4 Version History | Track all changes with snapshots | P0 |
| F1.5 Page Slugs | Human-readable URLs | P0 |
| F1.6 Soft Delete | Recoverable deletion with deletedAt | P0 |

**Acceptance Criteria (F1.1):**
- [ ] User can create new page with title
- [ ] User can edit page content with auto-save
- [ ] User can move page to new parent
- [ ] User can soft-delete page (with confirmation)
- [ ] Deleted pages can be restored within 30 days

#### F2: Basic Navigation

| Feature | Description | Priority |
|---------|-------------|----------|
| F2.1 Sidebar Tree | Collapsible page tree navigation | P0 |
| F2.2 Breadcrumbs | Show parent hierarchy | P0 |
| F2.3 Recent Pages | Last 10 viewed pages | P0 |
| F2.4 Favorites | Star pages for quick access | P1 |
| F2.5 Full-Text Search | PostgreSQL tsvector search | P0 |

**Acceptance Criteria (F2.1):**
- [ ] Sidebar shows workspace page tree
- [ ] Nodes are collapsible/expandable
- [ ] Current page is highlighted
- [ ] Drag-drop to reorder/reparent pages
- [ ] "New Page" button at any level

#### F3: Project-KB Linking

| Feature | Description | Priority |
|---------|-------------|----------|
| F3.1 Link Page to Product | Many-to-many relationship | P0 |
| F3.2 Primary Page Flag | Mark one page as product's main doc | P0 |
| F3.3 Project Docs Tab | See linked pages in product view | P0 |
| F3.4 Quick Link from Task | Link KB page from task detail | P1 |
| F3.5 Backlink Display | Show which projects link to page | P1 |

**Acceptance Criteria (F3.1):**
- [ ] User can link existing page to product
- [ ] User can create new page linked to product
- [ ] Linked pages appear in product's Docs tab
- [ ] Unlinking removes association (not page)
- [ ] One page can link to multiple products

### Phase 2 Features

#### F4: Real-Time Collaboration (Yjs)

| Feature | Description | Priority |
|---------|-------------|----------|
| F4.1 Concurrent Editing | Multiple users edit simultaneously | P0 |
| F4.2 Cursor Presence | See other users' cursors | P0 |
| F4.3 Selection Awareness | See highlighted selections | P1 |
| F4.4 Offline Editing | Edit offline, sync on reconnect | P0 |
| F4.5 Conflict Resolution | CRDT handles conflicts | P0 |

**Technical Requirements:**
- Hocuspocus server for Yjs sync
- IndexedDB for offline storage
- WebSocket connection per editor session
- Debounced save to PostgreSQL (5 seconds)

#### F5: @Mentions & #References

| Feature | Description | Priority |
|---------|-------------|----------|
| F5.1 @mention User | Autocomplete user mentions | P0 |
| F5.2 #reference Task | Link to PM tasks (PM-123) | P0 |
| F5.3 [[Page Link]] | Internal page linking | P0 |
| F5.4 Backlinks Panel | Show incoming references | P1 |
| F5.5 Notification on @mention | Notify mentioned users | P1 |

**Technical Requirements:**
- Tiptap extension for each mention type
- Autocomplete with debounced search
- Store mentions in PageMention table
- Render as clickable chips

#### F6: RAG Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| F6.1 Auto-Embedding | Generate embeddings on save | P0 |
| F6.2 Semantic Search | Vector similarity search | P0 |
| F6.3 Agent Context | Agents query KB for context | P0 |
| F6.4 Verified Boost | Verified pages rank higher | P0 |
| F6.5 Recency Decay | Recent pages slight boost | P1 |

**Technical Requirements:**
- pgvector extension in PostgreSQL
- Chunking: 512 tokens, 50 overlap
- Embedding model: tenant's BYOAI config
- Top-k: 5 results by default
- Verified boost: 1.5x multiplier

#### F7: Verified Content System

| Feature | Description | Priority |
|---------|-------------|----------|
| F7.1 Mark as Verified | Page owner can verify | P0 |
| F7.2 Expiration Date | Verification expires | P0 |
| F7.3 Visual Badge | Show verified status | P0 |
| F7.4 Stale Detection | Flag expired verifications | P0 |
| F7.5 Re-verification | Easy workflow to re-verify | P1 |

**Expiration Options:**
- 30 days
- 60 days
- 90 days
- Never (permanent)

### Phase 3 Features

#### F8: AI-Native KB

| Feature | Description | Priority |
|---------|-------------|----------|
| F8.1 AI Page Drafts | Generate page from context | P1 |
| F8.2 Smart Summarization | Auto-generate TL;DR | P1 |
| F8.3 Knowledge Extraction | Extract docs from completed tasks | P2 |
| F8.4 Q&A Chat | Chat with KB | P1 |
| F8.5 Gap Detection | Find missing documentation | P2 |

#### F9: Advanced Features

| Feature | Description | Priority |
|---------|-------------|----------|
| F9.1 Page Comments | Threaded discussions | P1 |
| F9.2 Diagram Embed | Excalidraw integration | P2 |
| F9.3 Table Blocks | Database-style tables | P2 |
| F9.4 Export | Markdown/PDF export | P1 |
| F9.5 Import | Notion/Confluence import | P2 |

---

## Data Models

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KNOWLEDGE BASE DOMAIN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐                                                        │
│  │  KnowledgePage  │◄────┐                                                  │
│  │                 │     │ (self-ref: parent-child)                         │
│  │ id              │─────┘                                                  │
│  │ tenantId        │                                                        │
│  │ workspaceId     │                                                        │
│  │ parentId        │────────────────────────────────────────────────┐       │
│  │ title           │                                                 │       │
│  │ slug            │                                                 │       │
│  │ content (JSON)  │────┐                                            │       │
│  │ contentText     │    │ Tiptap JSON                               │       │
│  │                 │    └──────────────────────────┐                 │       │
│  │ isVerified      │                               │                 │       │
│  │ verifiedAt      │                               ▼                 ▼       │
│  │ verifiedById    │                        ┌─────────────┐   ┌───────────┐ │
│  │ verifyExpires   │                        │ Rich Text   │   │  Parent   │ │
│  │ ownerId         │                        │ Editor      │   │  Page     │ │
│  │ viewCount       │                        │ (Tiptap)    │   │           │ │
│  │ lastViewedAt    │                        └─────────────┘   └───────────┘ │
│  │ yjsState        │ ◄─── BLOB for Yjs persistence                          │
│  │ createdAt       │                                                        │
│  │ updatedAt       │                                                        │
│  │ deletedAt       │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                  │
│           │ 1:N                                                              │
│           │                                                                  │
│  ┌────────┴────────────────────────────────────────────────────────────┐    │
│  │                              │                              │        │    │
│  ▼                              ▼                              ▼        ▼    │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐ ┌────┐ │
│  │  PageVersion    │     │ PageEmbedding   │     │  ProjectPage    │ │... │ │
│  │                 │     │                 │     │  (join table)   │ │    │ │
│  │ id              │     │ id              │     │                 │ │    │ │
│  │ pageId          │     │ pageId          │     │ productId ──────┼─┼──┐ │ │
│  │ version (int)   │     │ chunkIndex      │     │ pageId          │ │  │ │ │
│  │ content (JSON)  │     │ chunkText       │     │ isPrimary       │ │  │ │ │
│  │ contentText     │     │ embedding[1536] │     │ createdAt       │ │  │ │ │
│  │ changeNote      │     │ embeddingModel  │     │                 │ │  │ │ │
│  │ createdById     │     │ createdAt       │     │                 │ │  │ │ │
│  │ createdAt       │     │                 │     │                 │ │  │ │ │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘ │  │ │ │
│                                                                       │  │ │ │
│                                                                       │  │ │ │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐ │  │ │ │
│  │  PageComment    │     │  PageMention    │     │  PageActivity   │ │  │ │ │
│  │                 │     │                 │     │                 │ │  │ │ │
│  │ id              │     │ id              │     │ id              │ │  │ │ │
│  │ pageId          │     │ pageId          │     │ pageId          │ │  │ │ │
│  │ userId          │     │ mentionType     │     │ userId          │ │  │ │ │
│  │ content         │     │ targetId        │     │ type            │ │  │ │ │
│  │ parentId        │     │ position        │     │ data (JSON)     │ │  │ │ │
│  │ createdAt       │     │ createdAt       │     │ createdAt       │ │  │ │ │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘ │  │ │ │
│                                                                       │  │ │ │
│                                                                       ▼  ▼ │ │
│                                                               ┌───────────┐│ │
│                                                               │  Product  ││ │
│                                                               │  (PM)     ││ │
│                                                               └───────────┘│ │
│                                                                             │ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Prisma Schema

```prisma
// packages/db/prisma/schema/kb.prisma

model KnowledgePage {
  id            String    @id @default(cuid())
  tenantId      String
  workspaceId   String

  // Hierarchy
  parentId      String?

  // Content
  title         String
  slug          String    @db.VarChar(255)
  content       Json      // Tiptap/ProseMirror JSON
  contentText   String    @db.Text  // Plain text for FTS

  // Verification
  isVerified    Boolean   @default(false)
  verifiedAt    DateTime?
  verifiedById  String?
  verifyExpires DateTime?

  // Ownership
  ownerId       String

  // Analytics
  viewCount     Int       @default(0)
  lastViewedAt  DateTime?

  // Yjs State
  yjsState      Bytes?    // Yjs document state for persistence

  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  // Relations
  parent        KnowledgePage?   @relation("PageHierarchy", fields: [parentId], references: [id])
  children      KnowledgePage[]  @relation("PageHierarchy")
  versions      PageVersion[]
  embeddings    PageEmbedding[]
  projects      ProjectPage[]
  comments      PageComment[]
  mentions      PageMention[]
  activities    PageActivity[]

  // Indexes
  @@unique([tenantId, workspaceId, slug])
  @@index([tenantId])
  @@index([workspaceId])
  @@index([parentId])
  @@index([ownerId])
  @@index([isVerified])
  @@index([updatedAt])
  @@index([deletedAt])
}

model PageVersion {
  id            String    @id @default(cuid())
  pageId        String
  version       Int
  content       Json      // Snapshot of content
  contentText   String    @db.Text

  // Metadata
  changeNote    String?   @db.VarChar(500)
  createdById   String
  createdAt     DateTime  @default(now())

  page          KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@unique([pageId, version])
  @@index([pageId])
  @@index([createdAt])
}

model PageEmbedding {
  id            String    @id @default(cuid())
  pageId        String
  chunkIndex    Int

  // Content
  chunkText     String    @db.Text

  // Vector - pgvector extension
  // Using raw SQL for vector operations
  embedding     Unsupported("vector(1536)")

  // Metadata
  embeddingModel String   @default("text-embedding-3-small") @db.VarChar(100)
  createdAt     DateTime  @default(now())

  page          KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId])
  // Vector index created via migration
  // CREATE INDEX idx_embedding_vector ON "PageEmbedding"
  //   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
}

model ProjectPage {
  id            String    @id @default(cuid())
  productId     String
  pageId        String
  isPrimary     Boolean   @default(false)
  createdAt     DateTime  @default(now())

  // Note: Product model defined in pm.prisma
  page          KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@unique([productId, pageId])
  @@index([productId])
  @@index([pageId])
}

model PageComment {
  id            String    @id @default(cuid())
  pageId        String
  userId        String
  content       String    @db.Text

  // Thread support
  parentId      String?

  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  page          KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)
  parent        PageComment?  @relation("CommentThread", fields: [parentId], references: [id])
  replies       PageComment[] @relation("CommentThread")

  @@index([pageId])
  @@index([userId])
  @@index([parentId])
}

model PageMention {
  id            String      @id @default(cuid())
  pageId        String

  // Mention details
  mentionType   MentionType
  targetId      String      // User ID, Task ID, or Page ID

  // Position (character offset in content)
  position      Int

  createdAt     DateTime    @default(now())

  page          KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId])
  @@index([targetId])
  @@index([mentionType])
}

model PageActivity {
  id            String           @id @default(cuid())
  pageId        String
  userId        String
  type          PageActivityType
  data          Json?

  createdAt     DateTime         @default(now())

  page          KnowledgePage    @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId])
  @@index([userId])
  @@index([type])
  @@index([createdAt])
}

// Enums
enum MentionType {
  USER          // @username
  TASK          // #PM-123
  PAGE          // [[Page Title]]
}

enum PageActivityType {
  CREATED
  UPDATED
  DELETED
  RESTORED
  VIEWED
  VERIFIED
  UNVERIFIED
  LINKED_TO_PROJECT
  UNLINKED_FROM_PROJECT
  COMMENTED
}
```

### Content JSON Structure (Tiptap)

```typescript
// Example Tiptap/ProseMirror JSON content
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
  type: string; // 'bold', 'italic', 'link', 'mention', etc.
  attrs?: Record<string, any>;
}

// Example document
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
        { type: 'text', text: 'Contact ' },
        {
          type: 'mention',
          attrs: { id: 'user_123', label: '@john.doe' }
        },
        { type: 'text', text: ' for access. Related task: ' },
        {
          type: 'taskReference',
          attrs: { id: 'task_456', label: '#PM-123' }
        }
      ]
    }
  ]
};
```

---

## RAG Pipeline Specification

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RAG Pipeline                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   INGESTION (on page create/update)                                         │
│   ─────────────────────────────────                                         │
│                                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │ Tiptap   │───►│ Extract  │───►│  Chunk   │───►│  Embed   │             │
│   │ JSON     │    │ Text     │    │ (512/50) │    │ (BYOAI)  │             │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘             │
│                                                          │                   │
│                                                          ▼                   │
│                                                   ┌──────────┐              │
│                                                   │ pgvector │              │
│                                                   │ Storage  │              │
│                                                   └──────────┘              │
│                                                                              │
│   RETRIEVAL (on search/agent query)                                         │
│   ─────────────────────────────────                                         │
│                                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │  Query   │───►│  Embed   │───►│ Vector   │───►│  Rank &  │             │
│   │  Text    │    │  Query   │    │ Search   │    │  Boost   │             │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘             │
│                                                          │                   │
│                                                          ▼                   │
│                                                   ┌──────────┐              │
│                                                   │ Context  │              │
│                                                   │ Assembly │              │
│                                                   └──────────┘              │
│                                                          │                   │
│                                                          ▼                   │
│                                                   ┌──────────┐              │
│                                                   │  LLM     │              │
│                                                   │ Response │              │
│                                                   └──────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Configuration

```typescript
interface RAGConfig {
  // Chunking
  chunkSize: number;        // 512 tokens (words approximation)
  chunkOverlap: number;     // 50 tokens overlap

  // Retrieval
  topK: number;             // 5 results
  minSimilarity: number;    // 0.3 threshold

  // Ranking
  verifiedBoost: number;    // 1.5x for verified pages
  recencyDecay: number;     // 0.95 per week decay

  // Model
  embeddingModel: string;   // From tenant BYOAI config
  embeddingDimension: number; // 1536 for OpenAI
}

const defaultConfig: RAGConfig = {
  chunkSize: 512,
  chunkOverlap: 50,
  topK: 5,
  minSimilarity: 0.3,
  verifiedBoost: 1.5,
  recencyDecay: 0.95,
  embeddingModel: 'text-embedding-3-small',
  embeddingDimension: 1536,
};
```

### Chunking Algorithm

```typescript
function chunkText(text: string, config: RAGConfig): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + config.chunkSize, words.length);
    const chunk = words.slice(start, end).join(' ');

    // Only add non-empty chunks
    if (chunk.trim().length > 50) { // Min 50 chars
      chunks.push(chunk);
    }

    // Slide window with overlap
    start += config.chunkSize - config.chunkOverlap;
  }

  return chunks;
}
```

### Vector Search Query

```sql
-- Search with verified content boost
SELECT
  pe.id,
  pe."pageId",
  kp.title as "pageTitle",
  pe."chunkText",
  kp."isVerified",
  kp."updatedAt",

  -- Cosine similarity
  1 - (pe.embedding <=> $1::vector) as similarity,

  -- Boosted score
  CASE
    WHEN kp."isVerified" THEN
      (1 - (pe.embedding <=> $1::vector)) * 1.5
    ELSE
      1 - (pe.embedding <=> $1::vector)
  END *
  -- Recency factor (slight decay for old content)
  POWER(0.95, EXTRACT(WEEK FROM NOW() - kp."updatedAt"))
  as score

FROM "PageEmbedding" pe
JOIN "KnowledgePage" kp ON pe."pageId" = kp.id
WHERE
  kp."tenantId" = $2
  AND kp."workspaceId" = $3
  AND kp."deletedAt" IS NULL
  AND (1 - (pe.embedding <=> $1::vector)) >= 0.3  -- Min threshold
ORDER BY score DESC
LIMIT $4;  -- topK
```

### RAG Service Interface

```typescript
interface RAGService {
  // Ingestion
  generateEmbeddings(tenantId: string, pageId: string): Promise<void>;
  deleteEmbeddings(pageId: string): Promise<void>;

  // Retrieval
  query(
    tenantId: string,
    workspaceId: string,
    queryText: string,
    options?: RAGQueryOptions,
  ): Promise<RAGResult[]>;

  // Context assembly
  getContextForTask(tenantId: string, taskId: string): Promise<string>;
  getContextForAgent(tenantId: string, agentQuery: string): Promise<AgentContext>;
}

interface RAGQueryOptions {
  topK?: number;
  boostVerified?: boolean;
  filterTags?: string[];
  minSimilarity?: number;
}

interface RAGResult {
  pageId: string;
  pageTitle: string;
  pageSlug: string;
  chunkText: string;
  similarity: number;
  score: number;
  isVerified: boolean;
  updatedAt: Date;
}

interface AgentContext {
  results: RAGResult[];
  formattedContext: string;
  sourceCitations: Citation[];
}
```

---

## Real-Time Collaboration (Yjs)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Yjs Real-Time Collaboration                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Browser A                Hocuspocus Server                Browser B        │
│   ┌───────────┐           ┌──────────────┐              ┌───────────┐       │
│   │  Tiptap   │           │              │              │  Tiptap   │       │
│   │  Editor   │◄─────────►│   Yjs Doc    │◄────────────►│  Editor   │       │
│   │           │ WebSocket │   Manager    │  WebSocket   │           │       │
│   │  ┌─────┐  │           │              │              │  ┌─────┐  │       │
│   │  │Y.Doc│  │           │  ┌────────┐  │              │  │Y.Doc│  │       │
│   │  └─────┘  │           │  │Presence│  │              │  └─────┘  │       │
│   └───────────┘           │  └────────┘  │              └───────────┘       │
│        │                  │              │                   │               │
│        │                  └───────┬──────┘                   │               │
│        ▼                          │                          ▼               │
│   ┌───────────┐                   │                    ┌───────────┐        │
│   │ IndexedDB │                   ▼                    │ IndexedDB │        │
│   │ (offline) │           ┌──────────────┐             │ (offline) │        │
│   └───────────┘           │  PostgreSQL  │             └───────────┘        │
│                           │  (yjsState)  │                                   │
│                           └──────────────┘                                   │
│                                                                              │
│   Sync Flow:                                                                 │
│   1. Client connects to Hocuspocus with page ID                             │
│   2. Server loads yjsState from PostgreSQL                                  │
│   3. Server broadcasts Y.Doc state to client                                │
│   4. Client merges with local IndexedDB state                               │
│   5. Changes broadcast to all connected clients                             │
│   6. Debounced save to PostgreSQL (5 seconds)                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hocuspocus Configuration

```typescript
// apps/api/src/modules/kb/hocuspocus/config.ts

import { Hocuspocus } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { Logger } from '@hocuspocus/extension-logger';
import { TiptapTransformer } from '@hocuspocus/transformer';

export const createHocuspocusServer = (deps: {
  prisma: PrismaService;
  auth: AuthService;
  redis: Redis;
}) => {
  return new Hocuspocus({
    port: parseInt(process.env.HOCUSPOCUS_PORT || '1234'),
    timeout: 30000,

    extensions: [
      // Logging
      new Logger({
        log: (message, _payload) => console.log(`[Hocuspocus] ${message}`),
      }),

      // Database persistence
      new Database({
        // Load document from DB
        fetch: async ({ documentName }) => {
          const pageId = extractPageId(documentName);
          const page = await deps.prisma.knowledgePage.findUnique({
            where: { id: pageId },
            select: { yjsState: true },
          });
          return page?.yjsState || null;
        },

        // Save document to DB
        store: async ({ documentName, state }) => {
          const pageId = extractPageId(documentName);

          // Also update content JSON and contentText
          const ydoc = new Y.Doc();
          Y.applyUpdate(ydoc, state);
          const json = TiptapTransformer.fromYdoc(ydoc);
          const text = extractTextFromTiptap(json);

          await deps.prisma.knowledgePage.update({
            where: { id: pageId },
            data: {
              yjsState: state,
              content: json,
              contentText: text,
              updatedAt: new Date(),
            },
          });
        },
      }),
    ],

    // Authentication
    onAuthenticate: async ({ token, documentName }) => {
      // Validate JWT
      const payload = await deps.auth.verifyToken(token);
      if (!payload) {
        throw new Error('Invalid token');
      }

      // Check page access
      const pageId = extractPageId(documentName);
      const hasAccess = await checkPageAccess(deps.prisma, payload.userId, pageId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      return {
        user: {
          id: payload.userId,
          name: payload.name,
          color: generateUserColor(payload.userId),
        },
      };
    },

    // Track connections
    onConnect: async ({ documentName, socketId }) => {
      const pageId = extractPageId(documentName);
      await deps.redis.sadd(`kb:page:${pageId}:connections`, socketId);
    },

    onDisconnect: async ({ documentName, socketId }) => {
      const pageId = extractPageId(documentName);
      await deps.redis.srem(`kb:page:${pageId}:connections`, socketId);
    },
  });
};

function extractPageId(documentName: string): string {
  // documentName format: "kb:{pageId}"
  return documentName.replace('kb:', '');
}

function generateUserColor(userId: string): string {
  // Generate consistent color from user ID
  const colors = [
    '#F87171', '#FB923C', '#FBBF24', '#A3E635',
    '#34D399', '#22D3EE', '#60A5FA', '#A78BFA',
  ];
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
```

### Client-Side Integration

```typescript
// apps/web/src/components/kb/editor/useCollaborativeEditor.ts

import { useEffect, useState, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

interface UseCollaborativeEditorOptions {
  pageId: string;
  token: string;
  userName: string;
  onSynced?: () => void;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

export function useCollaborativeEditor(options: UseCollaborativeEditorOptions) {
  const { pageId, token, userName, onSynced, onUnsavedChanges } = options;

  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  // Setup Hocuspocus provider
  useEffect(() => {
    const hocuspocusProvider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL!,
      name: `kb:${pageId}`,
      document: ydoc,
      token,

      onSynced: () => {
        setIsSynced(true);
        onSynced?.();
      },

      onAwarenessUpdate: ({ states }) => {
        const users = Array.from(states.values()).map((state: any) => ({
          id: state.user?.id,
          name: state.user?.name,
          color: state.user?.color,
          cursor: state.cursor,
        }));
        setConnectedUsers(users);
      },

      onDisconnect: () => {
        setIsSynced(false);
      },
    });

    // Offline persistence
    const indexeddbProvider = new IndexeddbPersistence(`kb:${pageId}`, ydoc);
    indexeddbProvider.on('synced', () => {
      console.log('IndexedDB synced');
    });

    setProvider(hocuspocusProvider);

    return () => {
      hocuspocusProvider.destroy();
      indexeddbProvider.destroy();
    };
  }, [pageId, token, ydoc]);

  // Create Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: userName,
          color: generateUserColor(userName),
        },
      }),
      // Custom extensions
      Mention,
      TaskReference,
      PageLink,
    ],
    onUpdate: ({ editor }) => {
      onUnsavedChanges?.(true);
    },
  });

  // Force sync
  const forceSync = useCallback(() => {
    provider?.forceSync();
  }, [provider]);

  return {
    editor,
    provider,
    isSynced,
    connectedUsers,
    forceSync,
  };
}
```

---

## Verified Content System

### Verification States

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Verification State Machine                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐                                                            │
│   │ UNVERIFIED  │◄─────────────────────────────────────────────────┐        │
│   │  (default)  │                                                   │        │
│   └──────┬──────┘                                                   │        │
│          │                                                          │        │
│          │ User clicks "Mark as Verified"                           │        │
│          ▼                                                          │        │
│   ┌─────────────┐                                                   │        │
│   │  VERIFIED   │                                                   │        │
│   │             │                                                   │        │
│   │ • isVerified = true                                            │        │
│   │ • verifiedAt = now()                                           │        │
│   │ • verifiedById = userId                                        │        │
│   │ • verifyExpires = now() + 30/60/90 days                        │        │
│   │                                                                 │        │
│   └──────┬──────┘                                                   │        │
│          │                                                          │        │
│          │ Expiration date reached (cron check)                     │        │
│          ▼                                                          │        │
│   ┌─────────────┐                                                   │        │
│   │   EXPIRED   │───────────────────────────────────────────────────┘        │
│   │             │        Owner re-verifies                                    │
│   │ • Flagged in stale list                                                  │
│   │ • Owner notified                                                         │
│   │ • Still searchable (lower rank)                                          │
│   │                                                                          │
│   └─────────────┘                                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Verification API

```typescript
// POST /api/kb/pages/:id/verify
interface VerifyPageRequest {
  expiresIn: '30d' | '60d' | '90d' | 'never';
}

interface VerifyPageResponse {
  id: string;
  isVerified: boolean;
  verifiedAt: string;
  verifyExpires: string | null;
}

// DELETE /api/kb/pages/:id/verify
// Removes verification (sets isVerified = false)
```

### Verification UI

```typescript
// apps/web/src/components/kb/VerificationBadge.tsx

interface Props {
  page: {
    isVerified: boolean;
    verifiedAt: string | null;
    verifyExpires: string | null;
    verifiedBy: { name: string } | null;
  };
  canVerify: boolean;
  onVerify: (expiresIn: string) => void;
  onUnverify: () => void;
}

export function VerificationBadge({
  page,
  canVerify,
  onVerify,
  onUnverify,
}: Props) {
  if (page.isVerified) {
    const expiresIn = page.verifyExpires
      ? formatDistanceToNow(new Date(page.verifyExpires))
      : 'Never';

    const isExpired = page.verifyExpires &&
      new Date(page.verifyExpires) < new Date();

    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
        isExpired
          ? "bg-amber-100 text-amber-800"
          : "bg-green-100 text-green-800"
      )}>
        {isExpired ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        <span>
          {isExpired ? 'Verification Expired' : 'Verified'}
        </span>
        <span className="text-xs opacity-75">
          {isExpired ? `Expired ${expiresIn} ago` : `Expires in ${expiresIn}`}
        </span>
        {canVerify && (
          <button
            onClick={onUnverify}
            className="ml-2 opacity-50 hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  if (!canVerify) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="w-4 h-4 mr-2" />
          Mark as Verified
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onVerify('30d')}>
          Verify for 30 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onVerify('60d')}>
          Verify for 60 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onVerify('90d')}>
          Verify for 90 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onVerify('never')}>
          Verify permanently
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Expiration Cron Job

```typescript
// apps/api/src/modules/kb/jobs/verification-expiry.job.ts

@Injectable()
export class VerificationExpiryJob {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  @Cron('0 0 * * *') // Daily at midnight
  async checkExpirations() {
    const now = new Date();

    // Find pages with expired verification
    const expiredPages = await this.prisma.knowledgePage.findMany({
      where: {
        isVerified: true,
        verifyExpires: {
          lte: now,
        },
        deletedAt: null,
      },
      include: {
        owner: { select: { id: true, email: true, name: true } },
      },
    });

    for (const page of expiredPages) {
      // Don't auto-unverify, just notify
      // Page stays "verified" but flagged as expired
      await this.notifications.send({
        userId: page.ownerId,
        type: 'kb.verification.expired',
        title: 'Page verification expired',
        message: `The page "${page.title}" needs re-verification.`,
        data: {
          pageId: page.id,
          pageTitle: page.title,
          pageSlug: page.slug,
        },
      });

      // Log activity
      await this.prisma.pageActivity.create({
        data: {
          pageId: page.id,
          userId: 'system',
          type: 'VERIFICATION_EXPIRED',
        },
      });
    }

    console.log(`Processed ${expiredPages.length} expired verifications`);
  }
}
```

---

## Search Architecture

### Full-Text Search (FTS)

```sql
-- Create FTS index
CREATE INDEX idx_page_fts ON "KnowledgePage"
USING GIN (to_tsvector('english', "contentText"));

-- Search query
SELECT
  id,
  title,
  slug,
  ts_rank(to_tsvector('english', "contentText"), query) as rank,
  ts_headline('english', "contentText", query,
    'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=25'
  ) as snippet
FROM "KnowledgePage", plainto_tsquery('english', $1) query
WHERE
  "tenantId" = $2
  AND "workspaceId" = $3
  AND "deletedAt" IS NULL
  AND to_tsvector('english', "contentText") @@ query
ORDER BY rank DESC
LIMIT 20;
```

### Hybrid Search (FTS + Semantic)

```typescript
interface SearchService {
  // Full-text search
  searchFTS(
    tenantId: string,
    workspaceId: string,
    query: string,
  ): Promise<SearchResult[]>;

  // Semantic/vector search
  searchSemantic(
    tenantId: string,
    workspaceId: string,
    query: string,
  ): Promise<SearchResult[]>;

  // Hybrid search (combine both)
  searchHybrid(
    tenantId: string,
    workspaceId: string,
    query: string,
    weights?: { fts: number; semantic: number },
  ): Promise<SearchResult[]>;
}

async function searchHybrid(
  tenantId: string,
  workspaceId: string,
  query: string,
  weights = { fts: 0.3, semantic: 0.7 },
): Promise<SearchResult[]> {
  // Run both searches in parallel
  const [ftsResults, semanticResults] = await Promise.all([
    searchFTS(tenantId, workspaceId, query),
    searchSemantic(tenantId, workspaceId, query),
  ]);

  // Combine and normalize scores
  const combined = new Map<string, SearchResult>();

  for (const result of ftsResults) {
    combined.set(result.pageId, {
      ...result,
      score: result.score * weights.fts,
    });
  }

  for (const result of semanticResults) {
    const existing = combined.get(result.pageId);
    if (existing) {
      existing.score += result.score * weights.semantic;
    } else {
      combined.set(result.pageId, {
        ...result,
        score: result.score * weights.semantic,
      });
    }
  }

  // Sort by combined score
  return Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}
```

---

## UI/UX Specification

### Information Architecture

```
/kb                               # KB Home
├── /                             # Recent pages, favorites, quick actions
├── /search                       # Search results
│   └── ?q=query                  # Query parameter
├── /new                          # Create new page
├── /verified                     # List of verified pages
├── /stale                        # Pages needing review
├── /[pageSlug]                   # Page view/edit
│   ├── /history                  # Version history
│   └── /comments                 # Page discussions
└── /settings                     # KB settings
    ├── /verification             # Verification policies
    ├── /rag                      # RAG configuration
    └── /templates                # Page templates
```

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header: Logo | Search | Notifications | User                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────────────────────────────────────┐   │
│  │                 │  │                                                 │   │
│  │  Page Tree      │  │  Page Content                                   │   │
│  │  ─────────────  │  │  ─────────────                                  │   │
│  │                 │  │                                                 │   │
│  │  📁 Getting     │  │  ┌─────────────────────────────────────────┐   │   │
│  │     Started     │  │  │ Breadcrumbs: KB / Getting Started / ... │   │   │
│  │    📄 Intro     │  │  └─────────────────────────────────────────┘   │   │
│  │    📄 Setup     │  │                                                 │   │
│  │                 │  │  ┌─────────────────────────────────────────┐   │   │
│  │  📁 Processes   │  │  │ [Verified Badge] [Connected Users: 2]    │   │   │
│  │    📄 Deploy    │  │  └─────────────────────────────────────────┘   │   │
│  │    📄 Review    │  │                                                 │   │
│  │                 │  │  # Deployment Process                           │   │
│  │  [+ New Page]   │  │                                                 │   │
│  │                 │  │  This document describes...                     │   │
│  │  ─────────────  │  │                                                 │   │
│  │                 │  │  ## Prerequisites                               │   │
│  │  Recent:        │  │                                                 │   │
│  │  • Deploy Guide │  │  - Node.js 18+                                  │   │
│  │  • API Docs     │  │  - Docker installed                             │   │
│  │  • Onboarding   │  │                                                 │   │
│  │                 │  │  Contact @john.doe for access.                  │   │
│  │                 │  │  Related: #PM-123                               │   │
│  │                 │  │                                                 │   │
│  └─────────────────┘  └─────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

```typescript
// Components needed
components/kb/
├── KBHome.tsx              # Home page with recent, favorites
├── PageTree.tsx            # Sidebar navigation tree
├── PageEditor.tsx          # Tiptap editor wrapper
├── PageHeader.tsx          # Title, breadcrumbs, actions
├── VerificationBadge.tsx   # Verified status indicator
├── ConnectedUsers.tsx      # Real-time presence
├── SearchResults.tsx       # Search results list
├── VersionHistory.tsx      # Version comparison
├── PageComments.tsx        # Threaded comments
├── MentionSuggestion.tsx   # @mention autocomplete
├── TaskReference.tsx       # #task reference autocomplete
└── PageLink.tsx            # [[page]] link autocomplete
```

---

## API Specification

### REST Endpoints

```yaml
/api/kb:
  /pages:
    GET:
      summary: List pages
      params:
        parentId?: string   # Filter by parent
        flat?: boolean      # Flat list vs tree
        search?: string     # FTS query
      response: Page[]

    POST:
      summary: Create page
      body:
        title: string
        parentId?: string
        content?: TiptapJSON
        linkedProducts?: string[]
      response: Page

  /pages/:id:
    GET:
      summary: Get page
      response: Page

    PUT:
      summary: Update page
      body:
        title?: string
        content?: TiptapJSON
        parentId?: string
      response: Page

    DELETE:
      summary: Soft delete page
      response: { success: true }

  /pages/:id/versions:
    GET:
      summary: List versions
      response: PageVersion[]

    POST:
      summary: Create version snapshot
      body:
        changeNote?: string
      response: PageVersion

  /pages/:id/versions/:version:
    GET:
      summary: Get specific version
      response: PageVersion

    POST:
      summary: Restore version
      response: Page

  /pages/:id/verify:
    POST:
      summary: Mark as verified
      body:
        expiresIn: '30d' | '60d' | '90d' | 'never'
      response: Page

    DELETE:
      summary: Remove verification
      response: Page

  /pages/:id/link:
    POST:
      summary: Link to product
      body:
        productId: string
        isPrimary?: boolean
      response: ProjectPage

    DELETE:
      summary: Unlink from product
      body:
        productId: string
      response: { success: true }

  /search:
    GET:
      summary: Full-text search
      params:
        q: string
        limit?: number
      response: SearchResult[]

  /search/semantic:
    POST:
      summary: Semantic search
      body:
        query: string
        topK?: number
      response: RAGResult[]

  /rag/query:
    POST:
      summary: RAG query with context
      body:
        query: string
        taskId?: string       # Optional: get context for task
        boostVerified?: boolean
      response:
        results: RAGResult[]
        formattedContext: string

  /stale:
    GET:
      summary: List stale pages
      response: Page[]

  /verified:
    GET:
      summary: List verified pages
      response: Page[]
```

### WebSocket Events

```typescript
// Emitted events
'kb.page.created'     // { pageId, title, parentId }
'kb.page.updated'     // { pageId, changes }
'kb.page.deleted'     // { pageId }
'kb.page.moved'       // { pageId, oldParentId, newParentId }
'kb.page.verified'    // { pageId, verifiedBy, expiresAt }
'kb.page.unverified'  // { pageId }

'kb.page.linked'      // { pageId, productId }
'kb.page.unlinked'    // { pageId, productId }

'kb.comment.created'  // { pageId, commentId, userId }
'kb.comment.deleted'  // { pageId, commentId }

// Subscribed events (from Hocuspocus)
'kb.presence.update'  // { pageId, users: [] }
```

---

## Integration Points

### PM Integration

```typescript
// 1. Project docs tab shows linked KB pages
// GET /api/pm/products/:id/docs
// Returns linked pages with ProjectPage.isPrimary

// 2. Task detail can link to KB page
// POST /api/pm/tasks/:id/links
// { type: 'kb_page', targetId: pageId }

// 3. Agents search KB for context
// POST /api/kb/rag/query
// { taskId: 'task_123' } // Gets context relevant to task

// 4. Scribe agent manages KB
// Uses all /api/kb/* endpoints via agent tools
```

### Event Bus Integration

```typescript
// Subscribe to PM events
'pm.project.completed' // → Scribe suggests knowledge capture
'pm.task.completed'    // → Auto-link if KB page mentioned

// Publish KB events
'kb.page.created'      // → Chrono logs activity
'kb.page.verified'     // → Analytics tracking
'kb.embedding.created' // → RAG index updated
```

### Scribe Agent Integration

```python
# Scribe tools that call KB APIs
scribe_tools = [
    create_kb_page,          # POST /api/kb/pages
    update_kb_page,          # PUT /api/kb/pages/:id
    search_kb,               # GET /api/kb/search
    query_rag,               # POST /api/kb/rag/query
    mark_verified,           # POST /api/kb/pages/:id/verify
    detect_stale_pages,      # GET /api/kb/stale
    summarize_page,          # Uses RAG + LLM
    suggest_structure,       # Analyzes page tree
    link_page_to_project,    # POST /api/kb/pages/:id/link
]
```

---

## Performance Requirements

### Latency Targets

| Operation | Target (P95) | Notes |
|-----------|--------------|-------|
| Page load | <400ms | Without Yjs sync |
| Yjs initial sync | <500ms | Including auth |
| Yjs update broadcast | <100ms | Real-time feel |
| FTS search | <300ms | PostgreSQL tsvector |
| Semantic search | <800ms | Embedding + vector search |
| RAG query (full) | <1.5s | Including LLM response |
| Save to DB | <200ms | Debounced from Yjs |
| Version snapshot | <500ms | Including content copy |

### Scalability Targets

| Dimension | MVP | Growth |
|-----------|-----|--------|
| Pages per workspace | 1,000 | 50,000 |
| Embeddings per tenant | 100,000 | 5,000,000 |
| Concurrent editors per page | 10 | 50 |
| Total Hocuspocus connections | 100 | 10,000 |
| Yjs document size | 1MB | 10MB |
| Page content size | 500KB | 5MB |

### Optimization Strategies

```typescript
// 1. Lazy-load page tree
// Only load immediate children, expand on demand

// 2. Debounce saves
// Hocuspocus saves every 5 seconds, not every keystroke

// 3. Paginate search results
// Return 20 results per page

// 4. Cache embeddings
// Don't regenerate if contentText unchanged

// 5. Connection pooling
// PgBouncer for high Hocuspocus concurrency

// 6. CDN for static content
// Exported/rendered pages can be cached
```

---

## Implementation Roadmap

### Phase 1: MVP Foundation (Week 6 of Core-PM)

| Task | Story Points | Dependencies |
|------|--------------|--------------|
| KnowledgePage Prisma model | 2 | None |
| PageVersion model | 1 | KnowledgePage |
| Page CRUD API | 3 | Models |
| Tiptap editor setup | 3 | None |
| Page tree navigation | 2 | CRUD API |
| Basic search (FTS) | 2 | ContentText index |
| ProjectPage linking | 2 | Product model |

**Total: 15 points (1 week)**

### Phase 2: Real-Time & RAG (Weeks 1-2 of Phase 2)

| Task | Story Points | Dependencies |
|------|--------------|--------------|
| Hocuspocus server setup | 3 | None |
| Yjs client integration | 3 | Hocuspocus |
| Cursor presence | 2 | Yjs |
| Offline support (IndexedDB) | 2 | Yjs |
| pgvector setup | 2 | PostgreSQL |
| Embedding generation | 3 | pgvector |
| RAG query service | 3 | Embeddings |
| Agent context API | 2 | RAG |

**Total: 20 points (2 weeks)**

### Phase 2: Verified Content & Polish (Weeks 3-4)

| Task | Story Points | Dependencies |
|------|--------------|--------------|
| Verification system | 3 | Page model |
| Expiration cron job | 2 | Verification |
| Stale page detection | 2 | None |
| @mentions extension | 3 | Tiptap |
| #task references | 2 | Tiptap |
| [[page]] links | 2 | Tiptap |
| Scribe agent setup | 3 | RAG |
| KB settings UI | 2 | None |

**Total: 19 points (2 weeks)**

### Phase 3: Advanced Features (Future)

| Feature | Estimated Points |
|---------|-----------------|
| AI page drafts | 5 |
| Smart summarization | 3 |
| Page comments | 5 |
| Diagram embed | 5 |
| Import (Notion/Confluence) | 8 |
| Export (Markdown/PDF) | 5 |
| KB analytics dashboard | 5 |

**Total: 36 points (Phase 3)**

---

## Related Documents

- [PRD.md](./PRD.md) - Full product requirements
- [architecture.md](./architecture.md) - Technical architecture
- [Platform Architecture](../../architecture.md) - Overall platform
- [RAG Patterns](../../research/rag-patterns.md) - RAG best practices

---

**Changelog:**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-16 | Initial KB specification |
