import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { BriefingService } from './briefing.service';
import { SuggestionService } from './suggestion.service';
import { EstimationService } from './estimation.service';
import { TimeTrackingService } from './time-tracking.service';
import { PhaseService } from './phase.service';
import { CheckpointService } from './checkpoint.service';
import { CheckpointReminderCron } from './checkpoint.cron';
import { CommonModule } from '../../common/common.module';
import { AgentOSModule } from '../../agentos/agentos.module';
import { EventsModule } from '../../events/events.module';

@Module({
  // ScheduleModule is registered globally in AppModule
  imports: [CommonModule, AgentOSModule, EventsModule, HttpModule],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    BriefingService,
    SuggestionService,
    EstimationService,
    TimeTrackingService,
    PhaseService,
    CheckpointService,
    CheckpointReminderCron,
  ],
  exports: [
    AgentsService,
    BriefingService,
    SuggestionService,
    EstimationService,
    TimeTrackingService,
    PhaseService,
    CheckpointService,
  ],
})
export class AgentsModule {}
