/**
 * Google Gemini Provider
 *
 * Implementation of AIProviderInterface for Google's Gemini models.
 * Uses the @google/generative-ai SDK.
 *
 * Supported models:
 * - gemini-1.5-pro
 * - gemini-1.5-flash
 * - gemini-pro
 *
 * @module ai-providers/providers/gemini
 */

import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
} from '@google/generative-ai';
import {
  BaseAIProvider,
  ChatParams,
  ChatResponse,
  ChatChunk,
  ValidationResult,
  TokenUsage,
} from '../interfaces/ai-provider.interface';

/**
 * Cost per million tokens for Gemini models (as of 2024)
 * Using average of input/output costs
 */
const GEMINI_COSTS: Record<string, number> = {
  'gemini-1.5-pro': 5.0,
  'gemini-1.5-flash': 0.15,
  'gemini-pro': 0.5,
  default: 1.0,
};

export class GeminiProvider extends BaseAIProvider {
  readonly provider = 'gemini' as const;
  readonly model: string;
  private client: GoogleGenerativeAI;
  private generativeModel: GenerativeModel;

  constructor(apiKey: string, model: string) {
    super();
    this.model = model;
    this.client = new GoogleGenerativeAI(apiKey);
    this.generativeModel = this.client.getGenerativeModel({ model });
  }

  async validateCredentials(): Promise<ValidationResult> {
    try {
      // Make a minimal request to validate the API key
      const result = await this.generativeModel.generateContent('test');
      await result.response;
      return { valid: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { valid: false, error: errorMessage };
    }
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const modelToUse = params.model || this.model;
    const model =
      modelToUse !== this.model
        ? this.client.getGenerativeModel({ model: modelToUse })
        : this.generativeModel;

    // Convert messages to Gemini format
    const { contents, systemInstruction } = this.convertMessages(params.messages);

    const result = await model.generateContent({
      contents,
      systemInstruction,
      generationConfig: {
        maxOutputTokens: params.maxTokens ?? 4096,
        temperature: params.temperature,
      },
    });

    const response = result.response;
    const text = response.text();

    // Gemini provides token counts via usageMetadata
    const usageMetadata = response.usageMetadata;
    const usage: TokenUsage = {
      promptTokens: usageMetadata?.promptTokenCount ?? 0,
      completionTokens: usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: usageMetadata?.totalTokenCount ?? 0,
    };

    // Track usage for cumulative stats
    const costPerMillion = GEMINI_COSTS[modelToUse] ?? GEMINI_COSTS.default;
    this.trackUsage(usage, costPerMillion);

    const finishReason = response.candidates?.[0]?.finishReason;

    return {
      content: text,
      finishReason: finishReason === 'STOP' ? 'stop' : 'length',
      usage,
      model: modelToUse,
    };
  }

  async *streamChat(params: ChatParams): AsyncGenerator<ChatChunk, void, unknown> {
    const modelToUse = params.model || this.model;
    const model =
      modelToUse !== this.model
        ? this.client.getGenerativeModel({ model: modelToUse })
        : this.generativeModel;

    // Convert messages to Gemini format
    const { contents, systemInstruction } = this.convertMessages(params.messages);

    const result = await model.generateContentStream({
      contents,
      systemInstruction,
      generationConfig: {
        maxOutputTokens: params.maxTokens ?? 4096,
        temperature: params.temperature,
      },
    });

    let totalUsage: TokenUsage | undefined;
    let lastFinishReason: string | undefined;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { delta: text };
      }

      // Track finish reason
      const candidate = chunk.candidates?.[0];
      if (candidate?.finishReason) {
        lastFinishReason = candidate.finishReason;
      }

      // Get usage from final response
      if (chunk.usageMetadata) {
        totalUsage = {
          promptTokens: chunk.usageMetadata.promptTokenCount ?? 0,
          completionTokens: chunk.usageMetadata.candidatesTokenCount ?? 0,
          totalTokens: chunk.usageMetadata.totalTokenCount ?? 0,
        };
      }
    }

    // Final chunk with finish reason
    if (totalUsage) {
      const costPerMillion = GEMINI_COSTS[modelToUse] ?? GEMINI_COSTS.default;
      this.trackUsage(totalUsage, costPerMillion);
    }

    yield {
      delta: '',
      finishReason: lastFinishReason === 'STOP' ? 'stop' : 'length',
      usage: totalUsage,
    };
  }

  /**
   * Convert messages to Gemini format
   */
  private convertMessages(
    messages: ChatParams['messages'],
  ): { contents: Content[]; systemInstruction?: string } {
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const contents: Content[] = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    return {
      contents,
      systemInstruction: systemMessage?.content,
    };
  }
}
