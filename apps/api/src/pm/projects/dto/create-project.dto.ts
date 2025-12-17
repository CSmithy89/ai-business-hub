import { ProjectType } from '@prisma/client'
import { IsEnum, IsOptional, IsString, IsHexColor } from 'class-validator'

export class CreateProjectDto {
  /**
   * TenantGuard can extract workspaceId from body, params, query, or session.
   * Keep it optional so API can rely on session-based workspace context.
   */
  @IsOptional()
  @IsString()
  workspaceId?: string

  @IsString()
  businessId!: string

  @IsString()
  name!: string

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
  @IsString()
  leadUserId?: string
}
