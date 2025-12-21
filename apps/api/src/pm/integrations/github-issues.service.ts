import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ExternalLinkType, IntegrationProvider, TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { PrismaService } from '../../common/services/prisma.service'
import { TasksService } from '../tasks/tasks.service'
import { IntegrationsService } from './integrations.service'
import { GithubIssuesSyncDto } from './dto/github-issues-sync.dto'

@Injectable()
export class GithubIssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  async syncIssues(workspaceId: string, actorId: string, dto: GithubIssuesSyncDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, workspaceId, deletedAt: null },
      select: { id: true, phases: { select: { id: true, status: true } } },
    })

    if (!project) throw new NotFoundException('Project not found')

    const phaseId = resolveDefaultPhaseId(project.phases)
    if (!phaseId) throw new BadRequestException('No valid phase for issue sync')

    const token = await this.integrationsService.getProviderToken(workspaceId, IntegrationProvider.GITHUB)

    const issues = await fetchIssues(token, dto.owner, dto.repo, dto.state ?? 'open')
    const issueIds = issues.map((issue) => buildIssueExternalId(dto.owner, dto.repo, issue.number))

    const existingLinks = await this.prisma.externalLink.findMany({
      where: {
        workspaceId,
        provider: IntegrationProvider.GITHUB,
        linkType: ExternalLinkType.ISSUE,
        externalId: { in: issueIds },
      },
      select: { externalId: true },
    })

    const existingSet = new Set(existingLinks.map((link) => link.externalId))
    let created = 0
    let skipped = 0

    for (const issue of issues) {
      const externalId = buildIssueExternalId(dto.owner, dto.repo, issue.number)
      if (existingSet.has(externalId)) {
        skipped += 1
        continue
      }

      const status = issue.state === 'closed' ? TaskStatus.DONE : TaskStatus.TODO
      const description = buildIssueDescription(issue)

      const task = await this.tasksService.create(workspaceId, actorId, {
        projectId: dto.projectId,
        phaseId,
        title: issue.title || `GitHub Issue #${issue.number}`,
        description,
        status,
        priority: TaskPriority.MEDIUM,
        type: TaskType.TASK,
      })

      await this.prisma.externalLink.create({
        data: {
          workspaceId,
          taskId: task.data.id,
          provider: IntegrationProvider.GITHUB,
          linkType: ExternalLinkType.ISSUE,
          externalId,
          externalUrl: issue.html_url,
          metadata: {
            repo: `${dto.owner}/${dto.repo}`,
            state: issue.state,
            labels: issue.labels.map((label) => label.name),
          },
        },
      })

      created += 1
    }

    await this.prisma.integrationConnection.updateMany({
      where: { workspaceId, provider: IntegrationProvider.GITHUB },
      data: { lastCheckedAt: new Date() },
    })

    return {
      data: {
        total: issues.length,
        created,
        skipped,
      },
    }
  }
}

function resolveDefaultPhaseId(phases: Array<{ id: string; status: string }>): string | null {
  const current = phases.find((phase) => phase.status === 'CURRENT')
  return current?.id ?? phases[0]?.id ?? null
}

// Fetch timeout for external API calls (30 seconds)
const FETCH_TIMEOUT_MS = 30_000
// Maximum pages to fetch (100 issues per page = 500 issues max)
const MAX_PAGES = 5

type GitHubIssue = {
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  pull_request?: unknown
  labels: Array<{ name: string }>
}

async function fetchIssues(
  token: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all',
): Promise<GitHubIssue[]> {
  const allIssues: GitHubIssue[] = []
  let page = 1

  while (page <= MAX_PAGES) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=100&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
          signal: controller.signal,
        },
      )

      if (!response.ok) {
        throw new BadRequestException(`Failed to fetch GitHub issues: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as GitHubIssue[]

      // Filter out pull requests and add to results
      const issues = data.filter((issue) => !issue.pull_request)
      allIssues.push(...issues)

      // Stop if we got fewer than 100 results (no more pages)
      if (data.length < 100) break

      page += 1
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BadRequestException('GitHub API request timed out')
      }
      throw new BadRequestException('Failed to connect to GitHub API')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return allIssues
}

function buildIssueDescription(issue: {
  body: string | null
  html_url: string
}) {
  const body = issue.body ? issue.body.trim() : ''
  const link = `\n\nGitHub: ${issue.html_url}`
  return body ? `${body}${link}` : `Imported from GitHub.${link}`
}

function buildIssueExternalId(owner: string, repo: string, issueNumber: number): string {
  return `${owner}/${repo}#${issueNumber}`
}
