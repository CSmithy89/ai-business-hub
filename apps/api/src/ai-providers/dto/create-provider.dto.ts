/**
 * Create AI Provider DTO
 *
 * Validates input for creating a new AI provider configuration.
 */

import { z } from 'zod';

/**
 * Supported AI provider types
 */
export const providerTypes = [
  'claude',
  'openai',
  'gemini',
  'deepseek',
  'openrouter',
] as const;

/**
 * Zod schema for creating a provider
 */
export const createProviderSchema = z.object({
  provider: z.enum(providerTypes, {
    errorMap: () => ({
      message: `Provider must be one of: ${providerTypes.join(', ')}`,
    }),
  }),

  apiKey: z
    .string()
    .min(1, { message: 'API key is required' })
    .max(500, { message: 'API key is too long' }),

  defaultModel: z
    .string()
    .min(1, { message: 'Default model is required' })
    .max(100, { message: 'Model name is too long' }),

  maxTokensPerDay: z
    .number()
    .int()
    .min(1000, { message: 'Minimum tokens per day is 1000' })
    .max(10_000_000, { message: 'Maximum tokens per day is 10 million' })
    .optional()
    .default(100_000),
});

/**
 * TypeScript type inferred from schema
 */
export type CreateProviderDto = z.infer<typeof createProviderSchema>;

/**
 * Default models for each provider
 */
export const defaultModels: Record<(typeof providerTypes)[number], string> = {
  claude: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o',
  gemini: 'gemini-1.5-flash',
  deepseek: 'deepseek-chat',
  openrouter: 'anthropic/claude-3-5-sonnet',
};
