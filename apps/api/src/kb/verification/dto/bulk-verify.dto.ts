import { IsArray, IsEnum, ArrayMinSize, ArrayMaxSize, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO for bulk verification of multiple pages
 */
export class BulkVerifyDto {
  @ApiProperty({
    description: 'Array of page IDs to verify',
    example: ['page-id-1', 'page-id-2', 'page-id-3'],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one page ID is required' })
  @ArrayMaxSize(100, { message: 'Cannot verify more than 100 pages at once' })
  @IsString({ each: true })
  pageIds!: string[]

  @ApiProperty({
    description: 'Verification expiration period',
    enum: ['30d', '60d', '90d', 'never'],
    example: '90d',
  })
  @IsEnum(['30d', '60d', '90d', 'never'], {
    message: 'expiresIn must be one of: 30d, 60d, 90d, never',
  })
  expiresIn!: '30d' | '60d' | '90d' | 'never'
}
