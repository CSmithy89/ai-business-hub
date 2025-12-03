/**
 * AI Providers Controller
 *
 * REST API endpoints for managing AI provider configurations.
 * All endpoints require Owner or Admin role.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentWorkspace } from '../common/decorators/current-workspace.decorator';
import { AIProvidersService } from './ai-providers.service';
import { TokenUsageService, UsageStats, DailyUsage, AgentUsage } from './token-usage.service';
import {
  CreateProviderDto,
  createProviderSchema,
  UpdateProviderDto,
  updateProviderSchema,
  ProviderResponseDto,
  TestProviderResponseDto,
} from './dto';

/**
 * Controller for AI provider configuration management
 *
 * Endpoints:
 * - GET /workspaces/:workspaceId/ai-providers - List all providers
 * - POST /workspaces/:workspaceId/ai-providers - Create provider
 * - GET /workspaces/:workspaceId/ai-providers/usage - Get usage stats
 * - GET /workspaces/:workspaceId/ai-providers/usage/daily - Get daily usage
 * - GET /workspaces/:workspaceId/ai-providers/usage/by-agent - Get usage by agent
 * - GET /workspaces/:workspaceId/ai-providers/:providerId - Get provider
 * - PATCH /workspaces/:workspaceId/ai-providers/:providerId - Update provider
 * - DELETE /workspaces/:workspaceId/ai-providers/:providerId - Delete provider
 * - POST /workspaces/:workspaceId/ai-providers/:providerId/test - Test provider
 */
@ApiTags('AI Providers')
@Controller('workspaces/:workspaceId/ai-providers')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AIProvidersController {
  private readonly logger = new Logger(AIProvidersController.name);

  constructor(
    private readonly providersService: AIProvidersService,
    private readonly tokenUsageService: TokenUsageService,
  ) {}

  /**
   * List all AI providers for a workspace
   */
  @Get()
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'List all AI providers for workspace' })
  @ApiResponse({
    status: 200,
    description: 'List of AI providers',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async findAll(
    @CurrentWorkspace() workspace: { id: string },
  ): Promise<{ data: ProviderResponseDto[] }> {
    const providers = await this.providersService.findAll(workspace.id);
    return { data: providers };
  }

  /**
   * Create a new AI provider configuration
   */
  @Post()
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Add a new AI provider' })
  @ApiResponse({
    status: 201,
    description: 'Provider created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 409,
    description: 'Provider already exists',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async create(
    @CurrentWorkspace() workspace: { id: string },
    @Body() body: unknown,
  ): Promise<{ data: ProviderResponseDto }> {
    // Validate request body
    const result = createProviderSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }

    const dto: CreateProviderDto = result.data;
    const provider = await this.providersService.create(workspace.id, dto);

    this.logger.log(
      `Created ${dto.provider} provider for workspace ${workspace.id}`,
    );

    return { data: provider };
  }

  /**
   * Get token usage statistics for workspace
   */
  @Get('usage')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get token usage statistics' })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  async getUsage(
    @CurrentWorkspace() workspace: { id: string },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ data: UsageStats }> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const stats = await this.tokenUsageService.getWorkspaceUsage(
      workspace.id,
      start,
      end,
    );

    return { data: stats };
  }

  /**
   * Get daily token usage breakdown
   */
  @Get('usage/daily')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Get daily token usage breakdown' })
  @ApiResponse({
    status: 200,
    description: 'Daily usage breakdown',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default: 30)' })
  async getDailyUsage(
    @CurrentWorkspace() workspace: { id: string },
    @Query('days') days?: string,
  ): Promise<{ data: DailyUsage[] }> {
    const numDays = days ? parseInt(days, 10) : 30;
    const usage = await this.tokenUsageService.getDailyUsage(workspace.id, numDays);
    return { data: usage };
  }

  /**
   * Get token usage breakdown by agent
   */
  @Get('usage/by-agent')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Get token usage by agent' })
  @ApiResponse({
    status: 200,
    description: 'Usage breakdown by agent',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getUsageByAgent(
    @CurrentWorkspace() workspace: { id: string },
  ): Promise<{ data: AgentUsage[] }> {
    const usage = await this.tokenUsageService.getUsageByAgent(workspace.id);
    return { data: usage };
  }

  /**
   * Get a specific AI provider configuration
   */
  @Get(':providerId')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Get AI provider details' })
  @ApiResponse({
    status: 200,
    description: 'Provider details',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  async findOne(
    @CurrentWorkspace() workspace: { id: string },
    @Param('providerId') providerId: string,
  ): Promise<{ data: ProviderResponseDto }> {
    const provider = await this.providersService.findOne(
      workspace.id,
      providerId,
    );
    return { data: provider };
  }

  /**
   * Update an AI provider configuration
   */
  @Patch(':providerId')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update AI provider configuration' })
  @ApiResponse({
    status: 200,
    description: 'Provider updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  async update(
    @CurrentWorkspace() workspace: { id: string },
    @Param('providerId') providerId: string,
    @Body() body: unknown,
  ): Promise<{ data: ProviderResponseDto }> {
    // Validate request body
    const result = updateProviderSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }

    const dto: UpdateProviderDto = result.data;
    const provider = await this.providersService.update(
      workspace.id,
      providerId,
      dto,
    );

    this.logger.log(`Updated provider ${providerId}`);

    return { data: provider };
  }

  /**
   * Delete an AI provider configuration
   */
  @Delete(':providerId')
  @Roles('owner', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove AI provider' })
  @ApiResponse({
    status: 204,
    description: 'Provider deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  async remove(
    @CurrentWorkspace() workspace: { id: string },
    @Param('providerId') providerId: string,
  ): Promise<void> {
    await this.providersService.remove(workspace.id, providerId);
    this.logger.log(`Deleted provider ${providerId}`);
  }

  /**
   * Test/validate an AI provider's API key
   */
  @Post(':providerId/test')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Test AI provider API key' })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  async testProvider(
    @CurrentWorkspace() workspace: { id: string },
    @Param('providerId') providerId: string,
  ): Promise<TestProviderResponseDto> {
    const result = await this.providersService.testProvider(
      workspace.id,
      providerId,
    );

    this.logger.log(
      `Tested provider ${providerId}: valid=${result.valid}, latency=${result.latency}ms`,
    );

    return result;
  }
}
