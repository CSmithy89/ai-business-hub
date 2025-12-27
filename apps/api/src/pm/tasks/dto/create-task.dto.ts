import { AssignmentType, TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsDate, IsDefined, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'
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
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return value
}

export class CreateTaskDto {
  @ApiProperty({ required: false, description: 'Workspace ID (inferred from API key if not provided)' })
  @IsOptional()
  @IsString()
  workspaceId?: string

  @ApiProperty({ description: 'Project ID this task belongs to', example: 'cm4abc123xyz' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @ApiProperty({ description: 'Phase ID this task belongs to', example: 'cm4def456uvw' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  phaseId!: string

  @ApiProperty({ description: 'Task title', example: 'Implement user authentication' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  title!: string

  @ApiProperty({
    required: false,
    description: 'Detailed task description',
    example: 'Add OAuth2 authentication with Google and GitHub providers'
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    required: false,
    enum: TaskType,
    description: 'Type of task',
    example: TaskType.STORY
  })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType

  @ApiProperty({
    required: false,
    enum: TaskPriority,
    description: 'Task priority level',
    example: TaskPriority.HIGH
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority

  @ApiProperty({
    required: false,
    enum: AssignmentType,
    description: 'How task is assigned (HUMAN, AI_AGENT, HYBRID)',
    example: AssignmentType.HUMAN
  })
  @IsOptional()
  @IsEnum(AssignmentType)
  assignmentType?: AssignmentType

  @ApiProperty({
    required: false,
    description: 'User ID to assign task to (for HUMAN or HYBRID assignments)',
    example: 'cm4user789rst',
    nullable: true
  })
  @IsOptional()
  @IsString()
  assigneeId?: string | null

  @ApiProperty({
    required: false,
    description: 'Agent ID to assign task to (for AI_AGENT or HYBRID assignments)',
    example: 'agent-pm-planner',
    nullable: true
  })
  @IsOptional()
  @IsString()
  agentId?: string | null

  @ApiProperty({
    required: false,
    description: 'Story points for estimation',
    example: 5,
    minimum: 0,
    nullable: true
  })
  @IsOptional()
  @Transform(({ value }) => toOptionalNumber(value), { toClassOnly: true })
  @IsInt()
  @Min(0)
  storyPoints?: number | null

  @ApiProperty({
    required: false,
    description: 'Task due date (ISO 8601 format)',
    example: '2025-01-15T18:00:00Z',
    type: Date,
    nullable: true
  })
  @IsOptional()
  @Transform(({ value }) => toOptionalDate(value), { toClassOnly: true })
  @IsDate()
  dueDate?: Date | null

  @ApiProperty({
    required: false,
    description: 'Parent task ID (for subtasks)',
    example: 'cm4parent123abc',
    nullable: true
  })
  @IsOptional()
  @IsString()
  parentId?: string | null

  @ApiProperty({
    required: false,
    enum: TaskStatus,
    description: 'Initial task status',
    example: TaskStatus.TODO,
    default: TaskStatus.TODO
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus
}
