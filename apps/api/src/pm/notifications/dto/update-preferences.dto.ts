import { z } from 'zod';

/**
 * Time format validation (HH:MM in 24-hour format)
 */
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * IANA timezone validation (basic check for common format)
 */
const timezoneRegex = /^[A-Za-z]+\/[A-Za-z_]+$/;

/**
 * Zod schema for updating notification preferences
 * All fields are optional to support partial updates
 */
export const updatePreferencesSchema = z.object({
  // Platform notification preferences
  emailApprovals: z.boolean().optional(),
  emailWorkspaceInvites: z.boolean().optional(),
  emailAgentErrors: z.boolean().optional(),
  emailDigest: z.string().optional(),

  inAppApprovals: z.boolean().optional(),
  inAppWorkspaceInvites: z.boolean().optional(),
  inAppAgentUpdates: z.boolean().optional(),

  // PM-specific email preferences
  emailTaskAssigned: z.boolean().optional(),
  emailTaskMentioned: z.boolean().optional(),
  emailDueDateReminder: z.boolean().optional(),
  emailAgentCompletion: z.boolean().optional(),
  emailHealthAlert: z.boolean().optional(),

  // PM-specific in-app preferences
  inAppTaskAssigned: z.boolean().optional(),
  inAppTaskMentioned: z.boolean().optional(),
  inAppDueDateReminder: z.boolean().optional(),
  inAppAgentCompletion: z.boolean().optional(),
  inAppHealthAlert: z.boolean().optional(),

  // Quiet hours (must set both or neither)
  quietHoursStart: z
    .string()
    .regex(timeFormatRegex, {
      message: 'Quiet hours start must be in HH:MM format (24-hour)',
    })
    .nullable()
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(timeFormatRegex, {
      message: 'Quiet hours end must be in HH:MM format (24-hour)',
    })
    .nullable()
    .optional(),
  quietHoursTimezone: z
    .string()
    .regex(timezoneRegex, {
      message: 'Timezone must be a valid IANA timezone (e.g., America/Los_Angeles)',
    })
    .optional(),

  // Digest settings
  digestEnabled: z.boolean().optional(),
  digestFrequency: z.enum(['daily', 'weekly']).optional(),
}).refine(
  (data) => {
    // If quietHoursStart is set, quietHoursEnd must also be set (and vice versa)
    const hasStart = data.quietHoursStart !== undefined && data.quietHoursStart !== null;
    const hasEnd = data.quietHoursEnd !== undefined && data.quietHoursEnd !== null;

    // Allow both null or both set
    if (hasStart !== hasEnd) {
      return false;
    }
    return true;
  },
  {
    message: 'Both quietHoursStart and quietHoursEnd must be set together, or both must be null',
  }
);

/**
 * TypeScript type inferred from schema
 */
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
