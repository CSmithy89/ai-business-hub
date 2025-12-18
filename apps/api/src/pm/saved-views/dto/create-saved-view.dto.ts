import { ViewType } from '@prisma/client'
import { IsBoolean, IsEnum, IsJSON, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateSavedViewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
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
  sortBy?: string

  @IsOptional()
  @IsString()
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
