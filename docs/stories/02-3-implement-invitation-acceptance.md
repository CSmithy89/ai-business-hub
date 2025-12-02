# Story 02.3: Implement Invitation Acceptance

**Story ID:** 02-3
**Epic:** EPIC-02 - Workspace Management
**Status:** Drafted
**Priority:** P0 - Critical
**Points:** 3
**Created:** 2025-12-02

---

## User Story

**As a** user who received a workspace invitation
**I want** to accept the invitation via the email link
**So that** I can join the workspace and collaborate with team members

---

## Story Context

This story implements the invitation acceptance flow that converts a pending invitation into workspace membership. The flow handles three scenarios: authenticated users, unauthenticated existing users, and new users who need to register first.

When an invitation is accepted, the WorkspaceMember record is created and the invitation is deleted. The invitee's session is updated to make the new workspace their active workspace.

---

## Acceptance Criteria

### AC-2.3.1: Authenticated user can accept invitation
**Given** a logged-in user with a valid invitation token
**When** they visit `/invite/:token`
**Then**:
- WorkspaceMember record created with invited role
- Invitation record deleted
- Session updated with new workspace as active
- Redirected to workspace dashboard
- Success toast displayed

### AC-2.3.2: Unauthenticated existing user redirected to sign-in
**Given** an unauthenticated user with an existing account
**When** they visit `/invite/:token`
**Then**:
- Redirected to `/sign-in?invite={token}&email={invitedEmail}`
- After sign-in, invitation automatically accepted
- Then redirected to workspace dashboard

### AC-2.3.3: New user redirected to sign-up
**Given** an unauthenticated user without an account
**When** they visit `/invite/:token`
**Then**:
- Redirected to `/sign-up?invite={token}&email={invitedEmail}`
- Email field pre-filled from invitation
- After registration and verification, invitation accepted
- Then redirected to workspace dashboard

### AC-2.3.4: Expired invitation rejected
**Given** an invitation token that is past 7-day expiry
**When** visiting `/invite/:token`
**Then**:
- Error page displayed: "This invitation has expired"
- Link to request new invitation from workspace admin
- No membership created

### AC-2.3.5: Invalid token rejected
**Given** an invalid or non-existent invitation token
**When** visiting `/invite/:token`
**Then**:
- Error page displayed: "Invalid invitation link"
- HTTP 404 status
- No membership created

### AC-2.3.6: Already member handled
**Given** a user who is already a member of the workspace
**When** attempting to accept invitation
**Then**:
- Redirected to workspace dashboard
- Info toast: "You're already a member of this workspace"
- Invitation deleted (cleanup)

### AC-2.3.7: Email mismatch blocked
**Given** a logged-in user with email different from invitation
**When** attempting to accept
**Then**:
- Error displayed: "This invitation was sent to a different email address"
- Option to sign out and sign in with correct account
- Membership not created

---

## Technical Implementation Guidance

### API Endpoint to Implement

#### POST `/api/invitations/accept` - Accept Invitation

**Location:** `apps/web/src/app/api/invitations/accept/route.ts`

**Request Body:**
```typescript
{
  token: string;  // Invitation token from URL
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    workspace: {
      id: string;
      name: string;
      slug: string;
    };
    role: WorkspaceRole;
  }
}
```

**Implementation Steps:**
1. Validate token exists in request body
2. Find invitation by token
3. Check invitation not expired
4. Verify authenticated user's email matches invitation email
5. Check user not already a member
6. In transaction:
   - Create WorkspaceMember record
   - Delete WorkspaceInvitation record
   - Update session with new workspaceId
7. Emit event: `workspace.member.joined`
8. Return workspace info

**Error Handling:**
- 400: Missing token
- 401: Not authenticated
- 403: Email mismatch
- 404: Invalid token
- 409: Already member
- 410: Expired invitation

---

### Page to Implement

#### `/invite/[token]` - Invitation Landing Page

**Location:** `apps/web/src/app/invite/[token]/page.tsx`

**Behavior:**
1. Server-side check invitation validity
2. If invalid/expired: Show error UI
3. If authenticated:
   - Check email match
   - Call accept API
   - Redirect to dashboard
4. If not authenticated:
   - Check if email exists in system
   - Redirect to sign-in or sign-up with params

---

### Auth Flow Integration

**Location:** `apps/web/src/app/(auth)/sign-in/page.tsx` (modify existing)

**Changes:**
1. Check for `invite` query param
2. After successful sign-in, if invite param:
   - Call accept invitation API
   - Redirect to new workspace

---

## Test Requirements

### Integration Tests

**Location:** `apps/web/src/app/api/invitations/accept/__tests__/accept.test.ts`

#### Test Suite: POST `/api/invitations/accept`
- Valid token + authenticated user = membership created
- Expired token returns 410
- Invalid token returns 404
- Unauthenticated returns 401
- Email mismatch returns 403
- Already member returns 409, invitation deleted
- Invitation deleted after acceptance
- Session updated with new workspace
- Event emitted

---

## Definition of Done

- [ ] API endpoint implemented and functional
- [ ] Invite page handles all scenarios
- [ ] Auth pages updated for invite flow
- [ ] All acceptance criteria tested
- [ ] Error handling for all failure modes
- [ ] Event emissions implemented
- [ ] Code reviewed and approved
- [ ] No linting or type errors
- [ ] Successfully tested in local development

---

## Dependencies

### Upstream Dependencies
- **Story 02-2:** Member invitation system (creates invitations)
- **Epic 01:** Authentication system (sign-in/sign-up flows)

### Downstream Dependencies
- **Story 02-4:** Workspace switching (session workspace)
- **Story 02-5:** Member management (member list)

---

## Implementation Notes

### Email Matching
- Compare normalized (lowercase) emails
- User's email from session must match invitation email
- If mismatch, show clear error with sign-out option

### Post-Auth Invite Handling
- Store invite token in URL during auth flow
- After auth callback, check for token and process
- Clear token from URL after processing

### Session Update
- After acceptance, set activeWorkspaceId to new workspace
- This makes the new workspace immediately active
- User can switch later via workspace selector

### Edge Cases
- User already member but invitation exists: Accept gracefully, delete invitation
- Multiple pending invitations to same workspace: Should not happen (unique constraint)
- Deleted workspace: Return appropriate error

---

## References

- **Tech Spec:** `/docs/sprint-artifacts/tech-spec-epic-02.md`
- **Epic File:** `/docs/epics/EPIC-02-workspace-management.md`
- **Story 02-2:** `/docs/stories/02-2-implement-member-invitation-system.md`

---

## Implementation Notes (2025-12-02)

**Completed:**
- API endpoint for invitation acceptance
- Invite landing page with server-side validation
- Accept form component with loading states
- Error component for all failure scenarios
- Email mismatch detection and handling
- Graceful already-member handling

**Technical Debt:**
1. Auth page integration for `?invite=` param (sign-in/sign-up forms should auto-process)
2. Toast notifications after acceptance

---

_Story drafted: 2025-12-02_
_Implementation completed: 2025-12-02_
