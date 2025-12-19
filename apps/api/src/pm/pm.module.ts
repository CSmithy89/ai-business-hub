import { Module } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { EventsModule } from '../events/events.module'
import { ProjectsModule } from './projects/projects.module'
import { PhasesModule } from './phases/phases.module'
import { TeamModule } from './team/team.module'
import { ExpensesModule } from './expenses/expenses.module'
import { TasksModule } from './tasks/tasks.module'
import { AgentsModule } from './agents/agents.module'
import { SavedViewsModule } from './saved-views/saved-views.module'
import { PresenceModule } from './presence/presence.module'

@Module({
  imports: [
    CommonModule,
    EventsModule,
    ProjectsModule,
    PhasesModule,
    TeamModule,
    ExpensesModule,
    TasksModule,
    AgentsModule,
    SavedViewsModule,
    PresenceModule,
  ],
})
export class PmModule {}
