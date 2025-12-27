import { TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ListTasksQueryDto {
  @ApiProperty({ required: false, description: 'Filter by project ID' })
  @IsOptional()
  @IsString()
  projectId?: string

  @ApiProperty({ required: false, description: 'Filter by phase ID' })
  @IsOptional()
  @IsString()
  phaseId?: string

  @ApiProperty({ required: false, description: 'Filter by task status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus

  @ApiProperty({ required: false, description: 'Filter by assignee user ID' })
  @IsOptional()
  @IsString()
  assigneeId?: string

  @ApiProperty({ required: false, description: 'Filter by priority' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority

  @ApiProperty({ required: false, description: 'Filter by task type' })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType

  @ApiProperty({ required: false, description: 'Filter tasks due after this date (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  dueAfter?: string

  @ApiProperty({ required: false, description: 'Filter tasks due before this date (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  dueBefore?: string

  @ApiProperty({ required: false, description: 'Search by task title or description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  search?: string

  @ApiProperty({ required: false, default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50

  @ApiProperty({ required: false, default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0

  @ApiProperty({
    required: false,
    enum: ['createdAt', 'dueDate', 'priority', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'dueDate', 'priority', 'status'])
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'status' = 'createdAt'

  @ApiProperty({ required: false, enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'
}
