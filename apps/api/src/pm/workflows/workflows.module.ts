import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowExecutorService } from './workflow-executor.service';
import { WorkflowSchedulerService } from './workflow-scheduler.service';
import { PrismaService } from '../../common/services/prisma.service';
import { EventsModule } from '../../events';

@Module({
  imports: [
    EventsModule,
    BullModule.registerQueue({
      name: 'workflow-scheduler',
    }),
  ],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    WorkflowExecutorService,
    WorkflowSchedulerService,
    PrismaService,
  ],
  exports: [WorkflowsService, WorkflowExecutorService],
})
export class WorkflowsModule {}
