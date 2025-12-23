import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../events';

@Module({
  controllers: [WorkflowsController],
  providers: [WorkflowsService, PrismaService, EventPublisherService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
