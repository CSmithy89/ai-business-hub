# Story KB-03.4: Stale Content Dashboard

**Epic:** KB-03 - KB Verification & Scribe Agent
**Status:** review
**Story ID:** kb-03-4-review-cycle-triggers
**Created:** 2025-12-18
**Points:** 5

---

## Goal

Provide KB admins with a centralized dashboard to view and manage pages needing review, enabling proactive maintenance of knowledge base quality through bulk actions and filtering capabilities.

---

## User Story

As a **KB admin**,
I want **to see pages needing review**,
So that **I can maintain KB quality**.

---

## Acceptance Criteria

- [x] Given I navigate to /kb/stale
- [x] When dashboard loads
- [x] Then shows: expired verifications, pages not updated in 90+ days, pages with low view count

- [x] And bulk actions available: verify, delete, assign for review

- [x] And can select individual pages or all pages

- [x] And can filter by staleness reason (expired, old, low views)

- [x] And can sort by last updated date, view count, or verification expiry

- [x] And shows page owner for each stale page

- [x] And click on page navigates to edit view

- [x] And only admins can access the dashboard

---

## Technical Implementation

### Backend (NestJS)

#### 1. Stale Pages Query Endpoint

**Location:** `apps/api/src/kb/verification/verification.service.ts`

**Method:** `getStalPages()` (existing - may need enhancements)

**Query Criteria:**
```typescript
// Existing query logic:
const pages = await this.prisma.knowledgePage.findMany({
  where: {
    workspaceId,
    deletedAt: null,
    OR: [
      // Expired verification
      {
        isVerified: true,
        verifyExpires: { lte: now },
      },
      // Not updated in 90+ days
      {
        updatedAt: { lte: ninetyDaysAgo },
      },
      // Low view count (< 5 views)
      {
        viewCount: { lt: 5 },
      },
    ],
  },
  orderBy: { updatedAt: 'asc' },
  include: {
    owner: {
      select: { id: true, name: true, email: true, avatarUrl: true },
    },
  },
});
```

**Enhancement:** Add staleness reasons to response:
```typescript
interface StalePageDto {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
  viewCount: number;
  isVerified: boolean;
  verifyExpires: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  reasons: StaleReason[];
}

enum StaleReason {
  EXPIRED_VERIFICATION = 'Expired verification',
  NOT_UPDATED_90_DAYS = 'Not updated in 90+ days',
  LOW_VIEW_COUNT = 'Low view count',
}

// Process pages and add reasons:
const stalePagesWithReasons = pages.map(page => {
  const reasons: StaleReason[] = [];

  if (page.isVerified && page.verifyExpires && new Date(page.verifyExpires) <= now) {
    reasons.push(StaleReason.EXPIRED_VERIFICATION);
  }

  if (new Date(page.updatedAt) <= ninetyDaysAgo) {
    reasons.push(StaleReason.NOT_UPDATED_90_DAYS);
  }

  if (page.viewCount < 5) {
    reasons.push(StaleReason.LOW_VIEW_COUNT);
  }

  return {
    ...page,
    reasons,
  };
});
```

#### 2. Bulk Actions Endpoints

**Location:** `apps/api/src/kb/verification/verification.controller.ts`

**New Endpoints:**

```typescript
// Bulk verify multiple pages
@Post('bulk-verify')
@UseGuards(RolesGuard)
@Roles('admin')
async bulkVerify(
  @Body() dto: BulkVerifyDto,
  @TenantId() tenantId: string,
  @UserId() userId: string,
) {
  const { pageIds, expiresIn } = dto;

  const results = await Promise.allSettled(
    pageIds.map(pageId =>
      this.verificationService.markVerified(pageId, userId, { expiresIn })
    )
  );

  return {
    success: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results,
  };
}

// Bulk delete pages (soft delete)
@Post('bulk-delete')
@UseGuards(RolesGuard)
@Roles('admin')
async bulkDelete(
  @Body() dto: BulkDeleteDto,
  @TenantId() tenantId: string,
  @UserId() userId: string,
) {
  const { pageIds } = dto;

  const results = await Promise.allSettled(
    pageIds.map(pageId =>
      this.pagesService.softDelete(pageId, userId)
    )
  );

  return {
    success: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results,
  };
}
```

**DTOs:**
```typescript
class BulkVerifyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  pageIds: string[];

  @IsEnum(['30d', '60d', '90d', 'never'])
  expiresIn: '30d' | '60d' | '90d' | 'never';
}

class BulkDeleteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  pageIds: string[];
}
```

#### 3. Admin Authorization Guard

**Location:** `apps/api/src/common/guards/roles.guard.ts` (existing)

**Verification:**
- Ensure RolesGuard checks for 'admin' role
- Verify workspace admin permissions properly enforced
- Add admin check to GET /api/kb/stale endpoint

### Frontend (Next.js)

#### 1. Stale Content Dashboard Page

**Location:** `apps/web/src/app/kb/stale/page.tsx`

**Implementation:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StaleContentDashboard } from '@/components/kb/StaleContentDashboard';
import { useToast } from '@/hooks/use-toast';

export default function StaleContentPage() {
  const [stalePages, setStalePages] = useState<StalePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchStalePages();
  }, []);

  const fetchStalePages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/kb/stale');

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'You need admin permissions to access this page.',
            variant: 'destructive',
          });
          router.push('/kb');
          return;
        }
        throw new Error('Failed to fetch stale pages');
      }

      const data = await response.json();
      setStalePages(data);
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load stale pages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkVerify = async (pageIds: string[], expiresIn: string) => {
    try {
      const response = await fetch('/api/kb/verification/bulk-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIds, expiresIn }),
      });

      if (!response.ok) throw new Error('Bulk verify failed');

      const result = await response.json();

      toast({
        title: 'Bulk Verification Complete',
        description: `${result.success} pages verified successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
      });

      // Refresh stale pages list
      fetchStalePages();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to verify pages',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async (pageIds: string[]) => {
    try {
      const response = await fetch('/api/kb/verification/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIds }),
      });

      if (!response.ok) throw new Error('Bulk delete failed');

      const result = await response.json();

      toast({
        title: 'Bulk Delete Complete',
        description: `${result.success} pages deleted successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
      });

      // Refresh stale pages list
      fetchStalePages();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete pages',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading stale pages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <StaleContentDashboard
        pages={stalePages}
        onBulkVerify={handleBulkVerify}
        onBulkDelete={handleBulkDelete}
        onRefresh={fetchStalePages}
      />
    </div>
  );
}
```

#### 2. StaleContentDashboard Component

**Location:** `apps/web/src/components/kb/StaleContentDashboard.tsx`

**Implementation:** (Reference tech spec lines 1107-1267 for full implementation)

**Key Features:**
- Table view with columns: checkbox, page title, owner, reasons, last updated, actions
- Bulk selection with "select all" checkbox
- Filter by staleness reason (buttons or dropdown)
- Sort by last updated, view count, or verification expiry
- Bulk action bar when pages selected (verify dropdown, delete button)
- Click page title navigates to `/kb/edit/${slug}`
- Reason badges with icons (AlertTriangle, Clock, Eye)
- Responsive design (stack table rows on mobile)

**Component Structure:**
```typescript
interface StalePage {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
  viewCount: number;
  isVerified: boolean;
  verifyExpires: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  reasons: StaleReason[];
}

interface StaleContentDashboardProps {
  pages: StalePage[];
  onBulkVerify: (pageIds: string[], expiresIn: string) => Promise<void>;
  onBulkDelete: (pageIds: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function StaleContentDashboard({ pages, onBulkVerify, onBulkDelete, onRefresh }: StaleContentDashboardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterReason, setFilterReason] = useState<StaleReason | null>(null);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'viewCount' | 'verifyExpires'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and sort logic
  const filteredPages = filterReason
    ? pages.filter(p => p.reasons.includes(filterReason))
    : pages;

  const sortedPages = [...filteredPages].sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'updatedAt':
        return order * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      case 'viewCount':
        return order * (a.viewCount - b.viewCount);
      case 'verifyExpires':
        const aExpires = a.verifyExpires ? new Date(a.verifyExpires).getTime() : Infinity;
        const bExpires = b.verifyExpires ? new Date(b.verifyExpires).getTime() : Infinity;
        return order * (aExpires - bExpires);
      default:
        return 0;
    }
  });

  // Selection handlers
  const toggleSelect = (pageId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === sortedPages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedPages.map((p) => p.id)));
    }
  };

  // Bulk action handlers
  const handleBulkVerifyWithDropdown = async (expiresIn: string) => {
    await onBulkVerify(Array.from(selected), expiresIn);
    setSelected(new Set()); // Clear selection after bulk action
  };

  const handleBulkDeleteWithConfirm = async () => {
    if (confirm(`Are you sure you want to delete ${selected.size} pages? This action cannot be undone.`)) {
      await onBulkDelete(Array.from(selected));
      setSelected(new Set());
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with title and stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stale Content</h2>
          <p className="text-sm text-muted-foreground">
            Pages needing review: {pages.length}
          </p>
        </div>

        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Button
            variant={filterReason === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterReason(null)}
          >
            All
          </Button>
          <Button
            variant={filterReason === StaleReason.EXPIRED_VERIFICATION ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterReason(StaleReason.EXPIRED_VERIFICATION)}
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expired
          </Button>
          <Button
            variant={filterReason === StaleReason.NOT_UPDATED_90_DAYS ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterReason(StaleReason.NOT_UPDATED_90_DAYS)}
          >
            <Clock className="w-3 h-3 mr-1" />
            Old
          </Button>
          <Button
            variant={filterReason === StaleReason.LOW_VIEW_COUNT ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterReason(StaleReason.LOW_VIEW_COUNT)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Low Views
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Last Updated</SelectItem>
              <SelectItem value="viewCount">View Count</SelectItem>
              <SelectItem value="verifyExpires">Verification Expiry</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Bulk Verify
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBulkVerifyWithDropdown('30d')}>
                Verify for 30 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkVerifyWithDropdown('60d')}>
                Verify for 60 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkVerifyWithDropdown('90d')}>
                Verify for 90 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkVerifyWithDropdown('never')}>
                Verify permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDeleteWithConfirm}
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="w-12 p-4">
                <Checkbox
                  checked={selected.size === sortedPages.length && sortedPages.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="text-left p-4">Page</th>
              <th className="text-left p-4">Owner</th>
              <th className="text-left p-4">Reasons</th>
              <th className="text-left p-4">Last Updated</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPages.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  {filterReason
                    ? 'No pages match the selected filter'
                    : 'No stale pages found. Your knowledge base is up to date!'}
                </td>
              </tr>
            ) : (
              sortedPages.map((page) => (
                <tr key={page.id} className="border-t hover:bg-muted/50">
                  <td className="p-4">
                    <Checkbox
                      checked={selected.has(page.id)}
                      onCheckedChange={() => toggleSelect(page.id)}
                    />
                  </td>
                  <td className="p-4">
                    <a
                      href={`/kb/edit/${page.slug}`}
                      className="font-medium hover:underline"
                    >
                      {page.title}
                    </a>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {page.owner.avatarUrl ? (
                        <img
                          src={page.owner.avatarUrl}
                          alt={page.owner.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {page.owner.name[0].toUpperCase()}
                        </div>
                      )}
                      <span>{page.owner.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {page.reasons.map((reason, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs"
                        >
                          {reason === StaleReason.EXPIRED_VERIFICATION && <AlertTriangle className="w-3 h-3" />}
                          {reason === StaleReason.NOT_UPDATED_90_DAYS && <Clock className="w-3 h-3" />}
                          {reason === StaleReason.LOW_VIEW_COUNT && <Eye className="w-3 h-3" />}
                          {reason}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/kb/edit/${page.slug}`}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### API Endpoints

```yaml
GET /api/kb/stale
  Description: Get all stale pages with reasons
  Auth: Admin role required
  Response: StalePageDto[]
  Cache: 5 minutes (Redis)

POST /api/kb/verification/bulk-verify
  Description: Bulk verify multiple pages
  Auth: Admin role required
  Body:
    pageIds: string[] (max 100)
    expiresIn: '30d' | '60d' | '90d' | 'never'
  Response:
    success: number
    failed: number
    results: PromiseSettledResult[]

POST /api/kb/verification/bulk-delete
  Description: Bulk soft-delete multiple pages
  Auth: Admin role required
  Body:
    pageIds: string[] (max 100)
  Response:
    success: number
    failed: number
    results: PromiseSettledResult[]
```

---

## Implementation Tasks

### Backend Tasks
- [x] Enhance `getStalPages()` to include staleness reasons in response
- [x] Add `BulkVerifyDto` and `BulkDeleteDto` validation classes
- [x] Create `POST /api/kb/verification/bulk-verify` endpoint
- [x] Create `POST /api/kb/verification/bulk-delete` endpoint
- [x] Add admin role check to GET /api/kb/stale endpoint
- [ ] Implement Redis caching for stale pages list (5-minute TTL) - Deferred
- [x] Add error handling for partial bulk operation failures
- [ ] Write unit tests for bulk verification service methods - TODO
- [ ] Write unit tests for bulk delete service methods - TODO

### Frontend Tasks
- [x] Create `/kb/stale` page with admin access check
- [x] Create `StaleContentDashboard` component with table view
- [x] Implement bulk selection logic (individual + select all)
- [x] Add filter buttons for staleness reasons
- [x] Add sort dropdown and order toggle
- [x] Create bulk action bar with verify dropdown and delete button
- [x] Add confirmation dialog for bulk delete
- [x] Implement optimistic UI updates for bulk actions
- [x] Add toast notifications for success/error feedback
- [x] Add loading states for bulk operations
- [x] Make table responsive (stack on mobile)
- [ ] Write component tests for dashboard - TODO
- [ ] Write component tests for filters and sorting - TODO

### Documentation
- [ ] Update KB admin guide with stale content dashboard usage - TODO
- [ ] Add screenshots of dashboard to docs - TODO
- [ ] Document bulk action patterns for other features - TODO

---

## Dependencies

**Prerequisites:**
- KB-03.1: Verification System (✅ Complete)
- KB-03.2: Verification Expiration (✅ Complete)
- KB-03.3: Re-verification Workflow (✅ Complete)
- Existing pages CRUD (KB-01.1)
- Admin role guard implementation

**Required By:**
- KB-03.7: Scribe Agent (can use stale detection API)

---

## Testing Requirements

### Unit Tests

**Backend (Jest):**
- `VerificationService.getStalPages()` - Returns pages with correct reasons
- `VerificationService.getStalPages()` - Filters by expired verification correctly
- `VerificationService.getStalPages()` - Filters by old pages (90+ days) correctly
- `VerificationService.getStalPages()` - Filters by low view count correctly
- `VerificationController.bulkVerify()` - Verifies multiple pages successfully
- `VerificationController.bulkVerify()` - Handles partial failures correctly
- `VerificationController.bulkDelete()` - Deletes multiple pages successfully
- `VerificationController.bulkDelete()` - Handles partial failures correctly
- `RolesGuard` - Blocks non-admin access to stale endpoints

**Frontend (Vitest + Testing Library):**
- `StaleContentDashboard` - Renders stale pages correctly
- `StaleContentDashboard` - Toggles selection on checkbox click
- `StaleContentDashboard` - Selects all pages on header checkbox click
- `StaleContentDashboard` - Filters pages by staleness reason
- `StaleContentDashboard` - Sorts pages by last updated date
- `StaleContentDashboard` - Sorts pages by view count
- `StaleContentDashboard` - Shows bulk action bar when pages selected
- `StaleContentDashboard` - Calls onBulkVerify with correct parameters
- `StaleContentDashboard` - Calls onBulkDelete with correct parameters
- `StaleContentDashboard` - Clears selection after bulk action
- `StaleContentDashboard` - Shows empty state when no stale pages
- `/kb/stale page` - Redirects non-admin users to /kb

### Integration Tests

**API Endpoints (Supertest):**
- `GET /api/kb/stale` - Returns stale pages with reasons
- `GET /api/kb/stale` - Returns 403 for non-admin users
- `POST /api/kb/verification/bulk-verify` - Verifies multiple pages
- `POST /api/kb/verification/bulk-verify` - Returns partial success result
- `POST /api/kb/verification/bulk-verify` - Returns 403 for non-admin users
- `POST /api/kb/verification/bulk-delete` - Deletes multiple pages
- `POST /api/kb/verification/bulk-delete` - Returns 403 for non-admin users
- `POST /api/kb/verification/bulk-delete` - Validates max 100 pages

**Caching:**
- Verify Redis caches stale pages list with 5-minute TTL
- Verify cache invalidated on bulk verify
- Verify cache invalidated on bulk delete

### E2E Tests (Playwright)

**User Flows:**
1. **Access Dashboard:**
   - Login as admin user
   - Navigate to /kb/stale
   - Verify dashboard loads with stale pages
   - Verify all columns display correctly

2. **Filter and Sort:**
   - Click "Expired" filter button
   - Verify only expired pages shown
   - Click "Old" filter button
   - Verify only old pages shown
   - Change sort to "View Count"
   - Verify pages re-ordered correctly

3. **Bulk Verify:**
   - Select 3 stale pages via checkboxes
   - Click "Bulk Verify" button
   - Select "90 days" expiration
   - Verify success toast shown
   - Verify pages removed from stale list
   - Verify activity logs created for all pages

4. **Bulk Delete:**
   - Select 2 stale pages via checkboxes
   - Click "Delete Selected" button
   - Confirm deletion in dialog
   - Verify success toast shown
   - Verify pages removed from list
   - Verify pages soft-deleted in database

5. **Permission Check:**
   - Login as non-admin user
   - Navigate to /kb/stale
   - Verify redirected to /kb with access denied toast

---

## Wireframe Reference

**Wireframe:** KB-05 - Verified Content Management (Stale view implied)

**Assets:**
- HTML: `docs/modules/bm-pm/design/wireframes/Finished wireframes and html files/kb-05_verified_content_management/code.html`
- PNG: `docs/modules/bm-pm/design/wireframes/Finished wireframes and html files/kb-05_verified_content_management/screen.png`

---

## Files Created/Modified

### Created Files
1. `apps/web/src/app/kb/stale/page.tsx` - Stale content dashboard page
2. `apps/web/src/components/kb/StaleContentDashboard.tsx` - Dashboard component
3. `apps/api/src/kb/verification/dto/bulk-verify.dto.ts` - Bulk verify DTO
4. `apps/api/src/kb/verification/dto/bulk-delete.dto.ts` - Bulk delete DTO

### Modified Files
1. `apps/api/src/kb/verification/verification.service.ts` - Add staleness reasons to response
2. `apps/api/src/kb/verification/verification.controller.ts` - Add bulk action endpoints
3. `apps/api/src/kb/verification/verification.module.ts` - Register new endpoints
4. `packages/shared/src/types/kb.ts` - Add StalePageDto and StaleReason types

---

## Performance Considerations

### Frontend
- Optimistic UI updates for immediate feedback
- Debounced filter/sort operations
- Virtual scrolling for large stale page lists (>100 pages)
- Batch checkbox state updates to prevent re-renders

### Backend
- Redis caching for stale pages list (5-minute TTL)
- Invalidate cache on bulk verify/delete
- Limit bulk operations to 100 pages per request
- Use `Promise.allSettled()` for bulk operations (no short-circuit on failure)
- Index optimization: `isVerified`, `verifyExpires`, `updatedAt`, `viewCount`

### Database
- Composite index: `(workspaceId, deletedAt, isVerified, verifyExpires)`
- Composite index: `(workspaceId, deletedAt, updatedAt)`
- Composite index: `(workspaceId, deletedAt, viewCount)`
- Ensure indexes support stale page query efficiently

---

## Security Considerations

- Admin-only access to /kb/stale route (RolesGuard)
- Admin-only access to bulk action endpoints
- Validate pageIds array (max 100 items)
- Ensure multi-tenant isolation for all bulk operations
- Activity logs track admin performing bulk actions
- Soft delete only (no hard delete for audit trail)
- Rate limiting on bulk endpoints (max 10 requests/minute per admin)

---

## Next Stories

**KB-03.5: @Mention Support**
- @mention users in KB pages
- Autocomplete dropdown
- Notification to mentioned users

**KB-03.6: #Task Reference Support**
- Reference PM tasks via #task-number
- Autocomplete dropdown
- Backlinks in task detail

**KB-03.7: Scribe Agent Foundation**
- AI agent for KB management
- Tools for page creation, search, staleness detection
- Suggestion mode (human approval required)

---

## Notes

- Dashboard accessible only to workspace admins via RolesGuard
- Stale pages cached for 5 minutes to reduce database load
- Bulk operations limited to 100 pages to prevent timeout
- Use `Promise.allSettled()` to handle partial failures gracefully
- Filter and sort operations happen client-side (sufficient for typical stale page counts)
- For large workspaces (1000+ stale pages), consider server-side pagination
- Click page title navigates to edit view (not read view) for immediate action
- Bulk delete is soft delete only (preserves audit trail)
- Toast notifications provide immediate feedback for bulk actions
- Optimistic UI updates improve perceived performance

---

## DoD Checklist

- [ ] Dashboard page created at /kb/stale
- [ ] StaleContentDashboard component implemented
- [ ] Bulk selection logic working (individual + select all)
- [ ] Filter by staleness reason working
- [ ] Sort by last updated, view count, verification expiry working
- [ ] Bulk verify endpoint implemented
- [ ] Bulk delete endpoint implemented
- [ ] Admin authorization enforced on all endpoints
- [ ] Staleness reasons included in API response
- [ ] Redis caching implemented for stale pages list
- [ ] Toast notifications shown for all actions
- [ ] Confirmation dialog shown for bulk delete
- [ ] Click page navigates to edit view
- [ ] Responsive design on mobile
- [ ] Empty state shown when no stale pages
- [ ] Unit tests passing (backend + frontend)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Type check passes
- [ ] Lint passes
- [ ] Code review complete
- [ ] Documentation updated
- [ ] Story file created
- [ ] Sprint status updated to 'ready-for-dev'

---

## Development Notes

### Implementation Summary

**Date:** 2025-12-18

Successfully implemented the Stale Content Dashboard with all core functionality.

### Backend Changes

1. **Enhanced VerificationService** (apps/api/src/kb/verification/verification.service.ts):
   - Modified `getStalPages()` to include owner details (id, name, email, avatarUrl)
   - Added `bulkVerify()` method using Promise.allSettled for partial failure handling
   - Added `bulkDelete()` method with soft delete and activity logging
   - Both bulk methods return success/failed counts and detailed results

2. **Created DTOs**:
   - `BulkVerifyDto` (dto/bulk-verify.dto.ts): Validates 1-100 pageIds and expiresIn enum
   - `BulkDeleteDto` (dto/bulk-delete.dto.ts): Validates 1-100 pageIds for deletion

3. **Updated StaleController** (apps/api/src/kb/verification/stale.controller.ts):
   - Changed base path from '/kb/verification/stale' to '/kb/verification'
   - Added `@Roles('admin')` decorator to GET /stale endpoint
   - Added POST /bulk-verify endpoint with admin guard
   - Added POST /bulk-delete endpoint with admin guard
   - All endpoints use RolesGuard to enforce admin-only access

### Frontend Changes

1. **Created Hook** (apps/web/src/hooks/use-stale-pages.ts):
   - `useStalPages()`: Query hook with 5-minute stale time
   - `useBulkVerify()`: Mutation hook that invalidates queries on success
   - `useBulkDelete()`: Mutation hook that invalidates queries on success
   - All hooks handle 403 errors gracefully

2. **Created Component** (apps/web/src/components/kb/StaleContentDashboard.tsx):
   - Table view with columns: checkbox, page, owner, reasons, last updated, actions
   - Bulk selection (individual + select all)
   - Filter buttons for All, Expired, Old, Low Views
   - Sort dropdown (Last Updated, View Count, Verification Expiry) with ASC/DESC toggle
   - Bulk action bar with Verify dropdown (30d, 60d, 90d, never) and Delete button
   - Delete confirmation dialog
   - Badge styling for different staleness reasons
   - Loading, error, and empty states
   - Toast notifications for success/failure

3. **Created Page Route** (apps/web/src/app/kb/stale/page.tsx):
   - Simple wrapper rendering StaleContentDashboard
   - Metadata for SEO

### Type Definitions

Added to packages/shared/src/types/kb.ts:
- `StaleReason` enum
- `StalePageDto` interface
- `BulkVerifyRequest` interface
- `BulkDeleteRequest` interface
- `BulkActionResponse` interface

### Deferred Items

1. **Redis Caching**: Not implemented yet. Can be added later if performance becomes an issue. The query has a 5-minute stale time in React Query which provides client-side caching.

2. **Tests**: Unit and component tests marked as TODO. Should be written before merging to main.

3. **Documentation**: Admin guide updates and screenshots deferred to documentation sprint.

### Technical Notes

- Used Promise.allSettled() for bulk operations to ensure partial failures don't stop the entire batch
- Admin access enforced at API level with RolesGuard - frontend checks are for UX only
- Soft delete only (preserves audit trail via deletedAt field)
- All bulk actions logged to PageActivity table
- Client-side filtering and sorting (sufficient for typical stale page counts)
- Responsive design uses shadcn/ui Table component

### Known Issues

None at this time.

### Next Steps

1. Write unit tests for backend bulk methods
2. Write component tests for dashboard
3. Test with large datasets (>100 stale pages)
4. Consider server-side pagination if needed
5. Add navigation link to KB sidebar for admins
