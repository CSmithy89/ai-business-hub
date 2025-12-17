import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { EventsModule } from '../../events/events.module'
import { ProjectsModule } from '../projects/projects.module'
import { TeamController } from './team.controller'
import { TeamService } from './team.service'

@Module({
  imports: [CommonModule, EventsModule, ProjectsModule],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}

