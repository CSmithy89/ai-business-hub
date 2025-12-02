import { IsArray, ArrayMinSize, IsEnum, IsOptional, IsString, IsNotEmpty, ValidateIf } from 'class-validator';

/**
 * Request body DTO for bulk approve/reject operations
 *
 * Validates that reject actions include a required reason.
 */
export class BulkApprovalDto {
  @IsArray()
  @ArrayMinSize(1)
  ids!: string[];

  @IsEnum(['approve', 'reject'])
  action!: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateIf(o => o.action === 'reject')
  @IsString()
  @IsNotEmpty()
  reason?: string;
}
