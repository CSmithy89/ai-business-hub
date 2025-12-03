import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * Pagination DTO for list endpoints
 *
 * Provides standard pagination parameters for API endpoints.
 * Used by DLQ listing endpoint to paginate failed events.
 */
export class PaginationDto {
  /**
   * Page number (1-indexed)
   * @default 1
   */
  @ApiPropertyOptional({
    default: 1,
    description: 'Page number (1-indexed)',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  /**
   * Number of items per page
   * @default 50
   * @maximum 100
   */
  @ApiPropertyOptional({
    default: 50,
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;
}
