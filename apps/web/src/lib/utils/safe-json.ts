/**
 * Safe JSON parsing for fetch responses.
 *
 * Why: `response.json()` throws for empty bodies (204), non-JSON responses, or invalid JSON.
 * This helper avoids unhandled exceptions in hooks and mutation flows.
 */

export async function safeJson<T = unknown>(response: Response): Promise<T | null> {
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null

  try {
    return (await response.clone().json()) as T
  } catch {
    return null
  }
}

