import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { BriefingService } from './briefing.service';
import { SuggestionService } from './suggestion.service';
import { CommonModule } from '../../common/common.module';
import { AgentOSModule } from '../../agentos/agentos.module';

@Module({
  imports: [CommonModule, AgentOSModule, HttpModule, ScheduleModule.forRoot()],
  controllers: [AgentsController],
  providers: [AgentsService, BriefingService, SuggestionService],
  exports: [AgentsService, BriefingService, SuggestionService],
})
export class AgentsModule {}
