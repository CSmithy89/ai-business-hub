import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

export class TaskActionDto {
  @IsString()
  taskId!: string

  @IsEnum(['complete', 'carry_over', 'cancel'])
  action!: 'complete' | 'carry_over' | 'cancel'

  @ValidateIf((o) => o.action === 'carry_over')
  @IsString()
  @IsNotEmpty({ message: 'targetPhaseId is required when action is carry_over' })
  targetPhaseId?: string
}

export class PhaseTransitionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskActionDto)
  taskActions!: TaskActionDto[]

  @IsString()
  @IsOptional()
  completionNote?: string
}
