import { TaskRelationType } from '@prisma/client'
import { IsDefined, IsEnum, IsNotEmpty, IsString } from 'class-validator'

export class CreateTaskRelationDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  targetTaskId!: string

  @IsDefined()
  @IsEnum(TaskRelationType)
  relationType!: TaskRelationType
}
