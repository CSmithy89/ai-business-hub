import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AgentOSService } from '../../agentos/agentos.service';
import { ConversationRole } from '@prisma/client';

interface ChatParams {
  workspaceId: string;
  projectId: string;
  userId: string;
  agentName: 'navi' | 'sage' | 'chrono';
  message: string;
}

interface ConversationHistory {
  role: ConversationRole;
  message: string;
  createdAt: Date;
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentOS: AgentOSService,
  ) {}

  /**
   * Chat with an agent (Navi, Sage, or Chrono)
   */
  async chat(params: ChatParams): Promise<{
    conversationId: string;
    response: string;
    metadata?: Record<string, any>;
  }> {
    const { workspaceId, projectId, userId, agentName, message } = params;

    this.logger.log(
      `Chat request: agent=${agentName}, project=${projectId}, user=${userId}`,
    );

    // Load conversation history (last 50 messages)
    const history = await this.loadConversationHistory(
      workspaceId,
      projectId,
      agentName,
    );

    // Invoke agent via AgentOS
    const agentResponse = await this.invokeAgent({
      sessionId: `${workspaceId}-${projectId}`,
      userId,
      workspaceId,
      projectId,
      agentName,
      message,
      history,
    });

    // Store conversation (user message + agent response)
    const conversation = await this.storeConversation(
      workspaceId,
      projectId,
      userId,
      agentName,
      message,
      agentResponse.message,
      agentResponse.metadata,
    );

    return {
      conversationId: conversation.id,
      response: agentResponse.message,
      metadata: agentResponse.metadata,
    };
  }

  /**
   * Get conversation history for a project and agent
   */
  async getConversations(params: {
    workspaceId: string;
    projectId: string;
    agentName?: string;
    limit?: number;
  }) {
    const { workspaceId, projectId, agentName, limit = 50 } = params;

    const where: any = {
      workspaceId,
      projectId,
    };

    if (agentName) {
      where.agentName = agentName;
    }

    return this.prisma.agentConversation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        agentName: true,
        role: true,
        message: true,
        metadata: true,
        createdAt: true,
      },
    });
  }

  /**
   * Load conversation history (last 50 messages, ordered chronologically)
   */
  private async loadConversationHistory(
    workspaceId: string,
    projectId: string,
    agentName: string,
  ): Promise<ConversationHistory[]> {
    const conversations = await this.prisma.agentConversation.findMany({
      where: {
        workspaceId,
        projectId,
        agentName,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        role: true,
        message: true,
        createdAt: true,
      },
    });

    // Reverse to get chronological order (oldest to newest)
    return conversations.reverse();
  }

  /**
   * Store conversation (both user and agent messages)
   */
  private async storeConversation(
    workspaceId: string,
    projectId: string,
    userId: string,
    agentName: string,
    userMessage: string,
    agentResponse: string,
    metadata?: Record<string, any>,
  ) {
    // Store both user and agent messages as separate records
    await this.prisma.agentConversation.create({
      data: {
        workspaceId,
        projectId,
        userId,
        agentName,
        role: ConversationRole.USER,
        message: userMessage,
      },
    });

    // Store agent response
    const agentConversation = await this.prisma.agentConversation.create({
      data: {
        workspaceId,
        projectId,
        userId,
        agentName,
        role: ConversationRole.AGENT,
        message: agentResponse,
        metadata: metadata || undefined,
      },
    });

    return agentConversation;
  }

  /**
   * Invoke agent via AgentOS (Python FastAPI)
   */
  private async invokeAgent(params: {
    sessionId: string;
    userId: string;
    workspaceId: string;
    projectId: string;
    agentName: string;
    message: string;
    history: ConversationHistory[];
  }): Promise<{ message: string; metadata?: Record<string, any> }> {
    try {
      // For now, invoke the pm_team agent with context
      // The AgentOS will route to the appropriate team member (Navi, Sage, Chrono)
      const agentId = 'pm_team';

      const response = await this.agentOS.invokeAgent(
        agentId,
        {
          message: params.message,
          params: {
            projectId: params.projectId,
            agentName: params.agentName,
            history: params.history.map((h) => ({
              role: h.role.toLowerCase(),
              content: h.message,
            })),
          },
        },
        params.workspaceId,
        params.userId,
      );

      // Extract message from agent response
      const message = response.content || response.messages?.[0]?.content || '';

      return {
        message,
        metadata: {
          runId: response.runId,
          status: response.status,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to invoke agent: ${errorMessage}`, errorStack);

      // Graceful fallback
      return {
        message:
          "I'm having trouble connecting right now. Please try again in a moment.",
        metadata: {
          error: errorMessage,
        },
      };
    }
  }
}
