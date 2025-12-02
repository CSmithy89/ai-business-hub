import { IsObject, IsOptional, IsEnum, IsArray, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO for a single module permission override
 *
 * Supports two patterns:
 * 1. Role elevation: { role: 'admin' }
 * 2. Specific permissions: { permissions: ['records:view', 'records:create'] }
 */
export class ModulePermissionOverrideDto {
  @ApiProperty({
    description: 'Elevated role for this module',
    enum: ['admin', 'member', 'viewer'],
    required: false,
    example: 'admin',
  })
  @IsOptional()
  @IsEnum(['admin', 'member', 'viewer'])
  role?: 'admin' | 'member' | 'viewer'

  @ApiProperty({
    description: 'Specific permissions granted in this module',
    type: [String],
    required: false,
    example: ['records:view', 'records:create', 'records:edit'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[]
}

/**
 * DTO for updating member module permissions
 *
 * Request body for PATCH /api/workspaces/:id/members/:memberId/module-permissions
 */
export class UpdateModulePermissionsDto {
  @ApiProperty({
    description: 'Module permission overrides map (moduleId -> override)',
    type: 'object',
    required: false,
    example: {
      'bm-crm': { role: 'admin' },
      'bmc': { permissions: ['records:view', 'records:create'] },
    },
  })
  @IsOptional()
  @IsObject()
  modulePermissions?: Record<string, ModulePermissionOverrideDto> | null
}
