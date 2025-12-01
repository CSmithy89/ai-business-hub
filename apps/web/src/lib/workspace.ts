/**
 * Workspace utility functions
 * Includes slug generation and workspace-related helpers
 */

import { nanoid } from 'nanoid'

/**
 * Generate a URL-safe slug from a workspace name
 *
 * Format: {sanitized-name}-{nanoid(6)}
 * Example: "My Business" → "my-business-a1b2c3"
 *
 * @param name - The workspace name to convert to a slug
 * @returns URL-safe slug with unique suffix
 */
export function generateSlug(name: string): string {
  // Convert to lowercase and sanitize
  const sanitized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-{2,}/g, '-') // Replace multiple hyphens with single

  // Handle edge case of empty sanitized name
  if (!sanitized) {
    return `workspace-${nanoid(6)}`
  }

  // Append unique suffix
  const uniqueSuffix = nanoid(6)
  return `${sanitized}-${uniqueSuffix}`
}

/**
 * Generate a unique slug with collision detection and retry logic
 *
 * @param name - The workspace name to convert to a slug
 * @param checkExists - Function to check if slug already exists in database
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @returns Promise resolving to a unique slug
 * @throws Error if unable to generate unique slug after max attempts
 */
export async function generateUniqueSlug(
  name: string,
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts = 3
): Promise<string> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const slug = generateSlug(name)
    const exists = await checkExists(slug)

    if (!exists) {
      return slug
    }

    // Log collision for monitoring (in production, consider structured logging)
    console.warn('Slug collision detected, retrying...', {
      slug,
      attempt: attempts + 1,
      maxAttempts,
    })

    attempts++
  }

  throw new Error(
    `Failed to generate unique slug after ${maxAttempts} attempts. Please try a different name.`
  )
}

/**
 * Validate slug format
 *
 * @param slug - The slug to validate
 * @returns true if valid format, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Slug must be:
  // - Lowercase
  // - Only alphanumeric and hyphens
  // - Not start or end with hyphen
  // - Have exactly one hyphen-separated suffix of 6 characters
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*-[a-z0-9]{6}$/
  return slugRegex.test(slug)
}

/**
 * Extract workspace name hint from slug (for display purposes)
 * Removes the unique suffix to get approximate original name
 *
 * @param slug - The workspace slug
 * @returns Approximate original name (title cased)
 */
export function slugToNameHint(slug: string): string {
  // Remove the last segment (unique suffix)
  const parts = slug.split('-')

  if (parts.length <= 1) {
    return slug
  }

  // Remove last 6-char suffix
  const lastPart = parts[parts.length - 1]
  if (lastPart.length === 6) {
    parts.pop()
  }

  // Convert to title case
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
