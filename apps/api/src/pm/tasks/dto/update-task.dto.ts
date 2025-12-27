import { ApprovalStatus, AssignmentType, TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

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
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed
  }
  return value
}

export class UpdateTaskDto {
  @ApiProperty({ required: false, description: 'Task title', example: 'Implement user authentication' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string

  @ApiProperty({
    required: false,
    description: 'Detailed task description',
    example: 'Add OAuth2 authentication with Google and GitHub providers',
    nullable: true
  })
  @IsOptional()
  @IsString()
  description?: string | null

  @ApiProperty({ required: false, enum: TaskType, description: 'Type of task' })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType

  @ApiProperty({ required: false, enum: TaskPriority, description: 'Task priority level' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority

  @ApiProperty({ required: false, enum: AssignmentType, description: 'How task is assigned' })
  @IsOptional()
  @IsEnum(AssignmentType)
  assignmentType?: AssignmentType

  @ApiProperty({ required: false, description: 'User ID to assign task to', nullable: true })
  @IsOptional()
  @IsString()
  assigneeId?: string | null

  @ApiProperty({ required: false, description: 'Agent ID to assign task to', nullable: true })
  @IsOptional()
  @IsString()
  agentId?: string | null

  @ApiProperty({ required: false, description: 'Story points for estimation', minimum: 0, nullable: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value), { toClassOnly: true })
  @IsInt()
  @Min(0)
  storyPoints?: number | null

  @ApiProperty({ required: false, description: 'Task due date (ISO 8601 format)', type: Date, nullable: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalDate(value), { toClassOnly: true })
  @IsDate()
  dueDate?: Date | null

  @ApiProperty({ required: false, description: 'Task start date (ISO 8601 format)', type: Date, nullable: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalDate(value), { toClassOnly: true })
  @IsDate()
  startedAt?: Date | null

  @ApiProperty({ required: false, enum: TaskStatus, description: 'Task status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus

  @ApiProperty({ required: false, description: 'Whether task requires approval' })
  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean

  @ApiProperty({ required: false, enum: ApprovalStatus, description: 'Approval status' })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus

  @ApiProperty({ required: false, description: 'User ID who approved the task', nullable: true })
  @IsOptional()
  @IsString()
  approvedBy?: string | null

  @ApiProperty({ required: false, description: 'Timestamp when task was approved', type: Date, nullable: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalDate(value), { toClassOnly: true })
  @IsDate()
  approvedAt?: Date | null

  @ApiProperty({ required: false, description: 'Phase ID to move task to' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phaseId?: string

  @ApiProperty({ required: false, description: 'Parent task ID', nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string | null
}
