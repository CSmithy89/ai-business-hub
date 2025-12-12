/**
 * Redirect Validation Utility
 *
 * Provides secure redirect URL validation to prevent open redirect vulnerabilities.
 * Only allows relative paths starting with '/' and blocks:
 * - Absolute URLs (http://, https://, //)
 * - Protocol-relative URLs
 * - JavaScript URLs
 * - Data URLs
 * - External domain redirects
 *
 * Story: 15.15 - Security Enhancement
 */

/**
 * Allowlist of valid internal paths that can be used as redirect destinations.
 * Only paths that start with these prefixes are considered valid.
 */
const ALLOWED_PATH_PREFIXES = [
  '/businesses',
  '/dashboard',
  '/agents',
  '/approvals',
  '/settings',
  '/onboarding',
  '/profile',
] as const

/**
 * Validates if a redirect URL is safe to use.
 *
 * @param url - The URL to validate
 * @returns true if the URL is a valid internal redirect, false otherwise
 *
 * @example
 * isAllowedRedirect('/businesses') // true
 * isAllowedRedirect('/dashboard/123') // true
 * isAllowedRedirect('https://evil.com') // false
 * isAllowedRedirect('//evil.com') // false
 * isAllowedRedirect('javascript:alert(1)') // false
 */
export function isAllowedRedirect(url: string | null | undefined): boolean {
  // Reject null, undefined, or empty strings
  if (!url || typeof url !== 'string') {
    return false
  }

  // Trim whitespace
  const trimmedUrl = url.trim()

  // Must start with exactly one forward slash (not //)
  if (!trimmedUrl.startsWith('/') || trimmedUrl.startsWith('//')) {
    return false
  }

  // Block protocol handlers (javascript:, data:, vbscript:, etc.)
  const lowerUrl = trimmedUrl.toLowerCase()
  if (
    lowerUrl.includes('javascript:') ||
    lowerUrl.includes('data:') ||
    lowerUrl.includes('vbscript:')
  ) {
    return false
  }

  // Block URLs with backslashes (can bypass some filters)
  if (trimmedUrl.includes('\\')) {
    return false
  }

  // Block URLs with encoded characters that could bypass validation
  // Check for encoded slashes and backslashes
  if (
    lowerUrl.includes('%2f') || // encoded /
    lowerUrl.includes('%5c') || // encoded \
    lowerUrl.includes('%00') // null byte
  ) {
    return false
  }

  // Check if path starts with an allowed prefix
  const isAllowedPath = ALLOWED_PATH_PREFIXES.some(
    (prefix) => trimmedUrl === prefix || trimmedUrl.startsWith(`${prefix}/`)
  )

  return isAllowedPath
}

/**
 * Sanitizes a redirect URL, returning a safe default if invalid.
 *
 * @param url - The URL to sanitize
 * @param fallback - The fallback URL to use if validation fails (default: '/businesses')
 * @returns A safe redirect URL
 *
 * @example
 * getSafeRedirectUrl('/dashboard/123') // '/dashboard/123'
 * getSafeRedirectUrl('https://evil.com') // '/businesses'
 * getSafeRedirectUrl(null, '/agents') // '/agents'
 */
export function getSafeRedirectUrl(
  url: string | null | undefined,
  fallback: string = '/businesses'
): string {
  if (isAllowedRedirect(url)) {
    return url!.trim()
  }
  return fallback
}
