import { IsArray, ArrayMinSize, ArrayMaxSize, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO for bulk deletion of multiple pages
 */
export class BulkDeleteDto {
  @ApiProperty({
    description: 'Array of page IDs to delete (soft delete)',
    example: ['page-id-1', 'page-id-2', 'page-id-3'],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one page ID is required' })
  @ArrayMaxSize(100, { message: 'Cannot delete more than 100 pages at once' })
  @IsString({ each: true })
  pageIds!: string[]
}
