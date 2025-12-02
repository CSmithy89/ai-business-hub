import { IsOptional, IsString } from 'class-validator';

/**
 * Request body DTO for approving an approval item
 *
 * Allows optional notes when approving.
 */
export class ApproveItemDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
