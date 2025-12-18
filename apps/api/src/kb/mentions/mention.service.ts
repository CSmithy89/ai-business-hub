import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

interface UserMentionNode {
  userId: string
  label: string
  position: number
}

interface TaskMentionNode {
  taskId: string
  taskNumber: number
  label: string
  position: number
}

interface ExtractedMentions {
  users: UserMentionNode[]
  tasks: TaskMentionNode[]
}

/**
 * Service for extracting and managing mentions in KB pages
 */
@Injectable()
export class MentionService {
  private readonly logger = new Logger(MentionService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Extract user mentions from Tiptap JSON content (legacy method for backward compatibility)
   */
  extractMentionsFromContent(content: unknown): UserMentionNode[] {
    return this.extractAllMentions(content).users
  }

  /**
   * Extract all mentions (users and tasks) from Tiptap JSON content
   */
  extractAllMentions(content: unknown): ExtractedMentions {
    const mentions: ExtractedMentions = {
      users: [],
      tasks: [],
    }
    let position = 0

    interface TiptapNode {
      type?: string
      attrs?: Record<string, unknown>
      content?: TiptapNode[]
      text?: string
    }

    const MAX_DEPTH = 50 // Prevent stack overflow from malicious deeply nested content

    const traverse = (node: TiptapNode, depth = 0) => {
      // Prevent stack overflow attacks with deeply nested content
      if (depth > MAX_DEPTH) {
        this.logger.warn(`Maximum traversal depth (${MAX_DEPTH}) exceeded in mention extraction`)
        return
      }

      // User mention (@)
      if (node.type === 'mention' && node.attrs?.id) {
        mentions.users.push({
          userId: String(node.attrs.id),
          label: String(node.attrs.label || 'Unknown'),
          position,
        })
      }

      // Task reference (#)
      if (node.type === 'taskReference' && node.attrs?.id) {
        mentions.tasks.push({
          taskId: String(node.attrs.id),
          taskNumber: Number(node.attrs.taskNumber) || 0,
          label: String(node.attrs.label || 'Unknown'),
          position,
        })
      }

      if (node.content) {
        node.content.forEach((child: TiptapNode) => traverse(child, depth + 1))
      }

      if (node.text) {
        position += node.text.length
      } else {
        position++
      }
    }

    const typedContent = content as TiptapNode | null
    if (typedContent?.content) {
      typedContent.content.forEach(traverse)
    }

    return mentions
  }

  /**
   * Update mentions for a page
   * Creates new PageMention records and deletes old ones
   */
  async updatePageMentions(
    pageId: string,
    content: any,
    workspaceId: string,
    mentionedByUserId: string
  ): Promise<string[]> {
    // Extract mentions from content
    const mentions = this.extractMentionsFromContent(content)

    // Get existing mentions
    const existingMentions = await this.prisma.pageMention.findMany({
      where: {
        pageId,
        mentionType: 'USER',
      },
    })

    // Determine which are new mentions (not in existing)
    const existingUserIds = new Set(existingMentions.map((m) => m.targetId))
    const newMentions = mentions.filter((m) => !existingUserIds.has(m.userId))
    const newMentionUserIds = new Set(newMentions.map((m) => m.userId))

    // Delete old mentions that are no longer in content
    const currentUserIds = new Set(mentions.map((m) => m.userId))
    const mentionsToDelete = existingMentions.filter(
      (m) => !currentUserIds.has(m.targetId)
    )

    // Transaction: delete old, create new
    await this.prisma.$transaction(async (tx) => {
      // Delete removed mentions
      if (mentionsToDelete.length > 0) {
        await tx.pageMention.deleteMany({
          where: {
            id: {
              in: mentionsToDelete.map((m) => m.id),
            },
          },
        })
      }

      // Create new mentions
      if (newMentions.length > 0) {
        await tx.pageMention.createMany({
          data: newMentions.map((m) => ({
            pageId,
            mentionType: 'USER' as const,
            targetId: m.userId,
            position: m.position,
            label: m.label,
          })),
        })
      }
    })

    // Return IDs of newly mentioned users (excluding self-mentions)
    const usersToNotify = Array.from(newMentionUserIds).filter(
      (userId) => userId !== mentionedByUserId
    )

    this.logger.debug(
      `Updated mentions for page ${pageId}: ${mentions.length} total, ${newMentions.length} new, ${mentionsToDelete.length} deleted`
    )

    return usersToNotify
  }

  /**
   * Send notifications to mentioned users
   */
  async notifyMentionedUsers(
    pageId: string,
    userIds: string[],
    workspaceId: string,
    mentionedByUserId: string
  ): Promise<void> {
    if (userIds.length === 0) {
      return
    }

    // Get page details
    const page = await this.prisma.knowledgePage.findUnique({
      where: { id: pageId },
      select: {
        title: true,
        slug: true,
      },
    })

    if (!page) {
      this.logger.warn(`Page ${pageId} not found for mention notifications`)
      return
    }

    // Get mentioning user details
    const mentioningUser = await this.prisma.user.findUnique({
      where: { id: mentionedByUserId },
      select: { name: true, email: true },
    })

    const displayName = mentioningUser?.name || mentioningUser?.email || 'Someone'

    // Create notifications for each mentioned user
    const notifications = userIds.map((userId) => ({
      userId,
      workspaceId,
      type: 'kb_mention',
      title: 'You were mentioned',
      message: `${displayName} mentioned you in "${page.title}"`,
      link: `/kb/${page.slug}`,
      data: {
        pageId,
        pageTitle: page.title,
        pageSlug: page.slug,
        mentionedBy: mentionedByUserId,
        mentionedByName: displayName,
      },
    }))

    // Create all notifications in batch
    await this.prisma.notification.createMany({
      data: notifications,
    })

    this.logger.debug(
      `Sent ${notifications.length} mention notifications for page ${pageId}`
    )
  }

  /**
   * Get pages where user is mentioned
   */
  async getUserMentions(userId: string, workspaceId: string) {
    const mentions = await this.prisma.pageMention.findMany({
      where: {
        targetId: userId,
        mentionType: 'USER',
        page: {
          workspaceId,
          deletedAt: null,
        },
      },
      include: {
        page: {
          select: {
            id: true,
            title: true,
            slug: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return mentions
  }

  /**
   * Update task references for a page
   * Creates new PageMention records (type=TASK) and deletes old ones
   */
  async updatePageTaskReferences(pageId: string, content: unknown): Promise<void> {
    const allMentions = this.extractAllMentions(content)
    const taskMentions = allMentions.tasks

    // Get existing task references
    const existingRefs = await this.prisma.pageMention.findMany({
      where: {
        pageId,
        mentionType: 'TASK',
      },
    })

    // Determine which are new task references
    const existingTaskIds = new Set(existingRefs.map((r) => r.targetId))
    const currentTaskIds = new Set(taskMentions.map((m) => m.taskId))

    const newRefs = taskMentions.filter((m) => !existingTaskIds.has(m.taskId))
    const refsToDelete = existingRefs.filter((r) => !currentTaskIds.has(r.targetId))

    // Transaction: delete old, create new
    await this.prisma.$transaction(async (tx) => {
      // Delete removed task references
      if (refsToDelete.length > 0) {
        await tx.pageMention.deleteMany({
          where: {
            id: {
              in: refsToDelete.map((r) => r.id),
            },
          },
        })
      }

      // Create new task references
      if (newRefs.length > 0) {
        await tx.pageMention.createMany({
          data: newRefs.map((m) => ({
            pageId,
            mentionType: 'TASK' as const,
            targetId: m.taskId,
            position: m.position,
            label: m.label,
          })),
        })
      }
    })

    this.logger.debug(
      `Updated task refs for page ${pageId}: ${taskMentions.length} total, ${newRefs.length} new, ${refsToDelete.length} deleted`
    )
  }

  /**
   * Get pages that reference a specific task
   */
  async getTaskReferences(taskId: string, workspaceId: string) {
    const refs = await this.prisma.pageMention.findMany({
      where: {
        targetId: taskId,
        mentionType: 'TASK',
        page: {
          workspaceId,
          deletedAt: null,
        },
      },
      include: {
        page: {
          select: {
            id: true,
            title: true,
            slug: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return refs
  }

  /**
   * Update all mentions (users and tasks) for a page
   */
  async updateAllPageMentions(
    pageId: string,
    content: unknown,
    workspaceId: string,
    mentionedByUserId: string
  ): Promise<string[]> {
    // Update user mentions
    const usersToNotify = await this.updatePageMentions(
      pageId,
      content,
      workspaceId,
      mentionedByUserId
    )

    // Update task references
    await this.updatePageTaskReferences(pageId, content)

    return usersToNotify
  }
}
