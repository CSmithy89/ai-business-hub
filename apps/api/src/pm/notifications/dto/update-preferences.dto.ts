import { z } from 'zod';

/**
 * Time format validation (HH:MM in 24-hour format)
 */
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * IANA timezone validation
 * Allows: UTC, America/New_York, America/Argentina/Buenos_Aires, Etc/GMT+5
 */
const timezoneRegex = /^[A-Za-z_]+(?:\/[A-Za-z0-9_\-+]+)*$/;

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
    // For partial updates, we only validate when both fields are being changed together
    // If only one field is provided (the other is undefined), it's a partial update - allow it
    const startProvided = data.quietHoursStart !== undefined;
    const endProvided = data.quietHoursEnd !== undefined;

    // If neither is provided, no validation needed (partial update for other fields)
    if (!startProvided && !endProvided) {
      return true;
    }

    // If only one is provided, it's a partial update - allow it
    // The service layer will combine with existing values from the database
    if (startProvided !== endProvided) {
      return true;
    }

    // Both are provided - ensure they're both set or both null
    const startIsNull = data.quietHoursStart === null;
    const endIsNull = data.quietHoursEnd === null;

    // Both should be null or both should have values
    return startIsNull === endIsNull;
  },
  {
    message: 'When updating both quiet hours, they must both be set or both be null',
  }
);

/**
 * TypeScript type inferred from schema
 */
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
