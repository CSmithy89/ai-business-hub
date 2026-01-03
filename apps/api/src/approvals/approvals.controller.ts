import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentWorkspace } from '../common/decorators/current-workspace.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApprovalsService } from './approvals.service';
import { ApprovalQueryDto } from './dto/approval-query.dto';
import { ApproveItemDto } from './dto/approve-item.dto';
import { RejectItemDto } from './dto/reject-item.dto';
import { BulkApprovalDto } from './dto/bulk-approval.dto';
import { CancelApprovalDto } from './dto/cancel-approval.dto';
import { UpdateEscalationConfigDto } from './dto/escalation-config.dto';

/**
 * ApprovalsController - REST API for approval queue management
 *
 * Provides endpoints for:
 * - Listing approvals with filtering and pagination
 * - Retrieving single approval details
 * - Approving/rejecting approval items
 * - Bulk approve/reject operations
 *
 * Security:
 * - All endpoints protected by AuthGuard (JWT authentication)
 * - All endpoints protected by TenantGuard (workspace membership)
 * - Approve/reject endpoints restricted to admin/owner roles
 * - List/get endpoints accessible to all workspace members
 */
@Controller('approvals')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  /**
   * GET /api/approvals/escalation-config
   *
   * Get escalation configuration for the workspace.
   * Accessible to admin and owner roles.
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @returns Escalation configuration
   */
  @Get('escalation-config')
  @Roles('owner', 'admin')
  async getEscalationConfig(@CurrentWorkspace() workspaceId: string) {
    return this.approvalsService.getEscalationConfig(workspaceId);
  }

  /**
   * PUT /api/approvals/escalation-config
   *
   * Update escalation configuration for the workspace.
   * Restricted to owner role only.
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @param dto - Updated escalation configuration
   * @returns Updated escalation configuration
   */
  @Put('escalation-config')
  @Roles('owner')
  async updateEscalationConfig(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: UpdateEscalationConfigDto,
  ) {
    return this.approvalsService.updateEscalationConfig(workspaceId, dto);
  }

  /**
   * GET /api/approvals
   *
   * List approvals with filtering, sorting, and pagination.
   * Accessible to all workspace members.
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @param query - Query parameters (filters, sorting, pagination)
   * @returns Paginated list of approval items
   */
  @Get()
  @Roles('owner', 'admin', 'member')
  async listApprovals(
    @CurrentWorkspace() workspaceId: string,
    @Query() query: ApprovalQueryDto,
  ) {
    return this.approvalsService.findAll(workspaceId, query);
  }

  /**
   * GET /api/approvals/:id
   *
   * Get full approval details including AI reasoning.
   * Accessible to all workspace members.
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @param id - Approval item ID
   * @returns Full approval item with related entities
   */
  @Get(':id')
  @Roles('owner', 'admin', 'member')
  async getApproval(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.approvalsService.findOne(workspaceId, id);
  }

  /**
   * POST /api/approvals/:id/approve
   *
   * Approve an approval item with optional notes.
   * Restricted to admin and owner roles.
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @param id - Approval item ID
   * @param dto - Approval notes
   * @param user - Current user from AuthGuard
   * @returns Updated approval item
   */
  @Post(':id/approve')
  @Roles('owner', 'admin')
  async approveItem(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: ApproveItemDto,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.approve(workspaceId, id, user.id, dto);
  }

  /**
   * POST /api/approvals/:id/reject
   *
   * Reject an approval item with required reason.
   * Restricted to admin and owner roles.
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @param id - Approval item ID
   * @param dto - Rejection reason and notes
   * @param user - Current user from AuthGuard
   * @returns Updated approval item
   */
  @Post(':id/reject')
  @Roles('owner', 'admin')
  async rejectItem(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: RejectItemDto,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.reject(workspaceId, id, user.id, dto);
  }

  /**
   * POST /api/approvals/bulk
   *
   * Bulk approve or reject multiple approval items.
   * Handles partial failures gracefully.
   * Restricted to admin and owner roles.
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @param dto - Bulk action parameters
   * @param user - Current user from AuthGuard
   * @returns Summary of successes and failures
   */
  @Post('bulk')
  @Roles('owner', 'admin')
  async bulkAction(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: BulkApprovalDto,
    @CurrentUser() user: any,
  ) {
    return this.approvalsService.bulkAction(workspaceId, user.id, dto);
  }

  /**
   * DELETE /api/approvals/:id
   *
   * Cancel a pending approval item.
   * Only the user who created the approval or admins/owners can cancel.
   *
   * @param workspaceId - Workspace ID from TenantGuard
   * @param id - Approval item ID
   * @param dto - Optional cancellation reason
   * @param user - Current user from AuthGuard
   * @returns Success response with cancellation timestamp
   */
  @Delete(':id')
  @Roles('owner', 'admin', 'member')
  async cancelApproval(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: CancelApprovalDto,
    @CurrentUser() user: { id: string; email: string },
    @Req() req: Request,
  ) {
    // Check if user has admin/owner role for permission bypass
    // Use memberRole from request (set by TenantGuard) not user.role
    const memberRole = (req as unknown as { memberRole?: string }).memberRole;
    const isAdmin = memberRole === 'admin' || memberRole === 'owner';
    return this.approvalsService.cancel(workspaceId, id, user.id, dto, isAdmin);
  }
}
