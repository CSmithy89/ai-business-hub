import { Module } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { EventsModule } from '../events/events.module'
import { ProjectsModule } from './projects/projects.module'
import { PhasesModule } from './phases/phases.module'

@Module({
  imports: [CommonModule, EventsModule, ProjectsModule, PhasesModule],
})
export class PmModule {}
