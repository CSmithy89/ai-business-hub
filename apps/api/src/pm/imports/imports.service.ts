import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ExternalLinkType, ImportSource, ImportStatus, IntegrationProvider, TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { parseCsv } from '@hyvve/shared'
import { PrismaService } from '../../common/services/prisma.service'
import { TasksService } from '../tasks/tasks.service'
import { StartCsvImportDto } from './dto/start-csv-import.dto'
import { StartJiraImportDto } from './dto/start-jira-import.dto'
import { StartAsanaImportDto } from './dto/start-asana-import.dto'
import { StartTrelloImportDto } from './dto/start-trello-import.dto'
import type { CreateTaskDto } from '../tasks/dto/create-task.dto'

// Fetch timeout for external API calls (30 seconds)
const FETCH_TIMEOUT_MS = 30_000

const CSV_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'type',
  'dueDate',
  'assigneeEmail',
  'phaseName',
  'phaseId',
] as const

type CsvField = (typeof CSV_FIELDS)[number]

type RowError = {
  rowNumber: number
  field?: string
  message: string
  rawRow?: Record<string, string | null>
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  async startCsvImport(workspaceId: string, actorId: string, dto: StartCsvImportDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, workspaceId, deletedAt: null },
      select: {
        id: true,
        phases: { select: { id: true, name: true, status: true } },
      },
    })

    if (!project) throw new NotFoundException('Project not found')

    const defaultPhaseId = this.resolveDefaultPhaseId(project.phases, dto.phaseId)
    if (!defaultPhaseId) {
      throw new BadRequestException('No valid phase found for import')
    }

    // Strip BOM from entire CSV text before parsing
    const cleanedCsvText = stripBom(dto.csvText)
    const parsed = parseCsv(cleanedCsvText)
    if (parsed.length < 2) {
      throw new BadRequestException('CSV must include a header row and at least one data row')
    }

    const [headerRow, ...rows] = parsed

    const headerIndex = buildHeaderIndex(headerRow)
    const mapping = normalizeMapping(dto.mapping)

    validateMapping(mapping, headerIndex)

    // Pre-fetch all assignees to avoid N+1 query problem
    const assigneeEmails = extractUniqueAssigneeEmails(rows, headerIndex, mapping)
    const assigneeMap = await batchLookupAssignees(this.prisma, workspaceId, assigneeEmails)

    const job = await this.prisma.importJob.create({
      data: {
        workspaceId,
        projectId: dto.projectId,
        source: ImportSource.CSV,
        status: ImportStatus.RUNNING,
        totalRows: rows.length,
        mappingConfig: {
          mapping,
          defaultPhaseId,
        },
      },
      select: { id: true },
    })

    const errors: RowError[] = []
    let processedRows = 0
    let errorsPersisted = false

    const persistErrors = async () => {
      if (errorsPersisted || errors.length === 0) return
      await this.prisma.importError.createMany({
        data: errors.map((err) => ({
          importJobId: job.id,
          rowNumber: err.rowNumber,
          field: err.field,
          message: err.message,
          rawRow: err.rawRow,
        })),
      })
      errorsPersisted = true
    }

    try {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index]
        const rowNumber = index + 2
        const rowContext = buildRowContext(headerRow, row)
        const rowErrors: RowError[] = []

        const title = getMappedValue(row, headerIndex, mapping, 'title')
        if (!title) {
          rowErrors.push({ rowNumber, field: 'title', message: 'Title is required', rawRow: rowContext })
        }

        const description = getMappedValue(row, headerIndex, mapping, 'description')
        const statusValue = getMappedValue(row, headerIndex, mapping, 'status')
        const priorityValue = getMappedValue(row, headerIndex, mapping, 'priority')
        const typeValue = getMappedValue(row, headerIndex, mapping, 'type')
        const dueDateValue = getMappedValue(row, headerIndex, mapping, 'dueDate')
        const assigneeEmail = getMappedValue(row, headerIndex, mapping, 'assigneeEmail')
        const phaseName = getMappedValue(row, headerIndex, mapping, 'phaseName')
        const phaseIdValue = getMappedValue(row, headerIndex, mapping, 'phaseId')

        const status = mapEnumValue(TaskStatus, statusValue, 'status', rowErrors, rowNumber, rowContext)
        const priority = mapEnumValue(TaskPriority, priorityValue, 'priority', rowErrors, rowNumber, rowContext)
        const type = mapEnumValue(TaskType, typeValue, 'type', rowErrors, rowNumber, rowContext)

        const dueDate = parseOptionalDate(dueDateValue, rowErrors, rowNumber, rowContext)

        const phaseId = resolvePhaseId({
          phaseIdValue,
          phaseName,
          phases: project.phases,
          defaultPhaseId,
          rowNumber,
          rowContext,
          errors: rowErrors,
        })

        const assigneeId = resolveAssigneeFromMap({
          assigneeMap,
          email: assigneeEmail,
          rowNumber,
          rowContext,
          errors: rowErrors,
        })

        if (rowErrors.length > 0) {
          errors.push(...rowErrors)
          if (!dto.skipInvalidRows) {
            throw new BadRequestException({
              message: 'CSV validation failed',
              errors: rowErrors,
            })
          }
          processedRows += 1
          continue
        }

        const taskInput: CreateTaskDto = {
          projectId: dto.projectId,
          phaseId,
          title: title ?? '',
          description: description || undefined,
          status: status ?? undefined,
          priority: priority ?? undefined,
          type: type ?? undefined,
          dueDate: dueDate ?? undefined,
          assigneeId: assigneeId ?? undefined,
        }

        try {
          await this.tasksService.create(workspaceId, actorId, taskInput)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create task'
          errors.push({ rowNumber, message, rawRow: rowContext })
        }

        processedRows += 1
      }
    } catch (error) {
      await persistErrors()
      await this.prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: ImportStatus.FAILED,
          processedRows,
          errorCount: errors.length,
        },
      })
      throw error
    }

    await persistErrors()

    const updated = await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: ImportStatus.COMPLETED,
        processedRows,
        errorCount: errors.length,
      },
      select: {
        id: true,
        status: true,
        totalRows: true,
        processedRows: true,
        errorCount: true,
        createdAt: true,
      },
    })

    return { data: updated }
  }

  async startJiraImport(workspaceId: string, actorId: string, dto: StartJiraImportDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, workspaceId, deletedAt: null },
      select: {
        id: true,
        phases: { select: { id: true, status: true } },
      },
    })

    if (!project) throw new NotFoundException('Project not found')

    const defaultPhaseId = this.resolveDefaultPhaseId(project.phases, undefined)
    if (!defaultPhaseId) {
      throw new BadRequestException('No valid phase found for import')
    }

    const job = await this.prisma.importJob.create({
      data: {
        workspaceId,
        projectId: dto.projectId,
        source: ImportSource.JIRA,
        status: ImportStatus.RUNNING,
      },
      select: { id: true },
    })

    const jiraBaseUrl = dto.baseUrl.replace(/\/$/, '')
    let issues: Awaited<ReturnType<typeof fetchJiraIssues>> = []

    try {
      issues = await fetchJiraIssues({ ...dto, baseUrl: jiraBaseUrl })
    } catch (error) {
      await this.prisma.importJob.update({
        where: { id: job.id },
        data: { status: ImportStatus.FAILED, errorCount: 1 },
      })
      throw error
    }

    const errors: RowError[] = []
    let processedRows = 0
    let errorsPersisted = false

    const persistErrors = async () => {
      if (errorsPersisted || errors.length === 0) return
      await this.prisma.importError.createMany({
        data: errors.map((err) => ({
          importJobId: job.id,
          rowNumber: err.rowNumber,
          field: err.field,
          message: err.message,
          rawRow: err.rawRow,
        })),
      })
      errorsPersisted = true
    }

    for (let index = 0; index < issues.length; index += 1) {
      const issue = issues[index]
      const rowNumber = index + 1
      const summary = issue.fields.summary?.trim()
      if (!summary) {
        errors.push({ rowNumber, field: 'summary', message: 'Missing summary' })
        processedRows += 1
        continue
      }

      const status = mapJiraStatus(issue)
      const description = buildJiraDescription(issue, jiraBaseUrl)

      try {
        // Use transaction to ensure task and external link are created atomically
        await this.prisma.$transaction(async (tx) => {
          const task = await this.tasksService.createWithTransaction(tx, workspaceId, actorId, {
            projectId: dto.projectId,
            phaseId: defaultPhaseId,
            title: summary,
            description,
            status,
            priority: TaskPriority.MEDIUM,
            type: TaskType.TASK,
          })

          await tx.externalLink.create({
            data: {
              workspaceId,
              taskId: task.data.id,
              provider: IntegrationProvider.JIRA,
              linkType: ExternalLinkType.TICKET,
              externalId: issue.key,
              externalUrl: `${jiraBaseUrl}/browse/${issue.key}`,
              metadata: {
                status: issue.fields.status?.name,
                issueType: issue.fields.issuetype?.name,
              },
            },
          })
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create task'
        errors.push({ rowNumber, message, rawRow: { key: issue.key, summary } })
      }

      processedRows += 1
    }

    await persistErrors()

    const updated = await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: ImportStatus.COMPLETED,
        processedRows,
        totalRows: issues.length,
        errorCount: errors.length,
      },
      select: {
        id: true,
        status: true,
        totalRows: true,
        processedRows: true,
        errorCount: true,
        createdAt: true,
      },
    })

    return { data: updated }
  }

  async startAsanaImport(workspaceId: string, actorId: string, dto: StartAsanaImportDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, workspaceId, deletedAt: null },
      select: { id: true, phases: { select: { id: true, status: true } } },
    })

    if (!project) throw new NotFoundException('Project not found')

    const defaultPhaseId = this.resolveDefaultPhaseId(project.phases, undefined)
    if (!defaultPhaseId) throw new BadRequestException('No valid phase found for import')

    const job = await this.prisma.importJob.create({
      data: {
        workspaceId,
        projectId: dto.projectId,
        source: ImportSource.ASANA,
        status: ImportStatus.RUNNING,
      },
      select: { id: true },
    })

    const errors: RowError[] = []
    let tasks: Array<{ gid: string; name: string; notes?: string; completed: boolean }> = []

    try {
      tasks = await fetchAsanaTasks(dto)
    } catch (error) {
      await this.prisma.importJob.update({
        where: { id: job.id },
        data: { status: ImportStatus.FAILED, errorCount: 1 },
      })
      throw error
    }
    let processedRows = 0
    let errorsPersisted = false

    const persistErrors = async () => {
      if (errorsPersisted || errors.length === 0) return
      await this.prisma.importError.createMany({
        data: errors.map((err) => ({
          importJobId: job.id,
          rowNumber: err.rowNumber,
          field: err.field,
          message: err.message,
          rawRow: err.rawRow,
        })),
      })
      errorsPersisted = true
    }

    for (let index = 0; index < tasks.length; index += 1) {
      const item = tasks[index]
      const rowNumber = index + 1
      const title = item.name?.trim()
      if (!title) {
        errors.push({ rowNumber, field: 'name', message: 'Missing task name' })
        processedRows += 1
        continue
      }

      const status = item.completed ? TaskStatus.DONE : TaskStatus.TODO
      const description = item.notes || 'Imported from Asana.'

      try {
        // Use transaction to ensure task and external link are created atomically
        await this.prisma.$transaction(async (tx) => {
          const task = await this.tasksService.createWithTransaction(tx, workspaceId, actorId, {
            projectId: dto.projectId,
            phaseId: defaultPhaseId,
            title,
            description,
            status,
            priority: TaskPriority.MEDIUM,
            type: TaskType.TASK,
          })

          await tx.externalLink.create({
            data: {
              workspaceId,
              taskId: task.data.id,
              provider: IntegrationProvider.ASANA,
              linkType: ExternalLinkType.TICKET,
              externalId: item.gid,
              externalUrl: `https://app.asana.com/0/${dto.projectGid}/${item.gid}`,
              metadata: {
                completed: item.completed,
              },
            },
          })
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create task'
        errors.push({ rowNumber, message, rawRow: { gid: item.gid, name: title } })
      }

      processedRows += 1
    }

    await persistErrors()

    const updated = await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: ImportStatus.COMPLETED,
        processedRows,
        totalRows: tasks.length,
        errorCount: errors.length,
      },
      select: {
        id: true,
        status: true,
        totalRows: true,
        processedRows: true,
        errorCount: true,
        createdAt: true,
      },
    })

    return { data: updated }
  }

  async startTrelloImport(workspaceId: string, actorId: string, dto: StartTrelloImportDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, workspaceId, deletedAt: null },
      select: { id: true, phases: { select: { id: true, status: true } } },
    })

    if (!project) throw new NotFoundException('Project not found')

    const defaultPhaseId = this.resolveDefaultPhaseId(project.phases, undefined)
    if (!defaultPhaseId) throw new BadRequestException('No valid phase found for import')

    const job = await this.prisma.importJob.create({
      data: {
        workspaceId,
        projectId: dto.projectId,
        source: ImportSource.TRELLO,
        status: ImportStatus.RUNNING,
      },
      select: { id: true },
    })

    const errors: RowError[] = []
    let cards: Array<{ id: string; name: string; desc?: string; closed: boolean; idList: string; url: string }> = []

    try {
      cards = await fetchTrelloCards(dto)
    } catch (error) {
      await this.prisma.importJob.update({
        where: { id: job.id },
        data: { status: ImportStatus.FAILED, errorCount: 1 },
      })
      throw error
    }

    let processedRows = 0
    let errorsPersisted = false

    const persistErrors = async () => {
      if (errorsPersisted || errors.length === 0) return
      await this.prisma.importError.createMany({
        data: errors.map((err) => ({
          importJobId: job.id,
          rowNumber: err.rowNumber,
          field: err.field,
          message: err.message,
          rawRow: err.rawRow,
        })),
      })
      errorsPersisted = true
    }

    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index]
      const rowNumber = index + 1
      const title = card.name?.trim()
      if (!title) {
        errors.push({ rowNumber, field: 'name', message: 'Missing card name' })
        processedRows += 1
        continue
      }

      const status = card.closed ? TaskStatus.DONE : TaskStatus.TODO
      const description = card.desc || 'Imported from Trello.'

      try {
        // Use transaction to ensure task and external link are created atomically
        await this.prisma.$transaction(async (tx) => {
          const task = await this.tasksService.createWithTransaction(tx, workspaceId, actorId, {
            projectId: dto.projectId,
            phaseId: defaultPhaseId,
            title,
            description,
            status,
            priority: TaskPriority.MEDIUM,
            type: TaskType.TASK,
          })

          await tx.externalLink.create({
            data: {
              workspaceId,
              taskId: task.data.id,
              provider: IntegrationProvider.TRELLO,
              linkType: ExternalLinkType.TICKET,
              externalId: card.id,
              externalUrl: card.url,
              metadata: {
                closed: card.closed,
                listId: card.idList,
              },
            },
          })
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create task'
        errors.push({ rowNumber, message, rawRow: { id: card.id, name: title } })
      }

      processedRows += 1
    }

    await persistErrors()

    const updated = await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: ImportStatus.COMPLETED,
        processedRows,
        totalRows: cards.length,
        errorCount: errors.length,
      },
      select: {
        id: true,
        status: true,
        totalRows: true,
        processedRows: true,
        errorCount: true,
        createdAt: true,
      },
    })

    return { data: updated }
  }

  async getImportStatus(workspaceId: string, importJobId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: importJobId, workspaceId },
      select: {
        id: true,
        status: true,
        totalRows: true,
        processedRows: true,
        errorCount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!job) throw new NotFoundException('Import job not found')

    return { data: job }
  }

  async getImportErrors(workspaceId: string, importJobId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: importJobId, workspaceId },
      select: { id: true },
    })

    if (!job) throw new NotFoundException('Import job not found')

    const errors = await this.prisma.importError.findMany({
      where: { importJobId },
      orderBy: { rowNumber: 'asc' },
    })

    return { data: errors }
  }

  private resolveDefaultPhaseId(phases: Array<{ id: string; status: string }>, fallback?: string) {
    if (fallback && phases.some((phase) => phase.id === fallback)) return fallback
    const current = phases.find((phase) => phase.status === 'CURRENT')
    return current?.id ?? phases[0]?.id
  }
}

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, '')
}

function buildHeaderIndex(headers: string[]): Map<string, number> {
  const map = new Map<string, number>()
  headers.forEach((header, index) => {
    map.set(normalizeHeader(header), index)
  })
  return map
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase()
}

function normalizeMapping(mapping: Record<string, string>): Record<CsvField, string> {
  const normalized: Record<CsvField, string> = {} as Record<CsvField, string>
  CSV_FIELDS.forEach((field) => {
    const value = mapping[field] ?? ''
    normalized[field] = value
  })
  return normalized
}

function validateMapping(mapping: Record<CsvField, string>, headerIndex: Map<string, number>) {
  if (!mapping.title) {
    throw new BadRequestException('CSV mapping must include a title column')
  }

  CSV_FIELDS.forEach((field) => {
    const mappedHeader = mapping[field]
    if (!mappedHeader) return
    const normalized = normalizeHeader(mappedHeader)
    if (!headerIndex.has(normalized)) {
      throw new BadRequestException(`CSV mapping references unknown header: ${mappedHeader}`)
    }
  })
}

function getMappedValue(
  row: string[],
  headerIndex: Map<string, number>,
  mapping: Record<CsvField, string>,
  field: CsvField,
): string | null {
  const headerName = mapping[field]
  if (!headerName) return null
  const index = headerIndex.get(normalizeHeader(headerName))
  if (index === undefined) return null
  return row[index] ?? null
}

function mapEnumValue<T extends string>(
  enumValues: Record<string, T>,
  rawValue: string | null,
  field: string,
  errors: RowError[],
  rowNumber: number,
  rowContext: Record<string, string | null>,
): T | null {
  if (!rawValue) return null
  const normalized = rawValue.trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_')
  const allowed = Object.values(enumValues)
  const match = allowed.find((value) => value === normalized)
  if (!match) {
    errors.push({
      rowNumber,
      field,
      message: `Invalid ${field} value: ${rawValue}`,
      rawRow: rowContext,
    })
    return null
  }
  return match
}

function parseOptionalDate(
  value: string | null,
  errors: RowError[],
  rowNumber: number,
  rowContext: Record<string, string | null>,
): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    errors.push({
      rowNumber,
      field: 'dueDate',
      message: `Invalid due date: ${value}`,
      rawRow: rowContext,
    })
    return null
  }
  return parsed
}

function resolvePhaseId(params: {
  phaseIdValue: string | null
  phaseName: string | null
  phases: Array<{ id: string; name: string }>
  defaultPhaseId: string
  rowNumber: number
  rowContext: Record<string, string | null>
  errors: RowError[]
}): string {
  if (params.phaseIdValue) {
    const match = params.phases.find((phase) => phase.id === params.phaseIdValue)
    if (match) return match.id
    params.errors.push({
      rowNumber: params.rowNumber,
      field: 'phaseId',
      message: `Unknown phase ID: ${params.phaseIdValue}`,
      rawRow: params.rowContext,
    })
    return params.defaultPhaseId
  }

  if (params.phaseName) {
    const normalized = params.phaseName.trim().toLowerCase()
    const match = params.phases.find((phase) => phase.name.trim().toLowerCase() === normalized)
    if (match) return match.id
    params.errors.push({
      rowNumber: params.rowNumber,
      field: 'phaseName',
      message: `Unknown phase name: ${params.phaseName}`,
      rawRow: params.rowContext,
    })
    return params.defaultPhaseId
  }

  return params.defaultPhaseId
}

// Extract unique assignee emails from CSV rows for batch lookup
function extractUniqueAssigneeEmails(
  rows: string[][],
  headerIndex: Map<string, number>,
  mapping: Record<CsvField, string>,
): string[] {
  const emails = new Set<string>()
  for (const row of rows) {
    const email = getMappedValue(row, headerIndex, mapping, 'assigneeEmail')
    if (email) {
      emails.add(email.trim().toLowerCase())
    }
  }
  return Array.from(emails)
}

// Batch lookup all assignees in a single query
async function batchLookupAssignees(
  prisma: PrismaService,
  workspaceId: string,
  emails: string[],
): Promise<Map<string, string>> {
  if (emails.length === 0) return new Map()

  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      user: { email: { in: emails, mode: 'insensitive' } },
    },
    select: {
      userId: true,
      user: { select: { email: true } },
    },
  })

  const map = new Map<string, string>()
  for (const member of members) {
    if (member.user.email) {
      map.set(member.user.email.toLowerCase(), member.userId)
    }
  }
  return map
}

// Resolve assignee from pre-fetched map
function resolveAssigneeFromMap(params: {
  assigneeMap: Map<string, string>
  email: string | null
  rowNumber: number
  rowContext: Record<string, string | null>
  errors: RowError[]
}): string | null {
  if (!params.email) return null

  const normalizedEmail = params.email.trim().toLowerCase()
  const userId = params.assigneeMap.get(normalizedEmail)

  if (!userId) {
    params.errors.push({
      rowNumber: params.rowNumber,
      field: 'assigneeEmail',
      message: `Assignee not found: ${params.email}`,
      rawRow: params.rowContext,
    })
    return null
  }

  return userId
}

function buildRowContext(headers: string[], row: string[]): Record<string, string | null> {
  const context: Record<string, string | null> = {}
  headers.forEach((header, index) => {
    context[header] = row[index] ?? null
  })
  return context
}

async function fetchJiraIssues(dto: StartJiraImportDto) {
  const jql = dto.jql?.trim() || 'ORDER BY created DESC'
  const maxResults = dto.maxResults ?? 50
  const auth = Buffer.from(`${dto.email}:${dto.apiToken}`).toString('base64')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(
      `${dto.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      throw new BadGatewayException(`Failed to fetch Jira issues: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as {
      issues: Array<{
        key: string
        fields: {
          summary?: string
          description?: { content?: unknown } | string | null
          status?: { name?: string; statusCategory?: { key?: string } }
          issuetype?: { name?: string }
        }
      }>
    }

    return data.issues ?? []
  } catch (error) {
    if (error instanceof BadGatewayException) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BadGatewayException('Jira API request timed out')
    }
    throw new BadGatewayException('Failed to connect to Jira API')
  } finally {
    clearTimeout(timeoutId)
  }
}

function mapJiraStatus(issue: { fields: { status?: { statusCategory?: { key?: string } } } }): TaskStatus {
  const key = issue.fields.status?.statusCategory?.key
  if (key === 'done') return TaskStatus.DONE
  if (key === 'indeterminate') return TaskStatus.IN_PROGRESS
  return TaskStatus.TODO
}

function buildJiraDescription(
  issue: { fields: { description?: { content?: unknown } | string | null } },
  baseUrl: string,
) {
  if (typeof issue.fields.description === 'string') return issue.fields.description

  const link = `Imported from Jira (${baseUrl}).`
  return link
}

async function fetchAsanaTasks(dto: StartAsanaImportDto) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(
      `https://app.asana.com/api/1.0/projects/${dto.projectGid}/tasks?opt_fields=name,notes,completed`,
      {
        headers: {
          Authorization: `Bearer ${dto.accessToken}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      throw new BadGatewayException(`Failed to fetch Asana tasks: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as {
      data: Array<{ gid: string; name: string; notes?: string; completed: boolean }>
    }

    return data.data ?? []
  } catch (error) {
    if (error instanceof BadGatewayException) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BadGatewayException('Asana API request timed out')
    }
    throw new BadGatewayException('Failed to connect to Asana API')
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchTrelloCards(dto: StartTrelloImportDto) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(
      `https://api.trello.com/1/boards/${dto.boardId}/cards?fields=name,desc,closed,idList,url&key=${dto.apiKey}&token=${dto.token}`,
      { signal: controller.signal },
    )

    if (!response.ok) {
      throw new BadGatewayException(`Failed to fetch Trello cards: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as Array<{
      id: string
      name: string
      desc?: string
      closed: boolean
      idList: string
      url: string
    }>

    return data
  } catch (error) {
    if (error instanceof BadGatewayException) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BadGatewayException('Trello API request timed out')
    }
    throw new BadGatewayException('Failed to connect to Trello API')
  } finally {
    clearTimeout(timeoutId)
  }
}
