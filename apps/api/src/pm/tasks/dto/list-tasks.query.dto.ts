import { AssignmentType, TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class ListTasksQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string

  @IsOptional()
  @IsString()
  phaseId?: string

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus

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
  assigneeId?: string

  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  label?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}
