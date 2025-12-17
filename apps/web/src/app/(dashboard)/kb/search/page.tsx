'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { KBSearchInput } from '@/components/kb/KBSearchInput'
import { KBSearchResults } from '@/components/kb/KBSearchResults'
import { useKBSearch } from '@/hooks/use-kb-pages'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams?.get('q') || ''
  const { data: session } = useSession()
  const workspaceId = (session as any)?.workspaceId || ''

  const { data, isLoading, error } = useKBSearch(
    workspaceId,
    query,
    !!query && !!workspaceId
  )

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href={'/kb' as any}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to KB
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-4">Search Knowledge Base</h1>

        <KBSearchInput className="max-w-2xl" autoFocus />
      </div>

      {error && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10 text-destructive">
          <p className="font-medium">Search failed</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}

      {query && (
        <KBSearchResults
          query={query}
          results={data?.results || []}
          total={data?.total || 0}
          isLoading={isLoading}
        />
      )}

      {!query && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Enter a search query to find pages in your knowledge base</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
