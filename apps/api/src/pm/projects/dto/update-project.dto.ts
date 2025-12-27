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
import { ApiProperty } from '@nestjs/swagger'

export class UpdateProjectDto {
  @ApiProperty({ required: false, description: 'Project name', example: 'Website Redesign Q1 2025' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ required: false, description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ required: false, enum: ProjectType, description: 'Type of project' })
  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType

  @ApiProperty({ required: false, description: 'Project color (hex format)', example: '#3b82f6' })
  @IsOptional()
  @IsHexColor()
  color?: string

  @ApiProperty({ required: false, description: 'Icon identifier', example: 'code' })
  @IsOptional()
  @IsString()
  icon?: string

  @ApiProperty({ required: false, description: 'BMAD template ID' })
  @IsOptional()
  @IsString()
  bmadTemplateId?: string

  @ApiProperty({ required: false, enum: ProjectStatus, description: 'Project status' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus

  @ApiProperty({ required: false, description: 'Project start date', type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @ApiProperty({ required: false, description: 'Project target completion date', type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  targetDate?: Date

  @ApiProperty({
    required: false,
    description: 'Auto-approval threshold (0.0 to 1.0)',
    minimum: 0,
    maximum: 1,
    example: 0.85
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  autoApprovalThreshold?: number

  @ApiProperty({ required: false, description: 'Enable AI suggestion mode' })
  @IsOptional()
  @IsBoolean()
  suggestionMode?: boolean

  @ApiProperty({ required: false, description: 'Project budget', minimum: 0, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number | null
}
