'use client'

import { Clock, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import DOMPurify from 'dompurify'
import type { KBSearchResult } from '@/hooks/use-kb-pages'
import { cn } from '@/lib/utils'

/**
 * Sanitize HTML snippets from search results to prevent XSS attacks.
 * Only allows <mark> tags for highlighting search matches.
 */
function sanitizeSnippet(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: [],
  })
}

interface KBSearchResultsProps {
  query: string
  results: KBSearchResult[]
  total: number
  isLoading?: boolean
}

export function KBSearchResults({ query, results, total, isLoading }: KBSearchResultsProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search query or keywords
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Found {total} result{total !== 1 ? 's' : ''} for &quot;{query}&quot;
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.pageId}
            onClick={() => router.push(`/kb/${result.slug}` as any)}
            className={cn(
              "group p-4 border rounded-lg cursor-pointer transition-colors",
              "hover:bg-accent hover:border-accent-foreground/20"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-1 truncate group-hover:text-primary">
                  {result.title}
                </h3>

                {result.path.length > 0 && (
                  <div className="text-xs text-muted-foreground mb-2 truncate">
                    {result.path.join(' › ')}
                  </div>
                )}

                <div
                  className="text-sm text-muted-foreground line-clamp-3 [&_mark]:bg-yellow-200 [&_mark]:text-foreground [&_mark]:px-0.5 [&_mark]:rounded dark:[&_mark]:bg-yellow-900/50"
                  dangerouslySetInnerHTML={{ __html: sanitizeSnippet(result.snippet) }}
                />
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
