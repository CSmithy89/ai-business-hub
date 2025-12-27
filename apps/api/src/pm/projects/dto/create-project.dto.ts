import { ProjectType } from '@prisma/client'
import { IsEnum, IsOptional, IsString, IsHexColor } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateProjectDto {
  @ApiProperty({
    required: false,
    description: 'Workspace ID (inferred from API key if not provided)'
  })
  @IsOptional()
  @IsString()
  workspaceId?: string

  @ApiProperty({
    description: 'Business ID this project belongs to',
    example: 'cm4biz123xyz'
  })
  @IsString()
  businessId!: string

  @ApiProperty({
    description: 'Project name',
    example: 'Website Redesign Q1 2025'
  })
  @IsString()
  name!: string

  @ApiProperty({
    required: false,
    description: 'Project description',
    example: 'Comprehensive redesign of company website with improved UX and mobile responsiveness'
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    required: false,
    enum: ProjectType,
    description: 'Type of project',
    example: ProjectType.SOFTWARE
  })
  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType

  @ApiProperty({
    required: false,
    description: 'Project color for UI display (hex format)',
    example: '#3b82f6',
    pattern: '^#[0-9a-fA-F]{6}$'
  })
  @IsOptional()
  @IsHexColor()
  color?: string

  @ApiProperty({
    required: false,
    description: 'Icon identifier for project',
    example: 'code'
  })
  @IsOptional()
  @IsString()
  icon?: string

  @ApiProperty({
    required: false,
    description: 'BMAD template ID to use for project initialization',
    example: 'template-agile-scrum'
  })
  @IsOptional()
  @IsString()
  bmadTemplateId?: string

  @ApiProperty({
    required: false,
    description: 'User ID of project lead',
    example: 'cm4user456def'
  })
  @IsOptional()
  @IsString()
  leadUserId?: string
}
