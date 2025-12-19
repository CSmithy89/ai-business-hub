import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/services/prisma.service';
import { AgentOSService } from '../../agentos/agentos.service';
import { ConversationRole } from '@prisma/client';

// Configuration constants
const CONVERSATION_LIMITS = {
  /** Maximum messages to fetch for context */
  CONTEXT_LIMIT: 50,
  /** Maximum messages to retain per conversation (project + agent) */
  RETENTION_LIMIT: 100,
  /** Days after which old messages are archived/deleted */
  RETENTION_DAYS: 30,
} as const;

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

    // Check if message is a slash command
    const commandInfo = this.parseSlashCommand(message);

    // Load conversation history (last 50 messages)
    const history = await this.loadConversationHistory(
      workspaceId,
      projectId,
      agentName,
    );

    // Invoke agent via AgentOS
    // The agent will detect and handle slash commands via its tools
    const agentResponse = await this.invokeAgent({
      sessionId: `${workspaceId}-${projectId}`,
      userId,
      workspaceId,
      projectId,
      agentName,
      message,
      history,
      isCommand: commandInfo.isCommand,
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
      metadata: {
        ...agentResponse.metadata,
        isCommand: commandInfo.isCommand,
        command: commandInfo.command,
      },
    };
  }

  /**
   * Parse slash command from message
   */
  private parseSlashCommand(message: string): {
    isCommand: boolean;
    command?: string;
    args?: string;
  } {
    if (!message.startsWith('/')) {
      return { isCommand: false };
    }

    const parts = message.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    return {
      isCommand: true,
      command,
      args,
    };
  }

  /**
   * Get available slash commands
   */
  getAvailableCommands(): Record<string, string> {
    return {
      'create-task': 'Create a new task',
      'assign': 'Assign a task to a team member',
      'set-priority': 'Set priority for a task',
      'move-phase': 'Move task to a different phase',
      'help': 'Show available commands',
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
    const { workspaceId, projectId, agentName, limit = CONVERSATION_LIMITS.CONTEXT_LIMIT } = params;

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
   * Load conversation history (limited messages, ordered chronologically)
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
      take: CONVERSATION_LIMITS.CONTEXT_LIMIT,
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
   * Cleanup old conversation messages to prevent unbounded growth
   * Runs daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldConversations() {
    this.logger.log('Running conversation history cleanup');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CONVERSATION_LIMITS.RETENTION_DAYS);

    const result = await this.prisma.agentConversation.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} old conversation messages`);
    }

    return result;
  }

  /**
   * Store conversation (both user and agent messages)
   * Uses transaction to ensure both messages are saved atomically
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
    // Use transaction to ensure both messages are saved together
    return this.prisma.$transaction(async (tx) => {
      // Store user message
      await tx.agentConversation.create({
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
      const agentConversation = await tx.agentConversation.create({
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
    });
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
    isCommand?: boolean;
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
            isCommand: params.isCommand || false,
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
