'use client'

import { FileText, Clock, Star, Plus, BookOpen, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { useRecentPages, useFavorites, useToggleFavorite, useCreateKBPage } from '@/hooks/use-kb-pages'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface KBHomeProps {
  workspaceId: string
}

export function KBHome({ workspaceId }: KBHomeProps) {
  const router = useRouter()
  const { data: recentData, isLoading: recentLoading } = useRecentPages(workspaceId)
  const { data: favoritesData, isLoading: favoritesLoading } = useFavorites(workspaceId)
  const { mutate: toggleFavorite } = useToggleFavorite(workspaceId)
  const createPage = useCreateKBPage(workspaceId)

  const recentPages = recentData?.data ?? []
  const favorites = favoritesData?.data ?? []

  const handleCreatePage = async () => {
    try {
      const result = await createPage.mutateAsync({ title: 'Untitled' })
      router.push(`/kb/${result.data.slug}` as any)
    } catch {
      // Error handled by hook
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Knowledge Base</h1>
              <p className="text-muted-foreground">
                Your team&apos;s documentation and wiki
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={'/kb/chat' as any}>
                <MessageCircle className="mr-2 h-4 w-4" />
                KB Chat
              </Link>
            </Button>
            <Button onClick={handleCreatePage} disabled={createPage.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              New Page
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Pages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Recent Pages
            </CardTitle>
            <CardDescription>
              Pages you&apos;ve recently viewed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentPages.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No recent pages yet</p>
                <p className="text-sm">View some pages to see them here</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {recentPages.map((page) => (
                  <li key={page.id}>
                    <Link
                      href={`/kb/${page.slug}` as any}
                      className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{page.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(page.lastViewedAt), { addSuffix: true })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5" />
              Favorites
            </CardTitle>
            <CardDescription>
              Pages you&apos;ve starred for quick access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {favoritesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Star className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No favorites yet</p>
                <p className="text-sm">Star pages to add them here</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {favorites.map((page) => (
                  <li key={page.id} className="group flex items-center gap-1">
                    <Link
                      href={`/kb/${page.slug}` as any}
                      className="flex flex-1 items-center gap-2 rounded-md px-2 py-2 hover:bg-accent"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{page.title}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFavorite({ pageId: page.id, favorite: false })}
                      className={cn(
                        'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                        'hover:bg-accent'
                      )}
                      title="Remove from favorites"
                    >
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <li className="flex items-start gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Tip
              </span>
              <span>Use the search bar to find pages quickly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Tip
              </span>
              <span>Drag pages in the sidebar to reorganize hierarchy</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Tip
              </span>
              <span>Press Cmd+S to save your changes manually</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Tip
              </span>
              <span>Star important pages for quick access</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
