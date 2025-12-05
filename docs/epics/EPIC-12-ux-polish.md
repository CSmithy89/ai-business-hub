# Epic 12: UX Polish

**Epic ID:** EPIC-12
**Status:** Backlog
**Priority:** P1/P2 - High/Medium
**Phase:** Post-Foundation Enhancement

---

## Epic Overview

Close all frontend gaps identified in the wireframe-to-implementation gap analysis. This epic addresses UI features that were designed in wireframes but not fully implemented during initial development.

### Business Value
Complete, polished UI that matches design specifications. Improved user experience with consistent behavior across all features. Closes the gap between designed and implemented functionality.

### Success Criteria
- [ ] All OAuth providers functional (Google, Microsoft, GitHub)
- [ ] Approval queue has quick action buttons
- [ ] Chat panel has proper streaming UI
- [ ] Settings pages have unsaved changes detection
- [ ] All countdown timers implemented
- [ ] Approval metrics calculated from real data

### Dependencies
- **None** - Can start immediately
- **Parallel with:** EPIC-10 (Platform Hardening), EPIC-11 (Agent Integration)

### Reference
- See `docs/wireframe-gap-analysis.md` for detailed gap analysis
- Wireframes location: `docs/design/wireframes/Finished wireframes and html files/`

---

## Stories

### Story 12.1: OAuth Provider Buttons

**Points:** 2
**Priority:** P1 High

**As a** user
**I want** to sign in with Microsoft or GitHub
**So that** I have more authentication options

**Acceptance Criteria:**
- [ ] AC1: Add Microsoft OAuth button to sign-in page
- [ ] AC2: Add GitHub OAuth button to sign-in page
- [ ] AC3: Configure better-auth for Microsoft provider
- [ ] AC4: Configure better-auth for GitHub provider
- [ ] AC5: Match wireframe styling (icon + text, proper spacing)
- [ ] AC6: Add buttons to sign-up page as well
- [ ] AC7: Handle OAuth errors gracefully with user-friendly messages
- [ ] AC8: Update environment variables documentation

**Wireframes:** AU-01, AU-02

**Files:**
- `apps/web/src/app/(auth)/sign-in/page.tsx` (modify)
- `apps/web/src/components/auth/sign-up-form.tsx` (modify)
- `apps/web/src/lib/auth.ts` (configure providers)
- `packages/config/.env.example` (update)

**Technical Notes:**
- better-auth supports Microsoft and GitHub OAuth out of the box
- Epic 09 implemented the backend - this adds UI buttons

---

### Story 12.2: Confirm Password Field

**Points:** 1
**Priority:** P2 Medium

**As a** user signing up
**I want** to confirm my password
**So that** I don't accidentally create an account with a typo

**Acceptance Criteria:**
- [ ] AC1: Add confirm password input field to sign-up form
- [ ] AC2: Show password match indicator (green checkmark or red X)
- [ ] AC3: Validate passwords match before form submission
- [ ] AC4: Show inline error message if passwords don't match
- [ ] AC5: Both fields share same show/hide toggle behavior

**Wireframes:** AU-02

**Files:**
- `apps/web/src/components/auth/sign-up-form.tsx` (modify)

---

### Story 12.3: Approval Queue Quick Actions

**Points:** 3
**Priority:** P1 High

**As a** reviewer
**I want** to approve or reject items directly from the list
**So that** I can process approvals faster without opening modals

**Acceptance Criteria:**
- [ ] AC1: Add Approve button (green/primary) to approval list cards
- [ ] AC2: Add Reject button (red/destructive) to approval list cards
- [ ] AC3: Quick actions work without opening detail modal
- [ ] AC4: Show confirmation toast on successful action
- [ ] AC5: Implement optimistic UI update on action
- [ ] AC6: Handle errors with rollback and error toast
- [ ] AC7: Match wireframe button styling (icon + text)
- [ ] AC8: Update approval count stats immediately

**Wireframes:** AP-01

**Files:**
- `apps/web/src/components/approval/approval-list-item.tsx` (modify)
- `apps/web/src/hooks/use-approval-actions.ts` (create/modify)

---

### Story 12.4: Chat Streaming UI

**Points:** 2
**Priority:** P2 Medium

**As a** user chatting with agents
**I want** to see visual feedback while responses stream
**So that** I know the system is working and can follow along

**Acceptance Criteria:**
- [ ] AC1: Add blinking cursor indicator during streaming (|)
- [ ] AC2: Add shimmer progress bar while waiting for first token
- [ ] AC3: Smooth text reveal as tokens stream in
- [ ] AC4: Handle stream interruption gracefully
- [ ] AC5: Add "Stop generating" button for long responses

**Wireframes:** CH-02 (Type 8: Streaming/Loading)

**Files:**
- `apps/web/src/components/chat/ChatMessage.tsx` (modify)
- `apps/web/src/components/chat/StreamingIndicator.tsx` (create)
- `apps/web/src/components/chat/StreamingCursor.tsx` (create)

---

### Story 12.5: Settings UX Enhancements

**Points:** 2
**Priority:** P2 Medium

**As a** user editing settings
**I want** to see when I have unsaved changes
**So that** I don't accidentally navigate away without saving

**Acceptance Criteria:**
- [ ] AC1: Create UnsavedChangesBar component (yellow sticky bar at bottom)
- [ ] AC2: Track form dirty state in all settings pages
- [ ] AC3: Show bar with "Save Changes" and "Discard" buttons
- [ ] AC4: Add blue security notice banner to API Keys page
- [ ] AC5: Prevent navigation when unsaved changes exist (with confirmation)
- [ ] AC6: Banner text: "API keys are sensitive. Never share them publicly."

**Wireframes:** ST-01, ST-02

**Files:**
- `apps/web/src/components/settings/UnsavedChangesBar.tsx` (create)
- `apps/web/src/components/settings/SecurityNoticeBanner.tsx` (create)
- `apps/web/src/app/settings/api-keys/page.tsx` (modify)
- `apps/web/src/app/settings/profile/page.tsx` (modify)
- `apps/web/src/hooks/use-unsaved-changes.ts` (create)

---

### Story 12.6: Countdown Timers

**Points:** 2
**Priority:** P3 Low

**As a** user
**I want** to see countdown timers for cooldowns and redirects
**So that** I know when actions become available

**Acceptance Criteria:**
- [ ] AC1: Create reusable CountdownTimer component
- [ ] AC2: Add resend countdown to email verification page ("Resend in 30s")
- [ ] AC3: Add resend countdown to forgot password page
- [ ] AC4: Add auto-redirect countdown to password reset success ("Redirecting in 5s...")
- [ ] AC5: Button enables automatically when countdown reaches 0
- [ ] AC6: Timer updates every second with smooth animation

**Wireframes:** AU-03, AU-04, AU-05

**Files:**
- `apps/web/src/components/ui/countdown-timer.tsx` (create)
- `apps/web/src/app/(auth)/verify-email/page.tsx` (modify)
- `apps/web/src/app/(auth)/forgot-password/page.tsx` (modify)
- `apps/web/src/app/(auth)/reset-password/page.tsx` (modify)

---

### Story 12.7: Approval Metrics Calculation

**Points:** 3
**Priority:** P2 Medium

**As a** manager
**I want** to see real approval metrics
**So that** I can monitor team performance

**Acceptance Criteria:**
- [ ] AC1: Create API endpoint `/api/approvals/metrics` for metrics aggregation
- [ ] AC2: Calculate average response time from approval timestamps
- [ ] AC3: Calculate approval rate (approved / total processed)
- [ ] AC4: Calculate auto-approved count (items with confidence > 85%)
- [ ] AC5: Update ApprovalStats component to fetch real data
- [ ] AC6: Add loading skeleton while fetching metrics
- [ ] AC7: Cache metrics with 5-minute TTL for performance

**Wireframes:** AP-01 (Stats Bar)

**Files:**
- `apps/web/src/app/api/approvals/metrics/route.ts` (create)
- `apps/web/src/components/approval/approval-stats.tsx` (modify)
- `apps/web/src/hooks/use-approval-metrics.ts` (create)

**Technical Notes:**
- Current implementation shows placeholder text
- Metrics should aggregate across tenant's approval items

---

### Story 12.8: Chat Error & Preview Cards

**Points:** 3
**Priority:** P2 Medium

**As a** user
**I want** properly styled error messages and content previews in chat
**So that** errors are clear and content is previewable

**Acceptance Criteria:**
- [ ] AC1: Create ChatErrorMessage component with red left border
- [ ] AC2: Add warning icon and bold error title
- [ ] AC3: Add Retry and Cancel buttons to error messages
- [ ] AC4: Create ChatPreviewCard component for email/document previews
- [ ] AC5: Add "Show full content" expandable link
- [ ] AC6: Preview card shows icon, title, and content snippet
- [ ] AC7: Match wireframe styling exactly (colors, spacing, typography)

**Wireframes:** CH-02 (Type 3: Preview Card, Type 7: Error Message)

**Files:**
- `apps/web/src/components/chat/ChatErrorMessage.tsx` (create)
- `apps/web/src/components/chat/ChatPreviewCard.tsx` (create)
- `apps/web/src/components/chat/ChatMessage.tsx` (modify)

---

## Summary

| Metric | Value |
|--------|-------|
| Total Stories | 8 |
| Total Points | 18 |
| P1 High | 2 stories (5 points) |
| P2 Medium | 5 stories (11 points) |
| P3 Low | 1 story (2 points) |
| Dependencies | None |
| Parallel with | EPIC-10, EPIC-11 |

---

## Wireframe Gaps Addressed

From `docs/wireframe-gap-analysis.md`:

| Gap | Wireframe | Status After Epic |
|-----|-----------|-------------------|
| Microsoft OAuth button | AU-01 | Resolved |
| GitHub OAuth button | AU-01 | Resolved |
| Confirm password field | AU-02 | Resolved |
| Quick actions on approval cards | AP-01 | Resolved |
| Chat streaming UI | CH-02 | Resolved |
| Security notice banner | ST-02 | Resolved |
| Unsaved changes bar | ST-01 | Resolved |
| Countdown timers | AU-03/04/05 | Resolved |
| Approval metrics | AP-01 | Resolved |
| Chat error messages | CH-02 | Resolved |
| Chat preview cards | CH-02 | Resolved |

---

_Generated by BMAD Party Mode Planning Session_
_Date: 2025-12-05_
