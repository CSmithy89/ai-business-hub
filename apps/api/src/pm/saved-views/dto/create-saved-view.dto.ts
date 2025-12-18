import { ViewType } from '@prisma/client'
import { IsBoolean, IsEnum, IsIn, IsJSON, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

/**
 * Allowed columns for sorting saved views
 * Must match actual task table columns to prevent injection
 */
const ALLOWED_SORT_COLUMNS = ['title', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt', 'taskNumber'] as const

export class CreateSavedViewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[\w\s\-.,()]+$/, {
    message: 'View name can only contain letters, numbers, spaces, hyphens, periods, commas, and parentheses',
  })
  name!: string

  @IsString()
  @IsNotEmpty()
  projectId!: string

  @IsEnum(ViewType)
  viewType!: ViewType

  @IsOptional()
  @IsJSON()
  filters?: string // JSON string of filters

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_SORT_COLUMNS, { message: 'sortBy must be a valid column name' })
  sortBy?: string

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be "asc" or "desc"' })
  sortOrder?: string

  @IsOptional()
  @IsJSON()
  columns?: string // JSON string of column config

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @IsOptional()
  @IsBoolean()
  isShared?: boolean
}
