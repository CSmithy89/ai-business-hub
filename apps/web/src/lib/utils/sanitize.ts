/**
 * Input Sanitization Utilities
 * Story 09-14: Secure XSS prevention with DOMPurify
 *
 * Uses DOMPurify for robust HTML sanitization that handles all XSS vectors,
 * including edge cases that regex-based sanitization misses.
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * DOMPurify configuration for strict text-only sanitization
 * Removes ALL HTML, keeping only text content
 */
const STRICT_CONFIG = {
  ALLOWED_TAGS: [] as string[], // No HTML tags allowed
  ALLOWED_ATTR: [] as string[], // No attributes allowed
  KEEP_CONTENT: true, // Keep text content from tags
}

/**
 * DOMPurify configuration for basic formatting (paragraphs, bold, italic)
 * For use in descriptions that allow simple formatting
 */
const BASIC_FORMATTING_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em'],
  ALLOWED_ATTR: [] as string[],
  KEEP_CONTENT: true,
}

/**
 * Sanitize input to plain text only
 * Removes ALL HTML tags and attributes, keeping only text content
 * Also removes control characters
 *
 * Use this for: role names, workspace names, user input that should be plain text
 *
 * @param input - String to sanitize
 * @returns Sanitized plain text
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // First pass: DOMPurify removes all HTML and XSS vectors
  const cleaned = DOMPurify.sanitize(input, STRICT_CONFIG) as string

  // Second pass: Remove control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  const noControl = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Normalize whitespace
  return noControl.trim()
}

/**
 * Sanitize input allowing basic HTML formatting
 * Allows: p, br, b, i, strong, em tags
 * Removes: scripts, event handlers, all other tags
 *
 * Use this for: descriptions, content that may have simple formatting
 *
 * @param input - String to sanitize
 * @returns Sanitized string with allowed formatting
 */
export function sanitizeBasicHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // DOMPurify handles all XSS vectors including:
  // - Script tags and javascript: URLs
  // - Event handlers (onclick, onerror, etc.)
  // - SVG-based XSS
  // - Unicode tricks
  // - Mutation XSS
  const cleaned = DOMPurify.sanitize(input, BASIC_FORMATTING_CONFIG) as string

  // Remove control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  const noControl = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  return noControl.trim()
}

/**
 * Legacy-compatible sanitizeInput function
 * Replaces the regex-based version with DOMPurify-based sanitization
 *
 * @deprecated Use sanitizeText() or sanitizeBasicHTML() directly for clarity
 * @param input - String to sanitize
 * @returns Sanitized plain text
 */
export function sanitizeInput(input: string): string {
  return sanitizeText(input)
}

/**
 * Sanitize an object's string properties
 * Useful for sanitizing entire request bodies
 *
 * @param obj - Object with string properties to sanitize
 * @param keys - Array of keys to sanitize (sanitizes all string props if not provided)
 * @returns New object with sanitized values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  keys?: (keyof T)[]
): T {
  const result = { ...obj }
  const keysToSanitize = keys || (Object.keys(obj) as (keyof T)[])

  for (const key of keysToSanitize) {
    const value = result[key]
    if (typeof value === 'string') {
      ;(result as Record<keyof T, unknown>)[key] = sanitizeText(value)
    }
  }

  return result
}

/**
 * Sanitize HTML content (alias for sanitizeBasicHTML)
 * Allows basic formatting while removing XSS vectors
 *
 * @param input - HTML string to sanitize
 * @returns Sanitized HTML with only safe tags
 */
export function sanitizeHtml(input: string): string {
  return sanitizeBasicHTML(input)
}

/**
 * Sanitize a string for use in HTML attributes
 * Encodes special characters that could break out of attribute context
 *
 * @param input - String to sanitize for attribute use
 * @returns String safe for use in HTML attributes
 */
export function sanitizeForAttribute(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // First remove any HTML/XSS
  const cleaned = sanitizeText(input)

  // Encode characters that could break out of attribute context
  return cleaned
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Allowed URL protocols for sanitization
 */
const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

/**
 * Sanitize a URL, removing dangerous protocols
 * Returns empty string for unsafe URLs
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return ''
  }

  // Decode any HTML entities first
  const decoded = trimmed
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))

  // Check for dangerous protocols (case-insensitive)
  const lowerUrl = decoded.toLowerCase().trim()
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return ''
  }

  // Allow relative URLs (starting with / or not containing :)
  if (trimmed.startsWith('/') || !trimmed.includes(':')) {
    return trimmed
  }

  // Check against allowed protocols
  try {
    const urlObj = new URL(trimmed)
    if (SAFE_URL_PROTOCOLS.includes(urlObj.protocol)) {
      return trimmed
    }
    return ''
  } catch {
    // If URL parsing fails, it might still be a valid relative URL
    return trimmed.startsWith('/') ? trimmed : ''
  }
}

/**
 * Validate if a string is a valid HTTP/HTTPS URL
 *
 * @param url - String to validate as URL
 * @returns true if valid http/https URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}
