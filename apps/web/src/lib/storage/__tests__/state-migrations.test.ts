/**
 * Unit Tests for State Migration System
 *
 * Tests for the dashboard state migration utilities including:
 * - Version mismatch detection
 * - Migration sequencing
 * - Data preservation
 * - Error handling with fallback
 * - Logging behavior
 *
 * @see docs/modules/bm-dm/stories/dm-11-8-state-migration-system.md
 * Epic: DM-11 | Story: DM-11.8
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectVersionMismatch,
  needsMigration,
  getMigrationPath,
  migrateState,
  registerMigration,
  getRegisteredMigrations,
  clearMigrations,
  getDefaultState,
  STATE_VERSION,
  type MigrationDefinition,
} from '../state-migrations';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('State Migration System', () => {
  beforeEach(() => {
    // Clear any registered migrations before each test
    clearMigrations();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // VERSION DETECTION TESTS
  // ===========================================================================

  describe('Version Detection Tests', () => {
    describe('detectVersionMismatch', () => {
      it('should detect when stored version < current version', () => {
        // STATE_VERSION is 1, so version 0 should need migration
        expect(detectVersionMismatch(0)).toBe(true);
      });

      it('should return false when versions match', () => {
        expect(detectVersionMismatch(STATE_VERSION)).toBe(false);
      });

      it('should return false when stored version > current version', () => {
        expect(detectVersionMismatch(STATE_VERSION + 1)).toBe(false);
      });

      it('should handle version 1 (current STATE_VERSION)', () => {
        // Current STATE_VERSION is 1, so version 1 should not need migration
        expect(detectVersionMismatch(1)).toBe(false);
      });
    });

    describe('needsMigration', () => {
      it('should be an alias for detectVersionMismatch', () => {
        expect(needsMigration(0)).toBe(detectVersionMismatch(0));
        expect(needsMigration(STATE_VERSION)).toBe(detectVersionMismatch(STATE_VERSION));
        expect(needsMigration(STATE_VERSION + 1)).toBe(
          detectVersionMismatch(STATE_VERSION + 1)
        );
      });
    });
  });

  // ===========================================================================
  // MIGRATION SEQUENCING TESTS
  // ===========================================================================

  describe('Migration Sequence Tests', () => {
    describe('getMigrationPath', () => {
      it('should return empty array when no migrations needed', () => {
        const path = getMigrationPath(5, 5);
        expect(path).toEqual([]);
      });

      it('should return empty array when going backwards', () => {
        const path = getMigrationPath(5, 3);
        expect(path).toEqual([]);
      });

      it('should return migrations in correct order', () => {
        registerMigration({
          version: 2,
          description: 'v1 to v2',
          migrate: (s) => s,
        });
        registerMigration({
          version: 3,
          description: 'v2 to v3',
          migrate: (s) => s,
        });
        registerMigration({
          version: 4,
          description: 'v3 to v4',
          migrate: (s) => s,
        });

        const path = getMigrationPath(1, 4);

        expect(path).toHaveLength(3);
        expect(path[0].version).toBe(2);
        expect(path[1].version).toBe(3);
        expect(path[2].version).toBe(4);
      });

      it('should only return migrations in requested range', () => {
        registerMigration({
          version: 2,
          description: 'v1 to v2',
          migrate: (s) => s,
        });
        registerMigration({
          version: 3,
          description: 'v2 to v3',
          migrate: (s) => s,
        });
        registerMigration({
          version: 4,
          description: 'v3 to v4',
          migrate: (s) => s,
        });

        const path = getMigrationPath(2, 4);

        expect(path).toHaveLength(2);
        expect(path[0].version).toBe(3);
        expect(path[1].version).toBe(4);
      });
    });

    describe('migrateState - sequencing', () => {
      it('should handle single version jump (v1 -> v2)', () => {
        registerMigration({
          version: 2,
          description: 'Add preferences',
          migrate: (state: unknown) => ({
            ...(state as Record<string, unknown>),
            preferences: { theme: 'system' },
          }),
        });

        const result = migrateState({ version: 1, data: 'test' }, 1, 2);

        expect(result.success).toBe(true);
        expect(result.fromVersion).toBe(1);
        expect(result.toVersion).toBe(2);
        expect(result.migrationsApplied).toEqual([2]);
        expect((result.migratedState as Record<string, unknown>).preferences).toEqual({
          theme: 'system',
        });
      });

      it('should handle multiple version jumps (v1 -> v3)', () => {
        registerMigration({
          version: 2,
          description: 'Add preferences',
          migrate: (state: unknown) => ({
            ...(state as Record<string, unknown>),
            preferences: {},
          }),
        });
        registerMigration({
          version: 3,
          description: 'Add theme to preferences',
          migrate: (state: unknown) => {
            const s = state as Record<string, unknown>;
            return {
              ...s,
              preferences: {
                ...(s.preferences as Record<string, unknown>),
                theme: 'dark',
              },
            };
          },
        });

        const result = migrateState({ version: 1, data: 'test' }, 1, 3);

        expect(result.success).toBe(true);
        expect(result.migrationsApplied).toEqual([2, 3]);
        expect((result.migratedState as Record<string, unknown>).preferences).toEqual({
          theme: 'dark',
        });
      });

      it('should handle large version jumps (v1 -> v10)', () => {
        // Register migrations for v2 through v10
        for (let v = 2; v <= 10; v++) {
          registerMigration({
            version: v,
            description: `Migration to v${v}`,
            migrate: (state: unknown) => ({
              ...(state as Record<string, unknown>),
              [`field_v${v}`]: `value_v${v}`,
            }),
          });
        }

        const result = migrateState({ version: 1 }, 1, 10);

        expect(result.success).toBe(true);
        expect(result.migrationsApplied).toHaveLength(9);
        expect(result.migrationsApplied).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);

        const migrated = result.migratedState as Record<string, unknown>;
        expect(migrated.field_v2).toBe('value_v2');
        expect(migrated.field_v10).toBe('value_v10');
      });

      it('should be no-op when already at current version', () => {
        registerMigration({
          version: 2,
          description: 'Should not run',
          migrate: () => {
            throw new Error('Should not be called');
          },
        });

        const state = { version: 2, data: 'test' };
        const result = migrateState(state, 2, 2);

        expect(result.success).toBe(true);
        expect(result.migrationsApplied).toEqual([]);
        expect(result.migratedState).toEqual(state);
      });

      it('should be no-op when ahead of current version', () => {
        registerMigration({
          version: 2,
          description: 'Should not run',
          migrate: () => {
            throw new Error('Should not be called');
          },
        });

        const state = { version: 3, data: 'test' };
        const result = migrateState(state, 3, 2);

        expect(result.success).toBe(true);
        expect(result.migrationsApplied).toEqual([]);
        expect(result.migratedState).toEqual(state);
      });

      it('should update version number to target after migration', () => {
        registerMigration({
          version: 2,
          description: 'Simple migration',
          migrate: (s) => s,
        });

        const result = migrateState({ version: 1, data: 'test' }, 1, 2);

        expect(result.success).toBe(true);
        expect((result.migratedState as Record<string, unknown>).version).toBe(2);
      });

      it('should handle migration path with gaps (only apply existing migrations)', () => {
        // Only register migrations for v2 and v5, skip v3 and v4
        registerMigration({
          version: 2,
          description: 'v2 migration',
          migrate: (state: unknown) => ({
            ...(state as Record<string, unknown>),
            v2Added: true,
          }),
        });
        registerMigration({
          version: 5,
          description: 'v5 migration',
          migrate: (state: unknown) => ({
            ...(state as Record<string, unknown>),
            v5Added: true,
          }),
        });

        const result = migrateState({ version: 1 }, 1, 5);

        expect(result.success).toBe(true);
        expect(result.migrationsApplied).toEqual([2, 5]);

        const migrated = result.migratedState as Record<string, unknown>;
        expect(migrated.v2Added).toBe(true);
        expect(migrated.v5Added).toBe(true);
      });
    });
  });

  // ===========================================================================
  // DATA PRESERVATION TESTS
  // ===========================================================================

  describe('Data Preservation Tests', () => {
    it('should preserve existing fields through migration', () => {
      registerMigration({
        version: 2,
        description: 'Add new field',
        migrate: (state: unknown) => ({
          ...(state as Record<string, unknown>),
          newField: 'new',
        }),
      });

      const original = {
        version: 1,
        existingField: 'preserved',
        anotherField: 123,
      };

      const result = migrateState(original, 1, 2);

      expect(result.success).toBe(true);
      const migrated = result.migratedState as Record<string, unknown>;
      expect(migrated.existingField).toBe('preserved');
      expect(migrated.anotherField).toBe(123);
      expect(migrated.newField).toBe('new');
    });

    it('should add new fields with defaults', () => {
      registerMigration({
        version: 2,
        description: 'Add preferences with defaults',
        migrate: (state: unknown) => {
          const s = state as Record<string, unknown>;
          return {
            ...s,
            preferences: s.preferences || { theme: 'system', language: 'en' },
          };
        },
      });

      const result = migrateState({ version: 1 }, 1, 2);

      expect(result.success).toBe(true);
      expect((result.migratedState as Record<string, unknown>).preferences).toEqual({
        theme: 'system',
        language: 'en',
      });
    });

    it('should preserve nested object structures', () => {
      registerMigration({
        version: 2,
        description: 'Add to nested object',
        migrate: (state: unknown) => {
          const s = state as Record<string, unknown>;
          const nested = s.nested as Record<string, unknown>;
          return {
            ...s,
            nested: {
              ...nested,
              newNestedField: 'added',
            },
          };
        },
      });

      const original = {
        version: 1,
        nested: {
          existingNested: 'kept',
          deepNested: {
            level: 'deep',
          },
        },
      };

      const result = migrateState(original, 1, 2);

      expect(result.success).toBe(true);
      const migrated = result.migratedState as Record<string, unknown>;
      const nested = migrated.nested as Record<string, unknown>;
      expect(nested.existingNested).toBe('kept');
      expect(nested.newNestedField).toBe('added');
      expect((nested.deepNested as Record<string, unknown>).level).toBe('deep');
    });

    it('should preserve array data', () => {
      registerMigration({
        version: 2,
        description: 'Process array',
        migrate: (state: unknown) => {
          const s = state as Record<string, unknown>;
          return {
            ...s,
            items: [...(s.items as unknown[]), 'newItem'],
          };
        },
      });

      const original = {
        version: 1,
        items: ['item1', 'item2', { complex: 'item' }],
      };

      const result = migrateState(original, 1, 2);

      expect(result.success).toBe(true);
      const migrated = result.migratedState as Record<string, unknown>;
      const items = migrated.items as unknown[];
      expect(items).toHaveLength(4);
      expect(items[0]).toBe('item1');
      expect(items[2]).toEqual({ complex: 'item' });
      expect(items[3]).toBe('newItem');
    });

    it('should preserve complex widget configurations', () => {
      registerMigration({
        version: 2,
        description: 'Add widget preference',
        migrate: (state: unknown) => {
          const s = state as Record<string, unknown>;
          const widgets = s.widgets as Record<string, unknown>;
          return {
            ...s,
            widgets: {
              ...widgets,
              preferences: { collapsed: false },
            },
          };
        },
      });

      const original = {
        version: 1,
        widgets: {
          projectStatus: {
            projectId: 'proj-123',
            name: 'My Project',
            status: 'on-track',
            progress: 75,
          },
          metrics: {
            title: 'Key Metrics',
            metrics: [{ id: 'm1', label: 'Revenue', value: 1000 }],
          },
          alerts: [
            { id: 'a1', type: 'info', title: 'Alert', message: 'Test' },
          ],
        },
      };

      const result = migrateState(original, 1, 2);

      expect(result.success).toBe(true);
      const migrated = result.migratedState as Record<string, unknown>;
      const widgets = migrated.widgets as Record<string, unknown>;

      // Original widgets preserved
      expect((widgets.projectStatus as Record<string, unknown>).name).toBe('My Project');
      expect(
        ((widgets.metrics as Record<string, unknown>).metrics as unknown[]).length
      ).toBe(1);
      expect((widgets.alerts as unknown[]).length).toBe(1);

      // New field added
      expect((widgets.preferences as Record<string, unknown>).collapsed).toBe(false);
    });
  });

  // ===========================================================================
  // ERROR HANDLING TESTS
  // ===========================================================================

  describe('Error Handling Tests', () => {
    it('should return failure result when migration throws', () => {
      registerMigration({
        version: 2,
        description: 'Failing migration',
        migrate: () => {
          throw new Error('Migration error');
        },
      });

      const result = migrateState({ version: 1 }, 1, 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Migration to v2 failed');
      expect(result.error).toContain('Migration error');
    });

    it('should track partial migrations on failure', () => {
      registerMigration({
        version: 2,
        description: 'Succeeds',
        migrate: (state: unknown) => ({
          ...(state as Record<string, unknown>),
          v2: true,
        }),
      });
      registerMigration({
        version: 3,
        description: 'Fails',
        migrate: () => {
          throw new Error('v3 failed');
        },
      });
      registerMigration({
        version: 4,
        description: 'Never runs',
        migrate: (state: unknown) => ({
          ...(state as Record<string, unknown>),
          v4: true,
        }),
      });

      const result = migrateState({ version: 1 }, 1, 4);

      expect(result.success).toBe(false);
      expect(result.migrationsApplied).toEqual([2]); // Only v2 completed
      expect(result.error).toContain('v3 failed');

      // Partial state should have v2 changes
      const migrated = result.migratedState as Record<string, unknown>;
      expect(migrated.v2).toBe(true);
      expect(migrated.v4).toBeUndefined();
    });

    it('should capture error messages from exceptions', () => {
      registerMigration({
        version: 2,
        description: 'Custom error',
        migrate: () => {
          throw new Error('Custom error message');
        },
      });

      const result = migrateState({ version: 1 }, 1, 2);

      expect(result.error).toContain('Custom error message');
    });

    it('should handle non-Error exceptions', () => {
      registerMigration({
        version: 2,
        description: 'Throws string',
        migrate: () => {
          throw 'String error';
        },
      });

      const result = migrateState({ version: 1 }, 1, 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('String error');
    });

    it('should fail validation when validate function returns false', () => {
      registerMigration({
        version: 2,
        description: 'Validation fails',
        migrate: (state: unknown) => ({
          ...(state as Record<string, unknown>),
          invalid: null, // Should be an object
        }),
        validate: (state: unknown) => {
          const s = state as Record<string, unknown>;
          return s.invalid !== null && typeof s.invalid === 'object';
        },
      });

      const result = migrateState({ version: 1 }, 1, 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('should pass when validate function returns true', () => {
      registerMigration({
        version: 2,
        description: 'Validation passes',
        migrate: (state: unknown) => ({
          ...(state as Record<string, unknown>),
          valid: { key: 'value' },
        }),
        validate: (state: unknown) => {
          const s = state as Record<string, unknown>;
          return s.valid !== null && typeof s.valid === 'object';
        },
      });

      const result = migrateState({ version: 1 }, 1, 2);

      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // LOGGING TESTS
  // ===========================================================================

  describe('Logging Tests', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should log success events in development', () => {
      process.env.NODE_ENV = 'development';

      registerMigration({
        version: 2,
        description: 'Test migration',
        migrate: (s) => s,
      });

      migrateState({ version: 1 }, 1, 2);

      expect(console.log).toHaveBeenCalledWith(
        '[State Migration]',
        expect.objectContaining({
          type: 'state_migration',
          version: 2,
          status: 'success',
        })
      );
    });

    it('should log error events with details in development', () => {
      process.env.NODE_ENV = 'development';

      registerMigration({
        version: 2,
        description: 'Failing migration',
        migrate: () => {
          throw new Error('Test error');
        },
      });

      migrateState({ version: 1 }, 1, 2);

      expect(console.error).toHaveBeenCalledWith(
        '[State Migration]',
        expect.objectContaining({
          type: 'state_migration',
          version: 2,
          status: 'error',
          error: expect.stringContaining('Test error'),
        })
      );
    });

    it('should include timestamp in migration events', () => {
      process.env.NODE_ENV = 'development';

      registerMigration({
        version: 2,
        description: 'Test migration',
        migrate: (s) => s,
      });

      migrateState({ version: 1 }, 1, 2);

      expect(console.log).toHaveBeenCalledWith(
        '[State Migration]',
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });

    it('should only log errors in production', () => {
      process.env.NODE_ENV = 'production';

      registerMigration({
        version: 2,
        description: 'Success migration',
        migrate: (s) => s,
      });
      registerMigration({
        version: 3,
        description: 'Failing migration',
        migrate: () => {
          throw new Error('Prod error');
        },
      });

      // First migration succeeds - should NOT log
      migrateState({ version: 1 }, 1, 2);
      expect(console.log).not.toHaveBeenCalled();

      // Second migration fails - should log error
      migrateState({ version: 2 }, 2, 3);
      expect(console.error).toHaveBeenCalledWith(
        '[State Migration] Migration failed:',
        expect.objectContaining({
          version: 3,
          error: expect.stringContaining('Prod error'),
        })
      );
    });

    it('should include description in log events', () => {
      process.env.NODE_ENV = 'development';

      registerMigration({
        version: 2,
        description: 'Add user preferences',
        migrate: (s) => s,
      });

      migrateState({ version: 1 }, 1, 2);

      expect(console.log).toHaveBeenCalledWith(
        '[State Migration]',
        expect.objectContaining({
          description: 'Add user preferences',
        })
      );
    });
  });

  // ===========================================================================
  // REGISTRATION TESTS
  // ===========================================================================

  describe('Migration Registration Tests', () => {
    describe('registerMigration', () => {
      it('should register a valid migration', () => {
        const migration: MigrationDefinition = {
          version: 2,
          description: 'Test migration',
          migrate: (s) => s,
        };

        registerMigration(migration);

        const registered = getRegisteredMigrations();
        expect(registered).toHaveLength(1);
        expect(registered[0].version).toBe(2);
      });

      it('should throw for invalid version (0 or negative)', () => {
        expect(() =>
          registerMigration({
            version: 0,
            description: 'Invalid',
            migrate: (s) => s,
          })
        ).toThrow('Invalid migration version');

        expect(() =>
          registerMigration({
            version: -1,
            description: 'Invalid',
            migrate: (s) => s,
          })
        ).toThrow('Invalid migration version');
      });

      it('should throw for duplicate versions', () => {
        registerMigration({
          version: 2,
          description: 'First',
          migrate: (s) => s,
        });

        expect(() =>
          registerMigration({
            version: 2,
            description: 'Duplicate',
            migrate: (s) => s,
          })
        ).toThrow('already exists');
      });

      it('should maintain sorted order when registering out of order', () => {
        registerMigration({
          version: 4,
          description: 'v4',
          migrate: (s) => s,
        });
        registerMigration({
          version: 2,
          description: 'v2',
          migrate: (s) => s,
        });
        registerMigration({
          version: 3,
          description: 'v3',
          migrate: (s) => s,
        });

        const registered = getRegisteredMigrations();
        expect(registered.map((m) => m.version)).toEqual([2, 3, 4]);
      });
    });

    describe('getRegisteredMigrations', () => {
      it('should return a copy of migrations array', () => {
        registerMigration({
          version: 2,
          description: 'Test',
          migrate: (s) => s,
        });

        const migrations = getRegisteredMigrations();
        migrations.push({
          version: 99,
          description: 'Injected',
          migrate: (s) => s,
        });

        // Original registry should not be affected
        expect(getRegisteredMigrations()).toHaveLength(1);
      });
    });

    describe('clearMigrations', () => {
      it('should clear all registered migrations', () => {
        registerMigration({
          version: 2,
          description: 'v2',
          migrate: (s) => s,
        });
        registerMigration({
          version: 3,
          description: 'v3',
          migrate: (s) => s,
        });

        expect(getRegisteredMigrations()).toHaveLength(2);

        clearMigrations();

        expect(getRegisteredMigrations()).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // DEFAULT STATE TESTS
  // ===========================================================================

  describe('Default State Tests', () => {
    describe('getDefaultState', () => {
      it('should return a valid default state object', () => {
        const defaultState = getDefaultState();

        expect(defaultState.version).toBe(STATE_VERSION);
        expect(defaultState.timestamp).toBeDefined();
        expect(defaultState.activeProject).toBeNull();
        expect(defaultState.widgets).toBeDefined();
        expect(defaultState.loading).toBeDefined();
        expect(defaultState.errors).toBeDefined();
        expect(defaultState.activeTasks).toBeDefined();
      });

      it('should have correct widget structure', () => {
        const defaultState = getDefaultState();
        const widgets = defaultState.widgets as Record<string, unknown>;

        expect(widgets.projectStatus).toBeNull();
        expect(widgets.metrics).toBeNull();
        expect(widgets.activity).toBeNull();
        expect(widgets.alerts).toEqual([]);
      });

      it('should have correct loading structure', () => {
        const defaultState = getDefaultState();
        const loading = defaultState.loading as Record<string, unknown>;

        expect(loading.isLoading).toBe(false);
        expect(loading.loadingAgents).toEqual([]);
      });

      it('should return a new object each time', () => {
        const state1 = getDefaultState();
        const state2 = getDefaultState();

        expect(state1).not.toBe(state2);
        expect(state1.widgets).not.toBe(state2.widgets);
      });
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle null state input', () => {
      registerMigration({
        version: 2,
        description: 'Handle null',
        migrate: (state: unknown) => ({
          ...(state === null ? {} : (state as Record<string, unknown>)),
          added: true,
        }),
      });

      const result = migrateState(null, 1, 2);

      expect(result.success).toBe(true);
      expect((result.migratedState as Record<string, unknown>).added).toBe(true);
    });

    it('should handle undefined state input', () => {
      registerMigration({
        version: 2,
        description: 'Handle undefined',
        migrate: (state: unknown) => ({
          ...(state === undefined ? {} : (state as Record<string, unknown>)),
          added: true,
        }),
      });

      const result = migrateState(undefined, 1, 2);

      expect(result.success).toBe(true);
      expect((result.migratedState as Record<string, unknown>).added).toBe(true);
    });

    it('should handle empty object state', () => {
      registerMigration({
        version: 2,
        description: 'Add to empty',
        migrate: (state: unknown) => ({
          ...(state as Record<string, unknown>),
          newField: 'value',
        }),
      });

      const result = migrateState({}, 1, 2);

      expect(result.success).toBe(true);
      expect((result.migratedState as Record<string, unknown>).newField).toBe('value');
    });

    it('should handle non-object state gracefully', () => {
      registerMigration({
        version: 2,
        description: 'Transform primitive',
        migrate: (state: unknown) => ({
          originalValue: state,
          transformed: true,
        }),
      });

      const result = migrateState('string value', 1, 2);

      expect(result.success).toBe(true);
      expect((result.migratedState as Record<string, unknown>).originalValue).toBe(
        'string value'
      );
    });

    it('should handle very deeply nested state', () => {
      registerMigration({
        version: 2,
        description: 'Deep migration',
        migrate: (state: unknown) => {
          const s = state as Record<string, unknown>;
          const a = s.a as Record<string, unknown>;
          const b = a.b as Record<string, unknown>;
          const c = b.c as Record<string, unknown>;
          return {
            ...s,
            a: {
              ...a,
              b: {
                ...b,
                c: {
                  ...c,
                  newField: 'deep',
                },
              },
            },
          };
        },
      });

      const original = {
        version: 1,
        a: {
          b: {
            c: {
              existing: 'value',
            },
          },
        },
      };

      const result = migrateState(original, 1, 2);

      expect(result.success).toBe(true);
      const migrated = result.migratedState as Record<string, unknown>;
      const a = migrated.a as Record<string, unknown>;
      const b = a.b as Record<string, unknown>;
      const c = b.c as Record<string, unknown>;
      expect(c.existing).toBe('value');
      expect(c.newField).toBe('deep');
    });

    it('should handle state with circular reference detection (if migration creates one)', () => {
      // This tests that migrations don't inadvertently create circular refs
      registerMigration({
        version: 2,
        description: 'Safe migration',
        migrate: (state: unknown) => ({
          ...(state as Record<string, unknown>),
          safe: true,
        }),
      });

      const result = migrateState({ version: 1 }, 1, 2);

      // Should be serializable (no circular refs)
      expect(() => JSON.stringify(result.migratedState)).not.toThrow();
    });

    it('should update version even when no migrations are registered', () => {
      // No migrations registered, but we're asking to go from v1 to v2
      const result = migrateState({ version: 1, data: 'test' }, 1, 2);

      expect(result.success).toBe(true);
      expect((result.migratedState as Record<string, unknown>).version).toBe(2);
      expect((result.migratedState as Record<string, unknown>).data).toBe('test');
    });
  });

  // ===========================================================================
  // CONSTANTS TESTS
  // ===========================================================================

  describe('Constants', () => {
    it('should export STATE_VERSION matching dashboard-state.ts', () => {
      expect(STATE_VERSION).toBe(1);
    });
  });
});
