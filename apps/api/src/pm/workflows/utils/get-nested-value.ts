/**
 * Safely get a nested value from an object using a dot-separated path.
 *
 * @param obj - The object to access
 * @param path - Dot-separated path (e.g., "task.assignee.name")
 * @param defaultValue - Value to return if path doesn't exist
 * @returns The value at the path or the default value
 *
 * @example
 * const data = { task: { assignee: { name: 'John' } } };
 * getNestedValue(data, 'task.assignee.name'); // 'John'
 * getNestedValue(data, 'task.missing.path', 'default'); // 'default'
 */
export function getNestedValue<T = unknown>(
  obj: Record<string, unknown> | undefined | null,
  path: string,
  defaultValue?: T,
): T | undefined {
  if (obj == null || typeof path !== 'string') {
    return defaultValue;
  }

  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result === undefined ? defaultValue : result) as T;
}
