import { z } from 'zod';

/**
 * List Notifications Query DTO
 * Validates query parameters for listing notifications
 */
export const ListNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().optional(),
  read: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  workspaceId: z.string().optional(),
});

export type ListNotificationsQueryDto = z.infer<typeof ListNotificationsQuerySchema>;
