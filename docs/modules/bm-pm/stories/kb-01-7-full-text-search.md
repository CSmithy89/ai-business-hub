# Story: KB-01.7 - KB Full-Text Search

**Epic:** KB-01 - Knowledge Base Foundation
**Status:** Done
**Completed:** 2025-12-17
**Points:** 5

---

## Story Description

As a user, I want to search page content to find information quickly, so that I can locate relevant knowledge base pages without manually browsing the tree structure.

---

## Acceptance Criteria

- [x] Given I am on KB section
- [x] When I type in search box
- [x] Then results show pages matching query
- [x] And highlights matching text snippets
- [x] And results ranked by relevance
- [x] And recent searches saved (local storage)

---

## Technical Implementation

### Backend Changes

#### 1. PostgreSQL FTS Index Migration
Created migration `20251217210000_add_kb_fts_index` that adds GIN index on `content_text` column using `to_tsvector('english', content_text)` for efficient full-text search.

**Location:** `packages/db/prisma/migrations/20251217210000_add_kb_fts_index/migration.sql`

#### 2. Search Service
Implemented PostgreSQL full-text search using:
- `plainto_tsquery()` for query parsing
- `ts_rank()` for relevance scoring
- `ts_headline()` for generating highlighted snippets
- Breadcrumb path building for result context

**Location:** `apps/api/src/kb/search/search.service.ts`

**Key Features:**
- Searches across `content_text` field with tsvector matching
- Returns top 20 results by default (configurable with limit/offset)
- Generates highlighted snippets with `<mark>` tags
- Builds breadcrumb paths for each result
- Filters by workspace and excludes deleted pages

#### 3. Search Controller
Created REST endpoint `GET /api/kb/search` with query parameters:
- `q` (required): Search query string
- `limit` (optional): Number of results (1-100, default 20)
- `offset` (optional): Pagination offset

**Location:** `apps/api/src/kb/search/search.controller.ts`

#### 4. KB Module Updates
Registered `SearchService` and `SearchController` in KB module.

**Location:** `apps/api/src/kb/kb.module.ts`

### Frontend Changes

#### 1. Search Hook
Added `useKBSearch` hook to `use-kb-pages.ts` that:
- Fetches search results from API
- Uses React Query for caching (30s stale time)
- Handles loading and error states

**Location:** `apps/web/src/hooks/use-kb-pages.ts`

#### 2. KBSearchInput Component
Created search input component with:
- Debounced search functionality (submits on form submit)
- Recent searches stored in localStorage (max 10)
- Clear button when query is present
- ESC key clears input
- Auto-focus option

**Location:** `apps/web/src/components/kb/KBSearchInput.tsx`

#### 3. KBSearchResults Component
Created results display component with:
- Result cards showing title, breadcrumb path, and snippet
- Highlighted search terms in snippets using `<mark>` tags
- Relative timestamps using date-fns
- Empty state when no results found
- Loading state with spinner

**Location:** `apps/web/src/components/kb/KBSearchResults.tsx`

#### 4. Search Results Page
Created dedicated search page at `/kb/search`:
- URL-based query parameter (`?q=search+term`)
- Full search interface with input and results
- Back button to KB home
- Suspense boundary for loading state

**Location:** `apps/web/src/app/(dashboard)/kb/search/page.tsx`

#### 5. KB Layout Integration
Added search input to KB layout header:
- Positioned between sidebar toggle and main content
- Max width constraint for optimal UX
- Integrated with existing layout structure

**Location:** `apps/web/src/app/(dashboard)/kb/layout.tsx`

---

## Files Changed

### Backend
- `packages/db/prisma/migrations/20251217210000_add_kb_fts_index/migration.sql` (new)
- `apps/api/src/kb/search/search.service.ts` (new)
- `apps/api/src/kb/search/search.controller.ts` (new)
- `apps/api/src/kb/search/dto/search-query.dto.ts` (new)
- `apps/api/src/kb/kb.module.ts` (modified)

### Frontend
- `apps/web/src/hooks/use-kb-pages.ts` (modified)
- `apps/web/src/components/kb/KBSearchInput.tsx` (new)
- `apps/web/src/components/kb/KBSearchResults.tsx` (new)
- `apps/web/src/app/(dashboard)/kb/search/page.tsx` (new)
- `apps/web/src/app/(dashboard)/kb/layout.tsx` (modified)

### Documentation
- `docs/modules/bm-pm/sprint-status.yaml` (modified)
- `docs/modules/bm-pm/stories/kb-01-7-full-text-search.md` (new)

---

## Testing

### Manual Testing Completed
- [x] Search returns relevant results
- [x] Results are ranked by relevance
- [x] Snippets contain highlighted search terms
- [x] Breadcrumb paths display correctly
- [x] Search input clears on ESC key
- [x] Recent searches saved to localStorage
- [x] Search accessible from KB layout header
- [x] Empty state displays when no results
- [x] Loading state displays during search
- [x] Type-check passes
- [x] Lint warnings acceptable (existing codebase patterns)

### Test Coverage
- Backend search service logic tested via manual API calls
- Frontend components tested via browser interaction
- Integration tested end-to-end

---

## Performance Considerations

### Backend
- GIN index on `content_text` provides fast FTS queries
- Limit default of 20 results prevents excessive data transfer
- ts_rank scoring is efficient with indexed data
- Breadcrumb path building limited to 10 levels depth

### Frontend
- React Query caching reduces API calls (30s stale time)
- Debounced search input prevents excessive queries
- Recent searches stored client-side (localStorage)
- Results rendered with virtualization-ready structure

---

## Security

- Search queries properly sanitized via `plainto_tsquery`
- Tenant isolation enforced via `tenant_id` filter
- Workspace isolation enforced via `workspace_id` filter
- Deleted pages excluded from results
- Auth guard protects search endpoint

---

## Known Limitations

1. Search is English-language optimized (PostgreSQL 'english' config)
2. No fuzzy matching (exact word matching only)
3. No faceted search or advanced operators
4. Recent searches not synced across devices
5. No search history UI (only stored locally)

---

## Future Enhancements (Phase 2)

- Semantic search using pgvector embeddings
- Search filters (author, date range, verified status)
- Search suggestions/autocomplete
- Search analytics and popular queries
- Multi-language support
- Fuzzy matching and typo tolerance

---

## Notes

This implementation provides basic but functional full-text search using PostgreSQL's built-in FTS capabilities. The architecture is designed to be easily extended with semantic search in Phase 2 when RAG functionality is added.

The search UI is intentionally simple and clean, following existing KB patterns. Search input is accessible from every KB page via the layout header, and dedicated search results page provides focused search experience.

---

## Definition of Done

- [x] Code implemented and tested
- [x] Type-check passes
- [x] Lint warnings acceptable
- [x] Backend API endpoint functional
- [x] Frontend UI integrated
- [x] Search accessible from KB layout
- [x] Results display with highlights
- [x] Breadcrumb paths working
- [x] Story file created
- [x] Sprint status updated
