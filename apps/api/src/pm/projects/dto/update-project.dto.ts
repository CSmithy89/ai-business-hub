import { ProjectStatus, ProjectType } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsHexColor,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType

  @IsOptional()
  @IsHexColor()
  color?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsString()
  bmadTemplateId?: string

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  targetDate?: Date

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  autoApprovalThreshold?: number

  @IsOptional()
  @IsBoolean()
  suggestionMode?: boolean
}

