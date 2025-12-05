# Migration Guide: Epic 09 - UI & Authentication Enhancements

This guide covers the changes introduced in Epic 09 and how to migrate existing deployments.

---

## Overview

Epic 09 introduced significant authentication and UI enhancements:

- Microsoft OAuth provider
- GitHub OAuth provider
- Two-Factor Authentication (TOTP)
- Magic link authentication
- Account linking
- OTP code verification
- Team members UI improvements
- Custom roles and permission templates

---

## Pre-Migration Checklist

- [ ] Backup database
- [ ] Review environment variables
- [ ] Schedule maintenance window
- [ ] Notify users of downtime

---

## Database Schema Changes

### New Tables

```sql
-- Two-Factor Authentication
TwoFactorSecret
  - id: String (cuid)
  - userId: String (FK to User)
  - secret: String (encrypted)
  - backupCodes: String[] (encrypted)
  - createdAt: DateTime
  - updatedAt: DateTime

-- Custom Roles (Advanced RBAC)
CustomRole
  - id: String (cuid)
  - workspaceId: String (FK to Workspace)
  - name: String
  - permissions: Json
  - createdAt: DateTime
  - updatedAt: DateTime

-- Permission Templates
PermissionTemplate
  - id: String (cuid)
  - name: String
  - description: String
  - permissions: Json
  - isSystem: Boolean
  - createdAt: DateTime
```

### Modified Tables

```sql
-- User table additions
User
  + twoFactorEnabled: Boolean (default: false)
  + lastActiveAt: DateTime?

-- Account table additions (for OAuth)
Account
  + linkedAt: DateTime?
```

### Run Migration

```bash
# Generate migration
npx prisma migrate dev --name epic_09_auth_enhancements

# Or in production
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

---

## Environment Variables

### New Required Variables

```bash
# Microsoft OAuth (if using)
MICROSOFT_CLIENT_ID="your-microsoft-app-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# GitHub OAuth (if using)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### New Optional Variables

```bash
# Magic Link Configuration
MAGIC_LINK_EXPIRY_MINUTES="15"  # Default: 15

# 2FA Configuration
TOTP_ISSUER="HYVVE"  # Shown in authenticator apps
TOTP_WINDOW="1"      # Time window for code validation

# Rate Limiting (recommended: migrate to Redis)
RATE_LIMIT_REDIS_URL="redis://..."  # If using Redis rate limiting
```

### Updated Variables

No existing variables were changed, only additions.

---

## OAuth Provider Setup

### Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory > App Registrations
3. Create new registration:
   - Name: "HYVVE"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `https://your-domain.com/api/auth/callback/microsoft`
4. Copy Application (client) ID to `MICROSOFT_CLIENT_ID`
5. Create client secret and copy to `MICROSOFT_CLIENT_SECRET`
6. Under API permissions, ensure these are granted:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: "HYVVE"
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/api/auth/callback/github`
4. Copy Client ID to `GITHUB_CLIENT_ID`
5. Generate and copy Client Secret to `GITHUB_CLIENT_SECRET`

---

## Feature Migration Details

### Two-Factor Authentication

**No migration needed for existing users.** 2FA is opt-in.

New users can enable 2FA from:
- Settings > Security > Two-Factor Authentication

**Admin actions:**
- View 2FA adoption in admin dashboard
- Force 2FA for specific roles (optional configuration)

### Magic Link Authentication

**No migration needed.** Feature works immediately after deployment.

Users can request magic links from the sign-in page:
- Click "Sign in with email link"
- Enter email address
- Receive link via email
- Click to authenticate

### Account Linking

**Existing OAuth accounts:** Automatically linkable.

Users can link additional providers from:
- Settings > Account > Connected Accounts

**Important:** Users cannot unlink their last authentication method. At least one of the following must remain:
- Password
- OAuth provider
- Magic link (requires verified email)

### Custom Roles

**Migration from default roles:**

Existing workspace members retain their current roles. Custom roles are additive:

```sql
-- Default roles still exist
OWNER, ADMIN, MEMBER

-- Custom roles are workspace-specific
CustomRole belongs to Workspace
```

**Creating custom roles:**
- Workspace Settings > Roles > Create Custom Role
- Select permissions from permission matrix
- Assign to members

### Permission Templates

**System templates provided:**

| Template | Permissions |
|----------|-------------|
| Viewer | Read-only access |
| Contributor | Read + Write |
| Manager | Full access except billing |
| Custom | User-defined |

---

## API Changes

### New Endpoints

```
POST   /api/auth/2fa/setup           # Initialize 2FA setup
POST   /api/auth/2fa/verify-setup    # Verify and enable 2FA
POST   /api/auth/2fa/verify-login    # Verify 2FA during login
POST   /api/auth/2fa/backup-codes    # Generate new backup codes
DELETE /api/auth/2fa/disable         # Disable 2FA

POST   /api/auth/magic-link          # Request magic link
GET    /api/auth/magic-link/verify   # Verify magic link token

POST   /api/auth/link-account        # Link OAuth provider
DELETE /api/auth/unlink-account      # Unlink OAuth provider

GET    /api/workspaces/:id/roles     # List custom roles
POST   /api/workspaces/:id/roles     # Create custom role
PUT    /api/workspaces/:id/roles/:roleId  # Update custom role
DELETE /api/workspaces/:id/roles/:roleId  # Delete custom role

GET    /api/permission-templates     # List permission templates
```

### Changed Endpoints

```
POST /api/auth/signin
  # Now supports:
  # - Email/password
  # - OAuth (Google, Microsoft, GitHub)
  # - Magic link
  # - 2FA verification (when enabled)

GET /api/workspaces/:id/members
  # New fields in response:
  # - lastActiveAt
  # - twoFactorEnabled
  # - linkedProviders[]
```

---

## UI Changes

### New Pages

| Route | Purpose |
|-------|---------|
| `/settings/security` | 2FA setup and management |
| `/settings/account/connected` | Linked accounts management |
| `/workspace/[id]/settings/roles` | Custom role management |

### Updated Components

| Component | Changes |
|-----------|---------|
| `SignInForm` | Added magic link option, Microsoft/GitHub buttons |
| `MembersTable` | Added last active, status indicators, filters |
| `InviteMemberModal` | Enhanced with role selection including custom roles |
| `SettingsLayout` | Added Security and Connected Accounts sections |

---

## Breaking Changes

### None

Epic 09 was designed to be fully backward compatible. All changes are additive.

---

## Rollback Procedure

If issues occur after migration:

1. **Revert code:**
   ```bash
   git revert <epic-09-merge-commit>
   ```

2. **Database rollback:**
   ```bash
   # This will drop new tables - ensure data backup exists
   npx prisma migrate resolve --rolled-back epic_09_auth_enhancements
   ```

3. **Remove new environment variables** (optional, they'll be ignored)

---

## Post-Migration Verification

### Functional Tests

- [ ] Email/password login works
- [ ] Google OAuth works
- [ ] Microsoft OAuth works (new)
- [ ] GitHub OAuth works (new)
- [ ] 2FA setup flow works
- [ ] 2FA login flow works
- [ ] Magic link request works
- [ ] Magic link verification works
- [ ] Account linking works
- [ ] Account unlinking works (with safety checks)
- [ ] Custom role creation works
- [ ] Permission templates display correctly
- [ ] Team members table shows new fields

### Security Checks

- [ ] Rate limiting functions on auth endpoints
- [ ] 2FA backup codes are encrypted
- [ ] Magic link tokens expire correctly
- [ ] Account unlinking prevents removing last auth method

---

## Support

For issues during migration:
1. Check logs for specific errors
2. Review this guide's troubleshooting section
3. Open GitHub issue with details

---

*Last updated: 2025-12-05*
