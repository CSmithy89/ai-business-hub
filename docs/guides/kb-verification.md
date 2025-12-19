# Knowledge Base Verification Guide

This guide explains how to use the content verification system in the HYVVE Knowledge Base to ensure content accuracy and maintain AI-prioritized, trusted documentation.

---

## Overview

The verification system allows workspace members to mark KB pages as "verified" to indicate the content has been reviewed and is accurate. Verified pages are:

- **Prioritized by AI** - Scribe and other agents favor verified content in responses
- **Boosted in search** - RAG queries rank verified pages higher
- **Tracked for freshness** - Expiration dates ensure regular reviews

---

## Verification States

### Verified
A green checkmark badge indicates the page has been reviewed and verified by a team member.

| Badge | Meaning |
|-------|---------|
| **Verified** | Content reviewed and accurate |
| **Expires in X days** | Shows remaining validity period |
| **Verified by [Name]** | Shows who verified the content |

### Verification Expired
An amber warning badge indicates the verification period has passed and the page needs re-review.

| Badge | Meaning |
|-------|---------|
| **Verification Expired** | Review period has passed |
| **Re-verify** button | Click to start re-verification |

### Unverified
No badge is shown. The page has never been verified or verification was removed.

---

## How to Verify a Page

### Step 1: Open the Page
Navigate to any KB page you have permission to edit.

### Step 2: Click the Verification Button
In the page header or toolbar, click **"Mark as Verified"**.

### Step 3: Select Expiration Period
Choose how long the verification should remain valid:

| Period | Best For |
|--------|----------|
| **30 days** | Rapidly changing content (release notes, procedures) |
| **60 days** | Moderate change frequency (how-to guides) |
| **90 days** | Stable content (policies, architecture docs) |
| **Never expires** | Permanent reference material (glossaries, standards) |

### Step 4: Confirm
Click **"Verify"** to apply. The page will display the verified badge immediately.

---

## Re-verifying Expired Content

When a page's verification expires:

1. The owner receives an email notification
2. The page shows an **"Verification Expired"** badge
3. The page appears in the **Stale Content Dashboard**

To re-verify:

1. Open the page
2. Review the content for accuracy
3. Click **"Re-verify"** on the expired badge
4. Select a new expiration period
5. Click **"Verify"**

---

## Removing Verification

To remove verification from a page:

1. Open the verified page
2. Click the verification badge dropdown
3. Select **"Remove Verification"**
4. Confirm the action

The page will return to an unverified state and no longer receive AI prioritization.

---

## Who Can Verify?

Verification permissions depend on workspace roles:

| Role | Can Verify |
|------|------------|
| **Owner** | Yes - any page in workspace |
| **Admin** | Yes - any page in workspace |
| **Editor** | Yes - pages they own or can edit |
| **Viewer** | No |

---

## Best Practices

### Regular Review Cadence
- Set calendar reminders aligned with verification periods
- Review verification queue weekly in Stale Content Dashboard
- Assign verification ownership for critical pages

### Verification Criteria
Before marking a page as verified, ensure:

- [ ] Information is factually accurate
- [ ] Steps/procedures have been tested
- [ ] Links and references are valid
- [ ] Content is up-to-date with current processes
- [ ] Formatting is clear and readable

### Team Coordination
- Use @mentions to notify subject matter experts
- Tag pages with categories for bulk verification
- Document verification decisions in page comments

---

## Stale Content Dashboard

Admins can access the **Stale Content Dashboard** at `/kb/stale` to view all pages needing attention:

### Filters
- **Expired verification** - Verified pages past expiration
- **Not updated recently** - Pages unchanged for 90+ days
- **Low view count** - Rarely accessed pages

### Bulk Actions
- **Bulk Verify** - Verify multiple pages with same expiration
- **Bulk Delete** - Remove multiple obsolete pages

See the [Stale Content Dashboard Admin Guide](./kb-stale-dashboard.md) for detailed instructions.

---

## FAQ

**Q: Does verification affect page editing?**
A: No, verification is independent of editing. Anyone with edit permissions can still modify verified pages.

**Q: What happens when I edit a verified page?**
A: The verification remains intact. Consider re-verifying if you make significant changes.

**Q: Can I verify pages I don't own?**
A: Yes, if you have Editor, Admin, or Owner role in the workspace.

**Q: How do expired notifications work?**
A: Page owners receive an email when verification expires. A daily job checks for expirations at 2 AM.

---

## Related Documentation

- [Stale Content Dashboard Admin Guide](./kb-stale-dashboard.md)
- [Scribe Agent Reference](./kb-scribe-agent.md)
- [Knowledge Base Overview](../modules/bm-pm/kb-specification.md)
