import { AssignmentType, TaskStatus } from '@prisma/client'
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator'

export class BulkUpdateTasksDto {
  @IsArray()
  @ArrayMinSize(1)
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
