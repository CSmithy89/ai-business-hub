import { AssignmentType, TaskStatus } from '@prisma/client'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator'

/**
 * Maximum number of tasks that can be bulk updated at once.
 * Prevents expensive operations from overwhelming the server.
 */
const MAX_BULK_TASKS = 100

export class BulkUpdateTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_TASKS, { message: `Cannot bulk update more than ${MAX_BULK_TASKS} tasks at once` })
  @IsString({ each: true })
  ids!: string[]

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus

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
  @IsString()
  phaseId?: string
}
