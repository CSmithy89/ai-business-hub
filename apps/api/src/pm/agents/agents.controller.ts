import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentWorkspace } from '@/common/decorators/current-workspace.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AgentsService } from './agents.service';
import { BriefingService } from './briefing.service';
import { SuggestionService } from './suggestion.service';
import { ChatAgentDto, GetConversationsDto } from './dto/chat-agent.dto';
import {
  UpdateBriefingPreferencesDto,
  BriefingPreferencesResponseDto,
  DailyBriefingResponseDto,
} from './dto/briefing.dto';
import {
  GetSuggestionsDto,
  AcceptSuggestionDto,
  RejectSuggestionDto,
  SnoozeSuggestionDto,
  SuggestionResponseDto,
} from './dto/suggestion.dto';

@ApiTags('PM Agents')
@Controller('pm/agents')
@UseGuards(AuthGuard, TenantGuard)
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly briefingService: BriefingService,
    private readonly suggestionService: SuggestionService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send message to an agent' })
  @ApiResponse({
    status: 200,
    description: 'Agent response received',
    schema: {
      properties: {
        conversationId: { type: 'string' },
        response: { type: 'string' },
        metadata: { type: 'object' },
      },
    },
  })
  async chat(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() body: ChatAgentDto,
  ) {
    return this.agentsService.chat({
      workspaceId,
      userId,
      projectId: body.projectId,
      agentName: body.agentName,
      message: body.message,
    });
  }

  @Get('conversations/:projectId')
  @ApiOperation({ summary: 'Get conversation history for a project' })
  @ApiResponse({
    status: 200,
    description: 'Conversation history retrieved',
  })
  async getConversations(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @Query() query: GetConversationsDto,
  ) {
    return this.agentsService.getConversations({
      workspaceId,
      projectId,
      agentName: query.agentName,
      limit: query.limit,
    });
  }

  // ============================================
  // Daily Briefing Endpoints (PM-04-2)
  // ============================================

  @Post('briefing/generate')
  @ApiOperation({ summary: 'Generate daily briefing manually' })
  @ApiResponse({
    status: 200,
    description: 'Daily briefing generated',
    type: DailyBriefingResponseDto,
  })
  async generateBriefing(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.briefingService.generateBriefing(userId, workspaceId);
  }

  @Get('briefing/preferences')
  @ApiOperation({ summary: 'Get briefing preferences' })
  @ApiResponse({
    status: 200,
    description: 'Briefing preferences retrieved',
    type: BriefingPreferencesResponseDto,
  })
  async getBriefingPreferences(@CurrentUser('id') userId: string) {
    return this.briefingService.getPreferences(userId);
  }

  @Patch('briefing/preferences')
  @ApiOperation({ summary: 'Update briefing preferences' })
  @ApiResponse({
    status: 200,
    description: 'Briefing preferences updated',
    type: BriefingPreferencesResponseDto,
  })
  async updateBriefingPreferences(
    @CurrentUser('id') userId: string,
    @Body() body: UpdateBriefingPreferencesDto,
  ) {
    return this.briefingService.updatePreferences(userId, body);
  }

  // ============================================
  // Suggestion Endpoints (PM-04-3)
  // ============================================

  @Get('suggestions')
  @ApiOperation({ summary: 'Get pending suggestions for user' })
  @ApiResponse({
    status: 200,
    description: 'List of suggestions retrieved',
    type: [SuggestionResponseDto],
  })
  async getSuggestions(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Query() query: GetSuggestionsDto,
  ) {
    return this.suggestionService.getSuggestions({
      workspaceId,
      projectId: query.projectId,
      userId: query.userId || userId,
      agentName: query.agentName,
      status: query.status,
      limit: query.limit,
    });
  }

  @Post('suggestions/:id/accept')
  @ApiOperation({ summary: 'Accept and execute suggestion' })
  @ApiResponse({
    status: 200,
    description: 'Suggestion accepted and executed',
    schema: {
      properties: {
        success: { type: 'boolean' },
        result: { type: 'object' },
      },
    },
  })
  async acceptSuggestion(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') suggestionId: string,
    @Body() body: AcceptSuggestionDto,
  ) {
    return this.suggestionService.acceptSuggestion(
      suggestionId,
      workspaceId,
      userId,
      body.modifications,
    );
  }

  @Post('suggestions/:id/reject')
  @ApiOperation({ summary: 'Reject suggestion with optional reason' })
  @ApiResponse({
    status: 200,
    description: 'Suggestion rejected',
    schema: {
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  async rejectSuggestion(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') suggestionId: string,
    @Body() body: RejectSuggestionDto,
  ) {
    return this.suggestionService.rejectSuggestion(
      suggestionId,
      workspaceId,
      userId,
      body.reason,
    );
  }

  @Post('suggestions/:id/snooze')
  @ApiOperation({ summary: 'Snooze suggestion for specified hours' })
  @ApiResponse({
    status: 200,
    description: 'Suggestion snoozed',
    schema: {
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  async snoozeSuggestion(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') suggestionId: string,
    @Body() body: SnoozeSuggestionDto,
  ) {
    return this.suggestionService.snoozeSuggestion(
      suggestionId,
      workspaceId,
      userId,
      body.hours,
    );
  }

  @Delete('suggestions/:id')
  @ApiOperation({ summary: 'Dismiss suggestion permanently' })
  @ApiResponse({
    status: 200,
    description: 'Suggestion dismissed',
    schema: {
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  async dismissSuggestion(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') suggestionId: string,
  ) {
    return this.suggestionService.rejectSuggestion(
      suggestionId,
      workspaceId,
      userId,
      'Dismissed by user',
    );
  }
}
