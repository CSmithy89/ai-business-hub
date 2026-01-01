# Story DM-11.8: State Migration System

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** done
**Points:** 5
**Priority:** Medium

---

## Problem Statement

Currently, there is no migration path when `STATE_VERSION` changes in the dashboard state persistence system. When the state schema evolves (new fields, renamed properties, restructured data), users lose their saved preferences and configurations because the stored state format becomes incompatible with the current version.

This creates a poor user experience where dashboard customizations (widget layouts, preferences, settings) are reset whenever the application is updated with state schema changes.

## Gap Addressed

**REC-19:** No migration path when STATE_VERSION changes

## Implementation Plan

### 1. State Migration Module

Create a dedicated migration module that handles version transitions:

```typescript
// apps/web/src/lib/storage/state-migrations.ts

export const STATE_VERSION = 3; // Current version

export interface MigrationContext {
  fromVersion: number;
  toVersion: number;
  timestamp: string;
}

export interface MigrationResult {
  success: boolean;
  migratedState: any;
  context: MigrationContext;
  errors?: string[];
}

/**
 * Migration functions keyed by target version.
 * Each function migrates from the previous version to the keyed version.
 */
const migrations: Record<number, (state: any) => any> = {
  2: (state) => ({
    ...state,
    widgets: state.widgets || [],  // Added in v2
  }),
  3: (state) => ({
    ...state,
    preferences: {
      ...state.preferences,
      theme: state.preferences?.theme || 'system',  // Added in v3
    },
  }),
};

/**
 * Migrates state from one version to another, applying all intermediate migrations.
 */
export function migrateState(
  state: any,
  fromVersion: number,
  toVersion: number = STATE_VERSION
): MigrationResult {
  const context: MigrationContext = {
    fromVersion,
    toVersion,
    timestamp: new Date().toISOString(),
  };

  // No migration needed
  if (fromVersion >= toVersion) {
    return { success: true, migratedState: state, context };
  }

  const errors: string[] = [];
  let current = state;

  // Apply migrations in sequence
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    if (migrations[v]) {
      try {
        current = migrations[v](current);
        logMigrationEvent(v, 'success');
      } catch (error) {
        const errorMsg = `Migration to v${v} failed: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        logMigrationEvent(v, 'error', errorMsg);

        // Return failure with partially migrated state
        return {
          success: false,
          migratedState: current,
          context,
          errors,
        };
      }
    }
  }

  return {
    success: true,
    migratedState: { ...current, version: toVersion },
    context,
  };
}

/**
 * Logs migration events for debugging and analytics.
 */
function logMigrationEvent(
  version: number,
  status: 'success' | 'error',
  errorMessage?: string
): void {
  const event = {
    type: 'state_migration',
    version,
    status,
    timestamp: new Date().toISOString(),
    ...(errorMessage && { error: errorMessage }),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[State Migration]', event);
  }

  // Could emit to analytics/telemetry here
}

/**
 * Checks if state needs migration.
 */
export function needsMigration(stateVersion: number): boolean {
  return stateVersion < STATE_VERSION;
}

/**
 * Returns default state for fallback scenarios.
 */
export function getDefaultState(): any {
  return {
    version: STATE_VERSION,
    widgets: [],
    preferences: {
      theme: 'system',
    },
    // Add other default values as needed
  };
}
```

### 2. Dashboard Store Integration

Update the dashboard store to use migrations on initialization:

```typescript
// apps/web/src/stores/dashboard-store.ts

import {
  migrateState,
  needsMigration,
  getDefaultState,
  STATE_VERSION,
} from '@/lib/storage/state-migrations';

// In the store initialization / hydration logic:
function hydrateState(persistedState: any): DashboardState {
  // No persisted state, use defaults
  if (!persistedState) {
    return getDefaultState();
  }

  const stateVersion = persistedState.version ?? 1;

  // Check if migration is needed
  if (needsMigration(stateVersion)) {
    const result = migrateState(persistedState, stateVersion);

    if (result.success) {
      console.log(
        `State migrated from v${result.context.fromVersion} to v${result.context.toVersion}`
      );
      return result.migratedState;
    } else {
      console.error('State migration failed, falling back to defaults:', result.errors);
      return getDefaultState();
    }
  }

  return persistedState;
}
```

### 3. Migration Registry Pattern

For extensibility, implement a registry pattern for migrations:

```typescript
// Extended migration registry with metadata
interface MigrationDefinition {
  version: number;
  description: string;
  migrate: (state: any) => any;
  validate?: (state: any) => boolean;
}

const migrationRegistry: MigrationDefinition[] = [
  {
    version: 2,
    description: 'Add widgets array to state',
    migrate: (state) => ({
      ...state,
      widgets: state.widgets || [],
    }),
    validate: (state) => Array.isArray(state.widgets),
  },
  {
    version: 3,
    description: 'Add theme preference with system default',
    migrate: (state) => ({
      ...state,
      preferences: {
        ...state.preferences,
        theme: state.preferences?.theme || 'system',
      },
    }),
    validate: (state) =>
      state.preferences?.theme &&
      ['light', 'dark', 'system'].includes(state.preferences.theme),
  },
];
```

## Files to Create

| File | Description |
|------|-------------|
| `apps/web/src/lib/storage/state-migrations.ts` | Core migration system with version-keyed migration functions |
| `apps/web/src/lib/storage/__tests__/state-migrations.test.ts` | Unit tests for migration system |

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/stores/dashboard-store.ts` | Add migration on init/hydration |
| `apps/web/src/lib/storage/index.ts` | Export migration utilities (if exists) |

## Acceptance Criteria

- [x] AC1: Version mismatch detected on load
- [x] AC2: Migrations run in sequence
- [x] AC3: User data preserved
- [x] AC4: Migration events logged
- [x] AC5: Failed migrations fall back to defaults

## Test Requirements

### Unit Tests

1. **Version Detection Tests**
   - Detects when stored version < current version
   - Returns false when versions match
   - Handles missing version field (assume v1)
   - Handles null/undefined state

2. **Migration Sequence Tests**
   - Single version jump (v1 → v2)
   - Multiple version jumps (v1 → v3)
   - Large version jumps (v1 → v10)
   - No-op when already at current version
   - No-op when ahead of current version

3. **Data Preservation Tests**
   - Existing fields preserved through migration
   - New fields added with defaults
   - Nested object structures preserved
   - Array data preserved
   - Complex widget configurations preserved

4. **Error Handling Tests**
   - Failed migration returns failure result
   - Partial migrations tracked
   - Error messages captured
   - Fallback to defaults on failure

5. **Logging Tests**
   - Success events logged
   - Error events logged with details
   - Migration context includes timestamps
   - Development vs production logging behavior

### Integration Tests

1. **Store Integration**
   - Dashboard store hydrates with migration
   - Persisted state triggers migration check
   - Migrated state correctly typed
   - Store actions work after migration

2. **LocalStorage Integration**
   - Old format data migrated on load
   - Migrated data persisted correctly
   - Version number updated in storage

## Technical Notes

### Migration Function Guidelines

When adding new migrations:

1. **Always add to end of registry** - Migrations must be applied in order
2. **Provide sensible defaults** - New fields should have defaults that maintain existing behavior
3. **Preserve unknown fields** - Use spread operator to keep fields you don't modify
4. **Test both directions** - Verify data is accessible before and after migration
5. **Document breaking changes** - Add comments for non-obvious transformations

### Performance Considerations

- Migrations run synchronously during hydration
- Keep individual migrations fast (<10ms each)
- Batch multiple field additions into single version bumps when possible
- Log migration duration for monitoring

### Future Enhancements

- **Async migrations** - For large state transformations
- **Rollback support** - Store previous version for recovery
- **Migration analytics** - Track migration success/failure rates
- **Schema validation** - Zod validation post-migration

## Dependencies

- **DM-04** (Shared State) - Dashboard state management
- **DM-08.6** (Zustand Optimization) - Store architecture

## References

- [Epic DM-11 Tech Spec](../epics/epic-dm-11-tech-spec.md#dm-118-state-migration-system-5-pts) - Technical specification
- [DM-04.5 State Persistence](./dm-04-5-state-persistence.md) - Original persistence story
- [Tech Debt Consolidated](../tech-debt-consolidated.md) - REC-19
- [Dashboard Store](../../../../apps/web/src/stores/dashboard-store.ts) - Current store implementation

---

*Story Created: 2026-01-01*
*Epic: DM-11 | Story: 8 of 15 | Points: 5*

---

## Code Review Notes

**Reviewer:** Senior Developer (AI)
**Review Date:** 2026-01-01
**Status:** APPROVED

### Files Reviewed

1. `apps/web/src/lib/storage/state-migrations.ts` - Core migration module
2. `apps/web/src/lib/storage/__tests__/state-migrations.test.ts` - Unit tests (50 tests)
3. `apps/web/src/stores/dashboard-state-store.ts` - Store integration
4. `apps/web/src/lib/storage/index.ts` - Module exports

### Summary

The implementation fully satisfies all acceptance criteria with excellent code quality, comprehensive test coverage, and proper integration with the dashboard state store.

### Code Quality Assessment

**Strengths:**
- Clean migration API with well-designed `MigrationDefinition` interface
- Proper error handling with partial state preservation
- Development vs production logging differentiation
- Structured event logging with type, version, status, timestamp

### Acceptance Criteria Verification

| Criteria | Status | Evidence |
|----------|--------|----------|
| AC1: Version mismatch detected on load | PASS | `detectVersionMismatch()` and `needsMigration()` correctly compare versions. Integration in `restoreFromServer()` checks migration need. |
| AC2: Migrations run in sequence | PASS | `getMigrationPath()` sorts by version, `migrateState()` applies in order. Large jump test (v1->v10) confirms sequence. |
| AC3: User data preserved | PASS | Spread operator pattern preserves fields. Tests verify nested objects, arrays, complex widgets. |
| AC4: Migration events logged | PASS | `logMigrationEvent()` logs success/error events with timestamps. Dev logs all; prod only errors. |
| AC5: Failed migrations fall back to defaults | PASS | `getDefaultState()` provides fallback. Store calls it on migration failure with error logging. |

### Test Coverage

- **50 tests passing** covering:
  - Version detection (4 tests)
  - Migration sequencing (10 tests)
  - Data preservation (5 tests)
  - Error handling (6 tests)
  - Logging (6 tests)
  - Registration (8 tests)
  - Default state (4 tests)
  - Edge cases (7 tests)

### Store Integration

- `restoreFromServer()`: Correctly extracts version, calls `needsMigration()`, falls back to defaults on failure
- `applyFullState()`: Handles WebSocket state migration, rejects silently on failure

### Recommendations (Non-Blocking)

1. Add migration example in README when first real migration is added
2. Consider analytics hook when infrastructure is in place

### Verdict

**APPROVED** - Implementation is complete, well-tested, and production-ready.
