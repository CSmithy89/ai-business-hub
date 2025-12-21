import { BadRequestException, Injectable } from '@nestjs/common'
import { ExternalLinkType, IntegrationProvider, TaskStatus } from '@prisma/client'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class GithubPullRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async handleWebhook(workspaceId: string, payload: any) {
    const event = payload?.pull_request
    if (!event) {
      return { data: { linked: 0, skipped: 0 } }
    }

    const repoFullName = payload?.repository?.full_name || event?.base?.repo?.full_name
    if (!repoFullName) throw new BadRequestException('Repository missing')

    const taskNumber = extractTaskNumber(event?.head?.ref, event?.title, event?.body)
    if (!taskNumber) {
      return { data: { linked: 0, skipped: 1 } }
    }

    const projectId = await resolveProjectId(this.prisma, workspaceId, repoFullName)

    const task = await this.prisma.task.findFirst({
      where: {
        workspaceId,
        taskNumber,
        deletedAt: null,
        ...(projectId ? { projectId } : {}),
      },
      select: { id: true },
    })

    if (!task) {
      return { data: { linked: 0, skipped: 1 } }
    }

    const externalId = `${repoFullName}#${event.number}`

    const existing = await this.prisma.externalLink.findFirst({
      where: {
        workspaceId,
        provider: IntegrationProvider.GITHUB,
        linkType: ExternalLinkType.PR,
        externalId,
      },
      select: { id: true },
    })

    const metadata = {
      repo: repoFullName,
      state: event.state,
      merged: event.merged,
      branch: event.head?.ref,
    }

    if (existing) {
      await this.prisma.externalLink.update({
        where: { id: existing.id },
        data: {
          externalUrl: event.html_url,
          metadata,
        },
      })
    } else {
      await this.prisma.externalLink.create({
        data: {
          workspaceId,
          taskId: task.id,
          provider: IntegrationProvider.GITHUB,
          linkType: ExternalLinkType.PR,
          externalId,
          externalUrl: event.html_url,
          metadata,
        },
      })
    }

    const autoComplete = await isAutoCompleteEnabled(this.prisma, workspaceId, repoFullName)
    if (autoComplete && event.merged) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.DONE,
          completedAt: new Date(),
        },
      })
    }

    return { data: { linked: 1, skipped: 0 } }
  }
}

function extractTaskNumber(...candidates: Array<string | null | undefined>): number | null {
  const pattern = /(PM[-\s]?|#)(\d+)/i
  for (const candidate of candidates) {
    if (!candidate) continue
    const match = candidate.match(pattern)
    if (match) {
      const value = match[2] ? parseInt(match[2], 10) : NaN
      if (!Number.isNaN(value)) return value
    }
  }
  return null
}

async function resolveProjectId(prisma: PrismaService, workspaceId: string, repoFullName: string) {
  const connections = await prisma.integrationConnection.findMany({
    where: { workspaceId, provider: IntegrationProvider.GITHUB },
    select: { metadata: true },
  })

  for (const connection of connections) {
    const metadata = connection.metadata as { defaultRepo?: string; defaultProjectId?: string } | null
    if (metadata?.defaultRepo === repoFullName && metadata.defaultProjectId) {
      return metadata.defaultProjectId
    }
  }

  return null
}

async function isAutoCompleteEnabled(prisma: PrismaService, workspaceId: string, repoFullName: string) {
  const connection = await prisma.integrationConnection.findFirst({
    where: { workspaceId, provider: IntegrationProvider.GITHUB },
    select: { metadata: true },
  })

  const metadata = connection?.metadata as { autoCompleteOnMerge?: boolean; defaultRepo?: string } | null
  if (metadata?.defaultRepo && metadata.defaultRepo !== repoFullName) {
    return false
  }

  return Boolean(metadata?.autoCompleteOnMerge)
}
