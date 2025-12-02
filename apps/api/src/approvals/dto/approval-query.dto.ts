import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters DTO for listing approval items
 *
 * Supports filtering, sorting, and pagination for the approval queue.
 */
export class ApprovalQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'auto_approved', 'escalated'])
  status?: 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'escalated';

  @IsOptional()
  @IsString()
  type?: string; // 'content', 'email', 'campaign', 'deal', 'integration', 'agent_action'

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsEnum(['dueAt', 'confidenceScore', 'createdAt'])
  sortBy?: 'dueAt' | 'confidenceScore' | 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
