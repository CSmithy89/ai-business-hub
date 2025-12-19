import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { SuggestionType, SuggestionStatus } from '@prisma/client';

export class CreateSuggestionDto {
  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  workspaceId!: string;

  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId!: string;

  @ApiProperty({ description: 'User ID this suggestion is for' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Agent name (navi, sage, chrono)' })
  @IsString()
  agentName!: string;

  @ApiProperty({ enum: SuggestionType })
  @IsEnum(SuggestionType)
  suggestionType!: SuggestionType;

  @ApiProperty({ description: 'Suggestion title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'AI reasoning for this suggestion' })
  @IsString()
  reasoning!: string;

  @ApiProperty({ description: 'Confidence score (0-1)', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: ['high', 'medium', 'low'],
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({
    description: 'Action payload (action-specific data)',
    type: 'object',
  })
  @IsObject()
  actionPayload!: Record<string, any>;
}

export class GetSuggestionsDto {
  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  // Note: userId is NOT exposed here - it must come from @CurrentUser for security
  // Users should only see their own suggestions

  @ApiPropertyOptional({ description: 'Filter by agent name' })
  @IsOptional()
  @IsString()
  agentName?: string;

  @ApiPropertyOptional({ enum: SuggestionStatus })
  @IsOptional()
  @IsEnum(SuggestionStatus)
  status?: SuggestionStatus;

  @ApiPropertyOptional({ description: 'Limit results', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AcceptSuggestionDto {
  @ApiPropertyOptional({
    description: 'Optional modifications to action payload',
  })
  @IsOptional()
  @IsObject()
  modifications?: Record<string, any>;
}

export class RejectSuggestionDto {
  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SnoozeSuggestionDto {
  @ApiPropertyOptional({
    description: 'Hours to snooze (default 4)',
    default: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168) // Max 1 week
  hours?: number;
}

export class SuggestionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  agentName!: string;

  @ApiProperty({ enum: SuggestionType })
  suggestionType!: SuggestionType;

  @ApiProperty({ enum: SuggestionStatus })
  status!: SuggestionStatus;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  reasoning!: string;

  @ApiProperty()
  confidence!: number;

  @ApiProperty()
  priority!: string;

  @ApiProperty({ type: 'object' })
  actionPayload!: Record<string, any>;

  @ApiPropertyOptional()
  snoozedUntil?: Date;

  @ApiProperty()
  expiresAt!: Date;

  @ApiPropertyOptional()
  acceptedAt?: Date;

  @ApiPropertyOptional()
  rejectedAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
