/**
 * AI Providers Service
 *
 * Business logic for managing AI provider configurations.
 * Handles CRUD operations, encryption/decryption, and validation.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { AIProviderFactory } from './ai-provider-factory.service';
import { CredentialEncryptionService } from '@hyvve/shared';
import {
  CreateProviderDto,
  UpdateProviderDto,
  ProviderResponseDto,
  TestProviderResponseDto,
  toProviderResponse,
} from './dto';

@Injectable()
export class AIProvidersService {
  private readonly logger = new Logger(AIProvidersService.name);
  private encryptionService: CredentialEncryptionService | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: AIProviderFactory,
  ) {}

  /**
   * Get or create the encryption service (lazy initialization)
   */
  private getEncryptionService(): CredentialEncryptionService {
    if (!this.encryptionService) {
      this.encryptionService = new CredentialEncryptionService();
    }
    return this.encryptionService;
  }

  /**
   * List all providers for a workspace
   */
  async findAll(workspaceId: string): Promise<ProviderResponseDto[]> {
    const providers = await this.prisma.aIProviderConfig.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' }, // Order by creation to determine default
    });

    // First valid provider is considered the default
    let defaultSet = false;
    return providers.map((provider) => {
      const isDefault = !defaultSet && provider.isValid;
      if (isDefault) defaultSet = true;
      return toProviderResponse(provider, isDefault);
    });
  }

  /**
   * Get a single provider by ID
   */
  async findOne(
    workspaceId: string,
    providerId: string,
  ): Promise<ProviderResponseDto> {
    const provider = await this.prisma.aIProviderConfig.findFirst({
      where: {
        id: providerId,
        workspaceId,
      },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${providerId} not found`);
    }

    // Check if this is the default provider (first valid one created)
    const isDefault = await this.isDefaultProvider(workspaceId, providerId);
    return toProviderResponse(provider, isDefault);
  }

  /**
   * Check if a provider is the default (first valid provider in workspace)
   */
  private async isDefaultProvider(
    workspaceId: string,
    providerId: string,
  ): Promise<boolean> {
    const firstValidProvider = await this.prisma.aIProviderConfig.findFirst({
      where: {
        workspaceId,
        isValid: true,
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    return firstValidProvider?.id === providerId;
  }

  /**
   * Create a new provider configuration
   */
  async create(
    workspaceId: string,
    dto: CreateProviderDto,
  ): Promise<ProviderResponseDto> {
    // Check if provider already exists for this workspace
    const existing = await this.prisma.aIProviderConfig.findFirst({
      where: {
        workspaceId,
        provider: dto.provider,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Provider ${dto.provider} already configured for this workspace`,
      );
    }

    // Encrypt the API key
    const apiKeyEncrypted = await this.getEncryptionService().encrypt(dto.apiKey);

    // Create the provider
    const provider = await this.prisma.aIProviderConfig.create({
      data: {
        workspaceId,
        provider: dto.provider,
        apiKeyEncrypted,
        defaultModel: dto.defaultModel,
        maxTokensPerDay: dto.maxTokensPerDay ?? 100_000,
        isValid: false, // Will be validated separately
      },
    });

    this.logger.log(
      `Created ${dto.provider} provider for workspace ${workspaceId}`,
    );

    // New provider is not valid yet, so can't be default
    return toProviderResponse(provider, false);
  }

  /**
   * Update a provider configuration
   */
  async update(
    workspaceId: string,
    providerId: string,
    dto: UpdateProviderDto,
  ): Promise<ProviderResponseDto> {
    // Verify provider exists and belongs to workspace
    const existing = await this.prisma.aIProviderConfig.findFirst({
      where: {
        id: providerId,
        workspaceId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Provider with ID ${providerId} not found`);
    }

    // Build update data
    const updateData: {
      defaultModel?: string;
      maxTokensPerDay?: number;
      apiKeyEncrypted?: string;
      isValid?: boolean;
      validationError?: string | null;
    } = {};

    if (dto.defaultModel !== undefined) {
      updateData.defaultModel = dto.defaultModel;
    }

    if (dto.maxTokensPerDay !== undefined) {
      updateData.maxTokensPerDay = dto.maxTokensPerDay;
    }

    if (dto.apiKey !== undefined) {
      // Re-encrypt the new API key
      updateData.apiKeyEncrypted = await this.getEncryptionService().encrypt(
        dto.apiKey,
      );
      // Reset validation status when key changes
      updateData.isValid = false;
      updateData.validationError = null;
    }

    const provider = await this.prisma.aIProviderConfig.update({
      where: { id: providerId },
      data: updateData,
    });

    this.logger.log(
      `Updated provider ${providerId} for workspace ${workspaceId}`,
    );

    const isDefault = await this.isDefaultProvider(workspaceId, providerId);
    return toProviderResponse(provider, isDefault);
  }

  /**
   * Delete a provider configuration
   */
  async remove(workspaceId: string, providerId: string): Promise<void> {
    // Verify provider exists and belongs to workspace
    const existing = await this.prisma.aIProviderConfig.findFirst({
      where: {
        id: providerId,
        workspaceId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Provider with ID ${providerId} not found`);
    }

    // Delete will cascade to TokenUsage records
    await this.prisma.aIProviderConfig.delete({
      where: { id: providerId },
    });

    this.logger.log(
      `Deleted provider ${providerId} from workspace ${workspaceId}`,
    );
  }

  /**
   * Test/validate a provider's API key
   */
  async testProvider(
    workspaceId: string,
    providerId: string,
  ): Promise<TestProviderResponseDto> {
    // Get provider with encrypted key
    const provider = await this.prisma.aIProviderConfig.findFirst({
      where: {
        id: providerId,
        workspaceId,
      },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${providerId} not found`);
    }

    const startTime = Date.now();

    try {
      // Create provider instance (decrypts key internally)
      const aiProvider = await this.providerFactory.create({
        id: provider.id,
        provider: provider.provider,
        apiKeyEncrypted: provider.apiKeyEncrypted,
        defaultModel: provider.defaultModel,
      });

      // Validate credentials
      const result = await aiProvider.validateCredentials();
      const latency = Date.now() - startTime;

      // Update provider validation status in database
      await this.prisma.aIProviderConfig.update({
        where: { id: providerId },
        data: {
          isValid: result.valid,
          lastValidatedAt: new Date(),
          validationError: result.error ?? null,
        },
      });

      return {
        valid: result.valid,
        error: result.error,
        latency,
        model: provider.defaultModel,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Update provider with validation failure
      await this.prisma.aIProviderConfig.update({
        where: { id: providerId },
        data: {
          isValid: false,
          lastValidatedAt: new Date(),
          validationError: errorMessage,
        },
      });

      return {
        valid: false,
        error: errorMessage,
        latency,
        model: provider.defaultModel,
      };
    }
  }

  /**
   * Get provider by type (internal use)
   * Returns the provider with decrypted key for internal operations
   */
  async getProviderInstance(workspaceId: string, providerType: string) {
    const provider = await this.prisma.aIProviderConfig.findFirst({
      where: {
        workspaceId,
        provider: providerType,
        isValid: true,
      },
    });

    if (!provider) {
      throw new NotFoundException(
        `No valid ${providerType} provider configured for this workspace`,
      );
    }

    return await this.providerFactory.create({
      id: provider.id,
      provider: provider.provider,
      apiKeyEncrypted: provider.apiKeyEncrypted,
      defaultModel: provider.defaultModel,
    });
  }

  /**
   * Get decrypted API key for a provider
   *
   * @param workspaceId Workspace ID
   * @param providerId Provider ID
   * @returns Decrypted API key or null if not found
   */
  async getDecryptedApiKey(
    workspaceId: string,
    providerId: string,
  ): Promise<string | null> {
    const provider = await this.prisma.aIProviderConfig.findFirst({
      where: {
        id: providerId,
        workspaceId,
      },
      select: {
        apiKeyEncrypted: true,
      },
    });

    if (!provider || !provider.apiKeyEncrypted) {
      return null;
    }

    try {
      const encryption = this.getEncryptionService();
      return await encryption.decrypt(provider.apiKeyEncrypted);
    } catch (error) {
      this.logger.error(`Failed to decrypt API key: ${error}`);
      return null;
    }
  }
}
