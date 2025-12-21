import { z } from 'zod';

/**
 * Bulk Read DTO
 * Validates request body for bulk marking notifications as read
 */
export const BulkReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export type BulkReadDto = z.infer<typeof BulkReadSchema>;
