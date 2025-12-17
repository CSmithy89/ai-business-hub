import { Module } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { EventsModule } from '../events/events.module'
import { ProjectsModule } from './projects/projects.module'

@Module({
  imports: [CommonModule, EventsModule, ProjectsModule],
})
export class PmModule {}

