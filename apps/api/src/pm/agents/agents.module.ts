import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { BriefingService } from './briefing.service';
import { SuggestionService } from './suggestion.service';
import { EstimationService } from './estimation.service';
import { TimeTrackingService } from './time-tracking.service';
import { CommonModule } from '../../common/common.module';
import { AgentOSModule } from '../../agentos/agentos.module';

@Module({
  // ScheduleModule is registered globally in AppModule
  imports: [CommonModule, AgentOSModule, HttpModule],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    BriefingService,
    SuggestionService,
    EstimationService,
    TimeTrackingService,
  ],
  exports: [
    AgentsService,
    BriefingService,
    SuggestionService,
    EstimationService,
    TimeTrackingService,
  ],
})
export class AgentsModule {}
