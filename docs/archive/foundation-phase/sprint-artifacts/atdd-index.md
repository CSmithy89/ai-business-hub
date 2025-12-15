# ATDD Test Coverage Index - HYVVE Platform

**Generated:** 2025-12-02
**Author:** TEA Agent
**Status:** Active

---

## Overview

This document tracks Acceptance Test-Driven Development (ATDD) coverage across all HYVVE platform epics. Tests are created in RED phase (failing) before implementation to guide development.

---

## Epic Test Coverage Summary

| Epic | Status | E2E Tests | API Tests | Coverage |
|------|--------|-----------|-----------|----------|
| **00 - Scaffolding** | Complete | N/A | N/A | Infrastructure only |
| **01 - Authentication** | Complete | 12 tests | - | 100% AC coverage |
| **02 - Workspaces** | In Progress | 24 tests | - | 100% AC coverage |
| **03 - RBAC** | Backlog | Planned | Planned | 0% |
| **04 - Approvals** | Backlog | Planned | Planned | 0% |
| **05 - Event Bus** | Backlog | - | Planned | 0% |
| **06 - BYOAI** | Backlog | Planned | Planned | 0% |
| **07 - UI Shell** | Backlog | Planned | - | 0% |
| **08 - Onboarding** | Backlog | Planned | Planned | 0% |

---

## Epic 00: Project Scaffolding (Complete)

**Test Coverage:** N/A - Infrastructure setup only

No E2E tests required. Validation via build and lint checks.

---

## Epic 01: Authentication System (Complete)

**Test File:** `apps/web/tests/e2e/auth.spec.ts`
**Coverage:** 12 E2E tests covering all acceptance criteria

### Test Scenarios

| AC ID | Test | Level | Status |
|-------|------|-------|--------|
| AC-1.1 | Register with valid email/password | E2E | Implemented |
| AC-1.2 | Email format validation | E2E | Implemented |
| AC-1.3 | Password strength validation | E2E | Implemented |
| AC-1.4 | Duplicate email rejection | E2E | Implemented |
| AC-2.2 | Verification link activates account | E2E | Implemented |
| AC-2.3 | Expired verification token handled | E2E | Planned |
| AC-3.1 | Sign in with valid credentials | E2E | Implemented |
| AC-3.2 | Invalid credentials rejected | E2E | Implemented |
| AC-3.3 | Unverified user blocked | E2E | Implemented |
| AC-4.1 | Google OAuth initiation | E2E | Implemented |
| AC-5.1 | Password reset email sent | E2E | Implemented |
| AC-6.1 | Session persists across loads | E2E | Implemented |
| AC-6.2 | Sign out clears session | E2E | Implemented |

### Required data-testid Attributes

```
email-input, password-input, sign-in-button, sign-up-button
google-sign-in-button, user-menu, error-message
password-strength, name-input, confirm-password-input
reset-password-button
```

---

## Epic 02: Workspace Management (In Progress)

**Test File:** `apps/web/tests/e2e/workspace.spec.ts`
**Coverage:** 24 E2E tests covering all acceptance criteria

### Test Scenarios by Story

#### Story 02.1: Workspace CRUD (5 tests)

| AC ID | Test | Level | Status |
|-------|------|-------|--------|
| AC-2.1.1 | Create workspace with owner role | E2E | RED |
| AC-2.1.2 | Auto-generate unique slug | E2E | RED |
| AC-2.1.3 | List all user workspaces | E2E | RED |
| AC-2.1.4 | Member cannot update settings | E2E | RED |
| AC-2.1.5 | Owner can soft delete | E2E | RED |

#### Story 02.2: Member Invitation (4 tests)

| AC ID | Test | Level | Status |
|-------|------|-------|--------|
| AC-2.2.1 | Owner can invite members | E2E | RED |
| AC-2.2.3 | Member cannot invite | E2E | RED |
| AC-2.2.4 | Duplicate invitation blocked | E2E | RED |
| AC-2.2.5 | Email delivery timing | E2E | Planned |

#### Story 02.3: Invitation Acceptance (4 tests)

| AC ID | Test | Level | Status |
|-------|------|-------|--------|
| AC-2.3.1 | Logged-in user accepts | E2E | RED |
| AC-2.3.2 | New user redirected to sign-up | E2E | RED |
| AC-2.3.3 | Expired invitation error | E2E | RED |
| AC-2.3.4 | Already-used token rejected | E2E | RED |

#### Story 02.4: Workspace Switching (3 tests)

| AC ID | Test | Level | Status |
|-------|------|-------|--------|
| AC-2.4.1 | Switch between workspaces | E2E | RED |
| AC-2.4.2 | Session updates on switch | E2E | RED |
| AC-2.4.3 | Last workspace remembered | E2E | RED |

#### Story 02.5: Member Management (5 tests)

| AC ID | Test | Level | Status |
|-------|------|-------|--------|
| AC-2.5.1 | List all members with roles | E2E | RED |
| AC-2.5.2 | Owner can change roles | E2E | RED |
| AC-2.5.3 | Admin cannot demote owner | E2E | RED |
| AC-2.5.4 | Member can leave | E2E | RED |
| AC-2.5.5 | Owner cannot leave | E2E | RED |

#### Story 02.6: Workspace Settings (3 tests)

| AC ID | Test | Level | Status |
|-------|------|-------|--------|
| AC-2.6.1 | Settings page accessible | E2E | RED |
| AC-2.6.2 | Name update works | E2E | RED |
| AC-2.6.3 | Avatar upload works | E2E | RED |

#### Story 02.7: Workspace Deletion (3 tests)

| AC ID | Test | Level | Status |
|-------|------|-------|--------|
| AC-2.7.1 | Delete requires confirmation | E2E | RED |
| AC-2.7.2 | 30-day grace period | E2E | RED |
| AC-2.7.3 | Deleted workspace access blocked | E2E | RED |

### Required data-testid Attributes

```
workspace-name-input, create-workspace-button, workspace-card
workspace-selector, workspace-option-*, workspace-name
invite-member-button, invite-email-input, invite-role-select
send-invitation-button, member-row, member-role
member-actions-*, change-role-*, leave-workspace-button
settings-form, save-settings-button, avatar-upload-input
delete-confirmation-input, delete-workspace-button
```

---

## Epic 03: RBAC & Multi-Tenancy (Planned)

**Test File:** `apps/web/tests/e2e/rbac.spec.ts` (not yet created)
**Estimated Tests:** 20+ E2E tests

### Planned Test Scenarios

- Permission matrix enforcement (5 roles × 6 permissions)
- Auth guards block unauthorized access
- Tenant isolation verification
- Module-level permission overrides
- Audit logging for permission changes

---

## Epic 04: Approval Queue System (Planned)

**Test File:** `apps/web/tests/e2e/approvals.spec.ts` (not yet created)
**Estimated Tests:** 25+ E2E tests

### Planned Test Scenarios

- Confidence-based routing (auto/quick/full review)
- Approval queue dashboard
- Bulk approval operations
- Escalation workflows
- AI reasoning display
- Audit trail viewing

---

## Epic 05: Event Bus (Planned)

**Test File:** `apps/web/tests/api/events.api.spec.ts` (not yet created)
**Estimated Tests:** 15+ API tests

### Planned Test Scenarios

- Event publishing and subscribing
- Retry and dead letter queue
- Event replay functionality
- Cross-module event routing

---

## Epic 06: BYOAI Configuration (Planned)

**Test File:** `apps/web/tests/e2e/ai-providers.spec.ts` (not yet created)
**Estimated Tests:** 20+ E2E + API tests

### Planned Test Scenarios

- Provider configuration (Claude, OpenAI, Gemini, DeepSeek)
- Credential encryption
- Token usage tracking and limits
- Provider health monitoring
- Model preference selection

---

## Epic 07: UI Shell (Planned)

**Test File:** `apps/web/tests/e2e/shell.spec.ts` (not yet created)
**Estimated Tests:** 15+ E2E tests

### Planned Test Scenarios

- Dashboard layout rendering
- Sidebar navigation
- Header bar interactions
- Chat panel
- Dark/light mode toggle
- Command palette
- Keyboard shortcuts

---

## Epic 08: Business Onboarding (Planned)

**Test File:** `apps/web/tests/e2e/onboarding.spec.ts` (not yet created)
**Estimated Tests:** 30+ E2E tests

### Planned Test Scenarios

- Onboarding wizard flow
- Document upload and extraction
- Validation team workflows
- Planning team workflows
- Branding team workflows
- Module handoff

---

## Test Infrastructure

### Fixtures Available

| Fixture | Purpose | File |
|---------|---------|------|
| `auth` | Login/logout helpers | `fixtures/index.ts` |
| `userFactory` | Create test users | `fixtures/factories/user-factory.ts` |
| `workspaceFactory` | Create test workspaces | `fixtures/factories/workspace-factory.ts` |

### Running Tests

```bash
# Run all E2E tests
pnpm --filter @hyvve/web test:e2e

# Run specific epic tests
pnpm --filter @hyvve/web test:e2e -- tests/e2e/auth.spec.ts
pnpm --filter @hyvve/web test:e2e -- tests/e2e/workspace.spec.ts

# Run in headed mode
pnpm --filter @hyvve/web test:e2e:headed

# Run specific test
pnpm --filter @hyvve/web test:e2e -- -g "should create workspace"
```

---

## Red-Green-Refactor Workflow

### RED Phase (TEA Responsibility)

1. Create failing tests from acceptance criteria
2. Ensure tests fail due to missing implementation
3. Document required data-testid attributes
4. Create supporting fixtures and factories

### GREEN Phase (DEV Responsibility)

1. Pick one failing test
2. Implement minimal code to pass
3. Run test to verify green
4. Move to next test

### REFACTOR Phase (DEV Responsibility)

1. All tests passing
2. Improve code quality
3. Extract duplications
4. Ensure tests still pass

---

## Next Steps

1. **Epic 02 in progress:** Implement workspace features to turn RED tests GREEN
2. **Epic 03 tech spec:** Create tech spec before ATDD tests
3. **As each epic is contexted:** Generate ATDD test stubs

---

**Generated by:** BMad TEA Agent - ATDD Workflow
**Version:** 4.0 (BMad v6)
