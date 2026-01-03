/**
 * State Diff Utility
 *
 * Computes minimal diffs between dashboard states and applies
 * incoming diffs to local state. Supports path-based updates
 * for efficient WebSocket synchronization.
 *
 * Story: DM-11.2 - WebSocket State Synchronization
 */

/**
 * State change representing a path-value update
 */
export interface StateChange {
  /** Dot-notation path (e.g., 'widgets.projectStatus', 'activeProject') */
  path: string;
  /** The new value at this path */
  value: unknown;
}

/**
 * Get a nested value from an object by dot-notation path
 *
 * @param obj - The object to read from
 * @param path - Dot-notation path (e.g., 'widgets.projectStatus.status')
 * @returns The value at the path, or undefined if not found
 */
export function getByPath<T = unknown>(
  obj: Record<string, unknown>,
  path: string
): T | undefined {
  if (!path) return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current as T;
}

/**
 * Set a nested value in an object by dot-notation path
 * Creates intermediate objects as needed.
 * Returns a new object (immutable).
 *
 * @param obj - The object to update
 * @param path - Dot-notation path (e.g., 'widgets.projectStatus.status')
 * @param value - The new value to set
 * @returns A new object with the updated value
 */
export function setByPath<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): T {
  if (!path) return obj;

  const parts = path.split('.');
  const result = { ...obj } as Record<string, unknown>;
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = current[part];

    if (next === null || next === undefined || typeof next !== 'object') {
      // Create intermediate object
      current[part] = {};
    } else {
      // Clone to maintain immutability
      current[part] = { ...next } as Record<string, unknown>;
    }

    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;

  return result as T;
}

/**
 * Delete a nested value from an object by dot-notation path
 * Returns a new object (immutable).
 *
 * @param obj - The object to update
 * @param path - Dot-notation path (e.g., 'widgets.projectStatus')
 * @returns A new object with the value deleted
 */
export function deleteByPath<T extends Record<string, unknown>>(
  obj: T,
  path: string
): T {
  if (!path) return obj;

  const parts = path.split('.');
  const result = { ...obj } as Record<string, unknown>;
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = current[part];

    if (next === null || next === undefined || typeof next !== 'object') {
      // Path doesn't exist, nothing to delete
      return obj;
    }

    // Clone to maintain immutability
    current[part] = { ...next } as Record<string, unknown>;
    current = current[part] as Record<string, unknown>;
  }

  delete current[parts[parts.length - 1]];

  return result as T;
}

/**
 * Deep comparison between two values
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if values are deeply equal
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(objA[key], objB[key]));
}

/**
 * Compute the minimal diff between two states
 * Returns an array of changes needed to transform `oldState` into `newState`
 *
 * @param oldState - The previous state
 * @param newState - The new state
 * @param basePath - Internal: base path for recursion
 * @param maxDepth - Maximum recursion depth (default: 5)
 * @returns Array of state changes
 */
export function computeDiff(
  oldState: Record<string, unknown>,
  newState: Record<string, unknown>,
  basePath = '',
  maxDepth = 5
): StateChange[] {
  const changes: StateChange[] = [];

  if (maxDepth <= 0) {
    // At max depth, compare as a whole
    if (!deepEqual(oldState, newState)) {
      changes.push({ path: basePath, value: newState });
    }
    return changes;
  }

  // Check for added or modified keys in newState
  for (const key of Object.keys(newState)) {
    const path = basePath ? `${basePath}.${key}` : key;
    const oldValue = oldState[key];
    const newValue = newState[key];

    if (oldValue === undefined) {
      // Key added
      changes.push({ path, value: newValue });
    } else if (!deepEqual(oldValue, newValue)) {
      // Key modified
      if (
        typeof oldValue === 'object' &&
        typeof newValue === 'object' &&
        oldValue !== null &&
        newValue !== null &&
        !Array.isArray(oldValue) &&
        !Array.isArray(newValue)
      ) {
        // Recurse into nested objects
        const nestedChanges = computeDiff(
          oldValue as Record<string, unknown>,
          newValue as Record<string, unknown>,
          path,
          maxDepth - 1
        );
        changes.push(...nestedChanges);
      } else {
        // Leaf value changed or type changed
        changes.push({ path, value: newValue });
      }
    }
  }

  // Check for deleted keys (keys in oldState but not in newState)
  for (const key of Object.keys(oldState)) {
    if (!(key in newState)) {
      const path = basePath ? `${basePath}.${key}` : key;
      // For deletions, we set value to undefined
      changes.push({ path, value: undefined });
    }
  }

  return changes;
}

/**
 * Apply a state change to a state object
 *
 * @param state - The current state
 * @param change - The change to apply
 * @returns The updated state (immutable)
 */
export function applyChange<T extends Record<string, unknown>>(
  state: T,
  change: StateChange
): T {
  if (change.value === undefined) {
    return deleteByPath(state, change.path);
  }
  return setByPath(state, change.path, change.value);
}

/**
 * Apply multiple state changes to a state object
 *
 * @param state - The current state
 * @param changes - The changes to apply
 * @returns The updated state (immutable)
 */
export function applyChanges<T extends Record<string, unknown>>(
  state: T,
  changes: StateChange[]
): T {
  return changes.reduce((acc, change) => applyChange(acc, change), state);
}

/**
 * Create a StateChange from a path and value
 * Utility for creating changes to emit via WebSocket
 *
 * @param path - Dot-notation path
 * @param value - The new value
 * @returns StateChange object
 */
export function createChange(path: string, value: unknown): StateChange {
  return { path, value };
}
