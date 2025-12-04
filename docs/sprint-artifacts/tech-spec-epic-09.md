# Technical Specification - Epic 09: UI & Authentication Enhancements

**Epic ID:** EPIC-09
**Status:** Contexted
**Priority:** P2 - Medium
**Phase:** Post-MVP Enhancement
**Author:** Claude Code
**Date:** 2025-12-04
**Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Database Schema Changes](#database-schema-changes)
4. [API Endpoints](#api-endpoints)
5. [UI Components](#ui-components)
6. [Dependencies](#dependencies)
7. [Story Dependencies](#story-dependencies)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Notes](#implementation-notes)

---

## Overview

### Epic Summary

Epic 09 implements UI and authentication enhancements identified during wireframe implementation verification. This includes security features (2FA, additional OAuth providers, magic links) and UI improvements (enhanced Team Members page). These features were designed in wireframes but deferred from MVP for post-MVP enhancement.

### Business Value

- **Enhanced Security**: Two-factor authentication increases enterprise appeal and security posture
- **Enterprise Integration**: Microsoft OAuth enables corporate credential usage
- **Developer Experience**: GitHub OAuth provides familiar authentication for technical users
- **Workflow Efficiency**: Enhanced Team Members page improves daily workspace administration
- **Flexibility**: Magic links and account linking provide passwordless authentication options

### Success Criteria

- [ ] Two-factor authentication (TOTP) fully operational with backup codes
- [ ] Microsoft and GitHub OAuth providers configured and working
- [ ] Team Members page matches ST-06 wireframe with stats, search, and filters
- [ ] Magic link authentication working with 15-minute expiry
- [ ] Account linking allows users to connect multiple OAuth providers
- [ ] All features work seamlessly with existing better-auth infrastructure

### Story Breakdown

**15 stories, 42 points total:**

- **Authentication Enhancements:** 8 stories, 21 points (P2: 5 stories/15 pts, P3: 3 stories/6 pts)
- **Team Members UI:** 5 stories, 11 points (all P2)
- **Advanced RBAC:** 2 stories, 8 points (all P3)

---

## Architecture Decisions

### ADR-009-01: Use better-auth Plugins for 2FA and Magic Links

**Status:** Accepted

**Context:**
We need to implement two-factor authentication and magic link authentication without building custom solutions. better-auth provides official plugins for these features.

**Decision:**
Use `better-auth/plugins/two-factor` and `better-auth/plugins/magic-link` plugins instead of custom implementations.

**Consequences:**
- **Positive:**
  - Battle-tested implementation with security best practices
  - Native integration with existing better-auth setup
  - Automatic session handling and verification flows
  - Built-in TOTP and backup code generation
  - TypeScript-first with type safety
- **Negative:**
  - Locked into better-auth plugin architecture
  - Customization limited to plugin options
  - Plugin updates may introduce breaking changes

**Implementation:**
```typescript
// apps/web/src/lib/auth.ts
import { twoFactor } from 'better-auth/plugins/two-factor'
import { magicLink } from 'better-auth/plugins/magic-link'

export const auth = betterAuth({
  plugins: [
    organization({ /* existing config */ }),
    twoFactor({
      issuer: 'HYVVE',
      backupCodesCount: 10,
      totpWindow: 1, // Allow 30s clock drift
    }),
    magicLink({
      sendMagicLink: async ({ email, token }) => {
        await sendMagicLinkEmail(email, token)
      },
      expiresIn: 900, // 15 minutes
    }),
  ],
})
```

---

### ADR-009-02: Microsoft OAuth via Azure AD

**Status:** Accepted

**Context:**
Microsoft OAuth requires Azure AD App Registration. better-auth supports this through its social providers configuration.

**Decision:**
Use Azure AD v2.0 endpoints (Microsoft Identity Platform) with better-auth's microsoft provider.

**Consequences:**
- **Positive:**
  - Native Azure AD integration for enterprise customers
  - Supports both personal Microsoft accounts and Azure AD accounts
  - Better-auth handles token refresh automatically
  - Consistent with existing Google OAuth pattern
- **Negative:**
  - Requires Azure AD tenant setup (can use personal tenant for dev)
  - Additional OAuth provider credentials to manage
  - Need to configure redirect URIs in Azure Portal

**Implementation:**
```typescript
// apps/web/src/lib/auth.ts
socialProviders: {
  google: { /* existing */ },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/microsoft`,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/github`,
  },
}
```

**Azure AD Setup:**
1. Register app at https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps
2. Enable "Accounts in any organizational directory and personal Microsoft accounts"
3. Add redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/microsoft`
4. Generate client secret
5. Grant permissions: `User.Read`, `email`, `profile`, `openid`

---

### ADR-009-03: Account Linking Strategy

**Status:** Accepted

**Context:**
Users may want to link multiple OAuth providers (Google, Microsoft, GitHub) to a single HYVVE account for flexible sign-in options.

**Decision:**
Use email as the primary identifier for account linking. When a user signs in with an OAuth provider:
1. Check if email matches existing user
2. If yes, link the new OAuth account to existing user
3. If no, create new user

**Consequences:**
- **Positive:**
  - Seamless experience for users with same email across providers
  - Prevents duplicate accounts for same person
  - Follows standard OAuth linking pattern
  - better-auth handles this automatically via Account model
- **Negative:**
  - Users with different emails per provider need manual linking
  - Email verification required to prevent account hijacking
  - Need UI to manage linked accounts

**Security Considerations:**
- Only link accounts with **verified** emails
- Require re-authentication before linking new provider
- Show all linked accounts in settings for transparency
- Allow unlinking but keep at least one authentication method

---

### ADR-009-04: Two-Factor Authentication Implementation

**Status:** Accepted

**Context:**
We need to implement TOTP-based 2FA with backup codes for account recovery. The wireframe (AU-06) shows a complete flow.

**Decision:**
Implement TOTP using the `otpauth` standard with QR code generation. Store encrypted secrets in database with backup codes.

**Consequences:**
- **Positive:**
  - Compatible with all standard authenticator apps (Google Authenticator, Authy, 1Password)
  - QR code makes setup simple
  - Backup codes provide recovery mechanism
  - 30-day trusted device option reduces friction
- **Negative:**
  - SMS 2FA not implemented in v1 (TOTP only)
  - Users need authenticator app installed
  - Backup codes must be stored securely by user

**Flow:**
```
Setup:
1. User enables 2FA in settings
2. Backend generates TOTP secret
3. Frontend displays QR code + manual entry code
4. User scans QR code in authenticator app
5. User enters 6-digit code to verify setup
6. Backend generates 10 backup codes
7. User confirms they saved backup codes
8. 2FA enabled

Login:
1. User enters email/password (or OAuth)
2. If 2FA enabled, show verification prompt
3. User enters 6-digit code or backup code
4. Optional: "Trust this device for 30 days"
5. Proceed to dashboard
```

---

### ADR-009-05: Team Members Page Enhancement Strategy

**Status:** Accepted

**Context:**
The existing Team Members page is basic (list of members with roles). The ST-06 wireframe shows stats cards, search, filters, pending invitations, and last active tracking.

**Decision:**
Progressively enhance the existing MembersList component rather than rewriting. Add features in order of story priority.

**Consequences:**
- **Positive:**
  - Minimal disruption to existing functionality
  - Can ship improvements incrementally
  - Reuse existing API endpoints where possible
  - Maintains existing permission checks
- **Negative:**
  - Component may grow large (consider splitting later)
  - Need to maintain backward compatibility during enhancement

**Component Structure:**
```
Team Members Page
├── Stats Cards (Story 09.9)
│   ├── Total Members
│   ├── Admins Count
│   ├── Pending Invitations
│   └── Seats (Unlimited)
├── Search & Filter Bar (Story 09.10)
│   ├── Search Input (debounced)
│   └── Filter Dropdowns (Role, Status)
├── Invite Member Button → Modal (Story 09.11)
├── Members Table (Enhanced in 09.13)
│   ├── Avatar + Name + Email
│   ├── Role Badge
│   ├── Status Indicator (Story 09.13)
│   ├── Last Active (Story 09.13)
│   └── Actions Dropdown
└── Pending Invitations Section (Story 09.12)
    ├── Email + Role + Invited Date
    ├── Resend Button
    └── Revoke Button
```

---

### ADR-009-06: Custom Roles Database Design

**Status:** Accepted

**Context:**
Stories 09.14 and 09.15 introduce custom role creation and permission templates. This requires a new database structure for role definitions.

**Decision:**
Create a `CustomRole` model with permission arrays. Keep default roles (owner, admin, member, viewer, guest) hardcoded in application logic.

**Consequences:**
- **Positive:**
  - Flexible permission system for advanced users
  - Custom roles stored per workspace
  - Templates enable quick role creation
  - Permissions remain granular and auditable
- **Negative:**
  - Increased complexity in permission checking
  - Need to maintain backward compatibility with default roles
  - UI for permission selection can be complex

**Design:**
```typescript
// Custom role structure
{
  id: 'cuid',
  workspaceId: 'uuid',
  name: 'Project Manager',
  description: 'Can manage projects but not billing',
  permissions: [
    'approvals:read',
    'approvals:approve',
    'agents:read',
    'workspace:read',
    // ... array of permission strings
  ],
  isTemplate: false,
  createdById: 'uuid',
}
```

---

## Database Schema Changes

### 1. User Model Extensions (2FA)

**Affected Model:** `User`

```prisma
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  emailVerified     Boolean  @default(false) @map("email_verified")
  name              String?
  image             String?
  passwordHash      String?  @map("password_hash")

  // NEW: Two-Factor Authentication
  twoFactorEnabled  Boolean  @default(false) @map("two_factor_enabled")
  twoFactorSecret   String?  @map("two_factor_secret") // Encrypted TOTP secret
  twoFactorVerified Boolean  @default(false) @map("two_factor_verified")

  // NEW: Activity Tracking
  lastActiveAt      DateTime? @map("last_active_at")

  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relations
  sessions                 Session[]
  accounts                 Account[]
  workspaces               WorkspaceMember[]
  invitationsSent          WorkspaceMember[]     @relation("InvitedBy")
  workspaceInvitationsSent WorkspaceInvitation[] @relation("SentInvitations")
  assignedApprovals        ApprovalItem[]        @relation("AssignedApprovals")
  resolvedApprovals        ApprovalItem[]        @relation("ResolvedApprovals")
  createdApiKeys           ApiKey[]              @relation("CreatedBy")

  // NEW: 2FA Relations
  backupCodes              BackupCode[]
  trustedDevices           TrustedDevice[]
  customRoles              CustomRole[]          @relation("CreatedBy")

  @@index([lastActiveAt])
  @@map("users")
}
```

**Migration Impact:**
- Add nullable columns (safe, no data loss)
- Add index on `lastActiveAt` for member sorting
- No default values needed for optional fields

---

### 2. BackupCode Model (2FA Recovery)

**New Model:** `BackupCode`

```prisma
model BackupCode {
  id        String    @id @default(cuid())
  userId    String    @map("user_id")
  code      String    // Hashed backup code
  usedAt    DateTime? @map("used_at")

  createdAt DateTime  @default(now()) @map("created_at")
  expiresAt DateTime  @map("expires_at") // Optional expiry

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, usedAt]) // Find unused codes
  @@map("backup_codes")
}
```

**Purpose:**
- Store recovery codes for 2FA access
- Each user gets 10 codes during 2FA setup
- Single-use codes (marked with `usedAt`)
- Format: `XXXX-XXXX` (8 alphanumeric chars)

---

### 3. TrustedDevice Model (30-Day Trust)

**New Model:** `TrustedDevice`

```prisma
model TrustedDevice {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")

  deviceHash  String   @map("device_hash") // Hash of user agent + IP
  deviceName  String?  @map("device_name") // e.g., "Chrome on Windows"
  ipAddress   String   @map("ip_address")
  userAgent   String   @map("user_agent")

  trustedAt   DateTime @default(now()) @map("trusted_at")
  expiresAt   DateTime @map("expires_at") // trustedAt + 30 days
  lastUsedAt  DateTime @default(now()) @map("last_used_at")
  revokedAt   DateTime? @map("revoked_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceHash])
  @@index([userId])
  @@index([expiresAt])
  @@map("trusted_devices")
}
```

**Purpose:**
- Skip 2FA prompt for trusted devices
- Automatically expire after 30 days
- User can revoke trust manually in settings
- Device identification via hash prevents spoofing

---

### 4. WorkspaceMember Extensions (Last Active)

**Affected Model:** `WorkspaceMember`

```prisma
model WorkspaceMember {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  workspaceId       String    @map("workspace_id")
  role              String    @default("member")
  modulePermissions Json?     @map("module_permissions")

  invitedById       String?   @map("invited_by_id")
  invitedAt         DateTime  @default(now()) @map("invited_at")
  acceptedAt        DateTime? @map("accepted_at")

  // NEW: Track status
  status            String    @default("active") // active, pending, suspended

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace         Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  invitedBy         User?     @relation("InvitedBy", fields: [invitedById], references: [id])

  @@unique([userId, workspaceId])
  @@index([workspaceId])
  @@index([userId])
  @@index([workspaceId, status])
  @@map("workspace_members")
}
```

**Migration Impact:**
- Add `status` column with default 'active'
- Existing members automatically get 'active' status
- Pending invitations (acceptedAt IS NULL) can be marked 'pending'

---

### 5. CustomRole Model (Advanced RBAC)

**New Model:** `CustomRole`

```prisma
model CustomRole {
  id          String   @id @default(cuid())
  workspaceId String   @map("workspace_id")

  name        String
  description String?
  permissions String[] // Array of permission strings

  isTemplate  Boolean  @default(false) @map("is_template")

  createdById String   @map("created_by_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  createdBy   User      @relation("CreatedBy", fields: [createdById], references: [id])

  @@unique([workspaceId, name])
  @@index([workspaceId])
  @@index([isTemplate])
  @@map("custom_roles")
}
```

**Purpose:**
- Store custom role definitions per workspace
- Permission array uses dot notation: `module:action`
- Templates can be shared across workspaces
- Workspace relation enables tenant isolation

**Example Permissions:**
```typescript
[
  'approvals:read',
  'approvals:approve',
  'approvals:reject',
  'agents:read',
  'agents:configure',
  'workspace:read',
  'workspace:update',
  'members:read',
  'members:invite',
  'members:remove',
  'ai-providers:read',
  'ai-providers:configure',
]
```

---

### 6. Workspace Relation Extensions

**Affected Model:** `Workspace`

```prisma
model Workspace {
  // ... existing fields

  // NEW: Custom Roles relation
  customRoles  CustomRole[]

  @@map("workspaces")
}
```

---

### Database Migration Order

1. **Migration 001:** Add 2FA fields to User model
   ```sql
   ALTER TABLE users
   ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE,
   ADD COLUMN two_factor_secret TEXT,
   ADD COLUMN two_factor_verified BOOLEAN DEFAULT FALSE,
   ADD COLUMN last_active_at TIMESTAMP;

   CREATE INDEX idx_users_last_active ON users(last_active_at);
   ```

2. **Migration 002:** Create BackupCode table
   ```sql
   CREATE TABLE backup_codes (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     code TEXT NOT NULL,
     used_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     expires_at TIMESTAMP NOT NULL
   );
   CREATE INDEX idx_backup_codes_user ON backup_codes(user_id);
   CREATE INDEX idx_backup_codes_unused ON backup_codes(user_id, used_at);
   ```

3. **Migration 003:** Create TrustedDevice table
   ```sql
   CREATE TABLE trusted_devices (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     device_hash TEXT NOT NULL,
     device_name TEXT,
     ip_address TEXT NOT NULL,
     user_agent TEXT NOT NULL,
     trusted_at TIMESTAMP DEFAULT NOW(),
     expires_at TIMESTAMP NOT NULL,
     last_used_at TIMESTAMP DEFAULT NOW(),
     revoked_at TIMESTAMP,
     UNIQUE(user_id, device_hash)
   );
   CREATE INDEX idx_trusted_devices_user ON trusted_devices(user_id);
   CREATE INDEX idx_trusted_devices_expiry ON trusted_devices(expires_at);
   ```

4. **Migration 004:** Add status to WorkspaceMember
   ```sql
   ALTER TABLE workspace_members
   ADD COLUMN status TEXT DEFAULT 'active';

   CREATE INDEX idx_workspace_members_status ON workspace_members(workspace_id, status);
   ```

5. **Migration 005:** Create CustomRole table
   ```sql
   CREATE TABLE custom_roles (
     id TEXT PRIMARY KEY,
     workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     description TEXT,
     permissions TEXT[] NOT NULL,
     is_template BOOLEAN DEFAULT FALSE,
     created_by_id TEXT NOT NULL REFERENCES users(id),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(workspace_id, name)
   );
   CREATE INDEX idx_custom_roles_workspace ON custom_roles(workspace_id);
   CREATE INDEX idx_custom_roles_template ON custom_roles(is_template);
   ```

---

## API Endpoints

### Authentication Endpoints

#### 1. OAuth Providers (Stories 09.1, 09.2)

**Microsoft OAuth Sign-In**
```http
GET /api/auth/signin/microsoft
```
- Redirects to Microsoft login
- Handled automatically by better-auth
- Callback: `/api/auth/callback/microsoft`

**GitHub OAuth Sign-In**
```http
GET /api/auth/signin/github
```
- Redirects to GitHub login
- Handled automatically by better-auth
- Callback: `/api/auth/callback/github`

---

#### 2. Two-Factor Authentication Setup (Story 09.3)

**Generate 2FA Secret**
```http
POST /api/auth/2fa/setup

Response 200:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "manualEntryCode": "JBSW Y3DP EHPK 3PXP"
}
```

**Verify 2FA Setup**
```http
POST /api/auth/2fa/verify-setup
Content-Type: application/json

{
  "code": "123456"
}

Response 200:
{
  "success": true,
  "backupCodes": [
    "XXXX-XXXX",
    "YYYY-YYYY",
    // ... 10 codes total
  ]
}

Response 400:
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid verification code"
  }
}
```

---

#### 3. Two-Factor Authentication Login (Story 09.4)

**Verify 2FA Code at Login**
```http
POST /api/auth/2fa/verify
Content-Type: application/json

{
  "code": "123456",
  "trustDevice": true
}

Response 200:
{
  "success": true,
  "session": { /* session object */ }
}

Response 400:
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid or expired code"
  }
}
```

**Verify Backup Code**
```http
POST /api/auth/2fa/verify-backup
Content-Type: application/json

{
  "backupCode": "XXXX-XXXX"
}

Response 200:
{
  "success": true,
  "session": { /* session object */ },
  "remainingCodes": 9
}
```

---

#### 4. Two-Factor Authentication Management (Story 09.5)

**Get 2FA Status**
```http
GET /api/auth/2fa/status

Response 200:
{
  "enabled": true,
  "verifiedAt": "2025-12-01T10:00:00Z",
  "backupCodesRemaining": 8,
  "trustedDevicesCount": 2
}
```

**Disable 2FA**
```http
POST /api/auth/2fa/disable
Content-Type: application/json

{
  "password": "current-password"
}

Response 200:
{
  "success": true
}
```

**Generate New Backup Codes**
```http
POST /api/auth/2fa/backup-codes/regenerate
Content-Type: application/json

{
  "password": "current-password"
}

Response 200:
{
  "backupCodes": [
    "XXXX-XXXX",
    "YYYY-YYYY",
    // ... 10 new codes
  ]
}
```

**List Trusted Devices**
```http
GET /api/auth/2fa/trusted-devices

Response 200:
{
  "devices": [
    {
      "id": "cuid",
      "deviceName": "Chrome on Windows",
      "ipAddress": "192.168.1.1",
      "trustedAt": "2025-11-20T08:00:00Z",
      "lastUsedAt": "2025-12-01T12:00:00Z",
      "expiresAt": "2025-12-20T08:00:00Z"
    }
  ]
}
```

**Revoke Trusted Device**
```http
DELETE /api/auth/2fa/trusted-devices/:deviceId

Response 200:
{
  "success": true
}
```

---

#### 5. Magic Link Authentication (Story 09.6)

**Request Magic Link**
```http
POST /api/auth/magic-link
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "success": true,
  "message": "Magic link sent to your email"
}
```

**Verify Magic Link**
```http
GET /api/auth/magic-link/verify?token=TOKEN

Response: Redirect to dashboard with session cookie
```

---

#### 6. Account Linking (Story 09.7)

**List Linked Accounts**
```http
GET /api/auth/accounts

Response 200:
{
  "accounts": [
    {
      "id": "uuid",
      "provider": "google",
      "email": "user@gmail.com",
      "linkedAt": "2025-11-01T10:00:00Z"
    },
    {
      "id": "uuid",
      "provider": "microsoft",
      "email": "user@outlook.com",
      "linkedAt": "2025-12-01T12:00:00Z"
    }
  ]
}
```

**Unlink Account**
```http
DELETE /api/auth/accounts/:accountId
Content-Type: application/json

{
  "password": "current-password" // Required if this is not the last auth method
}

Response 200:
{
  "success": true
}

Response 400:
{
  "error": {
    "code": "LAST_AUTH_METHOD",
    "message": "Cannot remove last authentication method"
  }
}
```

---

#### 7. OTP Email Verification (Story 09.8)

**Send Verification Email with OTP**
```http
POST /api/auth/send-verification-otp

Response 200:
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

**Verify OTP Code**
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "code": "123456"
}

Response 200:
{
  "success": true,
  "emailVerified": true
}
```

---

### Team Members Endpoints

#### 8. Member Statistics (Story 09.9)

**Get Workspace Statistics**
```http
GET /api/workspaces/:workspaceId/stats

Response 200:
{
  "totalMembers": 12,
  "adminCount": 3,
  "pendingInvitations": 2,
  "seats": "unlimited"
}
```

---

#### 9. Member Search & Filtering (Story 09.10)

**Search and Filter Members**
```http
GET /api/workspaces/:workspaceId/members?search=john&role=admin&status=active

Query Parameters:
- search: string (searches name and email)
- role: "owner" | "admin" | "member" | "viewer" | "guest"
- status: "active" | "pending"

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "image": "https://...",
      "role": "admin",
      "status": "active",
      "lastActiveAt": "2025-12-04T10:30:00Z",
      "invitedAt": "2025-11-01T08:00:00Z",
      "acceptedAt": "2025-11-01T09:00:00Z"
    }
  ],
  "meta": {
    "total": 3,
    "filtered": 1
  }
}
```

---

#### 10. Workspace Invitations (Story 09.11, 09.12)

**Invite Member (Enhanced)**
```http
POST /api/workspaces/:workspaceId/invitations
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "member",
  "message": "Welcome to our workspace!" // Optional
}

Response 201:
{
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "role": "member",
    "token": "token",
    "expiresAt": "2025-12-11T10:00:00Z",
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

**List Pending Invitations**
```http
GET /api/workspaces/:workspaceId/invitations

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "email": "newuser@example.com",
      "role": "member",
      "invitedBy": {
        "id": "uuid",
        "name": "Admin User"
      },
      "createdAt": "2025-12-04T10:00:00Z",
      "expiresAt": "2025-12-11T10:00:00Z"
    }
  ]
}
```

**Resend Invitation**
```http
POST /api/workspaces/:workspaceId/invitations/:invitationId/resend

Response 200:
{
  "success": true,
  "newExpiresAt": "2025-12-11T12:00:00Z"
}
```

**Revoke Invitation**
```http
DELETE /api/workspaces/:workspaceId/invitations/:invitationId

Response 200:
{
  "success": true
}
```

---

#### 11. Last Active Tracking (Story 09.13)

**Update Last Active (Automatic)**
- Triggered by authentication middleware
- Updates `users.lastActiveAt` on every authenticated request
- No explicit endpoint needed

**Implementation Note:**
```typescript
// apps/web/src/middleware.ts
export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (session?.user) {
    // Update last active in background (don't await)
    updateLastActive(session.user.id)
  }

  return NextResponse.next()
}
```

---

### Custom Roles Endpoints (Stories 09.14, 09.15)

#### 12. Custom Role Management

**List Custom Roles**
```http
GET /api/workspaces/:workspaceId/custom-roles

Response 200:
{
  "data": [
    {
      "id": "cuid",
      "name": "Project Manager",
      "description": "Can manage projects but not billing",
      "permissions": ["approvals:read", "approvals:approve", "agents:read"],
      "isTemplate": false,
      "createdBy": {
        "id": "uuid",
        "name": "Admin User"
      },
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ]
}
```

**Create Custom Role**
```http
POST /api/workspaces/:workspaceId/custom-roles
Content-Type: application/json

{
  "name": "Project Manager",
  "description": "Can manage projects but not billing",
  "permissions": ["approvals:read", "approvals:approve", "agents:read"]
}

Response 201:
{
  "data": { /* custom role object */ }
}
```

**Update Custom Role**
```http
PATCH /api/workspaces/:workspaceId/custom-roles/:roleId
Content-Type: application/json

{
  "name": "Senior Project Manager",
  "permissions": ["approvals:read", "approvals:approve", "approvals:reject"]
}

Response 200:
{
  "data": { /* updated custom role */ }
}
```

**Delete Custom Role**
```http
DELETE /api/workspaces/:workspaceId/custom-roles/:roleId

Response 400 (if in use):
{
  "error": {
    "code": "ROLE_IN_USE",
    "message": "Cannot delete role that is assigned to members",
    "memberCount": 3
  }
}

Response 200:
{
  "success": true
}
```

**List Permission Templates**
```http
GET /api/custom-roles/templates

Response 200:
{
  "templates": [
    {
      "name": "Manager",
      "description": "Full project management access",
      "permissions": ["approvals:*", "agents:read", "workspace:read"]
    },
    {
      "name": "Contributor",
      "description": "Can view and create content",
      "permissions": ["approvals:read", "agents:read", "workspace:read"]
    }
  ]
}
```

---

## UI Components

### Authentication Components

#### 1. OAuth Sign-In Buttons (Stories 09.1, 09.2)

**File:** `apps/web/src/components/auth/oauth-buttons.tsx`

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

export function OAuthButtons() {
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => window.location.href = '/api/auth/signin/google'}
      >
        <Icons.google className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => window.location.href = '/api/auth/signin/microsoft'}
      >
        <Icons.microsoft className="mr-2 h-4 w-4" />
        Continue with Microsoft
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => window.location.href = '/api/auth/signin/github'}
      >
        <Icons.github className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
    </div>
  )
}
```

**Integration:**
- Add to sign-in page: `apps/web/src/app/(auth)/sign-in/page.tsx`
- Add to sign-up page: `apps/web/src/app/(auth)/sign-up/page.tsx`

---

#### 2. Two-Factor Setup Modal (Story 09.3)

**File:** `apps/web/src/components/auth/two-factor-setup-modal.tsx`

**States:**
1. Setup Options (Authenticator App recommended, SMS future)
2. QR Code Display with manual entry code
3. Verification (enter 6-digit code)
4. Backup Codes Display

**Props:**
```typescript
interface TwoFactorSetupModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}
```

**Key Features:**
- QR code generation using `qrcode` library
- Copy button for manual entry code
- 6-digit code input with auto-focus
- Backup codes with "Download" and "Copy" buttons
- Checkbox: "I have saved these codes in a safe place"

---

#### 3. Two-Factor Verification Prompt (Story 09.4)

**File:** `apps/web/src/components/auth/two-factor-prompt.tsx`

**Displays after successful password authentication:**
- 6-digit code input (auto-focus, numeric only)
- "Use backup code instead" link
- "Trust this device for 30 days" checkbox
- Submit button
- Rate limiting indicator (after 3 failed attempts)

---

#### 4. Two-Factor Management Card (Story 09.5)

**File:** `apps/web/src/components/settings/two-factor-card.tsx`

**Shows when 2FA is enabled:**
- Status badge (Enabled/Disabled)
- Enabled date
- Backup codes remaining count
- "View Backup Codes" button (requires password)
- "Generate New Backup Codes" button
- "View Trusted Devices" button
- "Disable 2FA" button (danger zone)

---

#### 5. Trusted Devices List (Story 09.5)

**File:** `apps/web/src/components/settings/trusted-devices-list.tsx`

**Table columns:**
- Device Name (e.g., "Chrome on Windows")
- IP Address
- Trusted Date
- Last Used
- Expires At
- Revoke Button

---

#### 6. Magic Link Request Form (Story 09.6)

**File:** `apps/web/src/components/auth/magic-link-form.tsx`

**Simple form:**
- Email input
- "Send Magic Link" button
- Success message: "Check your email for a login link"

**Integration:**
- Add as alternative on sign-in page
- Link: "Email me a login link instead"

---

#### 7. Linked Accounts Card (Story 09.7)

**File:** `apps/web/src/components/settings/linked-accounts-card.tsx`

**Shows all linked OAuth providers:**
- Provider icon + name
- Email used for that provider
- "Linked on [date]"
- "Unlink" button (if not last auth method)
- "Link [Provider]" buttons for unlinked providers

---

### Team Members Components

#### 8. Team Members Stats Cards (Story 09.9)

**File:** `apps/web/src/components/settings/team-stats-cards.tsx`

**Four stat cards:**
```typescript
<div className="grid gap-4 md:grid-cols-4">
  <StatsCard
    title="Total Members"
    value={stats.totalMembers}
    icon={Users}
  />
  <StatsCard
    title="Admins"
    value={stats.adminCount}
    icon={Shield}
  />
  <StatsCard
    title="Pending Invitations"
    value={stats.pendingInvitations}
    icon={Clock}
  />
  <StatsCard
    title="Seats"
    value="Unlimited"
    icon={Infinity}
  />
</div>
```

---

#### 9. Search and Filter Bar (Story 09.10)

**File:** `apps/web/src/components/settings/members-filters.tsx`

**Components:**
```typescript
<div className="flex gap-4">
  {/* Search Input */}
  <Input
    placeholder="Search by name or email..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="flex-1"
  />

  {/* Role Filter */}
  <Select value={roleFilter} onValueChange={setRoleFilter}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Filter by role" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Roles</SelectItem>
      <SelectItem value="owner">Owner</SelectItem>
      <SelectItem value="admin">Admin</SelectItem>
      <SelectItem value="member">Member</SelectItem>
      <SelectItem value="viewer">Viewer</SelectItem>
      <SelectItem value="guest">Guest</SelectItem>
    </SelectContent>
  </Select>

  {/* Status Filter */}
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Filter by status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Status</SelectItem>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="pending">Pending</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Features:**
- Debounced search (300ms delay)
- Persist filters in URL params
- Clear filters button

---

#### 10. Invite Member Modal (Story 09.11)

**File:** `apps/web/src/components/settings/invite-member-modal.tsx`

**Form fields:**
```typescript
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Invite Team Member</DialogTitle>
      <DialogDescription>
        Send an invitation to join your workspace
      </DialogDescription>
    </DialogHeader>

    <Form>
      {/* Email Input */}
      <Input
        type="email"
        placeholder="email@example.com"
        required
      />

      {/* Role Select */}
      <Select defaultValue="member">
        <SelectTrigger>
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="member">Member</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>

      {/* Permission Preview */}
      <Card>
        <CardContent className="text-sm">
          <p className="font-medium">Permissions for {selectedRole}:</p>
          <ul className="list-disc list-inside mt-2">
            {rolePermissions[selectedRole].map(perm => (
              <li key={perm}>{perm}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Optional Message */}
      <Textarea
        placeholder="Add a personal message (optional)"
        rows={3}
      />

      {/* Actions */}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Send Invitation</Button>
      </DialogFooter>
    </Form>
  </DialogContent>
</Dialog>
```

---

#### 11. Pending Invitations Section (Story 09.12)

**File:** `apps/web/src/components/settings/pending-invitations.tsx`

**Table below members list:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Pending Invitations</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Invited</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map(invitation => (
          <TableRow key={invitation.id}>
            <TableCell>{invitation.email}</TableCell>
            <TableCell>
              <Badge>{invitation.role}</Badge>
            </TableCell>
            <TableCell>{formatDate(invitation.createdAt)}</TableCell>
            <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => resend(invitation.id)}>
                Resend
              </Button>
              <Button variant="ghost" size="sm" onClick={() => revoke(invitation.id)}>
                Revoke
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

**Empty state:**
```typescript
<div className="text-center py-8 text-gray-500">
  No pending invitations
</div>
```

---

#### 12. Enhanced Members Table (Story 09.13)

**File:** `apps/web/src/components/settings/members-list.tsx` (enhanced)

**Add columns:**
```typescript
<TableRow>
  <TableHead>Member</TableHead>
  <TableHead>Role</TableHead>
  <TableHead>Status</TableHead>         {/* NEW */}
  <TableHead>Last Active</TableHead>    {/* NEW */}
  <TableHead className="text-right">Actions</TableHead>
</TableRow>
```

**Status Indicator Component:**
```typescript
<div className="flex items-center gap-2">
  <div className={cn(
    "h-2 w-2 rounded-full",
    status === 'active' ? "bg-green-500" : "bg-yellow-500"
  )} />
  <span className="text-sm capitalize">{status}</span>
</div>
```

**Last Active Display:**
```typescript
<span className="text-sm text-gray-500">
  {lastActiveAt ? formatDistanceToNow(new Date(lastActiveAt), { addSuffix: true }) : 'Never'}
</span>
```

---

### Custom Roles Components (Stories 09.14, 09.15)

#### 13. Custom Roles List

**File:** `apps/web/src/components/settings/custom-roles-list.tsx`

**Table with custom roles:**
- Name + Description
- Permission count badge
- Members count using this role
- Edit button
- Delete button (disabled if in use)

---

#### 14. Custom Role Editor

**File:** `apps/web/src/components/settings/custom-role-editor.tsx`

**Form sections:**
1. **Basic Info:** Name, Description
2. **Permissions Selector:** Checklist grouped by module
   - Approvals: read, approve, reject
   - Agents: read, configure
   - Workspace: read, update
   - Members: read, invite, remove
   - AI Providers: read, configure
3. **Actions:** Save, Cancel

---

#### 15. Permission Templates Selector

**File:** `apps/web/src/components/settings/permission-templates.tsx`

**Grid of template cards:**
```typescript
<div className="grid gap-4 md:grid-cols-3">
  {templates.map(template => (
    <Card key={template.name} className="cursor-pointer hover:border-primary">
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge>{template.permissions.length} permissions</Badge>
        <Button
          className="w-full mt-4"
          onClick={() => useTemplate(template)}
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  ))}
</div>
```

---

## Dependencies

### NPM Packages

#### 1. Authentication & Security

```json
{
  "dependencies": {
    "better-auth": "^1.0.0",
    "qrcode": "^1.5.4",
    "@types/qrcode": "^1.5.5",
    "otpauth": "^9.3.5"
  }
}
```

**Installation:**
```bash
pnpm add better-auth qrcode otpauth
pnpm add -D @types/qrcode
```

**Usage:**
- `better-auth`: Core authentication with plugins
- `qrcode`: Generate QR codes for 2FA setup
- `otpauth`: TOTP token generation and verification

---

#### 2. UI Components (Already Installed)

```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-table": "latest",
    "date-fns": "latest",
    "lucide-react": "latest"
  }
}
```

**No new UI dependencies required** - all components use existing shadcn/ui primitives.

---

### Better-Auth Plugins

#### 1. Two-Factor Plugin

```typescript
// apps/web/src/lib/auth.ts
import { twoFactor } from 'better-auth/plugins/two-factor'

plugins: [
  twoFactor({
    issuer: 'HYVVE',
    backupCodesCount: 10,
    totpWindow: 1,
  })
]
```

**Features:**
- TOTP generation with QR codes
- Backup codes (single-use)
- Trusted devices
- Verification at login

---

#### 2. Magic Link Plugin

```typescript
import { magicLink } from 'better-auth/plugins/magic-link'

plugins: [
  magicLink({
    sendMagicLink: async ({ email, token, url }) => {
      await sendMagicLinkEmail(email, url)
    },
    expiresIn: 900, // 15 minutes
  })
]
```

**Features:**
- Secure token generation
- Email delivery via Resend
- One-time use tokens
- Auto-expiration

---

### Environment Variables

```bash
# OAuth Providers (NEW)
MICROSOFT_CLIENT_ID="azure-ad-client-id"
MICROSOFT_CLIENT_SECRET="azure-ad-client-secret"

GITHUB_CLIENT_ID="github-oauth-app-id"
GITHUB_CLIENT_SECRET="github-oauth-app-secret"

# Existing (already configured)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"
RESEND_API_KEY="..."
```

---

### Database Extensions

**PostgreSQL Extensions Required:**
- None - all features use standard PostgreSQL functionality

**Redis Requirements:**
- None - optional Redis caching can be added later for 2FA rate limiting

---

## Story Dependencies

### Dependency Graph

```
Epic 09 Story Dependencies

┌─────────────────────────────────────────────────────┐
│ PHASE 1: OAuth Providers (Can run in parallel)     │
├─────────────────────────────────────────────────────┤
│ 09.1 - Microsoft OAuth (3 pts)                      │
│ 09.2 - GitHub OAuth (2 pts)                         │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ PHASE 2: Two-Factor Authentication (Sequential)     │
├─────────────────────────────────────────────────────┤
│ 09.3 - 2FA Setup (5 pts)                            │
│    └──> 09.4 - 2FA Login (3 pts)                    │
│           └──> 09.5 - 2FA Management (2 pts)        │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ PHASE 3: Alternative Auth (Can run in parallel)     │
├─────────────────────────────────────────────────────┤
│ 09.6 - Magic Link (3 pts)                           │
│ 09.7 - Account Linking (3 pts) [Depends on 09.1-2]  │
│ 09.8 - OTP Verification (2 pts)                     │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ PHASE 4: Team Members UI (Can run in parallel)      │
├─────────────────────────────────────────────────────┤
│ 09.9  - Stats Cards (2 pts)                         │
│ 09.10 - Search & Filters (3 pts)                    │
│ 09.11 - Invite Modal (2 pts)                        │
│ 09.12 - Pending Invitations (2 pts)                 │
│ 09.13 - Last Active & Status (2 pts)                │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ PHASE 5: Advanced RBAC (Sequential)                 │
├─────────────────────────────────────────────────────┤
│ 09.14 - Custom Role Creation (5 pts)                │
│    └──> 09.15 - Permission Templates (3 pts)        │
└─────────────────────────────────────────────────────┘
```

---

### Recommended Execution Order

#### Sprint 1 (Priority P2 - Core Features)

**Week 1: Authentication Core (10 points)**
1. 09.1 - Microsoft OAuth (3 pts) - Day 1-2
2. 09.2 - GitHub OAuth (2 pts) - Day 2-3
3. 09.3 - 2FA Setup (5 pts) - Day 3-5

**Week 2: Authentication Completion (5 points)**
4. 09.4 - 2FA Login (3 pts) - Day 6-7
5. 09.5 - 2FA Management (2 pts) - Day 8

**Week 3: Team Members UI (11 points)**
6. 09.9 - Stats Cards (2 pts) - Day 9
7. 09.10 - Search & Filters (3 pts) - Day 10-11
8. 09.11 - Invite Modal (2 pts) - Day 12
9. 09.12 - Pending Invitations (2 pts) - Day 13
10. 09.13 - Last Active & Status (2 pts) - Day 14

**Total: 26 points (P2 stories)**

---

#### Sprint 2 (Priority P3 - Nice-to-Have) - Optional

**Week 1: Alternative Auth (8 points)**
1. 09.6 - Magic Link (3 pts) - Day 1-2
2. 09.7 - Account Linking (3 pts) - Day 3-4
3. 09.8 - OTP Verification (2 pts) - Day 5

**Week 2: Advanced RBAC (8 points)**
4. 09.14 - Custom Role Creation (5 pts) - Day 6-8
5. 09.15 - Permission Templates (3 pts) - Day 9-10

**Total: 16 points (P3 stories)**

---

### Blocking Dependencies

**Hard Blockers:**
- ✅ Epic 01 (Authentication) - COMPLETE
- ✅ Epic 02 (Workspace Management) - COMPLETE
- ✅ Epic 03 (RBAC) - COMPLETE (required for custom roles)

**Soft Dependencies:**
- 09.4 depends on 09.3 (can't test 2FA login without setup)
- 09.5 depends on 09.3 and 09.4 (can't manage 2FA without it being enabled)
- 09.7 depends on 09.1 and 09.2 (need OAuth providers to link)
- 09.15 depends on 09.14 (need custom roles before templates)

**Independent Stories (Can Start Anytime):**
- 09.1 - Microsoft OAuth
- 09.2 - GitHub OAuth
- 09.6 - Magic Link
- 09.8 - OTP Verification
- 09.9 - Stats Cards
- 09.10 - Search & Filters
- 09.11 - Invite Modal
- 09.12 - Pending Invitations
- 09.13 - Last Active & Status

---

## Testing Strategy

### Unit Testing

#### 1. Authentication Logic

**File:** `apps/web/src/lib/__tests__/two-factor.test.ts`

```typescript
describe('Two-Factor Authentication', () => {
  it('generates valid TOTP secret', () => {
    const secret = generateTOTPSecret()
    expect(secret).toHaveLength(32)
    expect(secret).toMatch(/^[A-Z2-7]+$/)
  })

  it('verifies valid TOTP code', () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const code = generateTOTPCode(secret)
    expect(verifyTOTPCode(secret, code)).toBe(true)
  })

  it('rejects expired TOTP code', () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const expiredCode = '000000'
    expect(verifyTOTPCode(secret, expiredCode)).toBe(false)
  })

  it('generates 10 unique backup codes', () => {
    const codes = generateBackupCodes()
    expect(codes).toHaveLength(10)
    expect(new Set(codes).size).toBe(10)
    codes.forEach(code => {
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    })
  })
})
```

---

#### 2. OAuth Provider Configuration

**File:** `apps/web/src/lib/__tests__/oauth-providers.test.ts`

```typescript
describe('OAuth Providers', () => {
  it('has valid Microsoft OAuth config', () => {
    expect(auth.socialProviders.microsoft).toBeDefined()
    expect(auth.socialProviders.microsoft.clientId).toBeTruthy()
    expect(auth.socialProviders.microsoft.redirectURI).toContain('/callback/microsoft')
  })

  it('has valid GitHub OAuth config', () => {
    expect(auth.socialProviders.github).toBeDefined()
    expect(auth.socialProviders.github.clientId).toBeTruthy()
    expect(auth.socialProviders.github.redirectURI).toContain('/callback/github')
  })
})
```

---

#### 3. Member Filtering Logic

**File:** `apps/web/src/components/settings/__tests__/members-filters.test.tsx`

```typescript
describe('MembersFilters', () => {
  it('filters members by search query', () => {
    const members = [
      { name: 'John Doe', email: 'john@example.com', role: 'admin' },
      { name: 'Jane Smith', email: 'jane@example.com', role: 'member' },
    ]

    const filtered = filterMembers(members, { search: 'john' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('John Doe')
  })

  it('filters members by role', () => {
    const members = [
      { name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      { name: 'Member User', email: 'member@example.com', role: 'member' },
    ]

    const filtered = filterMembers(members, { role: 'admin' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].role).toBe('admin')
  })

  it('combines multiple filters', () => {
    const members = [
      { name: 'John Admin', email: 'john@example.com', role: 'admin', status: 'active' },
      { name: 'John Member', email: 'john2@example.com', role: 'member', status: 'active' },
      { name: 'Jane Admin', email: 'jane@example.com', role: 'admin', status: 'pending' },
    ]

    const filtered = filterMembers(members, {
      search: 'john',
      role: 'admin',
      status: 'active'
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('John Admin')
  })
})
```

---

### Integration Testing

#### 1. 2FA Setup Flow

**File:** `apps/web/tests/e2e/two-factor-setup.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Two-Factor Authentication Setup', () => {
  test('complete 2FA setup flow', async ({ page }) => {
    // Login
    await page.goto('/sign-in')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Navigate to security settings
    await page.goto('/settings/security')

    // Start 2FA setup
    await page.click('button:has-text("Enable 2FA")')

    // Should show QR code
    await expect(page.locator('img[alt="QR Code"]')).toBeVisible()

    // Should show manual entry code
    const manualCode = await page.locator('[data-testid="manual-entry-code"]')
    await expect(manualCode).toBeVisible()

    // Copy button works
    await page.click('button:has-text("Copy Code")')

    // Enter verification code (mock)
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('button:has-text("Verify & Enable")')

    // Should show backup codes
    await expect(page.locator('text=Save these backup codes')).toBeVisible()
    const backupCodes = await page.locator('[data-testid="backup-code"]').count()
    expect(backupCodes).toBe(10)

    // Confirm saved
    await page.click('input[type="checkbox"]')
    await page.click('button:has-text("I have saved these codes")')

    // Should redirect to settings with success message
    await expect(page.locator('text=Two-factor authentication enabled')).toBeVisible()
  })
})
```

---

#### 2. OAuth Sign-In Flow

**File:** `apps/web/tests/e2e/oauth-signin.spec.ts`

```typescript
test.describe('OAuth Sign-In', () => {
  test('sign in with Microsoft', async ({ page, context }) => {
    await page.goto('/sign-in')

    // Click Microsoft button
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("Continue with Microsoft")')
    ])

    // Should redirect to Microsoft login
    await expect(popup.url()).toContain('login.microsoftonline.com')

    // Mock Microsoft OAuth (in real test, use test account)
    // After OAuth callback, should be redirected to dashboard
    await expect(page.url()).toContain('/dashboard')
  })

  test('sign in with GitHub', async ({ page, context }) => {
    await page.goto('/sign-in')

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("Continue with GitHub")')
    ])

    await expect(popup.url()).toContain('github.com/login')
  })
})
```

---

#### 3. Team Members Management

**File:** `apps/web/tests/e2e/team-members.spec.ts`

```typescript
test.describe('Team Members Management', () => {
  test('displays member statistics', async ({ page }) => {
    await page.goto('/settings/workspace/members')

    // Check stats cards
    await expect(page.locator('text=Total Members')).toBeVisible()
    await expect(page.locator('text=Admins')).toBeVisible()
    await expect(page.locator('text=Pending Invitations')).toBeVisible()
    await expect(page.locator('text=Seats')).toBeVisible()
  })

  test('search filters members', async ({ page }) => {
    await page.goto('/settings/workspace/members')

    // Type in search
    await page.fill('input[placeholder*="Search"]', 'john')

    // Wait for debounce
    await page.waitForTimeout(400)

    // Should show filtered results
    const members = await page.locator('[data-testid="member-row"]').count()
    expect(members).toBeGreaterThan(0)
  })

  test('invite new member', async ({ page }) => {
    await page.goto('/settings/workspace/members')

    // Open invite modal
    await page.click('button:has-text("Invite Member")')

    // Fill form
    await page.fill('input[type="email"]', 'newuser@example.com')
    await page.selectOption('select[name="role"]', 'member')
    await page.fill('textarea[placeholder*="message"]', 'Welcome!')

    // Submit
    await page.click('button:has-text("Send Invitation")')

    // Should show success
    await expect(page.locator('text=Invitation sent')).toBeVisible()
  })

  test('resend pending invitation', async ({ page }) => {
    await page.goto('/settings/workspace/members')

    // Find pending invitation
    await page.click('button:has-text("Resend"):first')

    // Should show success
    await expect(page.locator('text=Invitation resent')).toBeVisible()
  })
})
```

---

### Manual Testing Checklist

#### Two-Factor Authentication
- [ ] Setup QR code scans successfully in Google Authenticator
- [ ] Setup QR code scans successfully in Authy
- [ ] Manual entry code works
- [ ] 6-digit verification code validates correctly
- [ ] Invalid code shows error
- [ ] Backup codes display and can be copied
- [ ] Backup codes can be downloaded as text file
- [ ] Login prompts for 2FA after password
- [ ] Backup code works at login
- [ ] "Trust this device" skips 2FA for 30 days
- [ ] Trusted devices list shows correct info
- [ ] Revoking trusted device works
- [ ] Regenerating backup codes invalidates old codes
- [ ] Disabling 2FA requires password confirmation

#### OAuth Providers
- [ ] Microsoft button redirects to Azure AD login
- [ ] Microsoft OAuth callback creates user account
- [ ] Microsoft OAuth links to existing account (same email)
- [ ] GitHub button redirects to GitHub OAuth
- [ ] GitHub OAuth callback creates user account
- [ ] Multiple accounts can be linked to same user
- [ ] Unlinking provider works (if not last auth method)
- [ ] Cannot unlink last authentication method

#### Magic Links
- [ ] Magic link email sends successfully
- [ ] Email contains valid link
- [ ] Clicking link signs user in
- [ ] Expired link shows error (after 15 min)
- [ ] Used link cannot be reused

#### Team Members UI
- [ ] Stats cards show correct counts
- [ ] Search filters by name
- [ ] Search filters by email
- [ ] Role filter works
- [ ] Status filter works
- [ ] Combined filters work together
- [ ] Invite modal opens
- [ ] Invitation sends successfully
- [ ] Pending invitations section shows invitations
- [ ] Resend button updates expiry
- [ ] Revoke button removes invitation
- [ ] Last active column shows relative time
- [ ] Status indicator shows green for active
- [ ] Status indicator shows yellow for pending

#### Custom Roles
- [ ] Custom role creation form works
- [ ] Permission checkboxes select correctly
- [ ] Role saves to database
- [ ] Role appears in members role dropdown
- [ ] Editing role updates permissions
- [ ] Cannot delete role in use
- [ ] Permission templates load
- [ ] Using template pre-fills permissions
- [ ] Saving custom role as template works

---

## Implementation Notes

### Security Considerations

#### 1. Two-Factor Authentication
- Store TOTP secrets **encrypted** in database
- Use `crypto.subtle` for key derivation
- Hash backup codes before storage (bcrypt)
- Rate limit verification attempts (5 per 15 min)
- Automatically revoke expired trusted devices
- Require re-authentication for 2FA management changes

#### 2. OAuth Account Linking
- Only link accounts with **verified** emails
- Prevent account hijacking by requiring current password
- Show confirmation dialog before linking
- Allow unlinking only if user has alternative auth method
- Log all account linking/unlinking events

#### 3. Magic Links
- Tokens expire after 15 minutes
- Single-use tokens (invalidate after use)
- Include CSRF protection
- Rate limit magic link requests (3 per hour per email)

#### 4. Custom Roles
- Validate permissions against allowed list
- Prevent permission escalation via custom roles
- Owner role cannot be assigned via custom roles
- Audit log all custom role changes

---

### Performance Optimizations

#### 1. Member Search & Filtering
- Debounce search input (300ms)
- Client-side filtering for <100 members
- Server-side filtering for >100 members
- Cache member list for 30 seconds

#### 2. Last Active Tracking
- Update `lastActiveAt` in background job
- Batch updates every 5 minutes
- Don't block request pipeline
- Use Redis for high-frequency updates (optional)

#### 3. Stats Cards
- Cache stats for 1 minute
- Invalidate on member add/remove
- Use React Query with stale time

---

### Accessibility

#### 1. Two-Factor Setup
- QR code has alt text
- Manual entry code is keyboard accessible
- Verification input supports paste
- Screen reader announces errors
- Backup codes have proper heading structure

#### 2. Member Search
- Search input has label
- Filter dropdowns are keyboard navigable
- Results announce count to screen readers
- Empty state is clear

#### 3. Color Contrast
- Status indicators use both color and icon
- Role badges meet WCAG AA contrast
- Focus indicators visible on all interactive elements

---

### Migration Strategy

#### Phase 1: Database Schema (Week 0)
1. Run migrations for 2FA tables
2. Add columns to User model
3. Add status to WorkspaceMember
4. Test migrations on staging
5. Plan rollback strategy

#### Phase 2: Backend Implementation (Week 1-2)
1. Implement 2FA endpoints
2. Add OAuth providers to better-auth config
3. Test authentication flows
4. Deploy to staging

#### Phase 3: Frontend Implementation (Week 2-3)
1. Build authentication components
2. Enhance Team Members page
3. Add custom roles UI
4. End-to-end testing

#### Phase 4: Production Rollout (Week 4)
1. Deploy to production (feature flag OFF)
2. Test with beta users
3. Enable feature flag gradually (10%, 50%, 100%)
4. Monitor error rates and performance

---

### Rollback Plan

**If critical issues arise:**

1. **Feature Flag:** Disable via environment variable
   ```bash
   FEATURE_2FA_ENABLED=false
   FEATURE_CUSTOM_ROLES_ENABLED=false
   ```

2. **Database Rollback:** Migrations are additive (safe to keep)
   - New tables don't affect existing functionality
   - New columns are nullable
   - Can be cleaned up later

3. **OAuth Rollback:** Remove providers from auth config
   ```typescript
   // Comment out in auth.ts
   // microsoft: { ... },
   // github: { ... },
   ```

4. **Monitoring:**
   - Track authentication error rates
   - Monitor 2FA verification failures
   - Watch for OAuth callback errors

---

### Documentation Requirements

#### 1. User Documentation
- [ ] How to enable two-factor authentication
- [ ] How to use backup codes
- [ ] How to link multiple accounts
- [ ] How to invite team members
- [ ] How to create custom roles

#### 2. Developer Documentation
- [ ] OAuth provider setup guide (Azure AD, GitHub)
- [ ] 2FA implementation details
- [ ] Custom roles permission system
- [ ] Testing guide for auth features

#### 3. Admin Documentation
- [ ] Security best practices
- [ ] Troubleshooting 2FA issues
- [ ] Managing pending invitations
- [ ] Custom role management

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **2FA Adoption Rate**
   - Target: 30% of users within 3 months
   - Measure: `users.twoFactorEnabled = true`

2. **OAuth Usage**
   - Target: 40% of sign-ins via OAuth (vs email/password)
   - Measure: Account provider distribution

3. **Member Management Efficiency**
   - Target: 50% reduction in time to invite/manage members
   - Measure: Time from "Invite" click to invitation sent

4. **Custom Roles Usage**
   - Target: 20% of workspaces create custom roles
   - Measure: Count of workspaces with `custom_roles.count > 0`

5. **Authentication Error Rate**
   - Target: <1% of authentication attempts fail
   - Measure: Failed 2FA verifications / Total attempts

---

## Appendix

### Wireframe References

| Story | Wireframe | File |
|-------|-----------|------|
| 09.1, 09.2 | AU-01, AU-02 | Sign-in/Sign-up pages with OAuth buttons |
| 09.3-09.5 | AU-06 | Two-factor authentication (all states) |
| 09.8 | AU-05 | Email verification with OTP code |
| 09.9-09.13 | ST-06 | Enhanced Team Members page |

**Wireframe Assets:**
- `docs/design/wireframes/Finished wireframes and html files/`
- HTML files for interactive preview
- PNG files for static reference

---

### Related Documents

- **PRD:** `docs/prd.md` - Product requirements
- **Architecture:** `docs/architecture.md` - System design (ADR-005: better-auth)
- **Epic File:** `docs/epics/EPIC-09-ui-auth-enhancements.md` - Story breakdown
- **Sprint Status:** `docs/sprint-artifacts/sprint-status.yaml` - Current state

---

### Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-04 | Claude Code | Initial technical specification |

---

**End of Technical Specification**

This document provides the complete technical blueprint for implementing Epic 09. All stories should reference this spec during development. For questions or clarifications, refer to the architecture document or epic file.
