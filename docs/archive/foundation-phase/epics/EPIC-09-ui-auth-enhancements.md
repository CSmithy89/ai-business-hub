# Epic 09: UI & Authentication Enhancements

**Epic ID:** EPIC-09
**Status:** Backlog
**Priority:** P2 - Medium
**Phase:** Post-MVP Enhancement

---

## Epic Overview

Implement UI and authentication enhancements identified during wireframe implementation verification. This epic covers features shown in wireframes but deferred from MVP, plus PRD-documented future enhancements.

### Business Value
Enhanced security features (2FA, additional OAuth providers) increase enterprise appeal. UI improvements (Team Members page) improve daily workflow efficiency.

### Success Criteria
- [ ] Two-factor authentication fully operational
- [ ] Microsoft and GitHub OAuth available
- [ ] Team Members page matches ST-06 wireframe completely
- [ ] Magic link authentication working
- [ ] Account linking functional

---

## Stories

### Authentication Enhancements

---

### Story 09.1: Implement Microsoft OAuth

**Points:** 3
**Priority:** P2

**As a** enterprise user
**I want** to sign in with my Microsoft account
**So that** I can use my corporate credentials

**Acceptance Criteria:**
- [ ] Configure Microsoft OAuth provider in better-auth
- [ ] Add "Sign in with Microsoft" button to sign-in page
- [ ] Add "Sign up with Microsoft" button to sign-up page
- [ ] Handle OAuth callback
- [ ] Support account linking for existing users
- [ ] Match button styling from AU-01/AU-02 wireframes

**Wireframes:** AU-01, AU-02 (Microsoft button shown)

---

### Story 09.2: Implement GitHub OAuth

**Points:** 2
**Priority:** P2

**As a** developer user
**I want** to sign in with my GitHub account
**So that** I can use my familiar credentials

**Acceptance Criteria:**
- [ ] Configure GitHub OAuth provider in better-auth
- [ ] Add "Sign in with GitHub" button (optional, not in wireframe)
- [ ] Handle OAuth callback
- [ ] Support account linking for existing users

**Technical Notes:**
- PRD lists as future enhancement
- Not shown in wireframes - consider adding to auth UI

---

### Story 09.3: Implement Two-Factor Authentication Setup

**Points:** 5
**Priority:** P2

**As a** security-conscious user
**I want** to enable two-factor authentication
**So that** my account is more secure

**Acceptance Criteria:**
- [ ] Create 2FA settings page at `/settings/security`
- [ ] Show 2FA options: Authenticator App (recommended), SMS
- [ ] Implement QR code generation for authenticator setup
- [ ] Show manual setup code with copy button
- [ ] Implement 6-digit TOTP verification
- [ ] Generate and display 10 backup codes
- [ ] Require checkbox confirmation before enabling
- [ ] Store encrypted 2FA secret in database

**Wireframes:** AU-06 (States 1-3: Setup Options, QR Code Modal, Backup Codes)

**Technical Notes:**
- Use better-auth two-factor plugin
- TOTP algorithm: SHA-1, 6 digits, 30-second window
- Backup codes: 10 codes, single-use, format: XXXX-XXXX

---

### Story 09.4: Implement Two-Factor Authentication Login

**Points:** 3
**Priority:** P2

**As a** user with 2FA enabled
**I want** to verify my identity during login
**So that** my account remains secure

**Acceptance Criteria:**
- [ ] Show 2FA prompt after password verification
- [ ] Accept 6-digit authenticator code
- [ ] Accept backup code as alternative
- [ ] Implement "Trust this device for 30 days" option
- [ ] Handle invalid/expired codes gracefully
- [ ] Rate limit verification attempts

**Wireframes:** AU-06 (States 4-5: Login 2FA Prompt, Backup Code Entry)

---

### Story 09.5: Implement 2FA Management

**Points:** 2
**Priority:** P2

**As a** user with 2FA enabled
**I want** to manage my 2FA settings
**So that** I can maintain security

**Acceptance Criteria:**
- [ ] Show 2FA status (enabled/disabled, method, enabled date)
- [ ] Display remaining backup codes count
- [ ] Allow viewing existing backup codes (with re-auth)
- [ ] Allow generating new backup codes
- [ ] Show trusted devices list
- [ ] Allow revoking trusted devices
- [ ] Allow disabling 2FA (with password confirmation)

**Wireframes:** AU-06 (State 6: 2FA Enabled Management)

---

### Story 09.6: Implement Magic Link Authentication

**Points:** 3
**Priority:** P3

**As a** user
**I want** to sign in with a magic link
**So that** I don't need to remember a password

**Acceptance Criteria:**
- [ ] Add "Email me a login link" option on sign-in page
- [ ] Generate secure magic link token (15 min expiry)
- [ ] Send magic link email via Resend
- [ ] Create magic link verification page
- [ ] Auto-sign in user when link clicked
- [ ] Invalidate token after use

**Technical Notes:**
- Use better-auth magic link plugin
- PRD lists as future enhancement

---

### Story 09.7: Implement Account Linking

**Points:** 3
**Priority:** P3

**As a** user with multiple OAuth accounts
**I want** to link them to my HYVVE account
**So that** I can sign in with any of them

**Acceptance Criteria:**
- [ ] Create linked accounts section in settings
- [ ] Show currently linked providers
- [ ] Allow linking additional OAuth providers
- [ ] Allow unlinking providers (keep at least one auth method)
- [ ] Handle account merge scenarios

**Technical Notes:**
- PRD lists as future enhancement

---

### Story 09.8: Implement OTP Code Verification

**Points:** 2
**Priority:** P3

**As a** user verifying my email
**I want** to enter an OTP code instead of clicking a link
**So that** I can verify from any device

**Acceptance Criteria:**
- [ ] Add 6-digit OTP code input on verification page
- [ ] Send OTP code in verification email (in addition to link)
- [ ] Validate OTP code entry
- [ ] Handle expired/invalid codes

**Wireframes:** AU-05 (shows 6-digit code input option)

---

### Team Members UI Enhancements

---

### Story 09.9: Implement Team Members Stats Cards

**Points:** 2
**Priority:** P2

**As a** workspace admin
**I want** to see team statistics at a glance
**So that** I understand my team composition

**Acceptance Criteria:**
- [ ] Add stats cards row above members table
- [ ] Show: Total Members, Admins, Pending Invitations, Seats (Unlimited)
- [ ] Real-time updates when members change
- [ ] Responsive layout for mobile

**Wireframes:** ST-06 (Stats section)

---

### Story 09.10: Implement Team Members Search & Filters

**Points:** 3
**Priority:** P2

**As a** workspace admin with many members
**I want** to search and filter the members list
**So that** I can find specific members quickly

**Acceptance Criteria:**
- [ ] Add search input with debounced search
- [ ] Search by name and email
- [ ] Add role filter dropdown (All, Owner, Admin, Member, Viewer, Guest)
- [ ] Add status filter dropdown (All, Active, Pending)
- [ ] Persist filter state in URL params
- [ ] Show "No results" state

**Wireframes:** ST-06 (Search and Filter Bar)

---

### Story 09.11: Implement Invite Member Modal

**Points:** 2
**Priority:** P2

**As a** workspace admin
**I want** to invite members from the Team Members page
**So that** I don't need to navigate elsewhere

**Acceptance Criteria:**
- [ ] Add "Invite Member" button in page header
- [ ] Create Invite Member modal dialog
- [ ] Email input with validation
- [ ] Role dropdown selector
- [ ] Permission preview based on selected role
- [ ] Optional personal message field
- [ ] Send invitation on submit
- [ ] Show success toast

**Wireframes:** ST-06 (Invite Member Modal)

**Technical Notes:**
- API exists from Story 02-2, this is UI only

---

### Story 09.12: Implement Pending Invitations Section

**Points:** 2
**Priority:** P2

**As a** workspace admin
**I want** to see and manage pending invitations
**So that** I can track who hasn't joined yet

**Acceptance Criteria:**
- [ ] Add "Pending Invitations" section below members table
- [ ] Show: Email, Role, Invited date
- [ ] Add "Resend" button per invitation
- [ ] Add "Revoke" button per invitation
- [ ] Show empty state when no pending invitations

**Wireframes:** ST-06 (Pending Invitations section)

**Technical Notes:**
- APIs exist from Story 02-2, this is UI only

---

### Story 09.13: Add Last Active & Status to Members Table

**Points:** 2
**Priority:** P2

**As a** workspace admin
**I want** to see member activity status
**So that** I know who is actively using the workspace

**Acceptance Criteria:**
- [ ] Add "Last Active" column to members table
- [ ] Add status indicator (green dot = Active, yellow = Pending)
- [ ] Track last activity timestamp in database
- [ ] Update on any authenticated action
- [ ] Show "Just now", "2 hours ago", etc. format

**Wireframes:** ST-06 (Status and Last Active columns)

**Technical Notes:**
- Requires database schema update for `lastActiveAt`

---

### Advanced RBAC (From PRD)

---

### Story 09.14: Implement Custom Role Creation

**Points:** 5
**Priority:** P3

**As a** workspace owner
**I want** to create custom roles
**So that** I can define exact permissions for my team

**Acceptance Criteria:**
- [ ] Create custom roles page in workspace settings
- [ ] Define role name and description
- [ ] Select permissions from permission list
- [ ] Save custom role to database
- [ ] Allow editing existing custom roles
- [ ] Prevent deletion of roles in use

**Technical Notes:**
- PRD lists as "Advanced RBAC" future enhancement

---

### Story 09.15: Implement Permission Templates

**Points:** 3
**Priority:** P3

**As a** workspace owner
**I want** to use permission templates
**So that** I can quickly set up common role configurations

**Acceptance Criteria:**
- [ ] Provide built-in templates (Manager, Contributor, Viewer)
- [ ] Allow creating role from template
- [ ] Allow saving current role as new template

**Technical Notes:**
- PRD lists as "Advanced RBAC" future enhancement

---

## Wireframe References

| Story | Wireframe | Description | Assets |
|-------|-----------|-------------|--------|
| 09.1, 09.2 | AU-01, AU-02 | OAuth buttons on auth pages | [AU-01](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-01_login_page/) · [AU-02](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-02_register/sign_up/) |
| 09.3-09.5 | AU-06 | Two-factor authentication (all states) | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-06_two-factor_authentication/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-06_two-factor_authentication/screen.png) |
| 09.8 | AU-05 | OTP code entry for verification | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-05_email_verification/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/au-05_email_verification/screen.png) |
| 09.9-09.13 | ST-06 | Team Members page enhancements | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/st-06_team_members/code.html) · [PNG](../design/wireframes/Finished%20wireframes%20and%20html%20files/st-06_team_members/screen.png) |

**Full wireframe index:** [WIREFRAME-INDEX.md](../design/wireframes/WIREFRAME-INDEX.md)

---

## Dependencies

- Epic 01: Authentication (base auth system)
- Epic 02: Workspace Management (team members base)
- Epic 03: RBAC (permission system for custom roles)

## Technical Notes

### better-auth Plugins Required
- `twoFactor` - For TOTP 2FA
- `magicLink` - For passwordless auth
- Already configured: `organization` for workspaces

### Database Schema Updates
- `users.twoFactorSecret` - Encrypted TOTP secret
- `users.twoFactorEnabled` - Boolean flag
- `backup_codes` - Table for recovery codes
- `trusted_devices` - Table for device trust
- `users.lastActiveAt` - Activity tracking
- `custom_roles` - Table for custom role definitions

### OAuth Provider Setup
- Microsoft: Azure AD App Registration
- GitHub: GitHub OAuth App

---

## Story Summary

| # | Story | Points | Priority |
|---|-------|--------|----------|
| 09.1 | Microsoft OAuth | 3 | P2 |
| 09.2 | GitHub OAuth | 2 | P2 |
| 09.3 | 2FA Setup | 5 | P2 |
| 09.4 | 2FA Login | 3 | P2 |
| 09.5 | 2FA Management | 2 | P2 |
| 09.6 | Magic Link Auth | 3 | P3 |
| 09.7 | Account Linking | 3 | P3 |
| 09.8 | OTP Code Verification | 2 | P3 |
| 09.9 | Team Members Stats | 2 | P2 |
| 09.10 | Team Members Search/Filter | 3 | P2 |
| 09.11 | Invite Member Modal | 2 | P2 |
| 09.12 | Pending Invitations UI | 2 | P2 |
| 09.13 | Last Active & Status | 2 | P2 |
| 09.14 | Custom Role Creation | 5 | P3 |
| 09.15 | Permission Templates | 3 | P3 |
| **Total** | | **42** | |

### By Priority
- **P2 (Medium):** 24 points - Core enhancements
- **P3 (Low):** 18 points - Nice-to-have

---

_Epic created: 2025-12-02_
_Source: Wireframe Implementation Gap Analysis + PRD Future Enhancements_
_PRD Reference: Growth Features (Post-MVP)_
