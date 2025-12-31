'use client'

import { useState, useMemo } from 'react'
import { useSession } from '@/lib/auth-client'
import { useRouter, usePathname } from 'next/navigation'
import { useKBPages, useDeleteKBPage, useUpdateKBPage } from '@/hooks/use-kb-pages'
import { PageTree } from '@/components/kb/sidebar/PageTree'
import { KBSearchInput } from '@/components/kb/KBSearchInput'
import { Button } from '@/components/ui/button'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface KBLayoutProps {
  children: React.ReactNode
}

export default function KBLayout({ children }: KBLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  // Check both possible session paths for workspaceId
  const sessionData = session as any
  const workspaceId =
    sessionData?.workspaceId ||
    sessionData?.session?.activeWorkspaceId ||
    ''
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [deletePageId, setDeletePageId] = useState<string | null>(null)

  const { data: pagesData } = useKBPages(workspaceId, true)
  const deletePageMutation = useDeleteKBPage(workspaceId)
  const updatePageMutation = useUpdateKBPage(workspaceId)

  const pages = pagesData?.data || []

  const handleNewPage = () => {
    router.push('/kb/new' as any)
  }

  const handleCreateSubpage = (parentId: string) => {
    router.push(`/kb/new?parentId=${parentId}` as any)
  }

  const handleRename = (pageId: string) => {
    // For now, navigate to the page where they can edit the title
    const page = pages.find((p) => p.id === pageId)
    if (page) {
      router.push(`/kb/${page.slug}` as any)
      toast.info('Click the title to rename the page')
    }
  }

  const handleDelete = (pageId: string) => {
    setDeletePageId(pageId)
  }

  const confirmDelete = async () => {
    if (!deletePageId) return

    try {
      await deletePageMutation.mutateAsync(deletePageId)
      setDeletePageId(null)
      // Navigate to KB home if we deleted the current page
      // Use exact path match to avoid false positives (e.g., /kb/foo-bar matching /kb/foo)
      const deletedPage = pages.find((p) => p.id === deletePageId)
      if (deletedPage && pathname === `/kb/${deletedPage.slug}`) {
        router.push('/kb' as any)
      }
    } catch (error) {
      console.error('Failed to delete page:', error)
    }
  }

  const handleMove = async (pageId: string, newParentId: string | null) => {
    try {
      await updatePageMutation.mutateAsync({
        id: pageId,
        input: { parentId: newParentId ?? undefined },
      })
      toast.success('Page moved successfully')
    } catch (error) {
      console.error('Failed to move page:', error)
      toast.error('Failed to move page')
    }
  }

  // Extract current page slug from pathname (SSR-safe using usePathname hook)
  const currentPageSlug = useMemo(() => {
    if (!pathname) return undefined
    const match = pathname.match(/\/kb\/([^/]+)/)
    return match ? match[1] : undefined
  }, [pathname])

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside
        className={cn(
          'border-r bg-card transition-all duration-300',
          sidebarCollapsed ? 'w-0' : 'w-64'
        )}
      >
        <div className={cn('h-full', sidebarCollapsed && 'hidden')}>
          <PageTree
            pages={pages}
            currentPageSlug={currentPageSlug}
            onMove={handleMove}
            onCreateSubpage={handleCreateSubpage}
            onRename={handleRename}
            onDelete={handleDelete}
            onNewPage={handleNewPage}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Toggle and Search */}
        <div className="border-b px-4 py-2 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 flex-shrink-0"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 max-w-md">
            <KBSearchInput />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePageId} onOpenChange={(open) => !open && setDeletePageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action can be undone within 30 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
