import { Injectable, Logger } from '@nestjs/common'
import { TaskStatus } from '@prisma/client'
import { ApprovalRouterService } from '../../approvals/services/approval-router.service'
import { PrismaService } from '../../common/services/prisma.service'
import { EventSubscriber } from '../../events'
import { BaseEvent, ConfidenceFactor, EventTypes } from '@hyvve/shared'
import { KbAiService } from './ai.service'

type TaskCommentSummary = {
  content: string
  createdAt: Date
  userId: string
}

const MIN_CONTENT_CHARS = 200
const MIN_CONTENT_WORDS = 40
const MAX_PREVIEW_COMMENTS = 8

@Injectable()
export class KnowledgeExtractionHandler {
  private readonly logger = new Logger(KnowledgeExtractionHandler.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalRouter: ApprovalRouterService,
    private readonly kbAiService: KbAiService,
  ) {}

  @EventSubscriber(EventTypes.PM_TASK_STATUS_CHANGED, { priority: 80 })
  async handleTaskStatusChanged(event: BaseEvent): Promise<void> {
    const data = event.data as Record<string, unknown>
    const nextStatus = this.getNextStatus(data)

    if (nextStatus !== TaskStatus.DONE) {
      return
    }

    const taskId = this.getTaskId(data)
    if (!taskId) {
      this.logger.warn({
        message: 'Task status change event missing taskId',
        eventId: event.id,
        correlationId: event.correlationId,
      })
      return
    }

    const workspaceId = event.tenantId

    const existingApproval = await this.prisma.approvalItem.findFirst({
      where: {
        workspaceId,
        type: 'kb.knowledge_extraction',
        sourceModule: 'scribe',
        sourceId: taskId,
      },
      select: { id: true, status: true },
    })

    if (existingApproval) {
      this.logger.debug({
        message: 'Knowledge extraction already requested for task',
        taskId,
        approvalId: existingApproval.id,
        status: existingApproval.status,
      })
      return
    }

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        projectId: true,
        taskNumber: true,
        completedAt: true,
      },
    })

    if (!task) {
      this.logger.warn({
        message: 'Task not found for knowledge extraction',
        taskId,
      })
      return
    }

    const comments = await this.prisma.taskComment.findMany({
      where: { taskId, deletedAt: null },
      select: { content: true, createdAt: true, userId: true },
      orderBy: { createdAt: 'asc' },
    })

    const combinedText = this.buildCombinedText(task.description, comments)
    if (!this.isSignificantContent(combinedText)) {
      this.logger.debug({
        message: 'Skipping knowledge extraction due to minimal content',
        taskId,
        contentLength: combinedText.length,
      })
      return
    }

    let draftContent = ''
    try {
      const draft = await this.kbAiService.generateDraftFromTask(
        event.tenantId,
        workspaceId,
        {
          title: task.title,
          description: task.description,
          comments: comments.map((comment) => comment.content),
        },
      )
      draftContent = draft.content
    } catch (error) {
      this.logger.warn({
        message: 'AI draft failed, using fallback template',
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      draftContent = this.buildFallbackDraft(task, comments)
    }

    const previewData = {
      title: task.title,
      content: draftContent,
      task: {
        id: task.id,
        title: task.title,
        projectId: task.projectId,
        taskNumber: task.taskNumber,
        completedAt: task.completedAt?.toISOString() ?? null,
      },
      comments: comments.slice(0, MAX_PREVIEW_COMMENTS).map((comment) => ({
        content: this.truncateText(comment.content, 300),
        createdAt: comment.createdAt.toISOString(),
        userId: comment.userId,
      })),
      triggeredById: event.userId,
    }

    const factors = this.buildConfidenceFactors(combinedText, comments)
    const taskLabel = task.taskNumber ? `Task ${task.taskNumber}` : 'Task'

    await this.approvalRouter.routeApproval(
      workspaceId,
      'scribe',
      'kb.knowledge_extraction',
      `Knowledge Extraction: ${task.title}`,
      factors,
      {
        description: `${taskLabel} completed with notable documentation value.`,
        previewData,
        sourceModule: 'scribe',
        sourceId: task.id,
        priority: 'medium',
      },
    )
  }

  private getNextStatus(data: Record<string, unknown>): string | undefined {
    const value = data.toStatus ?? data.to ?? data.status
    return typeof value === 'string' ? value : undefined
  }

  private getTaskId(data: Record<string, unknown>): string | undefined {
    const value = data.taskId ?? data.id
    return typeof value === 'string' ? value : undefined
  }

  private buildCombinedText(description: string | null | undefined, comments: TaskCommentSummary[]): string {
    const parts: string[] = []
    if (description?.trim()) {
      parts.push(description)
    }
    for (const comment of comments) {
      if (comment.content?.trim()) {
        parts.push(comment.content)
      }
    }
    return this.normalizeText(parts.join('\n\n'))
  }

  private isSignificantContent(text: string): boolean {
    if (!text) return false
    const wordCount = text.split(/\s+/).filter(Boolean).length
    return text.length >= MIN_CONTENT_CHARS || wordCount >= MIN_CONTENT_WORDS
  }

  private buildFallbackDraft(
    task: { title: string; description: string | null; id: string; projectId: string; completedAt: Date | null },
    comments: TaskCommentSummary[],
  ): string {
    const lines: string[] = [
      `# ${task.title}`,
      '',
      '## Summary',
      'TODO: Summarize the completed task and its outcome.',
      '',
      '## Context',
      task.description?.trim() || 'TODO: Add task context and background.',
      '',
      '## Key Decisions',
      '- TODO: Capture key decisions or changes.',
      '',
      '## Follow-ups',
      '- TODO: Note any follow-up actions or owners.',
      '',
      '## Task Details',
      `- Task ID: ${task.id}`,
      `- Project ID: ${task.projectId}`,
      `- Completed At: ${task.completedAt?.toISOString() ?? 'Unknown'}`,
    ]

    const commentLines = comments
      .slice(0, MAX_PREVIEW_COMMENTS)
      .map((comment) => `- ${this.truncateText(comment.content, 240)}`)

    if (commentLines.length > 0) {
      lines.push('', '## Discussion Highlights', ...commentLines)
    }

    return lines.join('\n')
  }

  private buildConfidenceFactors(text: string, comments: TaskCommentSummary[]): ConfidenceFactor[] {
    const contentScore = this.clamp(Math.round((Math.min(text.length, 800) / 800) * 100), 20, 80)
    const commentScore = this.clamp(Math.round((Math.min(comments.length, 5) / 5) * 100), 20, 80)
    const reviewGateScore = 55

    return [
      {
        factor: 'data_completeness',
        score: contentScore,
        weight: 0.4,
        explanation: `Task description and comments provide ${text.length} characters of source content.`,
      },
      {
        factor: 'pattern_match',
        score: commentScore,
        weight: 0.3,
        explanation: `Task discussion includes ${comments.length} comment${comments.length === 1 ? '' : 's'}.`,
      },
      {
        factor: 'business_rules',
        score: reviewGateScore,
        weight: 0.3,
        explanation: 'Knowledge extraction always requires human review.',
        concerning: true,
      },
    ]
  }

  private normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim()
  }

  private truncateText(text: string, limit: number): string {
    if (text.length <= limit) return text
    return `${text.slice(0, Math.max(0, limit - 3))}...`
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
  }
}
