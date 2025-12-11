# Story 15.7: Implement Settings Security Page

**Story ID:** 15.7
**Epic:** EPIC-15 - UI/UX Platform Foundation
**Priority:** P0 - Critical
**Points:** 5
**Status:** done

---

## User Story

**As a** user concerned about account security
**I want** a functional security settings page with password change
**So that** I can update my password and manage security settings

---

## Context

The security settings page currently shows a placeholder for password change with "Password change functionality coming soon." This story implements the password change functionality to complete the security page.

The page already has:
- TwoFactorCard component (Story 09-3)
- Linked Accounts link (Story 09-7)
- Sessions link (Story 01-7)

**Source:** tech-spec-epic-15.md Section 15.6-15.10
**Backlog Reference:** Section 4 - Settings Pages

---

## Acceptance Criteria

### Core Functionality

- [x] Password change form with:
  - Current password field (required)
  - New password field (required, validated)
  - Confirm new password field (required, must match)
- [x] Password validation:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- [x] Option to revoke other sessions on password change
- [x] Show/hide password toggle for all fields
- [x] Form validation with error messages
- [x] Success toast on password change
- [x] Loading state during submission
- [x] Error handling for wrong current password

---

## Technical Implementation

### Files to Create

```
apps/web/src/components/settings/password-change-form.tsx   # Password change form component
```

### Files to Modify

```
apps/web/src/app/(dashboard)/settings/security/page.tsx     # Replace placeholder with form
apps/web/src/lib/auth-client.ts                             # Export changePassword if needed
apps/web/src/lib/validations/auth.ts                        # Add changePassword schema
```

### Implementation Strategy

1. Create PasswordChangeForm component with:
   - Current password input with show/hide toggle
   - New password input with validation feedback
   - Confirm password input with match validation
   - Checkbox for "Sign out other sessions"
   - Submit button with loading state

2. Use existing passwordSchema from auth validations

3. Use better-auth `authClient.changePassword()` API:
   ```typescript
   await authClient.changePassword({
     currentPassword: "OldPassword123!",
     newPassword: "NewPassword456!",
     revokeOtherSessions: true,
   });
   ```

4. Handle errors:
   - Invalid current password
   - Network errors
   - Validation errors

---

## Tech Spec Reference

See **tech-spec-epic-15.md** Section: "Stories 15.6-15.10: Settings Pages Implementation"

---

## Definition of Done

- [x] Password change form displays correctly
- [x] All password validation rules enforced
- [x] Confirm password must match
- [x] Show/hide password toggles work
- [x] Form submits with loading state
- [x] Success toast on successful change
- [x] Error messages for invalid current password
- [x] Option to revoke other sessions works
- [x] TypeScript type check passes
- [x] ESLint passes
- [x] Code review completed

---

## Dependencies

- better-auth `changePassword` API
- Existing auth-client.ts setup
- Existing password validation schema

---

## Notes

- Uses existing passwordSchema from auth validations for consistency
- Revoke other sessions defaults to true for security
- Show/hide toggle improves UX for password entry

---

## Related Stories

- **15.6:** Implement Settings Profile Page (completed)
- **15.8:** Implement Settings Sessions Page
- **09-3:** Two-Factor Authentication (TwoFactorCard exists)

---

_Story created: 2025-12-11_
_Source: EPIC-15 UI/UX Platform Foundation_
_Tech Spec: tech-spec-epic-15.md_

---

## Tasks/Subtasks

- [x] **Task 1:** Add changePasswordSchema to auth validations
- [x] **Task 2:** Create PasswordChangeForm component
- [x] **Task 3:** Update security page with PasswordChangeForm
- [x] **Task 4:** Test password change functionality
- [x] **Task 5:** Verify TypeScript type check passes
- [x] **Task 6:** Verify ESLint passes

---

## File List

### Files to Create

| File | Description |
|------|-------------|
| `apps/web/src/components/settings/password-change-form.tsx` | Password change form component |

### Files to Modify

| File | Description |
|------|-------------|
| `apps/web/src/app/(dashboard)/settings/security/page.tsx` | Replace placeholder with form |
| `apps/web/src/lib/validations/auth.ts` | Add changePassword schema |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted | Claude Code |
| 2025-12-11 | Implementation complete | Claude Code |

---

## Senior Developer Review

### Implementation Summary

**Date:** 2025-12-11
**Reviewer:** Claude Code (AI)
**Status:** APPROVED

### Acceptance Criteria Validation

| Criteria | Status | Notes |
|----------|--------|-------|
| Password change form | PASS | All three fields present with labels |
| Password validation | PASS | Uses existing passwordSchema with all rules |
| Confirm password match | PASS | Zod refine validates match |
| Show/hide toggles | PASS | Eye/EyeOff icons on all fields |
| Loading state | PASS | Loader2 spinner on submit |
| Success toast | PASS | sonner toast on success |
| Error handling | PASS | Handles incorrect password, network errors |
| Revoke sessions option | PASS | Checkbox defaults to checked |

### Code Quality

| Aspect | Assessment |
|--------|------------|
| TypeScript | Strict mode, proper typing with Zod inference |
| Component Structure | Clean separation, single responsibility |
| State Management | react-hook-form with Zod resolver |
| Error Handling | Comprehensive: validation, API, network errors |
| UX | Password strength indicators, helpful text |

### Files Created

| File | Purpose |
|------|---------|
| `apps/web/src/components/settings/password-change-form.tsx` | Password change form with validation |

### Files Modified

| File | Changes |
|------|---------|
| `apps/web/src/app/(dashboard)/settings/security/page.tsx` | Replaced placeholder with PasswordChangeForm |
| `apps/web/src/lib/validations/auth.ts` | Added changePasswordSchema |

### Testing Results

- TypeScript type check: PASS
- ESLint: PASS (no new warnings)
- Playwright UI test: PASS - Form renders, fields accept input, validation visible

### Security Considerations

- Uses better-auth changePassword API with proper authentication
- Current password required for verification
- Option to revoke other sessions for security
- No password displayed in plain text by default
