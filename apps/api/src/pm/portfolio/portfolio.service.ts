import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/services/prisma.service'
import { RedisProvider } from '../../events/redis.provider'
import { PortfolioQueryDto } from './dto/portfolio-query.dto'

const PORTFOLIO_CACHE_TTL_SECONDS = 60

type PortfolioProject = {
  id: string
  slug: string
  name: string
  status: string
  type: string
  color: string
  icon: string
  totalTasks: number
  completedTasks: number
  startDate: string | null
  targetDate: string | null
  healthScore: number
  team: {
    leadUserId: string | null
    leadName: string | null
    memberCount: number
  }
}

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisProvider: RedisProvider,
  ) {}

  async getPortfolio(workspaceId: string, query: PortfolioQueryDto) {
    const from = query.from && !Number.isNaN(query.from.getTime()) ? query.from : undefined
    const to = query.to && !Number.isNaN(query.to.getTime()) ? query.to : undefined

    const cacheKey = `pm:portfolio:${workspaceId}:${JSON.stringify({
      status: query.status ?? null,
      teamLeadId: query.teamLeadId ?? null,
      search: query.search ?? null,
      from: from ? from.toISOString() : null,
      to: to ? to.toISOString() : null,
    })}`

    const cached = await this.getCachedPortfolio(cacheKey)
    if (cached) {
      return cached
    }

    const where: Prisma.ProjectWhereInput = {
      workspaceId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.teamLeadId ? { team: { leadUserId: query.teamLeadId } } : {}),
    }

    const andFilters: Prisma.ProjectWhereInput[] = []

    if (query.search) {
      andFilters.push({
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
        ],
      })
    }

    if (from || to) {
      const range: Prisma.DateTimeFilter = {}
      if (from) range.gte = from
      if (to) range.lte = to
      andFilters.push({
        OR: [{ targetDate: range }, { startDate: range }],
      })
    }

    if (andFilters.length > 0) {
      where.AND = andFilters
    }

    const projects = await this.prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        type: true,
        color: true,
        icon: true,
        totalTasks: true,
        completedTasks: true,
        healthScore: true,
        startDate: true,
        targetDate: true,
        team: {
          select: {
            leadUserId: true,
            members: {
              where: { isActive: true },
              select: { userId: true },
            },
          },
        },
      },
    })

    const leadIds = Array.from(
      new Set(
        projects
          .map((project) => project.team?.leadUserId)
          .filter((id): id is string => Boolean(id))
      )
    )

    const leadUsers = leadIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: leadIds }, workspaces: { some: { workspaceId } } },
          select: { id: true, name: true, email: true },
        })
      : []

    const leadMap = new Map(
      leadUsers.map((user) => [user.id, user.name ?? user.email ?? 'Team lead'])
    )

    const portfolioProjects: PortfolioProject[] = projects.map((project) => {
      const totalTasks = project.totalTasks ?? 0
      const completedTasks = project.completedTasks ?? 0
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      const healthScore = project.healthScore ?? progress
      const leadUserId = project.team?.leadUserId ?? null
      const leadName = leadUserId ? leadMap.get(leadUserId) ?? null : null

      return {
        id: project.id,
        slug: project.slug,
        name: project.name,
        status: project.status,
        type: project.type,
        color: project.color,
        icon: project.icon,
        totalTasks,
        completedTasks,
        startDate: project.startDate ? project.startDate.toISOString() : null,
        targetDate: project.targetDate ? project.targetDate.toISOString() : null,
        healthScore,
        team: {
          leadUserId,
          leadName,
          memberCount: project.team?.members.length ?? 0,
        },
      }
    })

    const healthScores = portfolioProjects
      .map((project) => project.healthScore)
      .filter((score) => Number.isFinite(score))

    const averageHealth =
      healthScores.length > 0
        ? Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)
        : null

    const healthSummary = {
      averageScore: averageHealth,
      onTrack: portfolioProjects.filter((project) => project.healthScore >= 75).length,
      watch: portfolioProjects.filter((project) => project.healthScore >= 50 && project.healthScore < 75).length,
      atRisk: portfolioProjects.filter((project) => project.healthScore < 50).length,
    }

    const totals = {
      totalProjects: portfolioProjects.length,
      activeProjects: portfolioProjects.filter((project) => project.status === 'ACTIVE').length,
      onHoldProjects: portfolioProjects.filter((project) => project.status === 'ON_HOLD').length,
      completedProjects: portfolioProjects.filter((project) => project.status === 'COMPLETED').length,
    }

    const teamLeads = leadUsers.map((user) => ({
      id: user.id,
      name: user.name ?? user.email ?? 'Team lead',
    }))

    const response = {
      data: {
        totals,
        health: healthSummary,
        teamLeads,
        projects: portfolioProjects,
      },
    }

    await this.setCachedPortfolio(cacheKey, response)
    return response
  }

  private async getCachedPortfolio(cacheKey: string): Promise<{ data: unknown } | null> {
    try {
      const redis = this.redisProvider.getClient()
      const cached = await redis.get(cacheKey)
      if (!cached) return null
      return JSON.parse(cached) as { data: unknown }
    } catch {
      return null
    }
  }

  private async setCachedPortfolio(cacheKey: string, value: { data: unknown }): Promise<void> {
    try {
      const redis = this.redisProvider.getClient()
      await redis.set(cacheKey, JSON.stringify(value), 'EX', PORTFOLIO_CACHE_TTL_SECONDS)
    } catch {
      // Best-effort cache only
    }
  }
}
