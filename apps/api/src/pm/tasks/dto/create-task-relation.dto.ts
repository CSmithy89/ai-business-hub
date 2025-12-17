import { TaskRelationType } from '@prisma/client'
import { IsEnum, IsString } from 'class-validator'

export class CreateTaskRelationDto {
  @IsString()
  targetTaskId!: string

  @IsEnum(TaskRelationType)
  relationType!: TaskRelationType
}

