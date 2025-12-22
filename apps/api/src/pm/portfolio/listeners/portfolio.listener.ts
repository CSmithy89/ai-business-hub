import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { EventTypes } from '@hyvve/shared'
import { PortfolioService } from '../portfolio.service'

@Injectable()
export class PortfolioListener {
  private readonly logger = new Logger(PortfolioListener.name)

  constructor(private readonly portfolioService: PortfolioService) {}

  @OnEvent(EventTypes.PM_TASK_CREATED)
  @OnEvent(EventTypes.PM_TASK_UPDATED)
  @OnEvent(EventTypes.PM_TASK_DELETED)
  @OnEvent(EventTypes.PM_TASK_STATUS_CHANGED)
  async handleTaskEvents(payload: { id?: string; projectId?: string; workspaceId?: string }, meta?: { tenantId?: string }) {
    // Determine workspaceId: payload.workspaceId or meta.tenantId
    const workspaceId = payload.workspaceId ?? meta?.tenantId

    if (workspaceId) {
      this.logger.debug(`Invalidating portfolio cache for workspace ${workspaceId} due to task event`)
      await this.portfolioService.invalidateCache(workspaceId)
    }
  }

  @OnEvent(EventTypes.PM_PROJECT_CREATED)
  @OnEvent(EventTypes.PM_PROJECT_UPDATED)
  @OnEvent(EventTypes.PM_PROJECT_DELETED)
  async handleProjectEvents(payload: { id?: string; workspaceId?: string }, meta?: { tenantId?: string }) {
    const workspaceId = payload.workspaceId ?? meta?.tenantId

    if (workspaceId) {
      this.logger.debug(`Invalidating portfolio cache for workspace ${workspaceId} due to project event`)
      await this.portfolioService.invalidateCache(workspaceId)
    }
  }
}
