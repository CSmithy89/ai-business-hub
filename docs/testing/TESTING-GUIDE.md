# HYVVE Platform Testing Guide

**Created:** 2025-12-05
**Version:** 1.0
**Covers:** Epics 00-09

---

## Quick Start

```bash
# Run all tests (recommended order)
pnpm test:all

# Or run by category:
pnpm test:unit      # Fast unit tests (~30 seconds)
pnpm test:api       # API unit tests (~1 minute)
pnpm test:e2e       # E2E tests (~5-10 minutes)
```

---

## Test Execution Order

Risk-based execution order - fail fast on critical paths:

### Level 1: Smoke Tests (Run First)
**Purpose:** Verify app is alive before burning CI minutes.
**Duration:** ~15 seconds

```bash
cd apps/web && pnpm test:e2e -- --grep "Smoke"
```

| Test | Validates |
|------|-----------|
| Homepage loads | Next.js running |
| Sign-in page loads | Auth routes functional |
| Sign-up page loads | Registration routes functional |

---

### Level 2: Unit Tests
**Purpose:** Validate business logic isolation.
**Duration:** ~1 minute

```bash
# API unit tests (NestJS/Jest)
cd apps/api && pnpm test

# Web unit tests (Vitest) - when added
cd apps/web && pnpm test
```

---

### Level 3: Integration Tests
**Purpose:** Validate cross-boundary communication.
**Duration:** ~2 minutes

```bash
cd apps/api && pnpm test -- --testPathPattern="integration"
```

---

### Level 4: E2E Tests
**Purpose:** Validate user journeys end-to-end.
**Duration:** ~5-10 minutes

```bash
cd apps/web && pnpm test:e2e
```

**Headed mode (debugging):**
```bash
cd apps/web && pnpm test:e2e:headed
```

**UI mode (interactive):**
```bash
cd apps/web && pnpm test:e2e:ui
```

---

## Epic-to-Test Traceability Matrix

### Coverage Summary

| Epic | Name | E2E Tests | Unit Tests | Coverage |
|------|------|-----------|------------|----------|
| 00 | Project Scaffolding | smoke.spec.ts | app.controller.spec.ts | ⚠️ Partial |
| 01 | Authentication | auth.spec.ts | - | ✅ Good |
| 02 | Workspace Management | workspace.spec.ts | - | ✅ Good |
| 03 | RBAC & Multi-tenancy | - | guards/*.spec.ts, rls.integration.spec.ts | ✅ Good |
| 04 | Approval System | approvals.spec.ts | approvals/*.spec.ts, audit/*.spec.ts | ✅ Good |
| 05 | Event Bus | events.spec.ts | events/*.spec.ts | ✅ Good |
| 06 | BYOAI Configuration | ai-providers.spec.ts | ai-providers/*.spec.ts | ✅ Good |
| 07 | UI Shell | ui-shell.spec.ts | ui.test.ts, onboarding-wizard-store.test.ts | ✅ Good |
| 08 | Business Onboarding | onboarding.spec.ts | workflow-*.test.ts, documents-upload.test.ts | ✅ Good |
| 09 | UI & Auth Enhancements | two-factor-auth.spec.ts, oauth-providers.spec.ts, team-members.spec.ts | - | ✅ Good |

---

### Detailed Traceability

#### EPIC-00: Project Scaffolding

| Story | Description | Test File | Status |
|-------|-------------|-----------|--------|
| 00.1 | Monorepo setup | smoke.spec.ts | ✅ |
| 00.2 | Next.js scaffold | smoke.spec.ts | ✅ |
| 00.3 | NestJS scaffold | app.controller.spec.ts | ✅ |
| 00.4 | Prisma schema | - | ⚠️ Schema tests needed |
| 00.5 | Docker setup | - | 🔲 Manual verification |
| 00.6 | CI/CD pipeline | - | 🔲 GitHub Actions |
| 00.7 | AgentOS setup | - | ⚠️ Missing |

**Recommended additions:**
- Database migration tests
- Health check endpoint tests

---

#### EPIC-01: Authentication

| Story | Description | Test File | Status |
|-------|-------------|-----------|--------|
| 01.1 | Better-auth setup | auth.spec.ts | ✅ |
| 01.2 | Registration | auth.spec.ts:Registration | ✅ |
| 01.3 | Email verification | - | ⚠️ Partial (no complete flow) |
| 01.4 | Sign-in | auth.spec.ts:Sign In | ✅ |
| 01.5 | Google OAuth | auth.spec.ts:Google OAuth | ✅ |
| 01.6 | Password reset | auth.spec.ts:Password Reset | ✅ |
| 01.7 | Session management | auth.spec.ts:Session Management | ✅ |
| 01.8 | Auth UI components | - | ⚠️ Unit tests needed |

**Test cases covered:**
- ✅ Register with valid credentials
- ✅ Reject weak password
- ✅ Reject duplicate email
- ✅ Sign in with valid credentials
- ✅ Reject invalid credentials
- ✅ Reject unverified user
- ✅ Initiate Google OAuth
- ✅ Send password reset email
- ✅ Persist session across page loads
- ✅ Sign out successfully

---

#### EPIC-02: Workspace Management

| Story | Description | Test File | Status |
|-------|-------------|-----------|--------|
| 02.1 | Workspace CRUD | workspace.spec.ts:Workspace CRUD | ✅ |
| 02.2 | Member invitation | workspace.spec.ts:Member Invitation | ✅ |
| 02.3 | Invitation acceptance | workspace.spec.ts:Invitation Acceptance | ✅ |
| 02.4 | Workspace switching | workspace.spec.ts:Workspace Switching | ✅ |
| 02.5 | Member management | workspace.spec.ts:Member Management | ✅ |
| 02.6 | Workspace settings | workspace.spec.ts:Workspace Settings | ✅ |
| 02.7 | Workspace deletion | workspace.spec.ts:Workspace Deletion | ✅ |

**Test cases covered:**
- ✅ Create workspace with user as owner
- ✅ Auto-generate unique slug
- ✅ List all user workspaces
- ✅ Member role restrictions
- ✅ Soft delete workspace
- ✅ Invite members
- ✅ Block duplicate invitations
- ✅ Accept/reject invitations
- ✅ Switch between workspaces
- ✅ Update member roles
- ✅ Leave workspace
- ✅ Delete with confirmation

---

#### EPIC-03: RBAC & Multi-tenancy

| Story | Description | Test File | Status |
|-------|-------------|-----------|--------|
| 03.1 | Permission definition | guards/*.spec.ts | ✅ |
| 03.2 | Auth guard | auth.guard.spec.ts | ✅ |
| 03.3 | Tenant guard | tenant.guard.spec.ts | ✅ |
| 03.4 | Roles guard | roles.guard.spec.ts | ✅ |
| 03.5 | Guards integration | guards.integration.spec.ts | ✅ |
| 03.6 | RLS policies | rls.integration.spec.ts | ✅ |
| 03.7 | Prisma extension | rls.integration.spec.ts | ⚠️ TODO tests added |

**Test cases covered (rls.integration.spec.ts):**
- ✅ Cross-tenant read isolation (data not visible to other tenants)
- ✅ Query scoping to current tenant
- ✅ Cross-tenant update prevention
- ✅ Cross-tenant delete prevention
- ✅ Workspace membership isolation
- ✅ Audit log tenant scoping
- ✅ AI provider config isolation (prevent API key exposure)
- ✅ Event metadata tenant scoping
- ✅ Business entity isolation

---

#### EPIC-04: Approval System

| Story | Description | Test File | Status |
|-------|-------------|-----------|--------|
| 04.1 | Approval queue schema | - | ⚠️ Schema only |
| 04.2 | Approval service | approvals.service.spec.ts | ✅ |
| 04.3 | Approval controller | approvals.controller.spec.ts | ✅ |
| 04.4 | Confidence calculator | confidence-calculator.service.spec.ts | ✅ |
| 04.5 | Approval router | approval-router.service.spec.ts | ✅ |
| 04.6 | Audit service | audit.service.spec.ts | ✅ |
| 04.7 | Audit controller | audit.controller.spec.ts | ✅ |
| 04.8-12 | UI & Integrations | approvals.spec.ts | ✅ |

**E2E Test cases covered (approvals.spec.ts):**
- ✅ Approval queue displays with items
- ✅ Filter by item type
- ✅ Sort by confidence
- ✅ Display confidence score badge
- ✅ Approve/reject actions on cards
- ✅ Confirmation dialogs
- ✅ Feedback textarea on rejection
- ✅ Bulk approve selected items
- ✅ Bulk reject with confirmation
- ✅ High confidence auto-routing indicator
- ✅ Medium confidence quick-approval UI
- ✅ Low confidence full-review marker
- ✅ Audit log display with filters
- ✅ Pagination and empty state handling
- ✅ Accessibility (keyboard navigation, ARIA)
- ✅ Responsive design (mobile/tablet)

---

#### EPIC-05: Event Bus

| Story | Description | Test File | Status |
|-------|-------------|-----------|--------|
| 05.1 | Event publisher | event-publisher.service.spec.ts | ✅ |
| 05.2 | Event consumer | event-consumer.service.spec.ts | ✅ |
| 05.3 | Event replay | event-replay.service.spec.ts, events.spec.ts | ✅ |
| 05.4 | DLQ handling | events.spec.ts | ✅ |
| 05.5 | Event retry | event-retry.service.spec.ts, events.spec.ts | ✅ |
| 05.6 | Event schema validation | event-publisher.service.spec.ts | ✅ |
| 05.7 | Event health monitoring | events.spec.ts | ✅ |

**E2E Test cases covered (events.spec.ts):**
- ✅ Event health section in admin dashboard
- ✅ Stream status indicators (healthy/unhealthy)
- ✅ Consumer group statistics
- ✅ Pending event count display
- ✅ Event throughput metrics
- ✅ DLQ section display
- ✅ DLQ event list with empty state
- ✅ Event error details on click
- ✅ Retry DLQ event functionality
- ✅ Delete DLQ event with confirmation
- ✅ DLQ pagination
- ✅ Event replay section and date range picker
- ✅ Event type filtering for replay
- ✅ Start replay job and status tracking
- ✅ Replay progress indicator
- ✅ Event statistics dashboard
- ✅ Events processed count and type breakdown
- ✅ Time period filtering for stats
- ✅ Access control (admin/owner only)
- ✅ Responsive design (mobile/tablet)

---

#### EPIC-06: BYOAI Configuration

| Story | Description | Test File | Status |
|-------|-------------|-----------|--------|
| 06.1 | Provider factory | ai-provider-factory.service.spec.ts | ✅ |
| 06.2 | Provider service | ai-providers.service.spec.ts | ✅ |
| 06.3 | Token limits | token-limit.service.spec.ts | ✅ |
| 06.4 | Token reset | token-reset.service.spec.ts | ✅ |
| 06.5 | Token usage | token-usage.service.spec.ts | ✅ |
| 06.6 | Provider health | provider-health.service.spec.ts | ✅ |
| 06.7-11 | UI & AgentOS | ai-providers.spec.ts | ✅ |

**E2E Test cases covered (ai-providers.spec.ts):**
- ✅ AI providers settings page display
- ✅ Provider cards with status indicators
- ✅ Provider enable/disable toggle
- ✅ Add provider modal with API key input
- ✅ API key validation (format checking)
- ✅ API key masking for security
- ✅ Test API key connection
- ✅ Provider verification status
- ✅ Delete provider with confirmation
- ✅ Token usage dashboard display
- ✅ Usage breakdown by provider and period
- ✅ Usage progress bars and limit warnings
- ✅ Token limit configuration
- ✅ Provider health indicators
- ✅ Health check history display
- ✅ Provider error display and refresh
- ✅ Agent model preference selection
- ✅ Agent provider assignments
- ✅ Accessibility (keyboard, ARIA)
- ✅ Responsive design (mobile/tablet)

---

#### EPIC-07: UI Shell

| Story | Description | Test File | Status |
|-------|-------------|-----------|--------|
| 07.1 | Layout & Sidebar | ui-shell.spec.ts | ✅ |
| 07.2 | Header | ui-shell.spec.ts | ✅ |
| 07.3 | Command palette | ui-shell.spec.ts:Command Palette | ✅ |
| 07.4 | Mobile drawer | ui-shell.spec.ts:Mobile Drawer | ✅ |
| 07.5 | Theme persistence | ui-shell.spec.ts:Theme Persistence | ✅ |
| 07.6 | Keyboard shortcuts | ui-shell.spec.ts:Keyboard Shortcuts | ✅ |
| 07.7 | Sidebar persistence | ui-shell.spec.ts:Sidebar State, ui.test.ts | ✅ |
| 07.8 | Chat panel | ui-shell.spec.ts:Chat Panel, ui.test.ts | ✅ |
| 07.9-10 | Notifications | - | ⚠️ Partial |

**E2E Test cases covered (ui-shell.spec.ts):**
- ✅ Command palette opens with Cmd+K / Ctrl+K
- ✅ Command palette closes with Escape
- ✅ Search filtering in command palette
- ✅ Navigation on item selection
- ✅ Keyboard navigation
- ✅ Mobile drawer toggle
- ✅ Theme persistence across refresh
- ✅ System preference respect
- ✅ Sidebar collapse persistence
- ✅ Chat panel toggle

**Unit Test cases covered (ui.test.ts):**
- ✅ Sidebar initialization (expanded)
- ✅ Sidebar toggle state transitions
- ✅ Sidebar direct state setting
- ✅ Chat panel initialization (open)
- ✅ Chat panel default width (380px)
- ✅ Chat panel toggle state
- ✅ Chat panel width clamping (320-480px)
- ✅ Mobile menu initialization (closed)
- ✅ Mobile menu toggle/open/close
- ✅ Command palette state management
- ✅ LocalStorage persistence (selective)
- ✅ Rapid state change handling
- ✅ State isolation between properties

**Unit Test cases covered (onboarding-wizard-store.test.ts):**
- ✅ Initial state (step 1, null hasDocuments)
- ✅ Step navigation and timestamp updates
- ✅ Documents choice state (hasDocuments)
- ✅ Business details state (name, description)
- ✅ Initial idea state (problem, customer, solution)
- ✅ Reset functionality
- ✅ State persistence with correct key
- ✅ Complete workflow simulation
- ✅ State isolation between fields

---

#### EPIC-08: Business Onboarding

| Story | Description | Test File | Status |
|-------|-------------|-----------|--------|
| 08.1 | Database models | - | ⚠️ Schema only |
| 08.2 | Business list | onboarding.spec.ts:Business List | ✅ |
| 08.3 | Creation wizard | onboarding.spec.ts:Business Creation Wizard | ✅ |
| 08.4 | Document upload | onboarding.spec.ts, documents-upload.test.ts | ✅ |
| 08.5 | Progress tracking | onboarding.spec.ts:Onboarding Progress | ✅ |
| 08.6-9 | Validation workflows | workflow-validation.test.ts | ✅ |
| 08.10-16 | Planning workflows | workflow-planning.test.ts | ✅ |
| 08.17-23 | Branding workflows | workflow-branding.test.ts | ✅ |
| Handoff | Workflow transitions | workflow-handoff.test.ts | ✅ |

**E2E Test cases covered (onboarding.spec.ts):**
- ✅ Display onboarding wizard
- ✅ Navigate through wizard steps
- ✅ Validate required fields
- ✅ Create business successfully
- ✅ Prevent duplicate business names
- ✅ Document upload zone
- ✅ File type validation
- ✅ Business list display
- ✅ Navigation to business detail
- ✅ Progress indicator
- ✅ Responsive design (mobile/tablet)
- ✅ Accessibility (focus, keyboard, ARIA)

**Unit Test cases covered (documents-upload.test.ts):**
- ✅ Authentication requirements (401 for unauthenticated)
- ✅ Workspace validation (400 for no workspace)
- ✅ Business not found handling (404)
- ✅ No files provided error (400)
- ✅ Too many files error (max 5)
- ✅ File size validation (10MB limit)
- ✅ File type validation (PDF, DOCX, MD only)
- ✅ Successful file upload and processing
- ✅ Multiple file processing
- ✅ Business progress update on success
- ✅ Extraction error handling (graceful)
- ✅ GET documents endpoint

**Unit Test cases covered (workflow-validation.test.ts):**
- ✅ Authentication and authorization
- ✅ Request body validation (Zod schemas)
- ✅ Business not found handling
- ✅ Idea intake message processing
- ✅ Problem statement keyword detection
- ✅ Workflow status tracking
- ✅ GET status with completion state
- ✅ PUT update for idea data
- ✅ Schema validation for intake/update

**Unit Test cases covered (workflow-planning.test.ts):**
- ✅ Business model canvas authentication
- ✅ Canvas message validation
- ✅ Business not found handling
- ✅ Canvas block processing (all 9 blocks)
- ✅ Pre-fill from validation data
- ✅ GET canvas status (not_started/in_progress/completed)
- ✅ PUT canvas block update
- ✅ Block name validation (enum)
- ✅ Confidence level validation
- ✅ Canvas completion with next workflow

**Unit Test cases covered (workflow-branding.test.ts):**
- ✅ Brand strategy authentication
- ✅ Analyze action (archetype recommendation)
- ✅ Select archetype action (positioning creation)
- ✅ Generate taglines action
- ✅ Finalize strategy action
- ✅ GET brand strategy status
- ✅ All 12 brand archetypes validated
- ✅ Request schema validation (discriminated union)
- ✅ Positioning generation for archetypes
- ✅ Tagline generation by archetype

**Unit Test cases covered (workflow-handoff.test.ts):**
- ✅ Validation-to-planning authentication
- ✅ Business not found handling
- ✅ Validation session required check
- ✅ Incomplete workflows detection
- ✅ Missing workflows list (all 4)
- ✅ Successful handoff execution
- ✅ Handoff summary with market data
- ✅ Planning session creation
- ✅ Business phase update
- ✅ Event emission (validation.completed)
- ✅ GET handoff status
- ✅ Handoff completion indicators
- ✅ Planning-to-branding requirements
- ✅ Handoff data integrity (validation score, timestamp)

---

#### EPIC-09: UI & Auth Enhancements

| Story | Description | Test File | Status |
|-------|-------------|-----------|--------|
| 09.1 | Microsoft OAuth | oauth-providers.spec.ts | ✅ |
| 09.2 | GitHub OAuth | oauth-providers.spec.ts | ✅ |
| 09.3 | 2FA Setup | two-factor-auth.spec.ts | ✅ |
| 09.4 | 2FA Login | two-factor-auth.spec.ts | ✅ |
| 09.5 | 2FA Management | two-factor-auth.spec.ts | ✅ |
| 09.6 | Magic Link | oauth-providers.spec.ts | ✅ |
| 09.7 | Account Linking | oauth-providers.spec.ts | ✅ |
| 09.8 | OTP Verification | oauth-providers.spec.ts | ✅ |
| 09.9 | Team Stats Cards | team-members.spec.ts | ✅ |
| 09.10 | Team Search/Filters | team-members.spec.ts | ✅ |
| 09.11 | Invite Modal | team-members.spec.ts | ✅ |
| 09.12 | Pending Invitations | team-members.spec.ts | ✅ |
| 09.13 | Last Active Status | team-members.spec.ts | ✅ |
| 09.14-15 | Custom Roles | - | ⚠️ Partial (backend only) |

**E2E Test cases covered (two-factor-auth.spec.ts):**
- ✅ Navigate to security settings
- ✅ 2FA setup option display
- ✅ Setup button when disabled
- ✅ Open 2FA setup modal
- ✅ Authenticator app option
- ✅ QR code display for setup
- ✅ Manual setup code display
- ✅ 6-digit code verification
- ✅ Backup codes display after setup
- ✅ Confirmation checkbox for backup codes
- ✅ 2FA prompt after password on login
- ✅ Accept authenticator code
- ✅ Backup code alternative
- ✅ Trust device option
- ✅ Invalid 2FA code handling
- ✅ 2FA status display in settings
- ✅ Backup codes count (remaining)
- ✅ View backup codes with re-auth
- ✅ Regenerate backup codes
- ✅ Trusted devices list
- ✅ Revoke trusted devices
- ✅ Disable 2FA with password confirmation
- ✅ Accessibility (keyboard navigation, ARIA)

**E2E Test cases covered (oauth-providers.spec.ts):**
- ✅ Microsoft sign-in button display
- ✅ Microsoft sign-up button display
- ✅ Initiate Microsoft OAuth flow
- ✅ Button styling consistency with Google
- ✅ GitHub sign-in button (if enabled)
- ✅ Initiate GitHub OAuth flow
- ✅ Magic link option on sign-in page
- ✅ Navigate to magic link form
- ✅ Valid email required for magic link
- ✅ Send magic link email
- ✅ Magic link verification page
- ✅ Linked accounts in settings
- ✅ Display currently linked providers
- ✅ Link provider button
- ✅ Prevent unlinking last auth method
- ✅ OTP option on email verification
- ✅ 6-digit OTP input
- ✅ OTP code validation
- ✅ OAuth callback error handling
- ✅ OAuth state mismatch handling
- ✅ Accessible OAuth buttons
- ✅ Keyboard activation of OAuth buttons

**E2E Test cases covered (team-members.spec.ts):**
- ✅ Team stats cards section display
- ✅ Total members count
- ✅ Admins count
- ✅ Pending invitations count
- ✅ Seats indicator (unlimited/limited)
- ✅ Responsive stats on mobile
- ✅ Search input display
- ✅ Search by name
- ✅ Search by email
- ✅ Role filter dropdown
- ✅ Filter by role
- ✅ Status filter
- ✅ Filter by status
- ✅ No results state
- ✅ Persist filters in URL
- ✅ Invite button in header
- ✅ Open invite modal
- ✅ Email input with validation
- ✅ Role dropdown in invite
- ✅ Permission preview on role select
- ✅ Optional message field
- ✅ Send invitation successfully
- ✅ Close modal on cancel
- ✅ Pending invitations section
- ✅ Invitation details (email, role, date)
- ✅ Resend invitation button/action
- ✅ Revoke invitation with confirmation
- ✅ Empty state for no invitations
- ✅ Last active column display
- ✅ Status indicator (active/pending)
- ✅ Relative time format
- ✅ Active status for recent activity
- ✅ Keyboard navigation in table
- ✅ Proper table structure (a11y)
- ✅ Screen reader announcements
- ✅ Focusable invite button
- ✅ Responsive tablet display
- ✅ Responsive mobile display
- ✅ Mobile card layout fallback

---

## Test Infrastructure

### Fixtures Available

```typescript
// Import from test fixtures
import { test, expect } from '../support/fixtures';

// Available fixtures:
test('example', async ({ page, auth, userFactory, workspaceFactory, businessFactory }) => {
  // auth: Login/logout helpers
  await auth.loginAsTestUser();
  await auth.loginAs('email', 'password');
  await auth.logout();

  // userFactory: Create test users
  const user = await userFactory.createUser({ password: '...' });
  const verifiedUser = await userFactory.createVerifiedUser();

  // workspaceFactory: Create test workspaces
  const workspace = await workspaceFactory.createWorkspace(authCookie, { name: '...' });

  // businessFactory: Create test businesses
  const business = await businessFactory.createBusiness(authCookie, { name: '...' });
});
```

### Environment Variables

```bash
# Required for E2E tests
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Test1234!
BASE_URL=http://localhost:3000
```

---

## Test Commands Reference

### Root Level (Turborepo)

```bash
# Run all tests across monorepo
pnpm test

# Run specific workspace tests
pnpm --filter @hyvve/web test
pnpm --filter @hyvve/api test
```

### Web App (Next.js)

```bash
cd apps/web

# Unit tests (Vitest)
pnpm test              # Run once
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage

# E2E tests (Playwright)
pnpm test:e2e          # Run headless
pnpm test:e2e:ui       # Interactive UI mode
pnpm test:e2e:headed   # Visible browser

# Run specific test file
pnpm test:e2e -- auth.spec.ts

# Run specific test by name
pnpm test:e2e -- --grep "should sign in"
```

### API (NestJS)

```bash
cd apps/api

# Unit tests (Jest)
pnpm test              # Run once
pnpm test:watch        # Watch mode
pnpm test:cov          # With coverage

# Run specific test file
pnpm test -- auth.guard.spec.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="should validate"
```

---

## CI Pipeline Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4

      # Type check first (fast fail)
      - run: pnpm turbo type-check

      # Lint
      - run: pnpm turbo lint

      # Unit tests
      - run: pnpm turbo test

      # E2E tests (requires services)
      - run: pnpm turbo test:e2e
```

### Test Artifacts

On failure, Playwright captures:
- Screenshots (`test-results/*.png`)
- Videos (`test-results/*.webm`)
- Traces (`test-results/*.zip`)

View traces:
```bash
npx playwright show-trace test-results/trace.zip
```

---

## Coverage Gaps & Recommendations

### Completed Coverage ✅

All high-priority gaps have been filled:

1. **EPIC-09 Tests** - ✅ Full coverage
   - two-factor-auth.spec.ts for 2FA flows
   - oauth-providers.spec.ts for OAuth/magic link
   - team-members.spec.ts for team UI

2. **RLS Integration Tests** - ✅ Complete
   - rls.integration.spec.ts verifies cross-tenant isolation
   - Tests prevent read/update/delete across tenants

3. **Approval E2E Tests** - ✅ Complete
   - approvals.spec.ts tests queue UI, cards, bulk actions
   - Confidence routing indicators tested

4. **Event Bus E2E Tests** - ✅ Complete
   - events.spec.ts tests health, DLQ, replay, stats
   - Admin access control tested

5. **BYOAI UI Tests** - ✅ Complete
   - ai-providers.spec.ts tests provider config, tokens, health

6. **Zustand Store Unit Tests** - ✅ Complete (New)
   - ui.test.ts for UI store state transitions
   - onboarding-wizard-store.test.ts for wizard state
   - Tests for persistence, clamping, and rapid changes

7. **Workflow API Tests** - ✅ Complete (New)
   - workflow-validation.test.ts for idea intake workflow
   - workflow-planning.test.ts for business model canvas
   - workflow-branding.test.ts for brand strategy
   - workflow-handoff.test.ts for phase transitions

8. **Document Upload Tests** - ✅ Complete (New)
   - documents-upload.test.ts for file upload API
   - Validation, processing, and extraction tests

9. **Rate Limiting Tests** - ✅ Already covered
   - rate-limit.test.ts includes concurrency tests

### Remaining Lower Priority (P2)

1. **Component Unit Tests** - UI reliability
   - Test shared components in packages/ui
   - Test complex form components

2. **EPIC-00 AgentOS Tests** - Python agent system
   - Health check for agent orchestrator
   - Agent communication tests

3. **EPIC-09 Custom Roles Tests** - Stories 09.14-15
   - Custom role CRUD tests
   - Permission assignment tests

---

## Flakiness Prevention

Per TEA knowledge base (`ci-burn-in.md`):

1. **Network-first approach** - Intercept before navigate
2. **Deterministic waits** - Use `waitForSelector`, not `waitForTimeout`
3. **Retry on CI** - `retries: 2` in CI, `0` locally
4. **Single worker on CI** - Prevent resource contention
5. **Artifact capture** - `retain-on-failure` for debugging

---

## Running Full Test Suite

**Recommended execution order:**

```bash
# 1. Type check (catches compilation errors)
pnpm turbo type-check

# 2. Lint (catches style/security issues)
pnpm turbo lint

# 3. Unit tests (fast feedback)
cd apps/api && pnpm test
cd apps/web && pnpm test

# 4. E2E smoke tests (verify app alive)
cd apps/web && pnpm test:e2e -- --grep "Smoke"

# 5. Full E2E suite
cd apps/web && pnpm test:e2e
```

**All-in-one command (if configured):**
```bash
pnpm test:all
```

---

_Generated by Master Test Architect (TEA)_
_Risk-based testing. Depth scales with impact._
