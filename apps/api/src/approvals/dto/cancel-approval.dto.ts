import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * Request body DTO for cancelling an approval item
 *
 * Reason is optional but recommended for audit purposes.
 */
export class CancelApprovalDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
