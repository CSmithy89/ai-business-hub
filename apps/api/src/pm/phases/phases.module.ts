import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { EventsModule } from '../../events/events.module'
import { PhasesController } from './phases.controller'
import { PhasesService } from './phases.service'

@Module({
  imports: [CommonModule, EventsModule],
  controllers: [PhasesController],
  providers: [PhasesService],
  exports: [PhasesService],
})
export class PhasesModule {}

