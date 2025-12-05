/**
 * Sanitization Utility Tests
 * Story 09: Tests for XSS prevention and input sanitization
 *
 * @module sanitize.test
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  sanitizeHtml,
  sanitizeForAttribute,
  sanitizeUrl,
  isValidUrl,
} from './sanitize'

describe('sanitizeText', () => {
  it('should return plain text unchanged', () => {
    const input = 'Hello, World!'
    expect(sanitizeText(input)).toBe('Hello, World!')
  })

  it('should strip HTML tags', () => {
    const input = '<p>Hello</p>'
    expect(sanitizeText(input)).toBe('Hello')
  })

  it('should strip script tags and content', () => {
    const input = 'Hello<script>alert("xss")</script>World'
    expect(sanitizeText(input)).toBe('HelloWorld')
  })

  it('should strip event handlers', () => {
    const input = '<div onclick="alert(1)">Click me</div>'
    expect(sanitizeText(input)).toBe('Click me')
  })

  it('should strip javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">Link</a>'
    expect(sanitizeText(input)).toBe('Link')
  })

  it('should remove control characters', () => {
    const input = 'Hello\x00World\x1F'
    const result = sanitizeText(input)
    expect(result).not.toContain('\x00')
    expect(result).not.toContain('\x1F')
    expect(result).toBe('HelloWorld')
  })

  it('should trim whitespace', () => {
    const input = '  Hello World  '
    expect(sanitizeText(input)).toBe('Hello World')
  })

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('')
  })

  it('should handle nested tags', () => {
    const input = '<div><span><b>Bold</b></span></div>'
    expect(sanitizeText(input)).toBe('Bold')
  })

  it('should handle malformed HTML', () => {
    const input = '<div>Unclosed<span>Tags'
    const result = sanitizeText(input)
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })

  it('should preserve unicode characters', () => {
    const input = '你好世界 🌍 مرحبا'
    expect(sanitizeText(input)).toBe('你好世界 🌍 مرحبا')
  })

  it('should handle SVG-based XSS', () => {
    const input = '<svg onload="alert(1)">'
    expect(sanitizeText(input)).toBe('')
  })

  it('should handle img onerror XSS', () => {
    const input = '<img src=x onerror="alert(1)">'
    expect(sanitizeText(input)).toBe('')
  })
})

describe('sanitizeHtml', () => {
  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>'
    const result = sanitizeHtml(input)
    expect(result).toContain('<p>')
    expect(result).toContain('<strong>')
    expect(result).toContain('</strong>')
    expect(result).toContain('</p>')
  })

  it('should strip links but keep text content', () => {
    // sanitizeBasicHTML is intentionally restrictive - no anchor tags
    const input = '<a href="https://example.com">Link</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<a')
    expect(result).toContain('Link')
  })

  it('should strip script tags', () => {
    const input = '<p>Safe</p><script>alert(1)</script>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).toContain('<p>Safe</p>')
  })

  it('should strip event handlers from allowed tags', () => {
    const input = '<p onclick="alert(1)">Click</p>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('onclick')
    expect(result).toContain('<p>')
    expect(result).toContain('Click')
  })

  it('should strip javascript: URLs from links', () => {
    const input = '<a href="javascript:alert(1)">Link</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('javascript:')
  })

  it('should strip lists but keep text content', () => {
    // sanitizeBasicHTML only allows: p, br, b, i, strong, em
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<ul>')
    expect(result).not.toContain('<li>')
    expect(result).toContain('Item 1')
    expect(result).toContain('Item 2')
  })

  it('should strip blockquotes but keep text content', () => {
    // sanitizeBasicHTML only allows: p, br, b, i, strong, em
    const input = '<blockquote>A quote</blockquote>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<blockquote>')
    expect(result).toContain('A quote')
  })

  it('should strip iframe tags', () => {
    const input = '<iframe src="https://evil.com"></iframe>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<iframe>')
  })

  it('should strip form elements', () => {
    const input = '<form action="/steal"><input type="text"></form>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<form>')
    expect(result).not.toContain('<input>')
  })

  it('should handle data: URLs', () => {
    const input = '<a href="data:text/html,<script>alert(1)</script>">Link</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('data:')
  })
})

describe('sanitizeForAttribute', () => {
  it('should encode HTML entities', () => {
    const input = '<script>"test"</script>'
    const result = sanitizeForAttribute(input)
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).not.toContain('"')
  })

  it('should be safe for use in attributes', () => {
    const input = '" onclick="alert(1)'
    const result = sanitizeForAttribute(input)
    expect(result).not.toContain('"')
  })

  it('should handle ampersands', () => {
    const input = 'Tom & Jerry'
    const result = sanitizeForAttribute(input)
    // Should not double-encode if already safe
    expect(result).toContain('&')
  })

  it('should handle single quotes', () => {
    const input = "It's a test"
    const result = sanitizeForAttribute(input)
    // Single quotes should be safe or encoded
    expect(result).toBeDefined()
  })
})

describe('sanitizeUrl', () => {
  it('should allow https URLs', () => {
    const input = 'https://example.com/path?query=1'
    expect(sanitizeUrl(input)).toBe(input)
  })

  it('should allow http URLs', () => {
    const input = 'http://example.com'
    expect(sanitizeUrl(input)).toBe(input)
  })

  it('should allow relative URLs', () => {
    const input = '/path/to/resource'
    expect(sanitizeUrl(input)).toBe(input)
  })

  it('should allow mailto URLs', () => {
    const input = 'mailto:test@example.com'
    expect(sanitizeUrl(input)).toBe(input)
  })

  it('should allow tel URLs', () => {
    const input = 'tel:+1234567890'
    expect(sanitizeUrl(input)).toBe(input)
  })

  it('should block javascript: URLs', () => {
    const input = 'javascript:alert(1)'
    expect(sanitizeUrl(input)).toBe('')
  })

  it('should block javascript: with encoding', () => {
    const input = 'java&#115;cript:alert(1)'
    expect(sanitizeUrl(input)).toBe('')
  })

  it('should block data: URLs', () => {
    const input = 'data:text/html,<script>alert(1)</script>'
    expect(sanitizeUrl(input)).toBe('')
  })

  it('should block vbscript: URLs', () => {
    const input = 'vbscript:msgbox(1)'
    expect(sanitizeUrl(input)).toBe('')
  })

  it('should handle empty string', () => {
    expect(sanitizeUrl('')).toBe('')
  })

  it('should handle case variations', () => {
    const input = 'JAVASCRIPT:alert(1)'
    expect(sanitizeUrl(input)).toBe('')
  })

  it('should handle whitespace tricks', () => {
    const input = '   javascript:alert(1)'
    expect(sanitizeUrl(input)).toBe('')
  })
})

describe('isValidUrl', () => {
  it('should validate https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
  })

  it('should validate http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('should reject javascript: URLs', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })

  it('should reject data: URLs', () => {
    expect(isValidUrl('data:text/html,test')).toBe(false)
  })

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not a url')).toBe(false)
  })

  it('should reject empty string', () => {
    expect(isValidUrl('')).toBe(false)
  })

  it('should validate URLs with paths and query strings', () => {
    expect(isValidUrl('https://example.com/path?query=value&other=123')).toBe(true)
  })

  it('should validate URLs with ports', () => {
    expect(isValidUrl('https://example.com:8080/path')).toBe(true)
  })

  it('should validate URLs with authentication', () => {
    expect(isValidUrl('https://user:pass@example.com')).toBe(true)
  })
})

describe('XSS Attack Vectors', () => {
  const xssPayloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<body onload=alert(1)>',
    '<iframe src="javascript:alert(1)">',
    '<div style="background:url(javascript:alert(1))">',
    '<a href="javascript:alert(1)">click</a>',
    '<input onfocus=alert(1) autofocus>',
    '<marquee onstart=alert(1)>',
    '<video><source onerror=alert(1)>',
    '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
    '"><script>alert(1)</script>',
    "'-alert(1)-'",
    '<scr<script>ipt>alert(1)</scr</script>ipt>',
    '\\x3cscript\\x3ealert(1)\\x3c/script\\x3e',
  ]

  it('should neutralize all common XSS payloads with sanitizeText', () => {
    for (const payload of xssPayloads) {
      const result = sanitizeText(payload)
      expect(result).not.toContain('<script')
      expect(result).not.toContain('onerror')
      expect(result).not.toContain('onload')
      expect(result).not.toContain('onfocus')
      expect(result).not.toContain('onstart')
      expect(result).not.toContain('javascript:')
    }
  })

  it('should neutralize all common XSS payloads with sanitizeHtml', () => {
    for (const payload of xssPayloads) {
      const result = sanitizeHtml(payload)
      expect(result).not.toContain('<script')
      expect(result).not.toMatch(/on\w+\s*=/i)
      expect(result).not.toContain('javascript:')
    }
  })
})
