import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import DOMPurify from 'dompurify'
import { KBSearchResults } from './KBSearchResults'
import type { KBSearchResult } from '@/hooks/use-kb-pages'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((html: string, options: { ALLOWED_TAGS: string[] }) => {
      let result = html
      result = result.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        '',
      )

      if (options.ALLOWED_TAGS.length === 1 && options.ALLOWED_TAGS[0] === 'mark') {
        result = result.replace(/<(?!\/?mark\b)[^>]*>/gi, '')
      }

      return result
    }),
  },
}))

describe('KBSearchResults', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('sanitizes search snippets and only allows <mark>', () => {
    const results: KBSearchResult[] = [
      {
        pageId: 'page-1',
        title: 'Test Page',
        slug: 'test-page',
        snippet:
          `<mark>hello</mark> <img src=x onerror="alert('xss')" /> ` +
          `<script>alert('xss')</script> world`,
        rank: 1,
        updatedAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        path: ['Root'],
      },
    ]

    const { container } = render(
      <KBSearchResults query="hello" results={results} total={1} />,
    )

    expect(DOMPurify.sanitize).toHaveBeenCalledWith(results[0].snippet, {
      ALLOWED_TAGS: ['mark'],
      ALLOWED_ATTR: [],
    })

    expect(container.querySelector('mark')?.textContent).toBe('hello')
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })
})

