import { Module } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { EventsModule } from '../events/events.module'
import { ProjectsModule } from './projects/projects.module'
import { PhasesModule } from './phases/phases.module'
import { TeamModule } from './team/team.module'
import { ExpensesModule } from './expenses/expenses.module'
import { TasksModule } from './tasks/tasks.module'
import { ImportsModule } from './imports/imports.module'
import { ExportsModule } from './exports/exports.module'
import { IntegrationsModule } from './integrations/integrations.module'
import { AgentsModule } from './agents/agents.module'
import { SavedViewsModule } from './saved-views/saved-views.module'
import { PresenceModule } from './presence/presence.module'
import { NotificationsModule } from './notifications/notifications.module'
import { PortfolioModule } from './portfolio/portfolio.module'
import { DependenciesModule } from './dependencies/dependencies.module'
import { WorkflowsModule } from './workflows/workflows.module'

@Module({
  imports: [
    CommonModule,
    EventsModule,
    ProjectsModule,
    PhasesModule,
    TeamModule,
    ExpensesModule,
    TasksModule,
    ImportsModule,
    ExportsModule,
    IntegrationsModule,
    AgentsModule,
    SavedViewsModule,
    PresenceModule,
    NotificationsModule,
    PortfolioModule,
    DependenciesModule,
    WorkflowsModule,
  ],
})
export class PmModule {}
