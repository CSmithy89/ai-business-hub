import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { BullModule } from '@nestjs/bullmq'
import { ProjectsModule } from '../projects/projects.module'
import { PhasesModule } from '../phases/phases.module'
import { TasksModule } from '../tasks/tasks.module'
import { SavedViewsModule } from '../saved-views/saved-views.module'
import { WebhooksModule } from '@/settings/webhooks/webhooks.module'
import { CommonModule } from '@/common/common.module'
import { RateLimitService } from '@/common/services/rate-limit.service'
import { RateLimitInterceptor } from '@/common/interceptors/rate-limit.interceptor'
import { ProjectsApiController } from './projects-api.controller'
import { PhasesApiController } from './phases-api.controller'
import { TasksApiController } from './tasks-api.controller'
import { ViewsApiController } from './views-api.controller'
import { SearchApiController } from './search-api.controller'
import { WebhooksApiController } from './webhooks-api.controller'

/**
 * API Module - External REST API for PM operations
 *
 * This module provides versioned REST API endpoints for external integrations.
 * All endpoints are prefixed with /api/v1/pm/*
 *
 * Controllers in this module:
 * - ProjectsApiController: Projects CRUD
 * - PhasesApiController: Phases CRUD with nested routes
 * - TasksApiController: Tasks CRUD with assign/transition actions
 * - ViewsApiController: Saved views CRUD
 * - SearchApiController: Full-text search
 * - WebhooksApiController: Webhooks CRUD
 *
 * Security:
 * - ApiKeyGuard: Validates API keys (applied per controller)
 * - ScopeGuard: Validates API scopes (applied per controller)
 * - RateLimitGuard: Enforces rate limits (applied per controller, AFTER ApiKeyGuard)
 * - RateLimitInterceptor: Adds rate limit headers (applied globally in this module)
 */
@Module({
  imports: [
    ProjectsModule,
    PhasesModule,
    TasksModule,
    SavedViewsModule,
    WebhooksModule,
    CommonModule,
    BullModule.registerQueue({ name: 'event-retry' }),
  ],
  controllers: [
    ProjectsApiController,
    PhasesApiController,
    TasksApiController,
    ViewsApiController,
    SearchApiController,
    WebhooksApiController,
  ],
  providers: [
    RateLimitService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
  ],
})
export class ApiModule {}
