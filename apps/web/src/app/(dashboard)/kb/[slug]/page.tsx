'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useKBPages, useKBPage, useUpdateKBPage, useDeleteKBPage } from '@/hooks/use-kb-pages'
import { PageEditor } from '@/components/kb/editor/PageEditor'
import { PageBreadcrumbs } from '@/components/kb/PageBreadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function KBPagePage({ params }: PageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const workspaceId = (session as any)?.workspaceId || ''
  const { data: pagesData } = useKBPages(workspaceId, true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Find page by slug
  const page = pagesData?.data.find((p) => p.slug === slug)
  const pageId = page?.id || ''

  const { data: pageData, isLoading } = useKBPage(pageId, workspaceId)
  const updatePage = useUpdateKBPage(workspaceId)
  const deletePage = useDeleteKBPage(workspaceId)

  const [title, setTitle] = useState('')
  const [isTitleEditing, setIsTitleEditing] = useState(false)

  useEffect(() => {
    if (pageData?.data) {
      setTitle(pageData.data.title)
    }
  }, [pageData])

  const handleSaveContent = async (content: any) => {
    if (!pageId) return

    await updatePage.mutateAsync({
      id: pageId,
      input: { content },
    })
  }

  const handleSaveTitle = async () => {
    if (!pageId || !title.trim() || title === pageData?.data.title) {
      setIsTitleEditing(false)
      return
    }

    await updatePage.mutateAsync({
      id: pageId,
      input: { title: title.trim() },
    })
    setIsTitleEditing(false)
  }

  const handleDelete = async () => {
    if (!pageId) return

    await deletePage.mutateAsync(pageId)
    router.push('/kb')
  }

  if (isLoading || !pageData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading page...</div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Page not found</h2>
        <p className="mb-4 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist
        </p>
        <Button asChild>
          <Link href="/kb">Back to KB</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b bg-background">
          <div className="flex flex-col gap-3 p-4">
            {/* Breadcrumbs */}
            {pagesData?.data && (
              <PageBreadcrumbs currentPage={pageData.data} allPages={pagesData.data} />
            )}

            {/* Title and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/kb">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>

                {isTitleEditing ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveTitle()
                      } else if (e.key === 'Escape') {
                        setTitle(pageData.data.title)
                        setIsTitleEditing(false)
                      }
                    }}
                    autoFocus
                    className="text-xl font-semibold"
                  />
                ) : (
                  <h1
                    className="text-xl font-semibold cursor-pointer truncate hover:text-muted-foreground"
                    onClick={() => setIsTitleEditing(true)}
                  >
                    {pageData.data.title}
                  </h1>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <PageEditor
            pageId={pageId}
            initialContent={pageData.data.content}
            onSave={handleSaveContent}
            placeholder="Start writing your page content..."
          />
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{pageData.data.title}&quot;? This action
              can be undone within 30 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
