/**
 * Dashboard State Controller
 *
 * REST API endpoints for dashboard state persistence.
 * Provides save/get/delete operations for Redis-backed state.
 *
 * All endpoints:
 * - Require authentication (AuthGuard)
 * - Are scoped to user + workspace (TenantGuard)
 * - Are accessible to all workspace members
 *
 * Security: Multi-Tenant Isolation
 * - TenantGuard verifies user is a member of the workspace by querying
 *   WorkspaceMember table for the user+workspaceId combination
 * - Dashboard state is keyed by userId:workspaceId, so users can only
 *   access their own state within workspaces they belong to
 * - Workspace switching requires re-authentication via TenantGuard
 *
 * Story: DM-11.1 - Redis State Persistence
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardStateService } from './dashboard-state.service';
import {
  SaveDashboardStateDto,
  SaveStateResponseDto,
  GetStateResponseDto,
  DeleteStateResponseDto,
} from './dto/dashboard-state.dto';

/**
 * User object from request (attached by AuthGuard)
 */
interface RequestUser {
  id: string;
  email: string;
  [key: string]: unknown;
}

@Controller('dashboard/state')
@UseGuards(AuthGuard, TenantGuard)
export class DashboardStateController {
  constructor(private readonly dashboardStateService: DashboardStateService) {}

  /**
   * POST /api/dashboard/state
   *
   * Save dashboard state to Redis.
   * Handles conflict resolution if server has newer version.
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @param user - Current user from AuthGuard
   * @param dto - State data to save
   * @returns Save result with conflict resolution info
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async saveState(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: SaveDashboardStateDto,
  ): Promise<SaveStateResponseDto> {
    return this.dashboardStateService.saveState(user.id, workspaceId, dto);
  }

  /**
   * GET /api/dashboard/state
   *
   * Retrieve dashboard state from Redis.
   * Returns 404 if no state exists (first-time user).
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @param user - Current user from AuthGuard
   * @returns State data with version and lastModified
   */
  @Get()
  async getState(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<GetStateResponseDto> {
    const state = await this.dashboardStateService.getState(
      user.id,
      workspaceId,
    );

    if (!state) {
      throw new NotFoundException('Dashboard state not found');
    }

    return state;
  }

  /**
   * DELETE /api/dashboard/state
   *
   * Delete dashboard state from Redis.
   * Used to reset state or for cleanup.
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @param user - Current user from AuthGuard
   * @returns Success status
   */
  @Delete()
  async deleteState(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<DeleteStateResponseDto> {
    return this.dashboardStateService.deleteState(user.id, workspaceId);
  }
}
