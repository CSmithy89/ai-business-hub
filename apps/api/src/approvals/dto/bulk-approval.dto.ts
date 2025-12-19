import { IsArray, ArrayMinSize, ArrayMaxSize, IsEnum, IsOptional, IsString, IsNotEmpty, ValidateIf } from 'class-validator';

/**
 * Maximum number of items that can be bulk approved/rejected at once.
 * Prevents expensive operations from overwhelming the server.
 */
const MAX_BULK_APPROVALS = 100;

/**
 * Request body DTO for bulk approve/reject operations
 *
 * Validates that reject actions include a required reason.
 */
export class BulkApprovalDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_APPROVALS, { message: `Cannot bulk process more than ${MAX_BULK_APPROVALS} items at once` })
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
