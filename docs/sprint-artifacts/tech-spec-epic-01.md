# Epic Technical Specification: Authentication System

Date: 2025-12-01
Author: chris
Epic ID: 01
Status: Draft

---

## Overview

Epic 01 implements the complete authentication system for the HYVVE platform using better-auth library with Prisma adapter. This epic establishes secure user registration, sign-in flows (email/password and Google OAuth), email verification, password reset, and session management. Authentication is foundational to all platform access and enables the multi-tenant workspace architecture defined in subsequent epics.

The authentication system aligns with the "90/5 Promise" by providing frictionless user onboarding (target: < 3 minutes from signup to workspace creation) while maintaining enterprise-grade security through JWT tokens, rate limiting, and secure session management.

## Objectives and Scope

### In Scope
- Email/password registration with email verification via Resend
- Google OAuth sign-in/sign-up with account linking
- Password reset flow with secure time-limited tokens
- Session management with JWT access tokens (15 min) + database sessions (7-30 days)
- Rate limiting on all authentication endpoints
- Auth UI components following HYVVE design system
- Integration with existing Prisma schema (users, sessions, accounts, verification_tokens)

### Out of Scope
- Two-factor authentication (2FA/TOTP) - Growth feature
- Magic link / passwordless authentication - Growth feature
- GitHub/Microsoft OAuth providers - Growth feature
- SAML/SSO integration - Enterprise feature
- Custom role creation - Epic 03 (RBAC)

## System Architecture Alignment

### Components Referenced
| Component | Purpose | Package |
|-----------|---------|---------|
| better-auth | Authentication library | `apps/web/src/lib/auth.ts` |
| Prisma Adapter | Database integration | `packages/db` |
| Next.js API Routes | Auth endpoints | `apps/web/src/app/api/auth/[...all]` |
| Resend | Email service | External service |
| React Query | Client state | `apps/web` |

### Architecture Constraints
- **ADR-005**: better-auth selected for native organization support
- **ADR-003**: Prisma Client Extension for tenant filtering (future epics)
- JWT tokens must include `workspaceId` claim for multi-tenant support
- HTTP-only cookies for session tokens (XSS protection)
- CORS configuration for API routes

---

## Detailed Design

### Services and Modules

| Service | Responsibility | Location | Owner |
|---------|---------------|----------|-------|
| AuthService | better-auth configuration, providers | `apps/web/src/lib/auth.ts` | Frontend |
| SessionProvider | React context for auth state | `apps/web/src/components/providers` | Frontend |
| EmailService | Verification/reset emails via Resend | `apps/web/src/lib/email.ts` | Frontend |
| AuthGuard | Route protection middleware | `apps/web/src/middleware.ts` | Frontend |

### Data Models and Contracts

**Existing Prisma Models (from packages/db):**

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  emailVerified Boolean   @default(false) @map("email_verified")
  name          String?
  image         String?
  passwordHash  String?   @map("password_hash")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  sessions      Session[]
  accounts      Account[]
  workspaces    WorkspaceMember[]
}

model Session {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  token             String    @unique
  expiresAt         DateTime  @map("expires_at")
  ipAddress         String?   @map("ip_address")
  userAgent         String?   @map("user_agent")
  activeWorkspaceId String?   @map("active_workspace_id")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  provider          String
  providerAccountId String    @map("provider_account_id")
  accessToken       String?   @map("access_token") @db.Text
  refreshToken      String?   @map("refresh_token") @db.Text
  expiresAt         DateTime? @map("expires_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model VerificationToken {
  id         String   @id @default(uuid())
  identifier String
  token      String   @unique
  expiresAt  DateTime @map("expires_at")
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([identifier, token])
}
```

**JWT Payload Structure:**
```typescript
interface JwtPayload {
  sub: string;           // User ID
  sessionId: string;     // Session reference
  workspaceId?: string;  // Active workspace (multi-tenant)
  email: string;
  name: string;
  iat: number;           // Issued at
  exp: number;           // Expiration
}
```

### APIs and Interfaces

| Endpoint | Method | Request | Response | Rate Limit |
|----------|--------|---------|----------|------------|
| `/api/auth/sign-up/email` | POST | `{ email, password, name }` | `{ user, session }` | 3/hour |
| `/api/auth/sign-in/email` | POST | `{ email, password, remember? }` | `{ user, session }` | 5/15min |
| `/api/auth/sign-in/social` | POST | `{ provider: 'google' }` | Redirect URL | - |
| `/api/auth/callback/google` | GET | OAuth callback | Redirect + cookie | - |
| `/api/auth/sign-out` | POST | - | `{ success: true }` | - |
| `/api/auth/session` | GET | - | `{ user, session }` | - |
| `/api/auth/verify-email` | POST | `{ token }` | `{ success: true }` | 5/hour |
| `/api/auth/forgot-password` | POST | `{ email }` | `{ success: true }` | 3/hour |
| `/api/auth/reset-password` | POST | `{ token, password }` | `{ success: true }` | 3/hour |

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email/password mismatch |
| `EMAIL_NOT_VERIFIED` | 403 | Account exists but unverified |
| `EMAIL_IN_USE` | 409 | Registration with existing email |
| `INVALID_TOKEN` | 400 | Expired or invalid verification token |
| `RATE_LIMITED` | 429 | Too many attempts |

### Workflows and Sequencing

**Registration Flow:**
```
User → Sign-up form → Validate input → Check email unique
  → Hash password (Argon2id) → Create unverified user
  → Generate verification token (24hr) → Send email via Resend
  → Show success message → User clicks email link
  → Verify token → Update emailVerified=true → Redirect to sign-in
```

**Google OAuth Flow:**
```
User → "Sign in with Google" → Redirect to Google consent
  → User authorizes → Callback with code → Exchange for tokens
  → Fetch user profile → Find/create user → Link account
  → Create session → Set HTTP-only cookie → Redirect to dashboard
```

**Password Reset Flow:**
```
User → "Forgot password" → Enter email → Check user exists
  → Generate reset token (1hr) → Send email via Resend
  → User clicks link → Verify token → Show reset form
  → Validate new password → Update passwordHash
  → Invalidate all sessions → Redirect to sign-in
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sign-in response time (p95) | < 300ms | API monitoring |
| Session validation (p95) | < 50ms | Redis cache hit |
| Email delivery | < 5 seconds | Resend webhook |
| Password hashing (Argon2id) | 200-500ms | Deliberate slow |

### Security

| Requirement | Implementation | Reference |
|-------------|---------------|-----------|
| Password hashing | Argon2id (better-auth default) | NFR-S1 |
| Token signing | RS256 JWT | NFR-S3 |
| CSRF protection | better-auth built-in | NFR-S4 |
| XSS prevention | HTTP-only cookies, CSP headers | NFR-S5 |
| Rate limiting | Redis-backed token bucket | NFR-S7 |
| Audit logging | Auth events to event bus | NFR-S8 |

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase, one lowercase, one number
- Client-side strength indicator
- Server-side validation with Zod

### Reliability/Availability

- Auth service availability: 99.9% (critical path)
- Session token refresh: Automatic daily, transparent to user
- Graceful degradation: If Resend unavailable, queue emails for retry
- Session recovery: Database-backed sessions survive server restarts

### Observability

| Signal | Type | Purpose |
|--------|------|---------|
| `auth.signin.success` | Event | Track successful logins |
| `auth.signin.failure` | Event | Track failed attempts |
| `auth.signup.completed` | Event | New user registration |
| `auth.password.reset` | Event | Password recovery |
| `auth.session.expired` | Metric | Session expiration rate |
| `auth.rate_limit.hit` | Metric | Rate limiting effectiveness |

---

## Dependencies and Integrations

### npm Dependencies
```json
{
  "better-auth": "^1.0.0",
  "@better-auth/prisma-adapter": "^1.0.0",
  "resend": "^3.0.0",
  "zod": "^3.23.0",
  "argon2": "^0.41.0"
}
```

### External Services
| Service | Purpose | Credentials |
|---------|---------|-------------|
| Google Cloud OAuth | Social sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Resend | Transactional email | `RESEND_API_KEY` |

### Environment Variables Required
```bash
# Authentication
BETTER_AUTH_SECRET=xxx              # JWT signing secret (openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=xxx                # Google Cloud Console
GOOGLE_CLIENT_SECRET=xxx            # Google Cloud Console

# Email
RESEND_API_KEY=xxx                  # Resend dashboard
```

### Epic Dependencies
- **Epic 00** (Complete): Prisma database package, Next.js setup, shared types

### Wireframe References

All Authentication wireframes are complete. Reference these when implementing UI:

| Story | Wireframe | Description | Assets |
|-------|-----------|-------------|--------|
| 01.2 Registration | AU-02 | Register page with email/password, Google OAuth | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-02_register/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-02_register/screen.png) |
| 01.3 Email Verification | AU-05 | Email verification pending, resend link | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-05_email_verification/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-05_email_verification/screen.png) |
| 01.4 Sign-In | AU-01 | Login page with email/password, Google OAuth | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-01_login_page/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-01_login_page/screen.png) |
| 01.6 Password Reset | AU-03 | Forgot password form | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-03_forgot_password/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-03_forgot_password/screen.png) |
| 01.6 Password Reset | AU-04 | New password form after reset | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-04_password_reset/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-04_password_reset/screen.png) |

**Full wireframe index:** [WIREFRAME-INDEX.md](../design/wireframes/WIREFRAME-INDEX.md)

---

## Acceptance Criteria (Authoritative)

| ID | Criteria | Testable Statement |
|----|----------|-------------------|
| AC-1.1 | User can register with valid email/password | Given unique email and valid password, when submitting registration form, then user is created and verification email sent |
| AC-1.2 | Registration validates email format | Given invalid email format, when submitting form, then validation error displayed |
| AC-1.3 | Registration validates password strength | Given weak password, when submitting form, then strength indicator shows weak and submission blocked |
| AC-1.4 | Registration rejects duplicate email | Given existing email, when submitting form, then error "Email already in use" displayed |
| AC-2.1 | Verification email received within 5 seconds | Given successful registration, when checking inbox, then verification email arrives within 5 seconds |
| AC-2.2 | Verification link activates account | Given valid verification link, when clicking, then emailVerified=true and redirect to sign-in |
| AC-2.3 | Expired verification token handled | Given 24hr+ old token, when clicking link, then error message and resend option shown |
| AC-3.1 | User can sign in with valid credentials | Given verified user with correct email/password, when signing in, then session created and redirect to dashboard |
| AC-3.2 | Invalid credentials rejected | Given wrong password, when signing in, then error "Invalid credentials" after validation delay |
| AC-3.3 | Unverified user cannot sign in | Given unverified user, when signing in, then error "Please verify your email" shown |
| AC-4.1 | Google OAuth initiates correctly | Given "Sign in with Google" click, when OAuth starts, then redirect to Google consent screen |
| AC-4.2 | Google OAuth creates/links account | Given successful Google auth, when returning, then user created/linked and signed in |
| AC-5.1 | Password reset email sent | Given valid email, when requesting reset, then email sent within 5 seconds |
| AC-5.2 | Password reset updates password | Given valid reset token and new password, when submitting, then password updated and sessions invalidated |
| AC-5.3 | Expired reset token rejected | Given 1hr+ old token, when submitting, then error "Token expired" shown |
| AC-6.1 | Session persists across page loads | Given active session, when refreshing page, then user remains signed in |
| AC-6.2 | Sign out clears session | Given active session, when signing out, then session removed and redirect to sign-in |
| AC-6.3 | Sign out all devices works | Given multiple sessions, when signing out all, then all sessions invalidated |
| AC-7.1 | Rate limiting enforced | Given 6 sign-in attempts in 15 min, when attempting 6th, then 429 response with retry-after |
| AC-8.1 | Auth UI matches design system | Given auth pages, when reviewing visually, then matches approved wireframes |

---

## Traceability Mapping

| AC | Spec Section | Component(s)/API(s) | Test Idea |
|----|--------------|---------------------|-----------|
| AC-1.1 | Data Models, APIs | `POST /api/auth/sign-up/email`, User model | Integration: submit form, verify user created |
| AC-1.2 | APIs | Zod schema validation | Unit: email validation regex |
| AC-1.3 | Workflows | Client-side validation, Zod | Unit: password strength function |
| AC-1.4 | APIs | Prisma unique constraint | Integration: duplicate email submission |
| AC-2.1 | Dependencies | Resend integration | E2E: check email delivery time |
| AC-2.2 | Workflows, Data Models | VerificationToken, User.emailVerified | Integration: token verification flow |
| AC-2.3 | Workflows | Token expiry check | Unit: token age validation |
| AC-3.1 | APIs, Workflows | `POST /api/auth/sign-in/email`, Session | Integration: login creates session |
| AC-3.2 | APIs, Security | Password comparison | Unit: wrong password returns error |
| AC-3.3 | APIs | User.emailVerified check | Integration: unverified user blocked |
| AC-4.1 | APIs | `POST /api/auth/sign-in/social` | E2E: OAuth redirect works |
| AC-4.2 | Workflows, Data Models | Account model, account linking | Integration: Google callback flow |
| AC-5.1 | Workflows, Dependencies | Reset token generation, Resend | Integration: reset email sent |
| AC-5.2 | Workflows | Password update, session invalidation | Integration: reset completes |
| AC-5.3 | Workflows | Token expiry (1hr) | Unit: expired token rejected |
| AC-6.1 | Data Models | Session model, cookies | E2E: page refresh maintains auth |
| AC-6.2 | APIs | `POST /api/auth/sign-out` | Integration: session deleted |
| AC-6.3 | APIs | Bulk session deletion | Integration: all sessions cleared |
| AC-7.1 | Security | Rate limiting middleware | Integration: 429 after limit |
| AC-8.1 | UI Components | Auth pages, wireframes | Visual: screenshot comparison |

---

## Risks, Assumptions, Open Questions

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Resend API rate limits | Medium | Implement retry queue with exponential backoff |
| Google OAuth app approval | Low | Use unverified app for development, submit for review before prod |
| better-auth breaking changes | Medium | Pin version, test upgrades in staging |

### Assumptions
- better-auth Prisma adapter is compatible with Prisma 6.x
- Resend API available in user's region
- Google Cloud project already created with OAuth consent configured
- Users have access to email for verification

### Open Questions
| Question | Owner | Resolution Deadline |
|----------|-------|---------------------|
| Should we support "Remember me" extending to 30 days? | Product | Story 01.4 |
| Email template branding - use HYVVE logo? | Design | Story 01.3 |
| Session token rotation strategy? | Security | Story 01.7 |

---

## Test Strategy Summary

### Test Levels
| Level | Scope | Tools | Coverage |
|-------|-------|-------|----------|
| Unit | Validation functions, utilities | Vitest | Password strength, email format, token expiry |
| Integration | API endpoints, database | Vitest + Prisma test client | All auth endpoints |
| E2E | User flows | Playwright | Registration, login, OAuth, password reset |

### Test Data
- Seed verified test user: `test@example.com` / `Test1234!`
- Seed unverified test user: `unverified@example.com`
- Mock Resend in tests to avoid email sends

### Coverage Targets
- Unit tests: 80% coverage on validation logic
- Integration tests: All API endpoints
- E2E tests: Critical happy paths (registration, login, OAuth, reset)

### Edge Cases to Test
- Registration with email that differs only in case
- OAuth with email that matches existing password user
- Password reset while session active
- Concurrent sign-in attempts
- Token reuse attempts after verification/reset
