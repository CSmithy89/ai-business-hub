/**
 * Update AI Provider DTO
 *
 * Validates input for updating an AI provider configuration.
 * All fields are optional - only provided fields will be updated.
 */

import { z } from 'zod';

/**
 * Zod schema for updating a provider
 */
export const updateProviderSchema = z.object({
  apiKey: z
    .string()
    .min(1, 'API key cannot be empty')
    .max(500, 'API key is too long')
    .optional(),

  defaultModel: z
    .string()
    .min(1, 'Model name cannot be empty')
    .max(100, 'Model name is too long')
    .optional(),

  maxTokensPerDay: z
    .number()
    .int()
    .min(1000, 'Minimum tokens per day is 1000')
    .max(10_000_000, 'Maximum tokens per day is 10 million')
    .optional(),
});

/**
 * TypeScript type inferred from schema
 */
export type UpdateProviderDto = z.infer<typeof updateProviderSchema>;
