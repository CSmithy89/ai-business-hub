import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

interface MentionNode {
  userId: string
  label: string
  position: number
}

/**
 * Service for extracting and managing mentions in KB pages
 */
@Injectable()
export class MentionService {
  private readonly logger = new Logger(MentionService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Extract mentions from Tiptap JSON content
   */
  extractMentionsFromContent(content: any): MentionNode[] {
    const mentions: MentionNode[] = []
    let position = 0

    const traverse = (node: any) => {
      if (node.type === 'mention' && node.attrs?.id) {
        mentions.push({
          userId: node.attrs.id,
          label: node.attrs.label || 'Unknown',
          position,
        })
      }

      if (node.content) {
        node.content.forEach((child: any) => traverse(child))
      }

      if (node.text) {
        position += node.text.length
      } else {
        position++
      }
    }

    if (content?.content) {
      content.content.forEach(traverse)
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
}
