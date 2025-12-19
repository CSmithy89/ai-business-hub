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
import { EstimationService } from './estimation.service';
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
    private readonly estimationService: EstimationService,
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

  @Get('commands')
  @ApiOperation({ summary: 'Get available slash commands' })
  @ApiResponse({
    status: 200,
    description: 'List of available slash commands',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
      example: {
        'create-task': 'Create a new task',
        'assign': 'Assign a task to a team member',
        'set-priority': 'Set priority for a task',
        'move-phase': 'Move task to a different phase',
        'help': 'Show available commands',
      },
    },
  })
  async getCommands() {
    return this.agentsService.getAvailableCommands();
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

  // ============================================
  // Estimation Endpoints (PM-04-5)
  // ============================================

  @Post('estimation/estimate')
  @ApiOperation({ summary: 'Get task estimation from Sage agent' })
  @ApiResponse({
    status: 200,
    description: 'Task estimate generated',
    schema: {
      properties: {
        storyPoints: { type: 'number' },
        estimatedHours: { type: 'number' },
        confidenceLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        confidenceScore: { type: 'number' },
        basis: { type: 'string' },
        coldStart: { type: 'boolean' },
        similarTasks: { type: 'array', items: { type: 'string' } },
        complexityFactors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async estimateTask(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      title: string;
      description?: string;
      type: string;
      projectId: string;
    },
  ) {
    return this.estimationService.estimateTask(workspaceId, userId, {
      title: body.title,
      description: body.description,
      type: body.type as any,
      projectId: body.projectId,
    });
  }

  @Post('estimation/similar')
  @ApiOperation({ summary: 'Find similar completed tasks' })
  @ApiResponse({
    status: 200,
    description: 'Similar tasks retrieved',
    schema: {
      type: 'array',
      items: {
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          type: { type: 'string' },
          storyPoints: { type: 'number' },
          estimatedHours: { type: 'number' },
          actualHours: { type: 'number' },
        },
      },
    },
  })
  async findSimilarTasks(
    @CurrentWorkspace() workspaceId: string,
    @Body()
    body: {
      projectId: string;
      taskType: string;
      query: string;
      limit?: number;
    },
  ) {
    return this.estimationService.findSimilarTasks(
      workspaceId,
      body.projectId,
      body.taskType as any,
      body.query,
      body.limit,
    );
  }

  @Get('estimation/velocity/:projectId')
  @ApiOperation({ summary: 'Calculate team velocity' })
  @ApiResponse({
    status: 200,
    description: 'Team velocity calculated',
    schema: {
      properties: {
        avgPointsPerSprint: { type: 'number' },
        avgHoursPerSprint: { type: 'number' },
        sprintCount: { type: 'number' },
      },
    },
  })
  async calculateVelocity(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @Query('sprints') sprints?: string,
  ) {
    return this.estimationService.calculateVelocity(
      workspaceId,
      projectId,
      sprints ? parseInt(sprints, 10) : 3,
    );
  }

  @Get('estimation/metrics')
  @ApiOperation({ summary: 'Get estimation accuracy metrics' })
  @ApiResponse({
    status: 200,
    description: 'Estimation metrics retrieved',
    schema: {
      properties: {
        averageError: { type: 'number' },
        averageAccuracy: { type: 'number' },
        totalEstimations: { type: 'number' },
      },
    },
  })
  async getEstimationMetrics(
    @CurrentWorkspace() workspaceId: string,
    @Query('projectId') projectId: string,
    @Query('taskType') taskType?: string,
  ) {
    return this.estimationService.getEstimationMetrics(
      workspaceId,
      projectId,
      taskType as any,
    );
  }

  // ============================================
  // Story Point Suggestions (PM-04-6)
  // ============================================

  @Post('estimation/suggest-points/:taskId')
  @ApiOperation({ summary: 'Get story point suggestion for a task' })
  @ApiResponse({
    status: 200,
    description: 'Story point suggestion generated',
    schema: {
      properties: {
        suggestionId: { type: 'string' },
        taskId: { type: 'string' },
        suggestedPoints: { type: 'number' },
        estimatedHours: { type: 'number' },
        confidenceLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        confidenceScore: { type: 'number' },
        reasoning: { type: 'string' },
        complexityFactors: { type: 'array', items: { type: 'string' } },
        similarTasks: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              points: { type: 'number' },
            },
          },
        },
        coldStart: { type: 'boolean' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async suggestStoryPoints(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.estimationService.suggestStoryPoints(taskId, workspaceId, userId);
  }

  @Post('estimation/suggestions/:id/accept')
  @ApiOperation({ summary: 'Accept story point suggestion' })
  @ApiResponse({
    status: 200,
    description: 'Story points applied to task',
    schema: {
      properties: {
        taskId: { type: 'string' },
        appliedPoints: { type: 'number' },
      },
    },
  })
  async acceptStoryPointSuggestion(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') suggestionId: string,
    @Body() body: { overridePoints?: number },
  ) {
    return this.estimationService.acceptStoryPointSuggestion(
      suggestionId,
      workspaceId,
      body.overridePoints,
    );
  }

  @Post('estimation/suggestions/:id/reject')
  @ApiOperation({ summary: 'Reject story point suggestion' })
  @ApiResponse({
    status: 200,
    description: 'Suggestion rejected',
    schema: {
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  async rejectStoryPointSuggestion(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') suggestionId: string,
    @Body() body: { reason?: string },
  ) {
    await this.estimationService.rejectStoryPointSuggestion(
      suggestionId,
      workspaceId,
      body.reason,
    );
    return { success: true };
  }
}
