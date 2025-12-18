import {
  Controller,
  Post,
  Get,
  Patch,
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
import { ChatAgentDto, GetConversationsDto } from './dto/chat-agent.dto';
import {
  UpdateBriefingPreferencesDto,
  BriefingPreferencesResponseDto,
  DailyBriefingResponseDto,
} from './dto/briefing.dto';

@ApiTags('PM Agents')
@Controller('pm/agents')
@UseGuards(AuthGuard, TenantGuard)
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly briefingService: BriefingService,
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
}
