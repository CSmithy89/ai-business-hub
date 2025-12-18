import {
  Controller,
  Post,
  Get,
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
import { ChatAgentDto, GetConversationsDto } from './dto/chat-agent.dto';

@ApiTags('PM Agents')
@Controller('pm/agents')
@UseGuards(AuthGuard, TenantGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

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
}
