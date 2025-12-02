import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { isInvitationExpired } from '@/lib/invitation'
import { InviteAcceptForm } from '@/components/invite/invite-accept-form'
import { InviteError } from '@/components/invite/invite-error'
import { AuthLayout } from '@/components/auth/auth-layout'

export const metadata: Metadata = {
  title: 'Accept Invitation | HYVVE',
  description: 'Accept your workspace invitation',
}

interface PageProps {
  params: Promise<{ token: string }>
}

/**
 * Invitation Landing Page
 *
 * Handles workspace invitation acceptance flow:
 * 1. Validates invitation token
 * 2. Checks authentication status
 * 3. Routes to appropriate flow (accept, sign-in, sign-up)
 */
export default async function InvitePage({ params }: PageProps) {
  const { token } = await params

  // Find invitation by token
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          deletedAt: true,
        },
      },
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  // Invalid token
  if (!invitation) {
    return (
      <AuthLayout>
        <InviteError
          title="Invalid Invitation"
          message="This invitation link is invalid or has already been used."
          showContactSupport
        />
      </AuthLayout>
    )
  }

  // Workspace deleted
  if (invitation.workspace.deletedAt) {
    return (
      <AuthLayout>
        <InviteError
          title="Workspace Unavailable"
          message="This workspace has been deleted and is no longer accepting new members."
        />
      </AuthLayout>
    )
  }

  // Expired invitation
  if (isInvitationExpired(invitation.expiresAt)) {
    return (
      <AuthLayout>
        <InviteError
          title="Invitation Expired"
          message="This invitation has expired. Please contact the workspace administrator for a new invitation."
          showRequestNew
        />
      </AuthLayout>
    )
  }

  // Check authentication
  const session = await getSession()

  // Not authenticated - redirect to sign-in or sign-up
  if (!session) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email.toLowerCase() },
      select: { id: true },
    })

    if (existingUser) {
      // Redirect to sign-in with invite token
      redirect(`/sign-in?invite=${token}&email=${encodeURIComponent(invitation.email)}`)
    } else {
      // Redirect to sign-up with invite token
      redirect(`/sign-up?invite=${token}&email=${encodeURIComponent(invitation.email)}`)
    }
  }

  // Authenticated - check email match
  const userEmail = session.user.email.toLowerCase()
  const inviteEmail = invitation.email.toLowerCase()

  if (userEmail !== inviteEmail) {
    return (
      <AuthLayout>
        <InviteError
          title="Email Mismatch"
          message={`This invitation was sent to ${invitation.email}. Please sign out and sign in with the correct account.`}
          showSignOut
          currentEmail={session.user.email}
          invitedEmail={invitation.email}
        />
      </AuthLayout>
    )
  }

  // Check if already a member
  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: invitation.workspaceId,
      },
    },
  })

  if (existingMember) {
    // Already a member - delete invitation and redirect
    await prisma.workspaceInvitation.delete({
      where: { id: invitation.id },
    })
    redirect(`/dashboard?workspace=${invitation.workspace.slug}`)
  }

  // Show acceptance form
  const inviterName = invitation.invitedBy.name || invitation.invitedBy.email

  return (
    <AuthLayout>
      <InviteAcceptForm
        token={token}
        workspaceName={invitation.workspace.name}
        inviterName={inviterName}
        role={invitation.role}
      />
    </AuthLayout>
  )
}
