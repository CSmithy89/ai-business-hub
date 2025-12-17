import { ApprovalStatus, AssignmentType, TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string | null

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

  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean

  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus

  @IsOptional()
  @IsString()
  approvedBy?: string | null

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  approvedAt?: Date | null

  @IsOptional()
  @IsString()
  phaseId?: string

  @IsOptional()
  @IsString()
  parentId?: string | null
}

