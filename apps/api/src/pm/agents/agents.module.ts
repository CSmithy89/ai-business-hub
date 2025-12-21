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
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { HealthCheckCron } from './health.cron';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ScheduledReportService } from './scheduled-report.service';
import { ScheduledReportController } from './scheduled-report.controller';
import { ScheduledReportCron } from './scheduled-report.cron';
import { CommonModule } from '../../common/common.module';
import { AgentOSModule } from '../../agentos/agentos.module';
import { EventsModule } from '../../events/events.module';

@Module({
  // ScheduleModule is registered globally in AppModule
  imports: [CommonModule, AgentOSModule, EventsModule, HttpModule],
  controllers: [
    AgentsController,
    HealthController,
    ReportController,
    ScheduledReportController,
  ],
  providers: [
    AgentsService,
    BriefingService,
    SuggestionService,
    EstimationService,
    TimeTrackingService,
    PhaseService,
    CheckpointService,
    CheckpointReminderCron,
    HealthService,
    HealthCheckCron,
    ReportService,
    ScheduledReportService,
    ScheduledReportCron,
  ],
  exports: [
    AgentsService,
    BriefingService,
    SuggestionService,
    EstimationService,
    TimeTrackingService,
    PhaseService,
    CheckpointService,
    HealthService,
    ReportService,
    ScheduledReportService,
  ],
})
export class AgentsModule {}
