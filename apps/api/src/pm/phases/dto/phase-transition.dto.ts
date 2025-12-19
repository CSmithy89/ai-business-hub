import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class TaskActionDto {
  @IsString()
  taskId!: string

  @IsEnum(['complete', 'carry_over', 'cancel'])
  action!: 'complete' | 'carry_over' | 'cancel'

  @IsString()
  @IsOptional()
  targetPhaseId?: string // Required if action = 'carry_over'
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
