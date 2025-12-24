import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkflowsController, WorkflowExecutionsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowExecutorService } from './workflow-executor.service';
import { WorkflowSchedulerService } from './workflow-scheduler.service';
import { ActionExecutorService } from './action-executor.service';
import { RedisLockService } from './utils/redis-lock.service';
import { CommonModule } from '../../common/common.module';
import { EventsModule } from '../../events';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    CommonModule,
    EventsModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'workflow-scheduler',
    }),
  ],
  controllers: [WorkflowsController, WorkflowExecutionsController],
  providers: [
    WorkflowsService,
    WorkflowExecutorService,
    WorkflowSchedulerService,
    ActionExecutorService,
    RedisLockService,
  ],
  exports: [WorkflowsService, WorkflowExecutorService],
})
export class WorkflowsModule {}
