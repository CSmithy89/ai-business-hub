# Story KB-01.2: Page Version History

**Epic:** KB-01 - Knowledge Base Foundation
**Story ID:** kb-01-2-page-versioning
**Status:** Done
**Points:** 5
**Type:** Feature
**Created:** 2025-12-17
**Completed:** 2025-12-17

---

## Description

Track page version history so users can see changes over time and restore previous versions. Every time a user manually saves a page (or marks it for version creation), a new PageVersion record is created with the content snapshot, version number, and optional change note.

---

## Acceptance Criteria

- [x] When page content is updated with `createVersion: true`, new PageVersion record created with content snapshot
- [x] GET /api/kb/pages/:id/versions returns version list (paginated, default 20, max 100)
- [x] GET /api/kb/pages/:id/versions/:version returns specific version with full content
- [x] POST /api/kb/pages/:id/versions creates manual version snapshot with optional changeNote
- [x] POST /api/kb/pages/:id/versions/:version/restore reverts page to that version
- [x] Version numbers auto-increment (1, 2, 3...) based on max version for page
- [x] Optional changeNote field (max 500 chars) for version description
- [x] Restored page creates new version (doesn't overwrite history)
- [x] Activity log records version restores with metadata

---

## Technical Implementation

### Backend Changes

#### New Files Created

1. **apps/api/src/kb/versions/versions.service.ts**
   - `createVersion()` - Creates new version snapshot with auto-incremented version number
   - `listVersions()` - Returns paginated list of versions for a page
   - `getVersion()` - Returns specific version by version number
   - `restoreVersion()` - Restores page to previous version and creates new version

2. **apps/api/src/kb/versions/versions.controller.ts**
   - `GET /api/kb/pages/:pageId/versions` - List all versions
   - `POST /api/kb/pages/:pageId/versions` - Create manual version snapshot
   - `GET /api/kb/pages/:pageId/versions/:version` - Get specific version
   - `POST /api/kb/pages/:pageId/versions/:version/restore` - Restore to version

3. **apps/api/src/kb/versions/dto/create-version.dto.ts**
   - Validation for creating version snapshots
   - Optional changeNote field (max 500 chars)

4. **apps/api/src/kb/versions/dto/list-versions.query.dto.ts**
   - Pagination parameters (limit, offset)
   - Defaults: limit=20, offset=0
   - Max limit: 100

#### Modified Files

1. **apps/api/src/kb/pages/dto/update-page.dto.ts**
   - Added `createVersion?: boolean` flag
   - Added `changeNote?: string` field for version notes

2. **apps/api/src/kb/pages/pages.service.ts**
   - Injected VersionsService via forwardRef
   - Modified `update()` method to detect content changes
   - Calls `versionsService.createVersion()` when `createVersion: true` and content changed
   - Passes changeNote to version creation

3. **apps/api/src/kb/kb.module.ts**
   - Registered VersionsController
   - Registered VersionsService
   - Added forwardRef provider for circular dependency resolution

### Key Implementation Details

**Version Auto-Increment:**
```typescript
const maxVersion = await prisma.pageVersion.findFirst({
  where: { pageId },
  orderBy: { version: 'desc' },
  select: { version: true },
})
const nextVersion = (maxVersion?.version || 0) + 1
```

**Content Change Detection:**
```typescript
const contentChanged = JSON.stringify(existing.content) !== JSON.stringify(dto.content)
if (dto.createVersion && contentChanged && dto.content) {
  await versionsService.createVersion(tenantId, workspaceId, id, actorId, dto.content, dto.changeNote)
}
```

**Restore with New Version:**
```typescript
// Update page with restored content
await tx.knowledgePage.update({
  where: { id: pageId },
  data: { content: versionToRestore.content, contentText: versionToRestore.contentText },
})

// Create new version after restore
await tx.pageVersion.create({
  data: {
    pageId,
    version: nextVersion,
    content: versionToRestore.content,
    contentText: versionToRestore.contentText,
    changeNote: `Restored from version ${versionNumber}`,
    createdById: actorId,
  },
})
```

**Activity Logging:**
```typescript
await tx.pageActivity.create({
  data: {
    pageId,
    userId: actorId,
    type: 'UPDATED',
    data: {
      restoredFromVersion: versionNumber,
      newVersion: nextVersion,
    },
  },
})
```

---

## API Endpoints

### List Versions
```
GET /api/kb/pages/:pageId/versions?limit=20&offset=0
```

**Response:**
```json
{
  "data": [
    {
      "id": "ver_abc123",
      "version": 3,
      "changeNote": "Updated deployment instructions",
      "createdById": "user_123",
      "createdAt": "2025-12-17T10:30:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

### Create Version
```
POST /api/kb/pages/:pageId/versions
Content-Type: application/json

{
  "changeNote": "Major refactor of architecture section"
}
```

### Get Version
```
GET /api/kb/pages/:pageId/versions/3
```

**Response:**
```json
{
  "data": {
    "id": "ver_abc123",
    "pageId": "page_123",
    "version": 3,
    "content": { "type": "doc", "content": [...] },
    "contentText": "Plain text...",
    "changeNote": "Updated deployment instructions",
    "createdById": "user_123",
    "createdAt": "2025-12-17T10:30:00Z"
  }
}
```

### Restore Version
```
POST /api/kb/pages/:pageId/versions/3/restore
```

**Response:**
```json
{
  "data": {
    "id": "page_123",
    "content": { "type": "doc", "content": [...] },
    "contentText": "Restored plain text...",
    "updatedAt": "2025-12-17T11:00:00Z"
  }
}
```

---

## Database Schema

The PageVersion model was already defined in the Prisma schema:

```prisma
model PageVersion {
  id      String @id @default(cuid())
  pageId  String @map("page_id")
  version Int

  // Content snapshot
  content     Json
  contentText String @map("content_text") @db.Text

  // Metadata
  changeNote  String? @map("change_note") @db.VarChar(500)
  createdById String  @map("created_by_id")
  createdAt   DateTime @default(now()) @map("created_at")

  page KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@unique([pageId, version])
  @@index([pageId])
  @@index([createdAt])
  @@map("page_versions")
}
```

---

## Testing

### Type Check
```bash
pnpm turbo type-check
# ✓ All packages pass type checking
```

### Lint
```bash
pnpm turbo lint
# ✓ All packages pass linting (warnings only for any types, acceptable for MVP)
```

### Manual Testing Scenarios

1. **Create Initial Version:**
   - Create page with POST /api/kb/pages
   - Verify version 1 created automatically

2. **Create Manual Version:**
   - Update page with `createVersion: true`
   - Verify new version created with incremented number
   - Verify changeNote stored

3. **List Versions:**
   - GET /api/kb/pages/:id/versions
   - Verify versions returned in descending order (newest first)
   - Verify pagination works

4. **Get Specific Version:**
   - GET /api/kb/pages/:id/versions/2
   - Verify full content returned

5. **Restore Version:**
   - POST /api/kb/pages/:id/versions/2/restore
   - Verify page content updated
   - Verify new version created with "Restored from version X" note
   - Verify activity logged

6. **Error Cases:**
   - Restore to non-existent version → 404
   - Restore to identical content → 400 (no change)
   - Create version for non-existent page → 404

---

## Frontend Integration Notes

While this story focused on the backend API, the frontend will need:

1. **Version History Page** (`/kb/[pageSlug]/history`)
   - List all versions with timestamps and change notes
   - "View" button to see version content
   - "Restore" button to revert to version

2. **Page Editor Updates**
   - Manual "Save Version" button
   - Optional change note input field
   - Indicator when versions are created

3. **Version Comparison** (future enhancement)
   - Diff view between versions
   - Highlight changed sections

---

## Performance Considerations

- Version creation is async after page update (fire-and-forget if it fails)
- Version lists are paginated (default 20, max 100)
- Indexes on `pageId` and `createdAt` ensure fast queries
- Content stored as JSON for efficient storage and retrieval

---

## Security

- All endpoints protected by AuthGuard, TenantGuard, RolesGuard
- Tenant isolation enforced on all queries
- Users need 'member' role minimum to view versions
- Users need 'member' role to restore versions (consider restricting to 'admin' in production)

---

## Known Limitations

- No diff/comparison between versions (Phase 2)
- No bulk version operations (Phase 2)
- No version retention policy (30 days? 100 versions max?) (Phase 2)
- Change notes are optional (consider making required for manual saves)

---

## Related Documentation

- Epic: `docs/modules/bm-pm/epics/epic-kb-01-tech-spec.md`
- Schema: `packages/db/prisma/schema.prisma`
- Architecture: `docs/modules/bm-pm/architecture.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-17 | Story completed - Backend API implemented | Claude |

---

## Notes

This story implements the core version history functionality. Future enhancements could include:

- Version comparison/diff view
- Version branching/forking
- Version retention policies
- Bulk version operations
- Version labels/tags
- Version approval workflows

The implementation follows the pattern established in PM-01 for service/controller structure and uses the same guards and validation patterns for consistency.
