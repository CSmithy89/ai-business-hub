'use client'

import { useSession } from '@/lib/auth-client'
import { useKBPages } from '@/hooks/use-kb-pages'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function KBHomePage() {
  const { data: session } = useSession()
  const workspaceId = (session as any)?.workspaceId || ''
  const { data, isLoading } = useKBPages(workspaceId, true)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading pages...</div>
      </div>
    )
  }

  const pages = data?.data || []
  const recentPages = pages
    .filter((p) => p.lastViewedAt)
    .sort((a, b) => new Date(b.lastViewedAt!).getTime() - new Date(a.lastViewedAt!).getTime())
    .slice(0, 10)

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground">
              Create and organize documentation for your team
            </p>
          </div>
          <Button asChild>
            <Link href="/kb/new">
              <Plus className="mr-2 h-4 w-4" />
              New Page
            </Link>
          </Button>
        </div>

        {/* Recent Pages */}
        {recentPages.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">Recent Pages</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/kb/${page.slug}`}
                  className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary">
                        {page.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(page.lastViewedAt!), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Pages */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">All Pages</h2>
          {pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No pages yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first knowledge base page to get started
              </p>
              <Button asChild>
                <Link href="/kb/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Page
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/kb/${page.slug}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{page.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
