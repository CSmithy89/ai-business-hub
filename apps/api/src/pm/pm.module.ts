import { Module } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { EventsModule } from '../events/events.module'
import { ProjectsModule } from './projects/projects.module'
import { PhasesModule } from './phases/phases.module'
import { TeamModule } from './team/team.module'

@Module({
  imports: [CommonModule, EventsModule, ProjectsModule, PhasesModule, TeamModule],
})
export class PmModule {}
