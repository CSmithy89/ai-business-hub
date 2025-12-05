import { z } from 'zod'

/**
 * Workspace role enum
 */
export const WORKSPACE_ROLES = ['admin', 'member', 'viewer', 'guest'] as const
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number]

/**
 * Invite member form validation schema
 * - Valid email required
 * - Role must be one of: admin, member, viewer, guest (not owner)
 */
export const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(WORKSPACE_ROLES, {
    message: 'Please select a valid role',
  }),
})

/**
 * Type export for invite member form data
 */
export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>
