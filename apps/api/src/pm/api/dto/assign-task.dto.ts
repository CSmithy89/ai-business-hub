import { AssignmentType } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class AssignTaskDto {
  @ApiProperty({ required: false, description: 'User ID to assign task to' })
  @IsOptional()
  @IsString()
  assigneeId?: string

  @ApiProperty({ required: false, description: 'Agent ID to assign task to' })
  @IsOptional()
  @IsString()
  agentId?: string

  @ApiProperty({ description: 'Assignment type', enum: AssignmentType })
  @IsEnum(AssignmentType)
  assignmentType!: AssignmentType
}
