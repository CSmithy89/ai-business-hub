/**
 * Dashboard State DTOs
 *
 * DTOs for dashboard state persistence API.
 * Validates state data for save/get/delete operations.
 *
 * Story: DM-11.1 - Redis State Persistence
 */

import { IsNumber, IsObject, IsOptional, IsString, IsBoolean } from 'class-validator';

// =============================================================================
// REQUEST DTOs
// =============================================================================

/**
 * Request DTO for saving dashboard state
 */
export class SaveDashboardStateDto {
  @IsNumber()
  version!: number;

  @IsObject()
  state!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  checksum?: string;
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================

/**
 * Response DTO for save state operation
 */
export class SaveStateResponseDto {
  @IsBoolean()
  success!: boolean;

  @IsNumber()
  serverVersion!: number;

  @IsOptional()
  @IsString()
  conflictResolution?: 'server' | 'client';
}

/**
 * Response DTO for get state operation
 */
export class GetStateResponseDto {
  @IsNumber()
  version!: number;

  @IsObject()
  state!: Record<string, unknown>;

  @IsString()
  lastModified!: string;
}

/**
 * Response DTO for delete state operation
 */
export class DeleteStateResponseDto {
  @IsBoolean()
  success!: boolean;
}

// =============================================================================
// INTERNAL TYPES
// =============================================================================

/**
 * Internal representation of stored state data
 */
export interface StoredStateData {
  version: number;
  state: Record<string, unknown>;
  lastModified: string;
  checksum?: string;
}

/**
 * Conflict resolution result
 */
export type ConflictResolution = 'server' | 'client';
