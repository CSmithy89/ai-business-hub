# Authentication System Research

**Status:** Complete
**Date:** 2025-11-30
**Researcher:** Winston (Architect), Amelia (Developer)

---

## Executive Summary

After analyzing better-auth, NextAuth.js, Clerk, and patterns from Twenty CRM and Taskosaur, we recommend **better-auth** as the authentication solution for HYVVE. It provides native organization/multi-tenancy support, JWT + session management, and a plugin architecture that aligns with our requirements.

---

## 1. Authentication Library Comparison

### 1.1 Options Evaluated

| Library | Multi-tenant | Org Support | Self-hosted | Plugins | Recommendation |
|---------|-------------|-------------|-------------|---------|----------------|
| **better-auth** | ✓ Native | ✓ Built-in | ✓ | ✓ Rich | **Recommended** |
| NextAuth.js (Auth.js) | Requires setup | ❌ | ✓ | ✓ | Good alternative |
| Clerk | ✓ | ✓ | ❌ (SaaS) | Limited | Too expensive at scale |
| Supabase Auth | ✓ | ❌ | ✓ | ❌ | Ties to Supabase |

### 1.2 Why better-auth?

1. **Organization Plugin** - Native multi-tenancy with roles (owner, admin, member)
2. **BYOAI Compatible** - Doesn't tie us to a specific auth provider
3. **Self-hosted** - Full control over user data (GDPR compliance)
4. **Plugin Ecosystem** - 2FA, magic link, passkey, username login
5. **TypeScript First** - Excellent DX with type safety
6. **Framework Agnostic** - Works with Next.js, NestJS, any backend

---

## 2. Authentication Methods

### 2.1 MVP Authentication Methods

| Method | Priority | Implementation |
|--------|----------|----------------|
| **Email/Password** | P0 (Required) | better-auth core |
| **Google OAuth** | P0 (Required) | better-auth OAuth plugin |
| **GitHub OAuth** | P1 (Nice to have) | better-auth OAuth plugin |
| **Microsoft OAuth** | P1 (Enterprise) | better-auth OAuth plugin |
| **Magic Link** | P2 (Future) | better-auth magic-link plugin |

### 2.2 Future Authentication Methods

| Method | Priority | Notes |
|--------|----------|-------|
| **SAML/SSO** | P3 | Enterprise tier feature |
| **Passkey/WebAuthn** | P3 | better-auth passkey plugin |
| **2FA/TOTP** | P2 | better-auth two-factor plugin |
| **SMS OTP** | P3 | Requires Twilio integration |

---

## 3. Session Management

### 3.1 Token Strategy

**Decision:** Use **JWT access tokens + database sessions** (better-auth default)

```typescript
// Session structure
interface Session {
  id: string;                    // Session UUID
  userId: string;                // User reference
  token: string;                 // Hashed session token
  expiresAt: Date;               // Session expiration
  ipAddress?: string;            // For audit
  userAgent?: string;            // For device tracking
  createdAt: Date;
  updatedAt: Date;
}

// JWT payload (access token)
interface JwtPayload {
  sub: string;                   // User ID
  sessionId: string;             // Session reference
  workspaceId?: string;          // Active workspace (multi-tenant)
  email: string;
  name: string;
  iat: number;                   // Issued at
  exp: number;                   // Expiration
}
```

### 3.2 Token Lifetimes

| Token Type | Duration | Renewable |
|------------|----------|-----------|
| **Access Token (JWT)** | 15 minutes | No |
| **Session** | 7 days (remember me: 30 days) | Yes, via refresh |
| **Refresh Token** | 30 days | On use |
| **Password Reset** | 1 hour | No |
| **Email Verification** | 24 hours | Resendable |

### 3.3 Session Configuration

```typescript
// better-auth configuration
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: prisma,  // Prisma adapter

  session: {
    expiresIn: 60 * 60 * 24 * 7,     // 7 days
    updateAge: 60 * 60 * 24,          // Refresh daily
    freshAge: 60 * 15,                // 15 min for sensitive ops
  },

  // JWT settings
  jwt: {
    expiresIn: 60 * 15,               // 15 minutes
  },

  // Rate limiting
  rateLimit: {
    window: 60,                       // 1 minute window
    max: 10,                          // 10 attempts
  },
});
```

### 3.4 Multi-Device Session Handling

```typescript
// List active sessions for user
const sessions = await auth.api.listSessions({
  headers: req.headers,
});

// Revoke specific session
await auth.api.revokeSession({
  body: { sessionId: "session_123" },
  headers: req.headers,
});

// Revoke all other sessions
await auth.api.revokeOtherSessions({
  headers: req.headers,
});
```

---

## 4. Security Requirements

### 4.1 Password Security

```typescript
// Password configuration
const passwordConfig = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: false,  // Recommended but not forced
  requireNumber: false,     // Recommended but not forced
  requireSpecial: false,    // Recommended but not forced
};

// Password hashing (Argon2id - better-auth default)
// - Memory: 19 MiB
// - Iterations: 2
// - Parallelism: 1
```

### 4.2 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| **Sign In** | 5 attempts | 15 minutes |
| **Sign Up** | 3 attempts | 1 hour |
| **Password Reset** | 3 attempts | 1 hour |
| **Email Verification** | 5 resends | 1 hour |
| **2FA Verify** | 5 attempts | 15 minutes |

### 4.3 Brute Force Protection

```typescript
// better-auth built-in protection
export const auth = betterAuth({
  rateLimit: {
    enabled: true,
    window: 60 * 15,  // 15 minutes
    max: 5,           // 5 attempts
    customRules: [
      {
        path: "/sign-in/email",
        window: 60 * 15,
        max: 5,
      },
      {
        path: "/forgot-password",
        window: 60 * 60,
        max: 3,
      },
    ],
  },
});
```

### 4.4 2FA/MFA Strategy

**MVP:** No 2FA required
**Post-MVP:** Optional TOTP (Google Authenticator, Authy)

```typescript
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    twoFactor({
      issuer: "HYVVE",
      // Optional: backup codes
      backupCodeLength: 10,
      backupCodeCount: 10,
    }),
  ],
});
```

---

## 5. Account Recovery

### 5.1 Password Reset Flow

```
User clicks "Forgot Password"
       │
       ▼
┌─────────────────────────────────────────┐
│  1. Submit email                        │
│  2. Rate limit check (3/hour)           │
│  3. Generate secure token (1hr expiry)  │
│  4. Send email with reset link          │
└─────────────────────────────────────────┘
       │
       ▼
User clicks link in email
       │
       ▼
┌─────────────────────────────────────────┐
│  5. Validate token                      │
│  6. Show password reset form            │
│  7. Update password (Argon2id hash)     │
│  8. Invalidate all sessions             │
│  9. Create new session                  │
│  10. Redirect to dashboard              │
└─────────────────────────────────────────┘
```

### 5.2 Email Change Flow

```typescript
// 1. Request email change (requires current password)
await authClient.changeEmail({
  newEmail: "new@example.com",
  currentPassword: "currentpassword",
  callbackURL: "/settings/verify-email",
});

// 2. Verify new email (link in email)
// Token valid for 24 hours
```

### 5.3 Account Lockout

- **Threshold:** 10 failed attempts in 1 hour
- **Lockout Duration:** 30 minutes
- **Recovery:** Password reset email OR wait for lockout expiry
- **Admin Override:** Platform admin can unlock

---

## 6. OAuth Configuration

### 6.1 Google OAuth

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["email", "profile"],
    },
  },
});
```

### 6.2 GitHub OAuth

```typescript
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    scope: ["user:email"],
  },
}
```

### 6.3 Microsoft OAuth (Enterprise)

```typescript
socialProviders: {
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    tenantId: "common",  // or specific tenant for SSO
    scope: ["email", "profile", "openid"],
  },
}
```

### 6.4 Account Linking

Users can link multiple OAuth providers to one account:

```typescript
// Link Google account to existing user
await authClient.linkSocial({
  provider: "google",
  callbackURL: "/settings/accounts",
});

// Unlink (requires at least one auth method remaining)
await authClient.unlinkSocial({
  provider: "google",
});
```

---

## 7. Multi-Tenancy Integration

### 7.1 Organization Plugin

```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    organization({
      // Allow any user to create organizations
      allowUserToCreateOrganization: true,

      // Max organizations per user
      organizationLimit: 5,

      // Custom roles (maps to our RBAC)
      roles: {
        owner: ["create", "read", "update", "delete", "invite", "remove", "transfer"],
        admin: ["read", "update", "invite", "remove"],
        member: ["read"],
        viewer: ["read"],  // Custom role
      },

      // Invitation email handler
      async sendInvitationEmail({ email, organization, inviter, url }) {
        await sendEmail({
          to: email,
          subject: `Join ${organization.name} on HYVVE`,
          template: "organization-invite",
          data: {
            inviterName: inviter.user.name,
            organizationName: organization.name,
            acceptUrl: url,
          },
        });
      },
    }),
  ],
});
```

### 7.2 Workspace Context in JWT

```typescript
// Set active workspace
await authClient.organization.setActive({
  organizationId: "org_123",
});

// JWT now includes workspaceId
// {
//   sub: "user_abc",
//   workspaceId: "org_123",
//   role: "admin",
//   ...
// }
```

---

## 8. Implementation Schema

### 8.1 Prisma Schema (better-auth)

```prisma
// User - core auth entity
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  emailVerified   Boolean   @default(false)
  name            String?
  image           String?

  // Password (null for OAuth-only users)
  passwordHash    String?

  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  sessions        Session[]
  accounts        Account[]  // OAuth accounts
  workspaces      WorkspaceMember[]
}

// Session - database-backed sessions
model Session {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  token           String    @unique  // Hashed session token
  expiresAt       DateTime

  // Audit info
  ipAddress       String?
  userAgent       String?

  // Active workspace (for multi-tenant context)
  activeWorkspaceId String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([token])
}

// Account - OAuth provider accounts
model Account {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider        String    // "google", "github", "microsoft"
  providerAccountId String

  // OAuth tokens
  accessToken     String?   @db.Text
  refreshToken    String?   @db.Text
  expiresAt       DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([provider, providerAccountId])
  @@index([userId])
}

// Verification tokens (email, password reset)
model VerificationToken {
  id              String    @id @default(uuid())
  identifier      String    // Email or user ID
  token           String    @unique
  type            String    // "email_verification", "password_reset"
  expiresAt       DateTime

  createdAt       DateTime  @default(now())

  @@index([identifier])
}

// Two-factor backup codes
model TwoFactorBackupCode {
  id              String    @id @default(uuid())
  userId          String
  code            String    // Hashed
  usedAt          DateTime?

  createdAt       DateTime  @default(now())

  @@index([userId])
}
```

---

## 9. API Endpoints

### 9.1 Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-up/email` | POST | Register with email/password |
| `/api/auth/sign-in/email` | POST | Login with email/password |
| `/api/auth/sign-in/social` | POST | Initiate OAuth flow |
| `/api/auth/callback/:provider` | GET | OAuth callback |
| `/api/auth/sign-out` | POST | Logout (invalidate session) |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/verify-email` | POST | Verify email with token |
| `/api/auth/change-password` | POST | Change password (authenticated) |
| `/api/auth/change-email` | POST | Change email (authenticated) |

### 9.2 Organization Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/organization/create` | POST | Create new workspace |
| `/api/auth/organization/list` | GET | List user's workspaces |
| `/api/auth/organization/set-active` | POST | Set active workspace |
| `/api/auth/organization/invite` | POST | Invite member |
| `/api/auth/organization/accept-invite` | POST | Accept invitation |
| `/api/auth/organization/members` | GET | List workspace members |
| `/api/auth/organization/update-role` | POST | Change member role |
| `/api/auth/organization/remove-member` | POST | Remove member |

---

## 10. Questions Answered

| Question | Answer |
|----------|--------|
| OAuth providers MVP | Google (required), GitHub (nice to have) |
| SSO required for MVP? | No, post-launch enterprise feature |
| 2FA strategy | TOTP optional, post-MVP |
| Social auth account linking | Yes, via better-auth |
| Session duration | 7 days (30 days with remember me) |

---

## 11. Implementation Priority

### MVP (Phase 1)
1. ✅ Email/password authentication
2. ✅ Google OAuth
3. ✅ Session management with JWT
4. ✅ Password reset flow
5. ✅ Email verification
6. ✅ Organization (workspace) creation

### Post-MVP (Phase 2)
7. ⬜ GitHub OAuth
8. ⬜ Microsoft OAuth
9. ⬜ Magic link authentication
10. ⬜ 2FA/TOTP

### Future (Phase 3)
11. ⬜ SAML/SSO
12. ⬜ Passkey/WebAuthn
13. ⬜ SMS OTP

---

## Related Documents

- [RBAC Specification Research](/docs/research/rbac-specification-research.md)
- [Multi-Tenant Isolation Research](/docs/research/multi-tenant-isolation-research.md)
- [PLATFORM-FOUNDATION-RESEARCH-CHECKLIST.md](/docs/research/PLATFORM-FOUNDATION-RESEARCH-CHECKLIST.md)
