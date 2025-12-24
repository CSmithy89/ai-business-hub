import { Module } from '@nestjs/common'
import { ProjectsModule } from '../projects/projects.module'
import { PhasesModule } from '../phases/phases.module'
import { TasksModule } from '../tasks/tasks.module'
import { SavedViewsModule } from '../saved-views/saved-views.module'
import { ProjectsApiController } from './projects-api.controller'
import { PhasesApiController } from './phases-api.controller'
import { TasksApiController } from './tasks-api.controller'
import { ViewsApiController } from './views-api.controller'
import { SearchApiController } from './search-api.controller'

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
 *
 * Note: Authentication guards (ApiKeyGuard, ScopeGuard, RateLimitGuard)
 * will be added in PM-11.2. For now, controllers are scaffolded without auth.
 */
@Module({
  imports: [ProjectsModule, PhasesModule, TasksModule, SavedViewsModule],
  controllers: [
    ProjectsApiController,
    PhasesApiController,
    TasksApiController,
    ViewsApiController,
    SearchApiController,
  ],
})
export class ApiModule {}
