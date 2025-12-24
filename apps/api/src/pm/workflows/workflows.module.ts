import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkflowsController, WorkflowExecutionsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowExecutorService } from './workflow-executor.service';
import { WorkflowSchedulerService } from './workflow-scheduler.service';
import { ActionExecutorService } from './action-executor.service';
import { PrismaService } from '../../common/services/prisma.service';
import { EventsModule } from '../../events';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
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
    PrismaService,
  ],
  exports: [WorkflowsService, WorkflowExecutorService],
})
export class WorkflowsModule {}
