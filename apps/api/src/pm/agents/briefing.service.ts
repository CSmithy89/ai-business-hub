import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../common/services/prisma.service'

export interface BriefingSection {
  title: string
  items: Array<{
    id: string
    text: string
    type: 'task' | 'blocker' | 'activity' | 'recommendation'
    priority?: 'high' | 'medium' | 'low'
    actionUrl?: string
  }>
}

export interface DailyBriefing {
  id: string
  generatedAt: string
  workspaceId: string
  userId: string
  sections: {
    tasksDueToday: BriefingSection
    overdueTasks: BriefingSection
    blockers: BriefingSection
    recentActivity: BriefingSection
    recommendations: BriefingSection
  }
  summary: string
}

@Injectable()
export class BriefingService {
  private readonly logger = new Logger(BriefingService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate daily briefing for a user
   */
  async generateBriefing(
    userId: string,
    workspaceId: string,
  ): Promise<DailyBriefing> {
    this.logger.log(`Generating daily briefing for user ${userId}`)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get tasks assigned to or created by the user
    const userTasks = await this.prisma.task.findMany({
      where: {
        phase: {
          project: {
            workspaceId,
          },
        },
        OR: [{ assigneeId: userId }, { createdBy: userId }],
        status: { not: 'DONE' },
      },
      include: {
        phase: {
          include: {
            project: true,
          },
        },
      },
    })

    // Tasks due today
    const tasksDueToday = userTasks.filter((t) => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      return due >= today && due < tomorrow
    })

    // Overdue tasks
    const overdueTasks = userTasks.filter((t) => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      return due < today
    })

    // Blockers (urgent priority tasks)
    const blockers = userTasks.filter((t) => t.priority === 'URGENT')

    // Recent activity (last 24 hours)
    const recentActivity = await this.prisma.task.findMany({
      where: {
        phase: {
          project: {
            workspaceId,
          },
        },
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        phase: {
          include: { project: true },
        },
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    })

    // Generate simple recommendations based on the data
    const recommendations = this.generateRecommendations(
      tasksDueToday.length,
      overdueTasks.length,
      blockers.length,
    )

    const briefing: DailyBriefing = {
      id: `briefing-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      workspaceId,
      userId,
      sections: {
        tasksDueToday: {
          title: 'Tasks Due Today',
          items: tasksDueToday.map((t) => ({
            id: t.id,
            text: `${t.title} (${t.phase.project.name})`,
            type: 'task',
            priority:
              t.priority === 'URGENT' || t.priority === 'HIGH'
                ? 'high'
                : 'medium',
            actionUrl: `/pm/tasks/${t.id}`,
          })),
        },
        overdueTasks: {
          title: 'Overdue Tasks',
          items: overdueTasks.map((t) => ({
            id: t.id,
            text: `${t.title} (${t.phase.project.name}) - Due ${new Date(t.dueDate!).toLocaleDateString()}`,
            type: 'task',
            priority: 'high',
            actionUrl: `/pm/tasks/${t.id}`,
          })),
        },
        blockers: {
          title: 'Blockers & Urgent Items',
          items: blockers.map((t) => ({
            id: t.id,
            text: `${t.title} (${t.phase.project.name})`,
            type: 'blocker',
            priority: 'high',
            actionUrl: `/pm/tasks/${t.id}`,
          })),
        },
        recentActivity: {
          title: 'Recent Activity',
          items: recentActivity.map((t) => ({
            id: t.id,
            text: `${t.title} updated in ${t.phase.project.name}`,
            type: 'activity',
            actionUrl: `/pm/tasks/${t.id}`,
          })),
        },
        recommendations: {
          title: 'Recommendations',
          items: recommendations.map((r, i) => ({
            id: `rec-${i}`,
            text: r,
            type: 'recommendation',
          })),
        },
      },
      summary: this.generateSummary(
        tasksDueToday.length,
        overdueTasks.length,
        blockers.length,
      ),
    }

    return briefing
  }

  private generateRecommendations(
    dueToday: number,
    overdue: number,
    blockers: number,
  ): string[] {
    const recommendations: string[] = []

    if (blockers > 0) {
      recommendations.push('Address urgent blockers first to unblock team progress')
    }
    if (overdue > 0) {
      recommendations.push(
        `Review ${overdue} overdue task${overdue > 1 ? 's' : ''} and update timelines if needed`,
      )
    }
    if (dueToday > 0) {
      recommendations.push(
        `Focus on completing ${dueToday} task${dueToday > 1 ? 's' : ''} due today`,
      )
    }
    if (recommendations.length === 0) {
      recommendations.push("You're all caught up! Consider reviewing upcoming tasks")
    }

    return recommendations.slice(0, 3)
  }

  private generateSummary(
    dueToday: number,
    overdue: number,
    blockers: number,
  ): string {
    const parts: string[] = []

    if (dueToday > 0) {
      parts.push(`${dueToday} task${dueToday > 1 ? 's' : ''} due today`)
    }
    if (overdue > 0) {
      parts.push(`${overdue} overdue`)
    }
    if (blockers > 0) {
      parts.push(`${blockers} blocker${blockers > 1 ? 's' : ''}`)
    }

    if (parts.length === 0) {
      return "You're all caught up! No urgent items today."
    }

    return parts.join(', ') + '.'
  }

  /**
   * Get user's briefing preferences
   */
  async getPreferences(userId: string) {
    const pref = await this.prisma.userPreference.findUnique({
      where: { userId },
    })

    return (
      pref || {
        dailyBriefingEnabled: true,
        dailyBriefingHour: 8,
        emailBriefing: false,
      }
    )
  }

  /**
   * Update user's briefing preferences
   */
  async updatePreferences(
    userId: string,
    data: {
      dailyBriefingEnabled?: boolean
      dailyBriefingHour?: number
      emailBriefing?: boolean
    },
  ) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    })
  }

  /**
   * Cron job to check and send briefings
   * Runs every hour at minute 0
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledBriefingCheck() {
    const currentHour = new Date().getUTCHours()
    this.logger.log(`Running briefing check for hour ${currentHour} UTC`)

    // Find users who have briefings enabled for this hour
    const usersToNotify = await this.prisma.userPreference.findMany({
      where: {
        dailyBriefingEnabled: true,
        dailyBriefingHour: currentHour,
      },
    })

    this.logger.log(
      `Found ${usersToNotify.length} users for briefing at hour ${currentHour}`,
    )

    for (const pref of usersToNotify) {
      try {
        // Get ALL workspace memberships for proper multi-tenant isolation
        const memberships = await this.prisma.workspaceMember.findMany({
          where: { userId: pref.userId },
        })

        // Generate briefing for EACH workspace the user belongs to
        for (const membership of memberships) {
          const briefing = await this.generateBriefing(
            pref.userId,
            membership.workspaceId,
          )
          // TODO: Emit via WebSocket or create notification record
          this.logger.log(
            `Generated briefing for user ${pref.userId} in workspace ${membership.workspaceId}: ${briefing.summary}`,
          )
        }
      } catch (error) {
        this.logger.error(
          `Failed to generate briefing for user ${pref.userId}:`,
          error,
        )
      }
    }
  }
}
