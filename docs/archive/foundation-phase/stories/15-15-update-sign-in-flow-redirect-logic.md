# Story 15-15: Update Sign-In Flow Redirect Logic

**Status:** done
**Points:** 2
**Priority:** P1
**Epic:** EPIC-15 - UI/UX Platform Foundation

---

## User Story

**As a** returning user
**I want** to land on the right page after sign-in
**So that** I can immediately start working

## Acceptance Criteria

- [x] After successful sign-in:
  - [x] If no workspaces exist → redirect to `/onboarding/account-setup`
  - [x] If workspaces exist → redirect to `/businesses`
  - [x] If deep link provided → redirect to deep link after auth
- [x] Middleware stores intended destination before auth redirect
- [x] OAuth callbacks use intelligent redirect logic
- [x] Magic link uses `/businesses` as default callback
- [x] Businesses page redirects to onboarding if NO_WORKSPACE error

## Technical Implementation

### Files Created

1. **`apps/web/src/app/api/auth/redirect-destination/route.ts`**
   - New API endpoint that determines redirect destination based on user state
   - Checks workspace membership
   - Sets active workspace if none set
   - Returns destination URL with reason

### Files Modified

1. **`apps/web/middleware.ts`**
   - Updated to support deep link redirect via `?redirect=` query param
   - Enhanced protected route handling
   - Added open redirect prevention (`isAllowedRedirect()`)

2. **`apps/web/src/components/auth/sign-in-form.tsx`**
   - Added `handleSuccessfulSignIn()` function
   - Uses redirect-destination API for intelligent routing
   - Updated OAuth callbacks to use `getOAuthCallbackURL()`
   - Supports deep link preservation from URL params

3. **`apps/web/src/lib/auth-client.ts`**
   - Updated `sendMagicLink()` default callback from `/dashboard` to `/businesses`

4. **`apps/web/src/app/(app)/businesses/page.tsx`**
   - Added NO_WORKSPACE error handling
   - Redirects to onboarding if user has no workspace

## Sign-In Flow Logic

```
User signs in
    │
    ├── Check URL for ?redirect param
    │   └── If valid → redirect there
    │
    ├── Call /api/auth/redirect-destination
    │   │
    │   ├── No workspaces → /onboarding/account-setup
    │   │
    │   └── Has workspace → /businesses
    │
    └── Fallback → /businesses
```

## Security Considerations

- Open redirect prevention via `isAllowedRedirect()` validation
- Only allows relative paths starting with `/`
- Blocks protocol-relative URLs (`//`)
- Blocks javascript: and data: URLs

## Testing Notes

1. Sign in with new user (no workspace) → should redirect to onboarding
2. Sign in with existing user → should redirect to businesses
3. Sign in with `?redirect=/settings` → should redirect to settings after auth
4. OAuth sign-in → should use same redirect logic
5. Magic link → should redirect to businesses by default

## Definition of Done

- [x] Type check passes
- [x] Middleware handles redirect params securely
- [x] OAuth and email sign-in use consistent redirect logic
- [x] NO_WORKSPACE error triggers onboarding redirect
- [x] Code committed to epic branch
