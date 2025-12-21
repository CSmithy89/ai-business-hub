import { KnowledgeExtractionHandler } from './knowledge-extraction.handler'
import { EventTypes } from '@hyvve/shared'

const mockPrismaService = {
  approvalItem: {
    findFirst: jest.fn(),
  },
  task: {
    findFirst: jest.fn(),
  },
  taskComment: {
    findMany: jest.fn(),
  },
}

const mockApprovalRouter = {
  routeApproval: jest.fn(),
}

const mockKbAiService = {
  generateDraftFromTask: jest.fn(),
}

const baseEvent = {
  id: 'evt-1',
  type: EventTypes.PM_TASK_STATUS_CHANGED,
  source: 'api',
  timestamp: new Date().toISOString(),
  tenantId: 'workspace-1',
  userId: 'user-1',
  version: '1',
  data: {
    taskId: 'task-1',
    toStatus: 'DONE',
  },
}

describe('KnowledgeExtractionHandler', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('skips when status is not DONE', async () => {
    const handler = new KnowledgeExtractionHandler(
      mockPrismaService as any,
      mockApprovalRouter as any,
      mockKbAiService as any,
    )

    await handler.handleTaskStatusChanged({
      ...baseEvent,
      data: { taskId: 'task-1', toStatus: 'IN_PROGRESS' },
    })

    expect(mockPrismaService.task.findFirst).not.toHaveBeenCalled()
    expect(mockApprovalRouter.routeApproval).not.toHaveBeenCalled()
  })

  it('skips when content is not significant', async () => {
    mockPrismaService.approvalItem.findFirst.mockResolvedValue(null)
    mockPrismaService.task.findFirst.mockResolvedValue({
      id: 'task-1',
      title: 'Minor update',
      description: 'done',
      projectId: 'project-1',
      taskNumber: 12,
      completedAt: new Date(),
    })
    mockPrismaService.taskComment.findMany.mockResolvedValue([])

    const handler = new KnowledgeExtractionHandler(
      mockPrismaService as any,
      mockApprovalRouter as any,
      mockKbAiService as any,
    )

    await handler.handleTaskStatusChanged(baseEvent as any)

    expect(mockApprovalRouter.routeApproval).not.toHaveBeenCalled()
  })

  it('skips when approval already exists', async () => {
    mockPrismaService.approvalItem.findFirst.mockResolvedValue({
      id: 'approval-1',
      status: 'PENDING',
    })

    const handler = new KnowledgeExtractionHandler(
      mockPrismaService as any,
      mockApprovalRouter as any,
      mockKbAiService as any,
    )

    await handler.handleTaskStatusChanged(baseEvent as any)

    expect(mockPrismaService.task.findFirst).not.toHaveBeenCalled()
    expect(mockApprovalRouter.routeApproval).not.toHaveBeenCalled()
  })

  it('creates approval when content is significant', async () => {
    mockPrismaService.approvalItem.findFirst.mockResolvedValue(null)
    mockPrismaService.task.findFirst.mockResolvedValue({
      id: 'task-1',
      title: 'Document onboarding workflow',
      description: 'A'.repeat(320),
      projectId: 'project-1',
      taskNumber: 45,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
    })
    mockPrismaService.taskComment.findMany.mockResolvedValue([
      { content: 'Captured steps and blockers.', createdAt: new Date(), userId: 'user-2' },
    ])
    mockKbAiService.generateDraftFromTask.mockResolvedValue({
      content: '# Draft',
      citations: [],
    })

    const handler = new KnowledgeExtractionHandler(
      mockPrismaService as any,
      mockApprovalRouter as any,
      mockKbAiService as any,
    )

    await handler.handleTaskStatusChanged(baseEvent as any)

    expect(mockKbAiService.generateDraftFromTask).toHaveBeenCalled()
    expect(mockApprovalRouter.routeApproval).toHaveBeenCalledWith(
      'workspace-1',
      'scribe',
      'kb.knowledge_extraction',
      expect.stringContaining('Document onboarding workflow'),
      expect.any(Array),
      expect.objectContaining({
        sourceModule: 'scribe',
        sourceId: 'task-1',
        previewData: expect.objectContaining({
          title: 'Document onboarding workflow',
          content: '# Draft',
          isAIGenerated: true,
          contentTruncated: false,
        }),
      }),
    )
  })

  it('treats lowercase DONE as complete', async () => {
    mockPrismaService.approvalItem.findFirst.mockResolvedValue(null)
    mockPrismaService.task.findFirst.mockResolvedValue({
      id: 'task-1',
      title: 'Document onboarding workflow',
      description: 'A'.repeat(320),
      projectId: 'project-1',
      taskNumber: 45,
      completedAt: new Date('2025-01-01T10:00:00.000Z'),
    })
    mockPrismaService.taskComment.findMany.mockResolvedValue([])
    mockKbAiService.generateDraftFromTask.mockResolvedValue({
      content: '# Draft',
      citations: [],
    })

    const handler = new KnowledgeExtractionHandler(
      mockPrismaService as any,
      mockApprovalRouter as any,
      mockKbAiService as any,
    )

    await handler.handleTaskStatusChanged({
      ...baseEvent,
      data: { taskId: 'task-1', toStatus: 'done' },
    } as any)

    expect(mockApprovalRouter.routeApproval).toHaveBeenCalled()
  })
})
