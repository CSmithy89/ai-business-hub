# Stale Content Dashboard - Admin Guide

This guide covers how to use the Stale Content Dashboard to manage knowledge base content that needs attention, including bulk verification and deletion.

---

## Accessing the Dashboard

Navigate to **Knowledge Base > Stale Content** or go directly to:
```
/kb/stale
```

**Required Role:** Admin or Owner

---

## Dashboard Overview

The Stale Content Dashboard displays pages flagged as "stale" based on three criteria:

| Reason | Description | Threshold |
|--------|-------------|-----------|
| **Expired Verification** | Page was verified but the expiration date has passed | `verifyExpires <= now()` |
| **Not Updated** | Page content hasn't changed in extended period | 90+ days since `updatedAt` |
| **Low Views** | Page has minimal engagement | `viewCount < 5` |

A page may appear for multiple reasons, shown as tags on each row.

---

## Dashboard Features

### Filtering

Use the filter dropdown to narrow results:

- **All Stale Pages** - Show everything
- **Expired Verification Only** - Only verification-expired pages
- **Not Updated Only** - Only pages stale by update date
- **Low Views Only** - Only low-engagement pages

### Sorting

Click column headers to sort by:

- **Title** (A-Z / Z-A)
- **Last Updated** (Oldest / Newest first)
- **View Count** (Lowest / Highest first)
- **Owner** (A-Z / Z-A)

### Search

Use the search box to filter by page title.

---

## Understanding Each Row

Each stale page displays:

| Column | Description |
|--------|-------------|
| **Checkbox** | Select for bulk actions |
| **Title** | Page title (click to open) |
| **Staleness Reasons** | Tags showing why flagged |
| **Last Updated** | Date of last content change |
| **View Count** | Total page views |
| **Owner** | Page owner with avatar |
| **Actions** | Quick action buttons |

---

## Individual Actions

### View Page
Click the page title to open it in the KB editor.

### Verify
Click the checkmark icon to verify a single page:
1. Select expiration period (30/60/90 days or Never)
2. Click **Verify**
3. Page is removed from stale list

### Delete
Click the trash icon to soft-delete a single page:
1. Confirmation dialog appears
2. Click **Delete** to confirm
3. Page is moved to trash (recoverable for 30 days)

---

## Bulk Actions

### Selecting Pages

- **Individual Selection**: Click checkboxes on specific rows
- **Select All Visible**: Click the header checkbox
- **Deselect All**: Click header checkbox again

The selection count shows in the bulk action bar.

### Bulk Verify

To verify multiple pages at once:

1. Select desired pages using checkboxes
2. Click **Bulk Verify** button
3. Choose expiration period (applies to all selected)
4. Confirm in the dialog
5. Progress indicator shows completion

**Results:**
- Success count displayed
- Failed verifications listed with reasons
- Dashboard refreshes automatically

### Bulk Delete

To delete multiple pages at once:

1. Select desired pages using checkboxes
2. Click **Bulk Delete** button
3. Review the confirmation dialog showing page count
4. Type "DELETE" to confirm (prevents accidents)
5. Click **Delete Pages**

**Results:**
- Success count displayed
- Failed deletions listed with reasons
- Deleted pages moved to trash

---

## Workflow Recommendations

### Weekly Review Process

1. **Filter by Expired Verification**
   - These are highest priority (previously verified, now expired)
   - Contact owners or verify yourself if content is accurate

2. **Filter by Not Updated**
   - Review for relevance
   - Either update content and verify, or delete if obsolete

3. **Filter by Low Views**
   - Evaluate if content is needed
   - Consider consolidating into other pages
   - Delete if truly unused

### Bulk Processing Tips

- **Batch by Category**: Use search to find related pages, bulk verify together
- **Set Consistent Expirations**: Use 90 days for stable docs, 30 days for volatile
- **Communicate Before Deleting**: Notify owners before bulk deletion

### Delegation

For large knowledge bases:
- Assign specific categories to team members
- Use @mentions to request owner review
- Set up scheduled review meetings

---

## API Reference

The dashboard uses these API endpoints:

### Get Stale Pages
```
GET /api/kb/verification/stale
Query: ?filter=all|expired|not_updated|low_views
```

### Bulk Verify
```
POST /api/kb/verification/bulk-verify
Body: { pageIds: string[], expiresIn: "30d"|"60d"|"90d"|"never" }
```

### Bulk Delete
```
POST /api/kb/verification/bulk-delete
Body: { pageIds: string[] }
```

---

## Troubleshooting

### "No stale pages found"
- All content is up-to-date and verified
- Check filter settings (may be filtering too narrowly)

### Bulk operation partially failed
- Some pages may have been deleted by others
- Permissions may have changed
- Check individual error messages for details

### Dashboard slow to load
- Large workspaces may take time to analyze
- Analysis is limited to first 500 pages
- Consider archiving old content

---

## Related Documentation

- [KB Verification Guide](./kb-verification.md)
- [Scribe Agent Reference](./kb-scribe-agent.md)
- [Knowledge Base Maintenance Runbook](../runbooks/knowledge-base-maintenance.md)
