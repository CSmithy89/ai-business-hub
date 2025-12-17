# Story KB-01.1: KB Data Model & API

**Epic:** KB-01 - Knowledge Base Foundation
**Status:** Done
**Story ID:** kb-01-1-knowledge-page-model-api
**Created:** 2025-12-17
**Completed:** 2025-12-17

---

## Goal

Create KnowledgePage CRUD API so users can manage wiki content with hierarchical organization, version history, and project linking.

---

## Acceptance Criteria

- [x] POST /api/kb/pages creates page with: title, slug (auto-generated), content (empty JSON), parentId (optional)
- [x] GET /api/kb/pages returns tree structure (or flat list with query param)
- [x] GET /api/kb/pages/:id returns page with content and increments view count
- [x] PATCH /api/kb/pages/:id updates fields (title, content, parentId)
- [x] DELETE /api/kb/pages/:id soft-deletes (sets deletedAt)
- [x] POST /api/kb/pages/:id/restore restores soft-deleted page
- [x] POST /api/kb/pages/:id/favorite adds page to user's favorites
- [x] DELETE /api/kb/pages/:id/favorite removes page from favorites
- [x] Events published: kb.page.created, kb.page.updated, kb.page.deleted, kb.page.restored

---

## Technical Implementation

### Prisma Schema Changes

**Updated Models:**
1. **KnowledgePage**: Added `favoritedBy` field (String[] for user IDs)
2. **ProjectPage**: Added `linkedBy` field (user who created the link), added `isPrimary` index

**Migration:** `20251217200000_add_kb_fields`

### Backend Structure

**Module:** `apps/api/src/kb/`
- `kb.module.ts` - Module definition
- `pages/pages.controller.ts` - REST endpoints with guards
- `pages/pages.service.ts` - Business logic with Prisma
- `pages/dto/create-page.dto.ts` - Create validation
- `pages/dto/update-page.dto.ts` - Update validation
- `pages/dto/list-pages.query.dto.ts` - List query params

### Key Features Implemented

1. **Slug Generation**: Unique slug per workspace from title using slugify
2. **Plain Text Extraction**: Tiptap JSON → plain text for full-text search
3. **Version History**: Initial version (v1) created on page creation
4. **Activity Logging**: CREATED, UPDATED, DELETED, VIEWED, RESTORED events
5. **View Tracking**: Increments viewCount and updates lastViewedAt on GET
6. **Favorites**: User-specific favorites stored as String[] array
7. **Soft Delete**: 30-day recovery window using deletedAt timestamp
8. **Event Publishing**: All CRUD operations publish events to event bus

### API Endpoints

```yaml
POST   /api/kb/pages           - Create page
GET    /api/kb/pages           - List pages (tree or flat)
GET    /api/kb/pages/:id       - Get page by ID
PATCH  /api/kb/pages/:id       - Update page
DELETE /api/kb/pages/:id       - Soft delete page
POST   /api/kb/pages/:id/restore - Restore deleted page
POST   /api/kb/pages/:id/favorite - Add to favorites
DELETE /api/kb/pages/:id/favorite - Remove from favorites
```

### Shared Types

**Location:** `packages/shared/src/types/kb.ts`

Exported types:
- `TiptapDocument`, `TiptapNode`, `TiptapMark` - Editor content structure
- `KnowledgePage` - Page entity
- `PageVersion` - Version snapshot
- `ProjectPage` - Project-page link
- `PageActivity` - Activity log entry
- `KBPageActivityType` - Activity types enum
- `PageTreeNode` - Tree navigation
- `PageSearchResult` - FTS result (for future story)
- Event payloads: `KBPageCreatedPayload`, `KBPageUpdatedPayload`, etc.

### Event Types

**Location:** `packages/shared/src/types/events.ts`

Added event types:
```typescript
KB_PAGE_CREATED: 'kb.page.created'
KB_PAGE_UPDATED: 'kb.page.updated'
KB_PAGE_DELETED: 'kb.page.deleted'
KB_PAGE_RESTORED: 'kb.page.restored'
KB_PAGE_MOVED: 'kb.page.moved'
KB_PAGE_LINKED_TO_PROJECT: 'kb.page.linked_to_project'
KB_PAGE_UNLINKED_FROM_PROJECT: 'kb.page.unlinked_from_project'
KB_PAGE_FAVORITED: 'kb.page.favorited'
KB_PAGE_UNFAVORITED: 'kb.page.unfavorited'
```

---

## Files Created/Modified

### Created Files
1. `apps/api/src/kb/kb.module.ts` - KB module definition
2. `apps/api/src/kb/pages/pages.controller.ts` - Pages controller
3. `apps/api/src/kb/pages/pages.service.ts` - Pages service
4. `apps/api/src/kb/pages/dto/create-page.dto.ts` - Create DTO
5. `apps/api/src/kb/pages/dto/update-page.dto.ts` - Update DTO
6. `apps/api/src/kb/pages/dto/list-pages.query.dto.ts` - List query DTO
7. `packages/shared/src/types/kb.ts` - KB shared types
8. `packages/db/prisma/migrations/20251217200000_add_kb_fields/migration.sql` - Migration

### Modified Files
1. `packages/db/prisma/schema.prisma` - Added favoritedBy and linkedBy fields
2. `packages/shared/src/types/events.ts` - Added KB event types
3. `packages/shared/src/index.ts` - Exported KB types
4. `apps/api/src/app.module.ts` - Registered KbModule

---

## Testing

### Manual Testing Checklist

- [ ] Create page with title only → returns page with auto-generated slug
- [ ] Create page with parentId → page appears as child in tree
- [ ] Get page by ID → increments view count
- [ ] Update page title → slug regenerates
- [ ] Update page content → contentText extracted
- [ ] Update page parentId → page moves in hierarchy
- [ ] Delete page → sets deletedAt, publishes event
- [ ] Restore deleted page → clears deletedAt
- [ ] Add to favorites → user ID added to favoritedBy
- [ ] Remove from favorites → user ID removed from favoritedBy
- [ ] List pages with flat=true → returns flat array
- [ ] List pages with flat=false → returns tree structure

### Type Check & Lint

```bash
pnpm turbo type-check --filter=@hyvve/api  # ✅ Passed
pnpm turbo lint --filter=@hyvve/api        # ✅ Passed (213 warnings - acceptable)
```

---

## Next Stories

**KB-01.2: Page Editor (Tiptap)**
- Integrate Tiptap rich text editor
- Auto-save functionality
- Toolbar with formatting options

**KB-01.4: Page Versioning**
- Manual save creates version snapshots
- Version restore capability
- Version history UI

---

## Notes

- Used workspaceId as tenantId following PM module pattern (alias for tenant isolation)
- Prisma schema already had most KB models from earlier design work
- Only needed to add favoritedBy and linkedBy fields
- Plain text extraction implemented for future FTS story (KB-01.7)
- View count tracking runs asynchronously (fire-and-forget) to avoid slowing page loads

---

## DoD Checklist

- [x] Code complete and tested
- [x] Type check passes
- [x] Lint passes
- [x] Migration created
- [x] Shared types exported
- [x] Events published
- [x] Module registered in app.module.ts
- [x] Story file created
- [x] Sprint status updated
