import { Injectable } from '@nestjs/common'
import { Prisma, TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { Readable } from 'node:stream'
import { PrismaService } from '../../common/services/prisma.service'
import { ExportTasksQueryDto } from './dto/export-tasks.query.dto'

const DEFAULT_FIELDS = [
  'taskNumber',
  'title',
  'status',
  'priority',
  'type',
  'assigneeId',
  'dueDate',
] as const

const ALLOWED_FIELDS = new Set([
  'taskNumber',
  'title',
  'description',
  'status',
  'priority',
  'type',
  'assigneeId',
  'dueDate',
  'phaseId',
  'projectId',
  'createdAt',
  'updatedAt',
])

const PAGE_SIZE = 500

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportTasks(workspaceId: string, query: ExportTasksQueryDto) {
    const fields = resolveFields(query.fields)
    const where = buildWhere(workspaceId, query)

    const stream = Readable.from(this.buildCsvStream(fields, where))

    return {
      stream,
      fields,
    }
  }

  private async *buildCsvStream(fields: string[], where: Prisma.TaskWhereInput) {
    yield `${fields.join(',')}\n`

    let cursor: string | null = null
    while (true) {
      const batch = await this.prisma.task.findMany({
        where,
        orderBy: { id: 'asc' },
        take: PAGE_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          taskNumber: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          type: true,
          assigneeId: true,
          dueDate: true,
          phaseId: true,
          projectId: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (batch.length === 0) break

      for (const task of batch) {
        const row = fields.map((field) => formatCsvValue(selectField(task, field)))
        yield `${row.join(',')}\n`
      }

      cursor = batch[batch.length - 1].id
    }
  }
}

function resolveFields(fields?: string[]): string[] {
  const selected = (fields || []).filter((field) => ALLOWED_FIELDS.has(field))
  return selected.length > 0 ? selected : [...DEFAULT_FIELDS]
}

function buildWhere(workspaceId: string, query: ExportTasksQueryDto): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    workspaceId,
    deletedAt: null,
  }

  if (query.projectId) where.projectId = query.projectId
  if (query.phaseId) where.phaseId = query.phaseId

  const statuses = parseEnumList(TaskStatus, query.status)
  if (statuses.length === 1) {
    where.status = statuses[0]
  } else if (statuses.length > 1) {
    where.status = { in: statuses }
  }

  const types = parseEnumList(TaskType, query.type)
  if (types.length === 1) {
    where.type = types[0]
  }

  const priorities = parseEnumList(TaskPriority, query.priority)
  if (priorities.length === 1) {
    where.priority = priorities[0]
  }

  if (query.assigneeId) where.assigneeId = query.assigneeId

  const labels = parseList(query.labels)
  if (labels.length > 0) {
    where.labels = {
      some: {
        name: { in: labels, mode: 'insensitive' },
      },
    }
  }

  const dueDateFilter = buildDateRange(query.dueDateFrom, query.dueDateTo)
  if (dueDateFilter) {
    where.dueDate = dueDateFilter
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      ...(/^[0-9]+$/.test(query.search) ? [{ taskNumber: parseInt(query.search, 10) }] : []),
    ]
  }

  return where
}

function parseEnumList<T extends string>(enumValues: Record<string, T>, value?: string): T[] {
  if (!value) return []
  const list = parseList(value)
  const allowed = new Set(Object.values(enumValues))
  return list
    .map((item) => normalizeEnum(item))
    .filter((item): item is T => allowed.has(item as T))
}

function parseList(value?: string): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function normalizeEnum(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_')
}

function buildDateRange(from?: string, to?: string): Prisma.DateTimeNullableFilter | null {
  if (!from && !to) return null

  const filter: Prisma.DateTimeNullableFilter = {}
  if (from) {
    const fromDate = new Date(from)
    if (!Number.isNaN(fromDate.getTime())) {
      filter.gte = fromDate
    }
  }
  if (to) {
    const toDate = new Date(to)
    if (!Number.isNaN(toDate.getTime())) {
      filter.lte = toDate
    }
  }

  return Object.keys(filter).length > 0 ? filter : null
}

function selectField(task: any, field: string): string | number | null {
  const value = task[field as keyof typeof task]
  if (value === undefined || value === null) return ''
  if (value instanceof Date) return value.toISOString()
  return value
}

function formatCsvValue(value: string | number | null): string {
  if (value === null || value === undefined) return ''
  const raw = String(value)
  if (/[
",]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}
