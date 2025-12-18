import { AssignmentType, TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsDate, IsDefined, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

function toOptionalNumber(value: unknown): unknown {
  if (value === undefined || value === null) return value
  if (typeof value === 'string' && value.trim() === '') return undefined
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return value
}

function toOptionalDate(value: unknown): unknown {
  if (value === undefined || value === null) return value
  if (typeof value === 'string' && value.trim() === '') return undefined
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return value
}

export class CreateTaskDto {
  @IsOptional()
  @IsString()
  workspaceId?: string

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  phaseId!: string

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  title!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority

  @IsOptional()
  @IsEnum(AssignmentType)
  assignmentType?: AssignmentType

  @IsOptional()
  @IsString()
  assigneeId?: string | null

  @IsOptional()
  @IsString()
  agentId?: string | null

  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value), { toClassOnly: true })
  @IsInt()
  @Min(0)
  storyPoints?: number | null

  @IsOptional()
  @Transform(({ value }) => toOptionalDate(value), { toClassOnly: true })
  @IsDate()
  dueDate?: Date | null

  @IsOptional()
  @IsString()
  parentId?: string | null

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus
}
