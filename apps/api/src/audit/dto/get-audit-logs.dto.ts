import { IsOptional, IsString, IsInt, Min, Max, IsDateString } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

/**
 * DTO for fetching audit logs with filtering and pagination
 */
export class GetAuditLogsDto {
  @ApiPropertyOptional({
    description: 'Maximum number of logs to return',
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50

  @ApiPropertyOptional({
    description: 'Number of logs to skip for pagination',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0

  @ApiPropertyOptional({
    description: 'Filter by action type (e.g., role_changed, member_added)',
    example: 'role_changed',
  })
  @IsOptional()
  @IsString()
  action?: string

  @ApiPropertyOptional({
    description: 'Filter by user ID (actor who performed the action)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  userId?: string

  @ApiPropertyOptional({
    description: 'Filter logs created after this date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({
    description: 'Filter logs created before this date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string
}
