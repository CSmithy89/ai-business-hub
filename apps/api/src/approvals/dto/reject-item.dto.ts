import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * Request body DTO for rejecting an approval item
 *
 * Requires a reason for rejection.
 */
export class RejectItemDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
