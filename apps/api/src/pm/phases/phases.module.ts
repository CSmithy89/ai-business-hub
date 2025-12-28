import { Module, forwardRef } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { EventsModule } from '../../events/events.module'
import { AgentsModule } from '../agents/agents.module'
import { PhasesController } from './phases.controller'
import { PhasesService } from './phases.service'

@Module({
  imports: [CommonModule, EventsModule, forwardRef(() => AgentsModule)],
  controllers: [PhasesController],
  providers: [PhasesService],
  exports: [PhasesService],
})
export class PhasesModule {}

