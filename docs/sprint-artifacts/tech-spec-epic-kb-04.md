# Epic Technical Specification: AI-Native Knowledge Base

Date: 2025-12-21
Author: chris
Epic ID: kb-04
Status: Draft

---

## Overview

Epic KB-04 delivers AI-native Knowledge Base features defined in the PRD Phase 3 "AI-Native KB Features" (KB-F8). It builds on the KB foundation (KB-01), RAG/semantic search (KB-02), and the Scribe agent and verification workflows (KB-03). The goal is to accelerate documentation creation and retrieval via AI drafts, summarization, Q&A, knowledge extraction, gap detection, and reusable templates, while preserving human review and source attribution.

## Objectives and Scope

In scope:
- AI page draft generation from context with citations, surfaced in the editor for human review.
- Smart summarization (TL;DR + key points) with optional insertion at the top of a page.
- KB Q&A chat powered by RAG with cited sources and conversational continuity.
- Knowledge extraction from completed tasks into suggested KB drafts (human approval required).
- Gap detection for missing or outdated documentation with suggested pages.
- KB page templates (Meeting Notes, Decision Record, Process Doc, Technical Spec) plus custom templates.

Out of scope:
- Advanced RAG features (multi-modal embeddings, fine-tuning, cross-workspace federation).
- KB governance, permissions, and external KB sync (planned in other Phase 3 epics).
- Changes to real-time collaboration (Yjs/Hocuspocus) beyond existing KB features.
- New platform-wide tenancy model changes (workspaceId remains the isolation boundary).

## System Architecture Alignment

- Uses existing KB domain in `apps/api/src/kb` (pages, search, rag, verification, embeddings) and the Postgres + pgvector RAG pipeline described in `docs/modules/bm-pm/architecture.md`.
- AI features route through the Scribe agent (`agents/platform/scribe`), which already supports drafting, summarization, RAG query, and stale detection workflows.
- UI integration lives in the Next app (`apps/web`) using the KB editor (Tiptap + Yjs) and wireframes for Scribe panel (KB-10), Q&A chat (KB-13), templates (KB-12), and analytics (KB-14 where applicable).
- All operations remain workspace-scoped (`workspaceId` with `tenantId` alias where required).

## Detailed Design

### Services and Modules

- **API: KB Pages (`apps/api/src/kb/pages`)**
  - Responsibilities: CRUD for pages, favorites, related pages, and mention extraction.
  - Inputs: `CreatePageDto`, `UpdatePageDto`, query params (search/tree).
  - Outputs: page payloads with content and metadata.

- **API: Search (`apps/api/src/kb/search`)**
  - Responsibilities: full-text search and semantic search.
  - Inputs: `SearchQueryDto`, `SemanticSearchDto` (`q`, `limit`, `offset`).
  - Outputs: ranked search results with snippets and scores.

- **API: RAG (`apps/api/src/kb/rag`)**
  - Responsibilities: RAG query execution against embeddings.
  - Inputs: `RagQueryDto` (`q`, `limit`, `pageIds`).
  - Outputs: ranked chunks + page metadata for AI responses.

- **API: Verification (`apps/api/src/kb/verification`)**
  - Responsibilities: stale-page detection and verification actions.
  - Inputs: admin role + query params.
  - Outputs: stale page lists and verification results.

- **Embeddings Pipeline (`apps/api/src/kb/embeddings`)**
  - Responsibilities: chunking, embedding generation, pgvector storage.
  - Inputs: page content text and workspace embeddings configuration.
  - Outputs: `PageEmbedding` rows for semantic search and RAG.

- **Agent: Scribe (`agents/platform/scribe`)**
  - Responsibilities: draft generation, summarization, Q&A, gap detection, and extraction suggestions.
  - Interfaces: `create_kb_page`, `update_kb_page`, `search_kb`, `query_rag`, `ask_kb_question`, `summarize_page`, `detect_stale_pages`, `analyze_kb_structure`.

- **Web UI (`apps/web`)**
  - Responsibilities: AI Draft action in editor, Summarize action, Q&A chat surface, template picker, gap analysis views.
  - Uses KB wireframes: KB-10 (Scribe), KB-12 (Templates), KB-13 (Q&A), KB-14 (Analytics if needed for gap reporting).

### Data Models and Contracts

- **KnowledgePage** (existing)
  - Fields: `id`, `workspaceId`, `parentId`, `title`, `slug`, `content` (Tiptap JSON), `contentText`, `isVerified`, `verifiedAt`, `verifiedById`, `verifyExpires`, `ownerId`, `viewCount`, `lastViewedAt`, `yjsState`, `createdAt`, `updatedAt`, `deletedAt`.
  - Planned extension for templates (from epic notes): `isTemplate` boolean to mark template pages.

- **PageVersion** (existing)
  - Fields: `id`, `pageId`, `version`, `content`, `contentText`, `changeNote`, `createdById`, `createdAt`.

- **PageEmbedding** (existing)
  - Fields: `id`, `pageId`, `chunkIndex`, `chunkText`, `embedding`, `embeddingModel`, `createdAt`.

- **ProjectPage** (existing join table)
  - Fields: `projectId`, `pageId`, `isPrimary`, `createdAt`.

- **Task data (PM domain)**
  - Used for knowledge extraction and gap detection (source data for completed tasks and frequent questions).

### APIs and Interfaces

- **Pages**
  - `POST /api/kb/pages` create page (title, content, parentId).
  - `GET /api/kb/pages` list pages (tree, search query).
  - `PATCH /api/kb/pages/:id` update page (title/content, mention processing).
  - `GET /api/kb/pages/:id` fetch page details.
  - `GET /api/kb/pages/:id/related` related page suggestions.

- **Search**
  - `GET /api/kb/search` full-text search (`q`, `limit`, `offset`).
  - `POST /api/kb/search/semantic` semantic search (`q`, `limit`, `offset`).

- **RAG**
  - `POST /api/kb/rag/query` RAG query (`q`, `limit`, `pageIds`).

- **Verification / Stale**
  - `GET /api/kb/verification/stale` list stale pages (admin).

- **Agent Interfaces (Scribe)**
  - `create_kb_page`, `update_kb_page` for draft suggestions.
  - `summarize_page` for TL;DR + key points.
  - `query_rag` and `ask_kb_question` for Q&A and citations.
  - `detect_stale_pages` and `analyze_kb_structure` for gap detection inputs.

### Workflows and Sequencing

1. **AI Draft Generation**
   - User triggers "AI Draft" in KB editor or Scribe panel.
   - Scribe uses project context + existing KB (RAG results) to produce draft content with citations.
   - Draft is injected into editor for review/edit before publish.

2. **Smart Summarization**
   - User clicks "Summarize" on a long page.
   - Scribe retrieves page content and generates TL;DR + key points.
   - User can insert summary block at top; summary is re-generated when page changes.

3. **Q&A Chat**
   - User opens KB chat and asks a question.
   - Scribe performs semantic search / RAG query and responds with citations.
   - Conversation history maintains context; return "Not found" when retrieval is empty.

4. **Knowledge Extraction**
   - On task completion, Scribe analyzes task content for knowledge value.
   - If criteria met, propose a draft KB page pre-filled with task details.
   - Human approval required before creation.

5. **Gap Detection**
   - User runs gap analysis from KB admin or Scribe panel.
   - Scribe cross-references task discussions, search logs (if available), and stale pages.
   - Output: missing topics, unanswered questions, and outdated pages with suggested actions.

6. **KB Templates**
   - User selects a template when creating a new page.
   - Template page content is copied into the new page (structure + placeholders).
   - Custom templates are created by saving a page as a template.

## Non-Functional Requirements

### Performance
- RAG query latency target: < 1s P95 (from architecture doc).
- KB page load target: < 400ms P95 (from architecture doc).
- Search rate limit: 30 requests per minute per user (current controller guard).

### Security
- All endpoints guarded by AuthGuard + TenantGuard; role checks for admin-only actions.
- Workspace isolation via `workspaceId` (tenantId alias where needed).
- Human approval required for any AI-authored content changes (Scribe prompt contract).

### Reliability/Availability
- AI features must degrade gracefully when BYOAI provider is unavailable (return actionable errors).
- Summarization and Q&A should not block normal page read/edit flows.

### Observability
- Use existing NestJS `Logger` in controllers and services for RAG/search queries.
- Track AI feature usage metrics (drafts, summaries, Q&A sessions, gap runs) via existing metrics pipeline.

## Dependencies and Integrations

- Postgres + pgvector extension for embeddings storage (KB spec).
- Prisma models for `KnowledgePage`, `PageEmbedding`, `PageVersion`, `ProjectPage`.
- BYOAI provider via `ByoaiService` for embeddings and LLM calls.
- Tiptap + Yjs for KB content and collaboration.
- Agno/AgentOS runtime for Scribe tools and execution.

## Acceptance Criteria (Authoritative)

1. When a user clicks "AI Draft" and describes what they need, Scribe generates a page draft.
2. The AI draft appears in the editor for review/edit before publishing.
3. Drafts include source citations when based on existing KB content.
4. When viewing a long page, clicking "Summarize" generates a TL;DR summary.
5. The summary can be inserted at the top of the page.
6. The summary includes a key points bullet list.
7. When a user opens KB chat and asks a question, the AI answers using KB content.
8. Q&A responses include source citations with links.
9. Follow-up questions maintain conversation context.
10. If no relevant content is found, the system responds with "Not found".
11. When a task with meaningful content is completed, Scribe detects a knowledge opportunity.
12. Scribe suggests creating a KB page from task content and provides a pre-filled draft.
13. Knowledge extraction requires human approval before creation.
14. Running gap analysis shows: undocumented topics, frequently asked topics without pages, and outdated pages.
15. Gap analysis output includes suggestions for new pages.
16. When creating a new page, users can select a template to pre-fill structure/headings/placeholders.
17. Templates include Meeting Notes, Decision Record, Process Doc, and Technical Spec.
18. Users can create custom templates.

## Traceability Mapping

| AC # | Spec Section | Components / APIs | Test Idea |
| --- | --- | --- | --- |
| 1-3 | Workflows: AI Draft | Scribe tools + `/api/kb/pages` | Simulate AI draft request; verify draft + citations in editor. |
| 4-6 | Workflows: Summarization | `summarize_page` + `/api/kb/pages/:id` | Summarize long page; assert TL;DR + key points insertion. |
| 7-10 | Workflows: Q&A Chat | `/api/kb/rag/query`, `/api/kb/search/semantic` | Ask known/unknown questions; verify citations and "Not found" response. |
| 11-13 | Workflows: Knowledge Extraction | Task completion event + Scribe `create_kb_page` | Complete task with rich content; ensure draft suggestion and approval gate. |
| 14-15 | Workflows: Gap Detection | `/api/kb/verification/stale`, search logs | Run gap analysis; verify missing/outdated page list and suggestions. |
| 16-18 | Workflows: KB Templates | `KnowledgePage` template flag + UI | Create page from template; verify structure and custom template creation. |

## Risks, Assumptions, Open Questions

- [Risk] Sprint status story list does not match the KB-04 epic doc (story titles differ); confirm authoritative story set before implementation.
- [Risk] `ask_kb_question` tool calls `/api/kb/ask` but no matching API controller is present; decide whether to add endpoint or map to `/api/kb/rag/query`.
- [Question] Where should summaries and template metadata be stored (new fields vs. separate tables)?
- [Assumption] KB-03.7 (Scribe agent foundation) and KB-02.8 (related pages) are complete and stable.
- [Question] What event or signal defines "task completed" for knowledge extraction, and what heuristic defines "significant" content?
- [Risk] Gap detection relies on task/search analytics not fully specified; may need instrumentation additions.

## Test Strategy Summary

- **API tests (Nest):** cover `/api/kb/rag/query`, `/api/kb/search/semantic`, and stale page endpoints with workspace scoping.
- **Agent tool tests:** validate Scribe tools return drafts, summaries, and gap lists deterministically (mock API responses).
- **UI tests (Vitest/Playwright):** AI Draft button flow, Summarize insert, Q&A chat with citations, template selection and custom template save.
- **Regression tests:** ensure AI features do not break existing KB page CRUD, search, or verification flows.
