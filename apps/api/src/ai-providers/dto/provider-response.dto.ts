/**
 * Provider Response DTO
 *
 * Defines the shape of provider data returned by API endpoints.
 * Never includes the encrypted API key.
 */

/**
 * Provider response for list and get endpoints
 */
export interface ProviderResponseDto {
  id: string;
  provider: string;
  defaultModel: string;
  isValid: boolean;
  lastValidatedAt: string | null;
  validationError: string | null;
  maxTokensPerDay: number;
  tokensUsedToday: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response for test endpoint
 */
export interface TestProviderResponseDto {
  valid: boolean;
  error?: string;
  latency: number; // milliseconds
  model: string;
}

/**
 * Transform database model to response DTO
 */
export function toProviderResponse(provider: {
  id: string;
  provider: string;
  defaultModel: string;
  isValid: boolean;
  lastValidatedAt: Date | null;
  validationError: string | null;
  maxTokensPerDay: number;
  tokensUsedToday: number;
  createdAt: Date;
  updatedAt: Date;
}): ProviderResponseDto {
  return {
    id: provider.id,
    provider: provider.provider,
    defaultModel: provider.defaultModel,
    isValid: provider.isValid,
    lastValidatedAt: provider.lastValidatedAt?.toISOString() ?? null,
    validationError: provider.validationError,
    maxTokensPerDay: provider.maxTokensPerDay,
    tokensUsedToday: provider.tokensUsedToday,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}
