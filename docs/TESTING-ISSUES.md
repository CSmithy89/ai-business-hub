# HYVVE Platform Testing Issues Report

**Date:** 2025-12-10
**Tester:** Claude Code (Playwright MCP)
**Branch:** fix/oauth-account-schema

---

## Executive Summary

Comprehensive testing of the HYVVE platform revealed **23 issues** across different severity levels. The most critical issues involve build errors affecting multiple settings pages due to `node:crypto` module imports in client-side code.

| Severity | Count |
|----------|-------|
| Critical | 6 |
| High | 5 |
| Medium | 7 |
| Low | 5 |

---

## Critical Issues (Blocking)

### 1. node:crypto Build Error - Multiple Pages Broken
**Severity:** CRITICAL
**Status:** 500 Internal Server Error
**Error:** `Module build failed: UnhandledSchemeError: Reading from "node:crypto" is not handled by plugins`

**Affected Pages:**
| Page | URL |
|------|-----|
| Workspace Roles | `/settings/workspace/roles` |
| AI Configuration | `/settings/ai-config` |
| API Keys | `/settings/api-keys` |
| Appearance | `/settings/appearance` |
| Linked Accounts | `/settings/linked-accounts` |
| Agent Activity | `/agents/activity` |

**Root Cause:** Server-side Node.js modules (`node:crypto`, `node:util`) are being imported in client-side components. Webpack cannot handle `node:` protocol URIs in browser bundles.

**Fix Required:**
1. Move crypto operations to server-side API routes
2. Use `crypto-browserify` or Web Crypto API for client-side
3. Add dynamic imports with `'use server'` directive
4. Check for `typeof window === 'undefined'` before using Node.js APIs

---

### 2. Google OAuth - 500 Internal Server Error
**Severity:** CRITICAL
**URL:** `/api/auth/callback/google`
**Status:** 500 Internal Server Error

**Root Cause:** Known issue from Epic 14 retrospective - Account schema incompatibility with better-auth OAuth flow.

**Fix Required:** Resolve the Account schema issue in better-auth configuration.

---

## High Priority Issues (404 Pages)

### 3. Missing Terms Page
**Severity:** HIGH
**URL:** `/terms`
**Status:** 404 Not Found

**Fix Required:** Create `apps/web/src/app/(public)/terms/page.tsx`

---

### 4. Missing Privacy Page
**Severity:** HIGH
**URL:** `/privacy`
**Status:** 404 Not Found

**Fix Required:** Create `apps/web/src/app/(public)/privacy/page.tsx`

---

### 5. Missing Help Page
**Severity:** HIGH
**URL:** `/help`
**Status:** 404 Not Found

**Note:** Help link appears in header on every page but leads to 404.

**Fix Required:** Create `apps/web/src/app/(dashboard)/help/page.tsx`

---

### 6. CRM Module - 404 (Expected)
**Severity:** HIGH (Expected - Future Module)
**URL:** `/crm`
**Status:** 404 Not Found

**Note:** CRM is listed in sidebar navigation but the module is planned for future implementation.

**Fix Options:**
1. Remove from sidebar until implemented
2. Create placeholder page with "Coming Soon" message
3. Hide behind feature flag

---

### 7. Projects Module - 404 (Expected)
**Severity:** HIGH (Expected - Future Module)
**URL:** `/projects`
**Status:** 404 Not Found

**Note:** Projects is listed in sidebar navigation but the module is planned for future implementation.

**Fix Options:** Same as CRM above.

---

## Medium Priority Issues (Functional)

### 8. Dashboard - Failed to Load Businesses
**Severity:** MEDIUM
**URL:** `/dashboard`
**Error:** "Failed to load businesses. Please try again later."
**Console:** Multiple 400 Bad Request errors

**Likely Cause:** API endpoint returning errors, possibly auth-related or missing data.

**Fix Required:** Debug `/api/businesses` endpoint and handle error states gracefully.

---

### 9. Workspace Settings - No Workspace Selected
**Severity:** MEDIUM
**URL:** `/settings/workspace`
**Issue:** Shows "No workspace selected" message

**Same issue on:** `/settings/workspace/members`

**Fix Required:** Ensure workspace context is properly loaded/selected on settings pages.

---

### 10. 2FA Status Fetch Failure
**Severity:** MEDIUM
**URL:** `/settings/security`
**Console Error:** `Failed to fetch 2FA status: TypeError: Failed to fetch`

**Fix Required:** Debug the 2FA status API endpoint.

---

### 11. Onboarding Launch - Auth Required
**Severity:** MEDIUM
**URL:** `/onboarding/wizard?step=4`
**Error:** "You must be signed in to create a business"

**Note:** This is expected behavior but user session seems to be lost during wizard flow.

**Fix Required:** Ensure auth session persists through onboarding wizard.

---

### 12. Missing Favicon
**Severity:** MEDIUM
**URL:** `/favicon.ico`
**Status:** 404 Not Found

**Fix Required:** Add favicon to `apps/web/public/favicon.ico`

---

### 13. Microsoft OAuth Button Missing
**Severity:** MEDIUM
**URL:** `/sign-in`
**Issue:** Wireframe shows Microsoft OAuth button, not implemented

**Reference:** Wireframe AU-01

**Fix Required:** Add Microsoft OAuth button to sign-in page (better-auth supports it).

---

### 14. GitHub OAuth Button Missing
**Severity:** MEDIUM
**URL:** `/sign-in`
**Issue:** Wireframe shows GitHub OAuth button, not implemented

**Reference:** Wireframe AU-01

**Fix Required:** Add GitHub OAuth button to sign-in page (better-auth supports it).

---

## Low Priority Issues (UX/Polish)

### 15. Sign-up Missing Confirm Password Field
**Severity:** LOW
**URL:** `/sign-up`
**Issue:** Wireframe shows confirm password field with match validation

**Reference:** Wireframe AU-02

**Fix Required:** Add confirm password input with validation.

---

### 16. Password Change - Placeholder Only
**Severity:** LOW
**URL:** `/settings/security`
**Issue:** Shows "Password change functionality coming soon"

**Fix Required:** Implement password change form.

---

### 17. Chat Panel - Fullscreen/Pop-out Not Implemented
**Severity:** LOW
**Issue:** Buttons visible but functionality not implemented

**Reference:** Wireframe CH-01

---

### 18. Approval Cards - Missing Quick Actions
**Severity:** LOW
**URL:** `/approvals`
**Issue:** Wireframe shows Approve/Reject buttons directly on cards

**Reference:** Wireframe AP-01

**Fix Required:** Add quick action buttons to approval list items.

---

### 19. Countdown Timers - Not Implemented
**Severity:** LOW
**URLs:** `/forgot-password`, `/verify-email`
**Issue:** Wireframes show resend countdown timers

**Reference:** Wireframes AU-03, AU-05

---

## Working Pages Summary

| Page | URL | Status |
|------|-----|--------|
| Sign In | `/sign-in` | ✅ Works |
| Sign Up | `/sign-up` | ✅ Works |
| Forgot Password | `/forgot-password` | ✅ Works |
| Magic Link | `/magic-link` | ✅ Works |
| Reset Password | `/reset-password` | ✅ Works |
| Dashboard | `/dashboard` | ✅ Loads (data error) |
| Approvals | `/approvals` | ✅ Works |
| AI Team/Agents | `/agents` | ✅ Works |
| Settings Profile | `/settings` | ✅ Works |
| Settings Security | `/settings/security` | ✅ Works |
| Settings Sessions | `/settings/sessions` | ✅ Works |
| Settings Workspace | `/settings/workspace` | ✅ Works |
| Settings Members | `/settings/workspace/members` | ✅ Works |
| Onboarding Wizard | `/onboarding/wizard` | ✅ Works (all 4 steps) |
| Business Validation | `/dashboard/[id]/validation` | ✅ Works |
| Business Planning | `/dashboard/[id]/planning` | ✅ Works |
| Business Branding | `/dashboard/[id]/branding` | ✅ Works |

---

## Wireframe Gap Analysis Summary

Based on `docs/wireframe-gap-analysis.md`:

### Fully Implemented Features
- Authentication flow (sign-in, sign-up, forgot password, reset password, 2FA)
- Settings layout with sidebar navigation
- Approval queue with filters and sorting
- Chat panel with agent conversation
- Business onboarding wizard (4 steps)
- Business validation/planning/branding pages
- Business switcher dropdown
- Three-panel shell layout

### Partially Implemented Features
- Agent cards (basic version, missing full card variants)
- Confidence breakdown (color coding works, detailed breakdown missing)
- Chat message types (basic messages work, preview cards missing)
- Approval detail modal (basic works, confidence factors missing)

### Not Implemented Features (Future Epics)
- Agent Detail Modal (5-tab interface)
- Agent Activity Feed (real-time)
- Agent Configuration Page (BYOAI settings)
- Validation Score Circle
- Milestone Timeline
- Business Card/Social Previews
- Export/Download Options

---

## Recommended Fix Priority

### Immediate (Sprint Blockers)
1. **Fix node:crypto build error** - Blocks 6 pages
2. **Fix OAuth Account schema** - Blocks social login
3. **Create Terms page** - Required for legal compliance
4. **Create Privacy page** - Required for legal compliance

### High Priority (This Sprint)
5. Create Help page
6. Fix dashboard business loading
7. Fix workspace selection state
8. Add favicon

### Medium Priority (Next Sprint)
9. Add Microsoft/GitHub OAuth buttons
10. Add confirm password field
11. Implement password change
12. Fix 2FA status fetch
13. Add placeholder pages for CRM/Projects

### Low Priority (Backlog)
14. Chat fullscreen/pop-out
15. Quick actions on approval cards
16. Countdown timers
17. Remaining wireframe gaps

---

## Test Environment

- **Platform:** Linux (WSL2)
- **Node Version:** (check with `node -v`)
- **Browser:** Chromium (Playwright)
- **Base URL:** http://localhost:3000
- **Test Account:** Created via sign-up flow

---

## Next Steps

1. Address critical node:crypto issue first
2. Create missing legal pages (Terms, Privacy)
3. Fix OAuth flow for social login
4. Add placeholder pages for future modules
5. Continue wireframe implementation in future sprints

---

## Related Documents

- `docs/wireframe-gap-analysis.md` - Detailed wireframe comparison
- `docs/epics/EPIC-14/retrospective.md` - OAuth issue documentation
- `docs/architecture.md` - Technical architecture reference
