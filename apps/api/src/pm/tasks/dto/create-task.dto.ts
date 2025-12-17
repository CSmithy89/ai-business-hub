import { AssignmentType, TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CreateTaskDto {
  @IsOptional()
  @IsString()
  workspaceId?: string

  @IsString()
  projectId!: string

  @IsString()
  phaseId!: string

  @IsString()
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
  @Type(() => Number)
  @IsInt()
  @Min(0)
  storyPoints?: number | null

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date | null

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus
}

