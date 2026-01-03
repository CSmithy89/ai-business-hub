/**
 * State Diff Utility Tests
 *
 * Tests for the state diff computation and application utilities.
 *
 * Story: DM-11.2 - WebSocket State Synchronization
 */

import {
  getByPath,
  setByPath,
  deleteByPath,
  deepEqual,
  computeDiff,
  applyChange,
  applyChanges,
  createChange,
  type StateChange,
} from './state-diff';

describe('state-diff', () => {
  describe('getByPath', () => {
    it('should get top-level value', () => {
      const obj = { name: 'test', value: 42 };
      expect(getByPath(obj, 'name')).toBe('test');
      expect(getByPath(obj, 'value')).toBe(42);
    });

    it('should get nested value', () => {
      const obj = { user: { profile: { name: 'John' } } };
      expect(getByPath(obj, 'user.profile.name')).toBe('John');
    });

    it('should return undefined for non-existent path', () => {
      const obj = { name: 'test' };
      expect(getByPath(obj, 'missing')).toBeUndefined();
      expect(getByPath(obj, 'user.profile.name')).toBeUndefined();
    });

    it('should return undefined for empty path', () => {
      const obj = { name: 'test' };
      expect(getByPath(obj, '')).toBeUndefined();
    });

    it('should handle null values in path', () => {
      const obj = { user: null };
      expect(getByPath(obj, 'user.profile')).toBeUndefined();
    });
  });

  describe('setByPath', () => {
    it('should set top-level value', () => {
      const obj = { name: 'old' };
      const result = setByPath(obj, 'name', 'new');
      expect(result.name).toBe('new');
      expect(obj.name).toBe('old'); // Original unchanged
    });

    it('should set nested value', () => {
      const obj = { user: { profile: { name: 'John' } } };
      const result = setByPath(obj, 'user.profile.name', 'Jane');
      expect(getByPath(result, 'user.profile.name')).toBe('Jane');
    });

    it('should create intermediate objects', () => {
      const obj = {};
      const result = setByPath(obj, 'user.profile.name', 'John');
      expect(getByPath(result, 'user.profile.name')).toBe('John');
    });

    it('should maintain immutability', () => {
      const obj = { user: { name: 'John' } };
      const result = setByPath(obj, 'user.name', 'Jane');
      expect(obj.user.name).toBe('John');
      expect(result.user.name).toBe('Jane');
      expect(obj.user).not.toBe(result.user);
    });

    it('should handle empty path', () => {
      const obj = { name: 'test' };
      const result = setByPath(obj, '', 'value');
      expect(result).toEqual(obj);
    });
  });

  describe('deleteByPath', () => {
    it('should delete top-level value', () => {
      const obj = { name: 'test', value: 42 };
      const result = deleteByPath(obj, 'name');
      expect(result.name).toBeUndefined();
      expect(result.value).toBe(42);
      expect(obj.name).toBe('test'); // Original unchanged
    });

    it('should delete nested value', () => {
      const obj = { user: { profile: { name: 'John', age: 30 } } };
      const result = deleteByPath(obj, 'user.profile.name');
      expect(getByPath(result, 'user.profile.name')).toBeUndefined();
      expect(getByPath(result, 'user.profile.age')).toBe(30);
    });

    it('should return original if path does not exist', () => {
      const obj = { name: 'test' };
      const result = deleteByPath(obj, 'missing.path');
      expect(result).toBe(obj);
    });
  });

  describe('deepEqual', () => {
    it('should return true for identical primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('test', 'test')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('a', 'b')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
    });

    it('should compare objects deeply', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    });

    it('should compare arrays deeply', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
    });

    it('should handle null and undefined', () => {
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('should handle different types', () => {
      expect(deepEqual(1, '1')).toBe(false);
      expect(deepEqual({}, [])).toBe(false);
    });
  });

  describe('computeDiff', () => {
    it('should detect added keys', () => {
      const oldState = { a: 1 };
      const newState = { a: 1, b: 2 };
      const diff = computeDiff(oldState, newState);
      expect(diff).toContainEqual({ path: 'b', value: 2 });
    });

    it('should detect modified keys', () => {
      const oldState = { a: 1 };
      const newState = { a: 2 };
      const diff = computeDiff(oldState, newState);
      expect(diff).toContainEqual({ path: 'a', value: 2 });
    });

    it('should detect deleted keys', () => {
      const oldState = { a: 1, b: 2 };
      const newState = { a: 1 };
      const diff = computeDiff(oldState, newState);
      expect(diff).toContainEqual({ path: 'b', value: undefined });
    });

    it('should compute nested diffs', () => {
      const oldState = { user: { name: 'John', age: 30 } };
      const newState = { user: { name: 'Jane', age: 30 } };
      const diff = computeDiff(oldState, newState);
      expect(diff).toContainEqual({ path: 'user.name', value: 'Jane' });
    });

    it('should return empty array for identical states', () => {
      const state = { a: 1, b: { c: 2 } };
      const diff = computeDiff(state, state);
      expect(diff).toEqual([]);
    });

    it('should handle array changes as complete replacement', () => {
      const oldState = { items: [1, 2, 3] };
      const newState = { items: [1, 2, 4] };
      const diff = computeDiff(oldState, newState);
      expect(diff).toContainEqual({ path: 'items', value: [1, 2, 4] });
    });
  });

  describe('applyChange', () => {
    it('should apply value change', () => {
      const state = { name: 'old' };
      const change: StateChange = { path: 'name', value: 'new' };
      const result = applyChange(state, change);
      expect(result.name).toBe('new');
    });

    it('should apply nested change', () => {
      const state = { user: { name: 'old' } };
      const change: StateChange = { path: 'user.name', value: 'new' };
      const result = applyChange(state, change);
      expect(getByPath(result, 'user.name')).toBe('new');
    });

    it('should apply deletion', () => {
      const state = { name: 'test', value: 42 };
      const change: StateChange = { path: 'name', value: undefined };
      const result = applyChange(state, change);
      expect(result.name).toBeUndefined();
      expect(result.value).toBe(42);
    });
  });

  describe('applyChanges', () => {
    it('should apply multiple changes', () => {
      const state = { a: 1, b: 2, c: 3 };
      const changes: StateChange[] = [
        { path: 'a', value: 10 },
        { path: 'b', value: 20 },
        { path: 'd', value: 40 },
      ];
      const result = applyChanges(state, changes);
      expect(result).toEqual({ a: 10, b: 20, c: 3, d: 40 });
    });

    it('should apply changes in order', () => {
      const state = { a: 1 };
      const changes: StateChange[] = [
        { path: 'a', value: 2 },
        { path: 'a', value: 3 },
      ];
      const result = applyChanges(state, changes);
      expect(result.a).toBe(3);
    });
  });

  describe('createChange', () => {
    it('should create a valid state change', () => {
      const change = createChange('user.name', 'John');
      expect(change).toEqual({ path: 'user.name', value: 'John' });
    });
  });
});
