# Epic 01: Authentication System

**Epic ID:** EPIC-01
**Status:** Ready for Development
**Priority:** P0 - Critical
**Phase:** Phase 1 - Core Foundation

---

## Epic Overview

Implement user authentication using better-auth with email/password and Google OAuth support.

### Business Value
Secure user authentication is the foundation for all platform access. Users can create accounts, sign in, and manage their sessions securely.

### Success Criteria
- [ ] Users can register with email/password
- [ ] Users can sign in with Google OAuth
- [ ] Password reset flow functional
- [ ] Sessions managed with JWT + database
- [ ] Rate limiting on auth endpoints

---

## Stories

### Story 01.1: Install and Configure better-auth

**Points:** 3
**Priority:** P0

**As a** developer
**I want** better-auth configured with Prisma adapter
**So that** I have a foundation for all auth flows

**Acceptance Criteria:**
- [ ] Install better-auth and Prisma adapter
- [ ] Create `lib/auth.ts` with better-auth configuration
- [ ] Configure session settings (7 days, daily refresh)
- [ ] Set up environment variables for secrets
- [ ] Create API route handlers in `app/api/auth/[...all]/route.ts`
- [ ] Verify auth endpoints respond correctly

**Technical Notes:**
```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization } from 'better-auth/plugins'
```

---

### Story 01.2: Implement Email/Password Registration

**Points:** 3
**Priority:** P0

**As a** new user
**I want** to register with my email and password
**So that** I can create an account on the platform

**Acceptance Criteria:**
- [ ] Create sign-up page at `/sign-up`
- [ ] Validate email format and password strength
- [ ] Hash password with Argon2id (better-auth default)
- [ ] Send email verification link
- [ ] Create unverified user in database
- [ ] Show success message with verification instructions
- [ ] Rate limit: 3 attempts per hour

**UI Components:**
- Email input with validation
- Password input with strength indicator
- Terms acceptance checkbox
- Submit button with loading state

---

### Story 01.3: Implement Email Verification

**Points:** 2
**Priority:** P0

**As a** new user
**I want** to verify my email address
**So that** I can activate my account

**Acceptance Criteria:**
- [ ] Generate secure verification token (24hr expiry)
- [ ] Send verification email via Resend
- [ ] Create verification page at `/verify-email`
- [ ] Update user `emailVerified` on success
- [ ] Handle expired/invalid tokens gracefully
- [ ] Allow resend of verification email (rate limited)

**Technical Notes:**
- Token stored in `verification_tokens` table
- Use Resend for transactional email

---

### Story 01.4: Implement Email/Password Sign-In

**Points:** 2
**Priority:** P0

**As a** registered user
**I want** to sign in with my email and password
**So that** I can access my account

**Acceptance Criteria:**
- [ ] Create sign-in page at `/sign-in`
- [ ] Validate credentials against database
- [ ] Create session in database
- [ ] Set session token in HTTP-only cookie
- [ ] Redirect to dashboard on success
- [ ] Show appropriate error for invalid credentials
- [ ] Rate limit: 5 attempts per 15 minutes

**UI Components:**
- Email input
- Password input with show/hide toggle
- "Remember me" checkbox (extends session to 30 days)
- "Forgot password" link
- Sign-in button with loading state

---

### Story 01.5: Implement Google OAuth

**Points:** 3
**Priority:** P0

**As a** user
**I want** to sign in with my Google account
**So that** I can access the platform without creating a password

**Acceptance Criteria:**
- [ ] Configure Google OAuth provider in better-auth
- [ ] Add "Sign in with Google" button
- [ ] Handle OAuth callback
- [ ] Create or link user account
- [ ] Store OAuth tokens in `accounts` table
- [ ] Support account linking for existing email users

**Technical Notes:**
- Google Cloud Console setup required
- Redirect URI: `{NEXT_PUBLIC_URL}/api/auth/callback/google`

---

### Story 01.6: Implement Password Reset Flow

**Points:** 2
**Priority:** P0

**As a** user who forgot their password
**I want** to reset my password via email
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] Create forgot password page at `/forgot-password`
- [ ] Generate secure reset token (1hr expiry)
- [ ] Send password reset email
- [ ] Create reset page at `/reset-password`
- [ ] Validate token and update password
- [ ] Invalidate all existing sessions on reset
- [ ] Rate limit: 3 attempts per hour

---

### Story 01.7: Implement Session Management

**Points:** 2
**Priority:** P0

**As a** user
**I want** to manage my active sessions
**So that** I can maintain security of my account

**Acceptance Criteria:**
- [ ] Create session context provider
- [ ] Implement `useSession` hook
- [ ] Store active workspace in session
- [ ] Add sign-out functionality (current device)
- [ ] Add sign-out all devices functionality
- [ ] Display active sessions in settings (future)

**Technical Notes:**
- JWT access tokens (15 min)
- Database sessions (7 days default, 30 with remember)

---

### Story 01.8: Create Auth UI Components

**Points:** 2
**Priority:** P0

**As a** user
**I want** a consistent and polished authentication experience
**So that** I trust the platform with my credentials

**Acceptance Criteria:**
- [ ] Create AuthLayout component (centered, branding)
- [ ] Style form inputs per Style Guide
- [ ] Add loading states for form submission
- [ ] Add toast notifications for success/error
- [ ] Implement responsive design for mobile
- [ ] Add "Sign in with Google" styled button

---

## Wireframe References

All Authentication wireframes are complete. Reference these when implementing:

| Story | Wireframe | Description | Assets |
|-------|-----------|-------------|--------|
| 01.2 Registration | AU-02 | Register page with email/password, Google OAuth | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-02_register/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-02_register/screen.png) |
| 01.3 Email Verification | AU-05 | Email verification pending, resend link | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-05_email_verification/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-05_email_verification/screen.png) |
| 01.4 Sign-In | AU-01 | Login page with email/password, Google OAuth | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-01_login_page/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-01_login_page/screen.png) |
| 01.6 Password Reset | AU-03 | Forgot password form | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-03_forgot_password/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-03_forgot_password/screen.png) |
| 01.6 Password Reset | AU-04 | New password form after reset | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-04_password_reset/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-04_password_reset/screen.png) |
| 01.8 Auth UI | All AU-* | Auth layout and component patterns | Reference all above wireframes for consistent styling |

**Full wireframe index:** [WIREFRAME-INDEX.md](../design/wireframes/WIREFRAME-INDEX.md)

---

## Dependencies

- Epic 00: Project Scaffolding (for Prisma, Next.js setup)

## Technical Notes

### Environment Variables Required
```bash
BETTER_AUTH_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
RESEND_API_KEY=xxx
```

### Database Tables Used
- `users` - User accounts
- `sessions` - Active sessions
- `accounts` - OAuth provider accounts
- `verification_tokens` - Email/password tokens

---

_Epic created: 2025-11-30_
_PRD Reference: FR-1 User Authentication_
