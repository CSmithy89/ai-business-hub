/**
 * Agent Preferences Service
 *
 * Manages per-agent model preferences for workspaces.
 * Allows users to configure which AI model each agent team should use.
 *
 * @module ai-providers
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

/**
 * Agent definition
 */
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'module';
  defaultProvider: string;
  defaultModel: string;
}

/**
 * Agent preference with current model
 */
export interface AgentPreference {
  agent: AgentDefinition;
  currentProviderId: string | null;
  currentModel: string | null;
  isCustom: boolean;
}

/**
 * Model preference to set
 */
export interface ModelPreference {
  providerId: string;
  model: string;
}

/**
 * Available model for selection
 */
export interface AvailableModel {
  provider: string;
  providerId: string;
  model: string;
  costPer1MTokens: number;
}

/**
 * Default agent definitions
 */
const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'bmv-team',
    name: 'BMV Team',
    description: 'Business Model Validation - analyzes and validates business models',
    category: 'core',
    defaultProvider: 'claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  {
    id: 'bmp-team',
    name: 'BMP Team',
    description: 'Business Model Planning - creates and manages business plans',
    category: 'core',
    defaultProvider: 'claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  {
    id: 'bm-brand-team',
    name: 'BM-Brand Team',
    description: 'Brand Management - handles branding and identity',
    category: 'core',
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
  },
  {
    id: 'approval-router',
    name: 'Approval Router',
    description: 'Routes approval requests based on confidence scores',
    category: 'core',
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'crm-assistant',
    name: 'CRM Assistant',
    description: 'Customer relationship management automation',
    category: 'module',
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
  },
  {
    id: 'content-generator',
    name: 'Content Generator',
    description: 'Generates marketing content and copy',
    category: 'module',
    defaultProvider: 'claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
];

/**
 * Estimated cost per 1M tokens for each model
 */
const MODEL_COSTS: Record<string, number> = {
  // Claude models
  'claude-3-5-sonnet-20241022': 15.0,
  'claude-3-5-haiku-20241022': 1.0,
  'claude-3-opus-20240229': 75.0,
  'claude-3-sonnet-20240229': 15.0,
  'claude-3-haiku-20240307': 0.25,
  // OpenAI models
  'gpt-4o': 15.0,
  'gpt-4o-mini': 0.6,
  'gpt-4-turbo': 30.0,
  'gpt-4': 60.0,
  'gpt-3.5-turbo': 2.0,
  'o1': 60.0,
  'o1-mini': 12.0,
  // DeepSeek models
  'deepseek-chat': 0.27,
  'deepseek-coder': 0.27,
};

@Injectable()
export class AgentPreferencesService {
  private readonly logger = new Logger(AgentPreferencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all agent definitions
   */
  getAgentDefinitions(): AgentDefinition[] {
    return AGENT_DEFINITIONS;
  }

  /**
   * Get agent preferences for a workspace
   */
  async getAgentPreferences(workspaceId: string): Promise<AgentPreference[]> {
    let settings: { agentModelPreferences: unknown } | null = null;

    try {
      // Get workspace settings (may not exist yet on a new workspace)
      settings = await this.prisma.workspaceSettings.findUnique({
        where: { workspaceId },
        select: { agentModelPreferences: true },
      });
    } catch (error) {
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code?: unknown }).code
          : undefined;

      // In dev environments with schema drift, workspace_settings may not exist yet.
      // Prisma throws:
      // - P2021: table does not exist
      // - P2022: column does not exist (schema drift)
      // For those specific cases,
      // fall back to defaults; for anything else, rethrow so the UI sees a real failure.
      if (errorCode === 'P2021' || errorCode === 'P2022') {
        this.logger.warn(
          `Failed to load workspace settings for agent preferences (workspaceId=${workspaceId})`,
          error instanceof Error ? error.stack : undefined,
        );
        settings = null;
      } else {
        throw error;
      }
    }

    const preferences = (settings?.agentModelPreferences as unknown as Record<
      string,
      ModelPreference
    >) || {};

    return AGENT_DEFINITIONS.map((agent) => {
      const pref = preferences[agent.id];
      return {
        agent,
        currentProviderId: pref?.providerId || null,
        currentModel: pref?.model || null,
        isCustom: !!pref,
      };
    });
  }

  /**
   * Update preference for a specific agent
   */
  async updateAgentPreference(
    workspaceId: string,
    agentId: string,
    preference: ModelPreference,
  ): Promise<AgentPreference> {
    // Verify agent exists
    const agent = AGENT_DEFINITIONS.find((a) => a.id === agentId);
    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    // Verify provider exists for workspace
    const provider = await this.prisma.aIProviderConfig.findFirst({
      where: {
        id: preference.providerId,
        workspaceId,
      },
    });

    if (!provider) {
      throw new NotFoundException(
        `Provider ${preference.providerId} not found`,
      );
    }

    // Get or create workspace settings
    let settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (!settings) {
      settings = await this.prisma.workspaceSettings.create({
        data: { workspaceId },
      });
    }

    // Update preferences
    const currentPrefs = (settings.agentModelPreferences as unknown as Record<
      string,
      ModelPreference
    >) || {};
    currentPrefs[agentId] = preference;

    await this.prisma.workspaceSettings.update({
      where: { workspaceId },
      data: { agentModelPreferences: currentPrefs as object },
    });

    this.logger.log(
      `Updated agent ${agentId} preference to ${preference.providerId}/${preference.model}`,
    );

    return {
      agent,
      currentProviderId: preference.providerId,
      currentModel: preference.model,
      isCustom: true,
    };
  }

  /**
   * Reset agent preference to default
   */
  async resetAgentPreference(
    workspaceId: string,
    agentId: string,
  ): Promise<AgentPreference> {
    // Verify agent exists
    const agent = AGENT_DEFINITIONS.find((a) => a.id === agentId);
    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    // Get workspace settings
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (settings?.agentModelPreferences) {
      const currentPrefs = settings.agentModelPreferences as unknown as Record<
        string,
        ModelPreference
      >;
      delete currentPrefs[agentId];

      await this.prisma.workspaceSettings.update({
        where: { workspaceId },
        data: { agentModelPreferences: currentPrefs as object },
      });

      this.logger.log(`Reset agent ${agentId} preference to default`);
    }

    return {
      agent,
      currentProviderId: null,
      currentModel: null,
      isCustom: false,
    };
  }

  /**
   * Get available models from configured providers
   */
  async getAvailableModels(workspaceId: string): Promise<AvailableModel[]> {
    const providers = await this.prisma.aIProviderConfig.findMany({
      where: {
        workspaceId,
        isValid: true,
      },
    });

    const models: AvailableModel[] = [];

    for (const provider of providers) {
      // Get models for each provider type
      const providerModels = this.getModelsForProvider(provider.provider);

      for (const model of providerModels) {
        models.push({
          provider: provider.provider,
          providerId: provider.id,
          model,
          costPer1MTokens: MODEL_COSTS[model] || 10.0,
        });
      }
    }

    return models;
  }

  /**
   * Get available models for a provider type
   */
  private getModelsForProvider(providerType: string): string[] {
    switch (providerType) {
      case 'claude':
        return [
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
        ];
      case 'openai':
        return [
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-4-turbo',
          'gpt-4',
          'gpt-3.5-turbo',
          'o1',
          'o1-mini',
        ];
      case 'deepseek':
        return ['deepseek-chat', 'deepseek-coder'];
      case 'openrouter':
        // OpenRouter supports many models
        return [
          'gpt-4o',
          'claude-3-5-sonnet-20241022',
          'deepseek-chat',
        ];
      default:
        return [];
    }
  }
}
