import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConfidenceFactor } from '@hyvve/shared';

/**
 * CreateApprovalDto - Request body for creating approval items
 *
 * Used by ApprovalRouterService to route approval requests based on confidence.
 */
export class CreateApprovalDto {
  /**
   * Approval type (e.g., 'content', 'email', 'campaign', 'deal', 'integration', 'agent_action')
   */
  @IsString()
  type!: string;

  /**
   * Approval title
   */
  @IsString()
  title!: string;

  /**
   * Optional description
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Optional preview data for UI rendering
   */
  @IsOptional()
  @IsObject()
  previewData?: any;

  /**
   * Source module that created this approval
   */
  @IsOptional()
  @IsString()
  sourceModule?: string;

  /**
   * Source entity ID (e.g., content_id, email_id)
   */
  @IsOptional()
  @IsString()
  sourceId?: string;

  /**
   * Priority level (determines due date)
   */
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  /**
   * Confidence factors for scoring
   * Must have weights that sum to 1.0
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  factors!: ConfidenceFactor[];
}
