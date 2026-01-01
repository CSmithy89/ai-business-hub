/**
 * State Migration System
 *
 * Provides version-keyed migrations for dashboard state schema evolution.
 * When STATE_VERSION changes, migrations are applied sequentially to
 * transform stored state from old versions to the current version.
 *
 * @see docs/modules/bm-dm/stories/dm-11-8-state-migration-system.md
 * Epic: DM-11 | Story: DM-11.8
 */

import { STATE_VERSION } from '@/lib/schemas/dashboard-state';

// Re-export STATE_VERSION for convenience
export { STATE_VERSION };

// =============================================================================
// TYPES
// =============================================================================

/**
 * Definition of a single migration step.
 */
export interface MigrationDefinition {
  /** Target version this migration upgrades TO */
  version: number;
  /** Human-readable description of what this migration does */
  description: string;
  /** Migration function - transforms state from version N-1 to version N */
  migrate: (state: unknown) => unknown;
  /** Optional validation function to verify migration success */
  validate?: (state: unknown) => boolean;
}

/**
 * Result of a migration operation.
 */
export interface MigrationResult {
  /** Whether all migrations completed successfully */
  success: boolean;
  /** Original version of the state */
  fromVersion: number;
  /** Target version after migration */
  toVersion: number;
  /** The migrated state object */
  migratedState: unknown;
  /** Error message if migration failed */
  error?: string;
  /** List of version numbers for migrations that were applied */
  migrationsApplied: number[];
}

/**
 * Event logged during migration for debugging.
 */
interface MigrationEvent {
  type: 'state_migration';
  version: number;
  status: 'success' | 'error';
  timestamp: string;
  error?: string;
  description?: string;
}

// =============================================================================
// MIGRATION REGISTRY
// =============================================================================

/**
 * Registry of migration definitions, keyed by target version.
 *
 * Guidelines for adding new migrations:
 * 1. Always add to end of array - migrations must be applied in order
 * 2. Provide sensible defaults - new fields should maintain existing behavior
 * 3. Preserve unknown fields - use spread operator to keep fields you don't modify
 * 4. Add validation function for non-trivial migrations
 * 5. Document breaking changes with clear descriptions
 *
 * Example migration:
 * {
 *   version: 2,
 *   description: 'Add preferences object with default theme',
 *   migrate: (state: any) => ({
 *     ...state,
 *     preferences: state.preferences || { theme: 'system' },
 *   }),
 *   validate: (state: any) => state.preferences !== undefined,
 * }
 */
const migrations: MigrationDefinition[] = [
  // Migrations will be added here as schema evolves
  // Example: v1 -> v2 migration
  // {
  //   version: 2,
  //   description: 'Add preferences object',
  //   migrate: (state) => ({ ...state, preferences: state.preferences || {} }),
  // },
];

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Detect if stored state version differs from current version.
 *
 * @param stateVersion - Version of the stored state
 * @returns true if state needs migration (stored version < current version)
 */
export function detectVersionMismatch(stateVersion: number): boolean {
  return stateVersion < STATE_VERSION;
}

/**
 * Check if state needs migration (alias for detectVersionMismatch).
 *
 * @param stateVersion - Version of the stored state
 * @returns true if state needs migration
 */
export function needsMigration(stateVersion: number): boolean {
  return detectVersionMismatch(stateVersion);
}

/**
 * Get the sequence of migrations to apply from one version to another.
 *
 * @param fromVersion - Starting version
 * @param toVersion - Target version
 * @returns Array of MigrationDefinition to apply in order
 */
export function getMigrationPath(
  fromVersion: number,
  toVersion: number
): MigrationDefinition[] {
  // No migrations needed if going backwards or staying same
  if (fromVersion >= toVersion) {
    return [];
  }

  // Filter and sort migrations in the required version range
  return migrations
    .filter((m) => m.version > fromVersion && m.version <= toVersion)
    .sort((a, b) => a.version - b.version);
}

/**
 * Migrate state from one version to another.
 *
 * Applies migrations sequentially in ascending version order.
 * If a migration fails, returns immediately with partial result.
 *
 * @param state - The state object to migrate
 * @param fromVersion - Current version of the state
 * @param toVersion - Target version (defaults to STATE_VERSION)
 * @returns MigrationResult with success status and migrated state
 */
export function migrateState(
  state: unknown,
  fromVersion: number,
  toVersion: number = STATE_VERSION
): MigrationResult {
  const migrationsApplied: number[] = [];

  // No migration needed if versions match or going backwards
  if (fromVersion >= toVersion) {
    return {
      success: true,
      fromVersion,
      toVersion,
      migratedState: state,
      migrationsApplied,
    };
  }

  const migrationPath = getMigrationPath(fromVersion, toVersion);

  // If no migrations defined for this range, just update version
  if (migrationPath.length === 0) {
    // Even without explicit migrations, we should update the version
    const updatedState =
      typeof state === 'object' && state !== null
        ? { ...state, version: toVersion }
        : state;

    return {
      success: true,
      fromVersion,
      toVersion,
      migratedState: updatedState,
      migrationsApplied,
    };
  }

  let currentState = state;

  // Apply migrations in sequence
  for (const migration of migrationPath) {
    try {
      currentState = migration.migrate(currentState);
      migrationsApplied.push(migration.version);

      // Run validation if provided
      if (migration.validate && !migration.validate(currentState)) {
        const errorMsg = `Validation failed for migration to v${migration.version}`;
        logMigrationEvent(migration.version, 'error', errorMsg, migration.description);
        return {
          success: false,
          fromVersion,
          toVersion,
          migratedState: currentState,
          error: errorMsg,
          migrationsApplied,
        };
      }

      logMigrationEvent(migration.version, 'success', undefined, migration.description);
    } catch (error) {
      const errorMsg = `Migration to v${migration.version} failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      logMigrationEvent(migration.version, 'error', errorMsg, migration.description);

      return {
        success: false,
        fromVersion,
        toVersion,
        migratedState: currentState,
        error: errorMsg,
        migrationsApplied,
      };
    }
  }

  // Update version number in final state
  if (typeof currentState === 'object' && currentState !== null) {
    currentState = { ...currentState, version: toVersion };
  }

  return {
    success: true,
    fromVersion,
    toVersion,
    migratedState: currentState,
    migrationsApplied,
  };
}

/**
 * Register a new migration.
 *
 * Migrations must be registered in version order.
 * This function validates that the migration version is valid.
 *
 * @param migration - MigrationDefinition to register
 * @throws Error if migration version is invalid
 */
export function registerMigration(migration: MigrationDefinition): void {
  // Validate version number
  if (migration.version <= 0) {
    throw new Error(`Invalid migration version: ${migration.version}. Must be > 0`);
  }

  // Check for duplicate versions
  const existing = migrations.find((m) => m.version === migration.version);
  if (existing) {
    throw new Error(
      `Migration for version ${migration.version} already exists: "${existing.description}"`
    );
  }

  // Add migration and re-sort to maintain order
  migrations.push(migration);
  migrations.sort((a, b) => a.version - b.version);
}

/**
 * Get all registered migrations (for testing/debugging).
 *
 * @returns Copy of the migrations array
 */
export function getRegisteredMigrations(): MigrationDefinition[] {
  return [...migrations];
}

/**
 * Clear all registered migrations (for testing only).
 * @internal
 */
export function clearMigrations(): void {
  migrations.length = 0;
}

// =============================================================================
// LOGGING
// =============================================================================

/**
 * Log a migration event for debugging and analytics.
 *
 * @param version - Migration target version
 * @param status - 'success' or 'error'
 * @param errorMessage - Error message if status is 'error'
 * @param description - Migration description
 */
function logMigrationEvent(
  version: number,
  status: 'success' | 'error',
  errorMessage?: string,
  description?: string
): void {
  const event: MigrationEvent = {
    type: 'state_migration',
    version,
    status,
    timestamp: new Date().toISOString(),
    ...(errorMessage && { error: errorMessage }),
    ...(description && { description }),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    if (status === 'error') {
      console.error('[State Migration]', event);
    } else {
      console.log('[State Migration]', event);
    }
  }

  // Production: only log errors
  if (process.env.NODE_ENV === 'production' && status === 'error') {
    console.error('[State Migration] Migration failed:', {
      version,
      error: errorMessage,
    });
  }
}

// =============================================================================
// DEFAULT STATE
// =============================================================================

/**
 * Get default dashboard state for fallback scenarios.
 *
 * Used when migration fails and we need a valid state structure.
 * This mirrors createInitialDashboardState() from dashboard-state.ts.
 *
 * @returns Default DashboardState structure
 */
export function getDefaultState(): Record<string, unknown> {
  return {
    version: STATE_VERSION,
    timestamp: Date.now(),
    activeProject: null,
    workspaceId: undefined,
    userId: undefined,
    widgets: {
      projectStatus: null,
      metrics: null,
      activity: null,
      alerts: [],
    },
    loading: {
      isLoading: false,
      loadingAgents: [],
    },
    errors: {},
    activeTasks: [],
  };
}
