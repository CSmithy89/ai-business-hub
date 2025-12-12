import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeEventHandler } from './realtime-event.handler';
import { RealtimeGateway } from './realtime.gateway';
import { BaseEvent, EventTypes } from '@hyvve/shared';

describe('RealtimeEventHandler', () => {
  let handler: RealtimeEventHandler;
  let mockGateway: Partial<RealtimeGateway>;

  beforeEach(async () => {
    // Mock the RealtimeGateway
    mockGateway = {
      broadcastApprovalCreated: jest.fn(),
      broadcastApprovalUpdated: jest.fn(),
      broadcastApprovalDeleted: jest.fn(),
      broadcastAgentStatusChanged: jest.fn(),
      broadcastAgentRunStarted: jest.fn(),
      broadcastAgentRunCompleted: jest.fn(),
      broadcastAgentRunFailed: jest.fn(),
      broadcastNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeEventHandler,
        {
          provide: RealtimeGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    handler = module.get<RealtimeEventHandler>(RealtimeEventHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleApprovalEvents', () => {
    const baseEvent: BaseEvent = {
      id: 'event-123',
      type: EventTypes.APPROVAL_REQUESTED,
      source: 'platform',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-123',
      tenantId: 'workspace-456',
      userId: 'user-789',
      version: '1.0',
      data: {},
    };

    it('should broadcast approval created for APPROVAL_REQUESTED event', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.APPROVAL_REQUESTED,
        data: {
          approvalId: 'approval-1',
          type: 'content_review',
          title: 'Review Post',
          confidenceScore: 0.85,
          recommendation: 'approve',
          dueAt: new Date().toISOString(),
        },
      };

      await handler.handleApprovalEvents(event);

      expect(mockGateway.broadcastApprovalCreated).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          id: 'approval-1',
          type: 'content_review',
          title: 'Review Post',
          confidenceScore: 0.85,
          recommendation: 'approve',
          status: 'pending',
        })
      );
    });

    it('should broadcast approval updated for APPROVAL_APPROVED event', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.APPROVAL_APPROVED,
        data: {
          approvalId: 'approval-1',
          type: 'content_review',
          title: 'Review Post',
          decision: 'approved',
          decidedById: 'user-123',
          decisionNotes: 'Looks good',
          confidenceScore: 0.85,
        },
      };

      await handler.handleApprovalEvents(event);

      expect(mockGateway.broadcastApprovalUpdated).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          id: 'approval-1',
          status: 'approved',
          decision: 'approved',
          decidedById: 'user-123',
        })
      );
    });

    it('should broadcast approval updated for APPROVAL_REJECTED event', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.APPROVAL_REJECTED,
        data: {
          approvalId: 'approval-1',
          type: 'content_review',
          title: 'Review Post',
          decision: 'rejected',
          decidedById: 'user-123',
          decisionNotes: 'Needs revision',
          confidenceScore: 0.85,
        },
      };

      await handler.handleApprovalEvents(event);

      expect(mockGateway.broadcastApprovalUpdated).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          id: 'approval-1',
          status: 'rejected',
          decision: 'rejected',
        })
      );
    });

    it('should broadcast approval updated for APPROVAL_ESCALATED event', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.APPROVAL_ESCALATED,
        data: {
          approvalId: 'approval-1',
          type: 'content_review',
          title: 'Review Post',
          escalatedToId: 'manager-123',
          reason: 'Low confidence',
          originalDueAt: new Date().toISOString(),
          newDueAt: new Date().toISOString(),
        },
      };

      await handler.handleApprovalEvents(event);

      expect(mockGateway.broadcastApprovalUpdated).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          id: 'approval-1',
          status: 'escalated',
          assignedToId: 'manager-123',
        })
      );
    });

    it('should broadcast approval updated for APPROVAL_EXPIRED event', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.APPROVAL_EXPIRED,
        data: {
          approvalId: 'approval-1',
          type: 'content_review',
          title: 'Review Post',
          dueAt: new Date().toISOString(),
        },
      };

      await handler.handleApprovalEvents(event);

      expect(mockGateway.broadcastApprovalUpdated).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          id: 'approval-1',
          status: 'expired',
        })
      );
    });
  });

  describe('handleAgentEvents', () => {
    const baseEvent: BaseEvent = {
      id: 'event-123',
      type: EventTypes.AGENT_RUN_STARTED,
      source: 'platform',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-123',
      tenantId: 'workspace-456',
      userId: 'user-789',
      version: '1.0',
      data: {},
    };

    it('should broadcast agent run started and status changed', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.AGENT_RUN_STARTED,
        data: {
          runId: 'run-1',
          agentId: 'agent-1',
          agentName: 'Content Writer',
          input: { topic: 'AI' },
          triggeredBy: 'user',
        },
      };

      await handler.handleAgentEvents(event);

      expect(mockGateway.broadcastAgentRunStarted).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          runId: 'run-1',
          agentId: 'agent-1',
          agentName: 'Content Writer',
          status: 'started',
        })
      );

      expect(mockGateway.broadcastAgentStatusChanged).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          agentId: 'agent-1',
          agentName: 'Content Writer',
          status: 'running',
        })
      );
    });

    it('should broadcast agent run completed and status idle', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.AGENT_RUN_COMPLETED,
        data: {
          runId: 'run-1',
          agentId: 'agent-1',
          agentName: 'Content Writer',
          output: { content: 'Generated content' },
          durationMs: 5000,
          tokensUsed: 1500,
        },
      };

      await handler.handleAgentEvents(event);

      expect(mockGateway.broadcastAgentRunCompleted).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          runId: 'run-1',
          status: 'completed',
          durationMs: 5000,
          tokensUsed: 1500,
        })
      );

      expect(mockGateway.broadcastAgentStatusChanged).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          agentId: 'agent-1',
          status: 'idle',
        })
      );
    });

    it('should broadcast agent run failed and status error', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.AGENT_RUN_FAILED,
        data: {
          runId: 'run-1',
          agentId: 'agent-1',
          agentName: 'Content Writer',
          error: 'Rate limit exceeded',
          errorCode: 'RATE_LIMIT',
          durationMs: 1000,
        },
      };

      await handler.handleAgentEvents(event);

      expect(mockGateway.broadcastAgentRunFailed).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          runId: 'run-1',
          status: 'failed',
          error: 'Rate limit exceeded',
          errorCode: 'RATE_LIMIT',
        })
      );

      expect(mockGateway.broadcastAgentStatusChanged).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          agentId: 'agent-1',
          status: 'error',
        })
      );
    });

    it('should broadcast confirmation notification for AGENT_CONFIRMATION_REQUESTED', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.AGENT_CONFIRMATION_REQUESTED,
        data: {
          runId: 'run-1',
          agentId: 'agent-1',
          agentName: 'Content Writer',
          confirmationId: 'confirm-1',
          toolName: 'publishPost',
          toolArgs: { platform: 'twitter' },
          message: 'Confirm publishing to Twitter?',
        },
      };

      await handler.handleAgentEvents(event);

      expect(mockGateway.broadcastAgentStatusChanged).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          agentId: 'agent-1',
          status: 'paused',
          currentTask: 'Waiting for confirmation',
        })
      );

      expect(mockGateway.broadcastNotification).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          type: 'agent_confirmation',
          title: 'Agent Confirmation Required',
          message: 'Confirm publishing to Twitter?',
          severity: 'warning',
        }),
        'user-789'
      );
    });
  });

  describe('handleTokenLimitEvents', () => {
    const baseEvent: BaseEvent = {
      id: 'event-123',
      type: EventTypes.TOKEN_LIMIT_WARNING,
      source: 'platform',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-123',
      tenantId: 'workspace-456',
      userId: 'user-789',
      version: '1.0',
      data: {},
    };

    it('should broadcast warning notification for TOKEN_LIMIT_WARNING', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.TOKEN_LIMIT_WARNING,
        data: {
          providerId: 'provider-1',
          provider: 'openai',
          tokensUsed: 80000,
          maxTokens: 100000,
          percentageUsed: 80,
          threshold: 80,
        },
      };

      await handler.handleTokenLimitEvents(event);

      expect(mockGateway.broadcastNotification).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          type: 'token_limit_warning',
          title: 'Token Limit Warning',
          severity: 'warning',
        })
      );
    });

    it('should broadcast error notification for TOKEN_LIMIT_EXCEEDED', async () => {
      const event: BaseEvent = {
        ...baseEvent,
        type: EventTypes.TOKEN_LIMIT_EXCEEDED,
        data: {
          providerId: 'provider-1',
          provider: 'openai',
          tokensUsed: 100000,
          maxTokens: 100000,
        },
      };

      await handler.handleTokenLimitEvents(event);

      expect(mockGateway.broadcastNotification).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          type: 'token_limit_exceeded',
          title: 'Token Limit Exceeded',
          severity: 'error',
        })
      );
    });
  });
});
