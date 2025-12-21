'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSessionToken, useSession } from '@/lib/auth-client'
import { useKBPages, useKBPage, useUpdateKBPage, useDeleteKBPage, useToggleFavorite, useCreateKBTemplate } from '@/hooks/use-kb-pages'
import { PageEditor } from '@/components/kb/editor/PageEditor'
import { PageBreadcrumbs } from '@/components/kb/PageBreadcrumbs'
import { LinkedProjects } from '@/components/kb/LinkedProjects'
import { VerificationBadge } from '@/components/kb/VerificationBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Trash2, Star, PanelRightClose, PanelRightOpen, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { stringToHslColor } from '@/lib/utils/color'
import { verifyPage, unverifyPage } from '@/lib/kb-api'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
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
  // Check both possible session paths for workspaceId
  const sessionData = session as any
  const workspaceId =
    sessionData?.workspaceId ||
    sessionData?.session?.activeWorkspaceId ||
    ''
  const sessionToken =
    sessionData?.token ||
    sessionData?.session?.token ||
    getCurrentSessionToken() ||
    ''
  const { data: pagesData } = useKBPages(workspaceId, true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(true)

  // Find page by slug
  const page = pagesData?.data.find((p) => p.slug === slug)
  const pageId = page?.id || ''

  const { data: pageData, isLoading } = useKBPage(pageId, workspaceId)
  const updatePage = useUpdateKBPage(workspaceId)
  const deletePage = useDeleteKBPage(workspaceId)
  const toggleFavorite = useToggleFavorite(workspaceId)
  const createTemplate = useCreateKBTemplate(workspaceId)
  const userId = (session as any)?.user?.id || ''
  const userName =
    sessionData?.user?.name ||
    sessionData?.user?.email ||
    'User'
  const userColor = userId ? stringToHslColor(userId) : 'hsl(210 10% 50%)'
  const isFavorited = pageData?.data?.favoritedBy?.includes(userId) ?? false
  const queryClient = useQueryClient()

  // Check if user can verify (page owner or admin)
  const canVerify = pageData?.data.ownerId === userId ||
    (sessionData?.user?.role === 'ADMIN' || sessionData?.user?.role === 'OWNER')

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
      input: { content, processMentions: true },
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
    router.push('/kb' as any)
  }

  const handleVerify = async (expiresIn: string) => {
    try {
      await verifyPage(pageId, expiresIn as '30d' | '60d' | '90d' | 'never')
      await queryClient.invalidateQueries({ queryKey: ['kb-page', pageId] })
      await queryClient.invalidateQueries({ queryKey: ['kb-pages', workspaceId] })
      toast.success('Page verified', {
        description: 'This page has been marked as verified.',
      })
    } catch (error) {
      toast.error('Verification failed', {
        description: error instanceof Error ? error.message : 'Failed to verify page',
      })
      throw error
    }
  }

  const handleUnverify = async () => {
    try {
      await unverifyPage(pageId)
      await queryClient.invalidateQueries({ queryKey: ['kb-page', pageId] })
      await queryClient.invalidateQueries({ queryKey: ['kb-pages', workspaceId] })
      toast.success('Verification removed', {
        description: 'This page is no longer verified.',
      })
    } catch (error) {
      toast.error('Failed to remove verification', {
        description: error instanceof Error ? error.message : 'Failed to unverify page',
      })
      throw error
    }
  }

  const handleSaveTemplate = async () => {
    if (!pageData?.data?.content) return

    const defaultTitle = `${pageData.data.title} Template`
    const templateTitle = window.prompt('Template name', defaultTitle)
    if (!templateTitle || !templateTitle.trim()) return

    try {
      await createTemplate.mutateAsync({
        title: templateTitle.trim(),
        category: 'Custom',
        content: pageData.data.content,
      })
    } catch {
      // Errors handled in hook
    }
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
          <Link href={'/kb' as any}>Back to KB</Link>
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
            {/* Breadcrumbs and Verification Badge */}
            <div className="flex items-center justify-between">
              {pagesData?.data && (
                <PageBreadcrumbs currentPage={pageData.data} allPages={pagesData.data} />
              )}
              {pageData?.data && (
                <VerificationBadge
                  page={{
                    isVerified: pageData.data.isVerified || false,
                    verifiedAt: pageData.data.verifiedAt || null,
                    verifyExpires: pageData.data.verifyExpires || null,
                  }}
                  canVerify={canVerify}
                  onVerify={handleVerify}
                  onUnverify={handleUnverify}
                />
              )}
            </div>

            {/* Title and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={'/kb' as any}>
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

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite.mutate({ pageId, favorite: !isFavorited })}
                  disabled={toggleFavorite.isPending}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={cn(
                      'h-4 w-4',
                      isFavorited && 'fill-yellow-500 text-yellow-500'
                    )}
                  />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveTemplate}
                  disabled={createTemplate.isPending}
                  title="Save as template"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  title={showInfoPanel ? 'Hide info panel' : 'Show info panel'}
                >
                  {showInfoPanel ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>

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
        </div>

        {/* Editor + Info Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <PageEditor
              pageId={pageId}
              workspaceId={workspaceId}
              initialContent={pageData.data.content}
              onSave={handleSaveContent}
              placeholder="Start writing your page content..."
              collaboration={
                sessionToken
                  ? {
                      token: sessionToken,
                      user: { name: userName, color: userColor },
                    }
                  : undefined
              }
            />
          </div>

          {/* Info Panel */}
          {showInfoPanel && (
            <div className="w-64 flex-shrink-0 border-l bg-muted/30 p-4 overflow-y-auto">
              <LinkedProjects pageId={pageId} workspaceId={workspaceId} />
            </div>
          )}
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
