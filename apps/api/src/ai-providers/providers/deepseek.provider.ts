/**
 * DeepSeek Provider
 *
 * Implementation of AIProviderInterface for DeepSeek models.
 * Uses OpenAI-compatible API with custom base URL.
 *
 * Supported models:
 * - deepseek-chat
 * - deepseek-coder
 * - deepseek-reasoner (DeepSeek R1)
 *
 * @module ai-providers/providers/deepseek
 */

import { OpenAIProvider } from './openai.provider';

/**
 * DeepSeek API base URL
 */
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

/**
 * Cost per million tokens for DeepSeek models (as of 2024)
 * DeepSeek is known for very competitive pricing
 */
const DEEPSEEK_COSTS: Record<string, number> = {
  'deepseek-chat': 0.27,
  'deepseek-coder': 0.27,
  'deepseek-reasoner': 2.19,
  default: 0.27,
};

export class DeepSeekProvider extends OpenAIProvider {
  override readonly provider = 'deepseek' as const;

  constructor(apiKey: string, model: string) {
    super(apiKey, model, DEEPSEEK_BASE_URL);
  }

  /**
   * Override cost calculation for DeepSeek pricing
   */
  protected override getCostPerMillion(model: string): number {
    return DEEPSEEK_COSTS[model] ?? DEEPSEEK_COSTS.default;
  }
}
