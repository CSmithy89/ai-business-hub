import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { EventsModule } from '../../events/events.module'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

@Module({
  imports: [CommonModule, EventsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
