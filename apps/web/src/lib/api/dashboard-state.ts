/**
 * Dashboard State API Client
 *
 * Frontend API client for dashboard state persistence.
 * Communicates with the NestJS dashboard/state endpoints.
 *
 * Features:
 * - Save state to server
 * - Retrieve state from server
 * - Delete state from server
 * - Graceful error handling (fail-open)
 *
 * Story: DM-11.1 - Redis State Persistence
 */

import { apiGet, apiPost, apiDelete } from '../api-client';
import type { DashboardState } from '../schemas/dashboard-state';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Response from save state endpoint
 */
export interface SaveStateResponse {
  success: boolean;
  serverVersion: number;
  conflictResolution?: 'server' | 'client';
}

/**
 * Response from get state endpoint
 */
export interface GetStateResponse {
  version: number;
  state: Record<string, unknown>;
  lastModified: string;
}

/**
 * Response from delete state endpoint
 */
export interface DeleteStateResponse {
  success: boolean;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Save dashboard state to server
 *
 * Sends state to Redis via the backend API.
 * Handles conflict resolution if server has newer version.
 *
 * @param state - Dashboard state to save
 * @param version - Current state version
 * @param checksum - Optional state checksum for integrity
 * @returns Save response with conflict info, or null on error
 */
export async function saveDashboardState(
  state: DashboardState,
  version: number,
  checksum?: string
): Promise<SaveStateResponse | null> {
  try {
    const response = await apiPost('/api/dashboard/state', {
      version,
      state,
      checksum,
    });

    if (!response.ok) {
      // Log but don't throw - dashboard should still work
      console.warn(
        '[DashboardState] Failed to save state:',
        response.status,
        response.statusText
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('[DashboardState] Error saving state:', error);
    return null;
  }
}

/**
 * Get dashboard state from server
 *
 * Retrieves state from Redis via the backend API.
 * Returns null if no state exists (first-time user) or on error.
 *
 * @returns State response or null if not found/error
 */
export async function getDashboardState(): Promise<GetStateResponse | null> {
  try {
    const response = await apiGet('/api/dashboard/state');

    if (response.status === 404) {
      // No state exists - not an error
      return null;
    }

    if (!response.ok) {
      console.warn(
        '[DashboardState] Failed to get state:',
        response.status,
        response.statusText
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('[DashboardState] Error getting state:', error);
    return null;
  }
}

/**
 * Delete dashboard state from server
 *
 * Removes state from Redis. Used for reset or cleanup.
 *
 * @returns Success status
 */
export async function deleteDashboardState(): Promise<DeleteStateResponse> {
  try {
    const response = await apiDelete('/api/dashboard/state');

    if (!response.ok) {
      console.warn(
        '[DashboardState] Failed to delete state:',
        response.status,
        response.statusText
      );
      return { success: false };
    }

    return await response.json();
  } catch (error) {
    console.warn('[DashboardState] Error deleting state:', error);
    return { success: false };
  }
}
