'use client'

import { useEditor, EditorContent, JSONContent } from '@tiptap/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createExtensions } from './extensions'
import { EditorToolbar } from './EditorToolbar'
import { HocuspocusProvider, WebSocketStatus } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { isChangeOrigin } from '@tiptap/extension-collaboration'
import { KB_COLLAB_WS_URL } from '@/lib/api-config'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { useKBDraft, useKBSummary, type KBDraftCitation } from '@/hooks/use-kb-pages'
import { draftTextToTiptap, summaryToTiptapNodes, type KBSummaryContent } from '@/lib/kb-ai'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface PageEditorProps {
  pageId?: string
  workspaceId?: string
  initialContent?: JSONContent
  onSave: (content: JSONContent) => Promise<void>
  placeholder?: string
  collaboration?: {
    token: string
    user?: {
      name: string
      color: string
    }
  }
}

export function PageEditor({
  pageId,
  workspaceId,
  initialContent,
  onSave,
  placeholder,
  collaboration,
}: PageEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [collabStatus, setCollabStatus] = useState<WebSocketStatus>(WebSocketStatus.Disconnected)
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [isSynced, setIsSynced] = useState(false)
  const [unsyncedChanges, setUnsyncedChanges] = useState(0)
  const [isIdbSynced, setIsIdbSynced] = useState(false)
  const isOnline = useNetworkStatus()
  const draftMutation = useKBDraft(workspaceId ?? '')
  const [draftDialogOpen, setDraftDialogOpen] = useState(false)
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftCitations, setDraftCitations] = useState<KBDraftCitation[]>([])
  const summaryMutation = useKBSummary(workspaceId ?? '')
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const [summaryResult, setSummaryResult] = useState<KBSummaryContent | null>(null)

  const collaborationEnabled = !!pageId && !!collaboration?.token
  const collabDoc = useMemo(() => new Y.Doc(), [pageId])

  useEffect(() => {
    return () => {
      collabDoc.destroy()
    }
  }, [collabDoc])

  useEffect(() => {
    if (!collaborationEnabled || !pageId) {
      setIsIdbSynced(false)
      return
    }

    const persistence = new IndexeddbPersistence(`kb:page:${pageId}`, collabDoc)
    persistence.on('synced', () => setIsIdbSynced(true))

    return () => {
      setIsIdbSynced(false)
      void persistence.destroy()
    }
  }, [collaborationEnabled, pageId, collabDoc])

  useEffect(() => {
    if (!collaborationEnabled || !pageId) {
      setCollabStatus(WebSocketStatus.Disconnected)
      setProvider(null)
      setIsSynced(false)
      setUnsyncedChanges(0)
      return
    }

    const token = collaboration?.token
    if (!token) return

    const newProvider = new HocuspocusProvider({
      url: KB_COLLAB_WS_URL,
      name: `kb:page:${pageId}`,
      token,
      document: collabDoc,
      onStatus: ({ status }) => setCollabStatus(status),
      onSynced: ({ state }) => setIsSynced(state),
      onUnsyncedChanges: ({ number }) => setUnsyncedChanges(number),
    })

    setProvider(newProvider)

    return () => {
      newProvider.destroy()
      setProvider(null)
      setIsSynced(false)
      setUnsyncedChanges(0)
    }
  }, [collaborationEnabled, pageId, collaboration?.token, collabDoc])

  const editor = useEditor({
    extensions: createExtensions(
      placeholder || 'Start writing...',
      collaborationEnabled
        ? {
            collaboration: { document: collabDoc },
            ...(provider && collaboration?.user
              ? { cursor: { provider, user: collaboration.user } }
              : {}),
            workspaceId,
          }
        : { workspaceId },
    ),
    content: collaborationEnabled ? undefined : initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px]',
      },
    },
    onUpdate: ({ transaction }) => {
      // Avoid treating remote Yjs transactions as local "unsaved changes"
      if (collaborationEnabled && isChangeOrigin(transaction)) {
        return
      }

      setHasUnsavedChanges(true)
      setSaveStatus('unsaved')
    },
  }, [collaborationEnabled, pageId, provider])

  // Seed Yjs-backed docs with initial JSON if the shared document is empty.
  useEffect(() => {
    if (!collaborationEnabled || !editor) return
    if (!initialContent) return

    const isEmpty = editor.getText().trim().length === 0
    if (!isEmpty) return

    editor.commands.setContent(initialContent)
  }, [collaborationEnabled, editor, pageId, initialContent])

  // Debounced auto-save (2 seconds after typing stops)
  const debouncedSave = useCallback(async () => {
    if (!editor || !hasUnsavedChanges) {
      return
    }

    setSaveStatus('saving')
    try {
      await onSave(editor.getJSON())
      setSaveStatus('saved')
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
      setSaveStatus('unsaved')
    }
  }, [editor, hasUnsavedChanges, onSave])

  const handleGenerateDraft = useCallback(async () => {
    if (!editor) return
    if (!workspaceId) {
      toast.error('Workspace is required to generate a draft.')
      return
    }

    const prompt = draftPrompt.trim()
    if (!prompt) {
      toast.error('Add a prompt to generate a draft.')
      return
    }

    try {
      const result = await draftMutation.mutateAsync({ prompt })
      const draftDoc = draftTextToTiptap(result.draft.content)
      const insertNodes = draftDoc.content ?? []
      const hasContent = editor.getText().trim().length > 0

      if (!hasContent) {
        editor.commands.setContent(draftDoc)
      } else {
        editor.chain().focus().insertContent([
          { type: 'paragraph', content: [] },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'AI Draft' }],
          },
          ...insertNodes,
        ]).run()
      }

      setDraftCitations(result.draft.citations || [])
      setDraftPrompt('')
      setDraftDialogOpen(false)
      toast.success('AI draft inserted into the editor.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate draft.')
    }
  }, [draftMutation, draftPrompt, editor, workspaceId])

  const handleSummarize = useCallback(async () => {
    if (!editor) return
    if (!workspaceId) {
      toast.error('Workspace is required to summarize.')
      return
    }
    if (!pageId) {
      toast.error('A page is required to summarize.')
      return
    }

    try {
      const result = await summaryMutation.mutateAsync({ pageId })
      setSummaryResult(result.summary)
      setSummaryDialogOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to summarize page.')
    }
  }, [editor, pageId, summaryMutation, workspaceId])

  const handleInsertSummary = useCallback(() => {
    if (!editor || !summaryResult) return

    const summaryNodes = summaryToTiptapNodes(summaryResult)
    const current = editor.getJSON()
    const content = current.content ?? []
    editor.commands.setContent({
      type: 'doc',
      content: [...summaryNodes, ...content],
    })

    setSummaryDialogOpen(false)
    toast.success('Summary inserted at the top of the page.')
  }, [editor, summaryResult])

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      debouncedSave()
    }, 2000)

    saveTimeoutRef.current = newTimeoutId

    // Cleanup
    return () => {
      clearTimeout(newTimeoutId)
    }
  }, [hasUnsavedChanges, debouncedSave])

  // Manual save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (editor && hasUnsavedChanges) {
          // Clear any pending auto-save to prevent race condition
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
            saveTimeoutRef.current = null
          }
          setSaveStatus('saving')
          onSave(editor.getJSON())
            .then(() => {
              setSaveStatus('saved')
              setHasUnsavedChanges(false)
            })
            .catch((error) => {
              console.error('Manual save failed:', error)
              setSaveStatus('unsaved')
            })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editor, hasUnsavedChanges, onSave])

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar
        editor={editor}
        onSummarize={handleSummarize}
        isSummarizeLoading={summaryMutation.isPending}
        onAIDraft={() => setDraftDialogOpen(true)}
        isAIDraftLoading={draftMutation.isPending}
      />

      {draftCitations.length > 0 && (
        <div className="border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground font-medium">Sources:</span>
            {draftCitations.map((citation) => (
              <Badge key={`${citation.pageId}-${citation.chunkIndex}`} variant="outline">
                <Link href={`/kb/${citation.slug}` as any} className="hover:underline">
                  {citation.title}
                </Link>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-8">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="flex items-center justify-end border-t bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {collaborationEnabled && (
            <div className="flex items-center gap-2">
              <div
                className={
                  collabStatus === WebSocketStatus.Connected
                    ? 'h-2 w-2 rounded-full bg-green-500'
                    : collabStatus === WebSocketStatus.Connecting
                      ? 'h-2 w-2 animate-pulse rounded-full bg-blue-500'
                      : 'h-2 w-2 rounded-full bg-muted-foreground'
                }
              />
              <span>
                {collabStatus === WebSocketStatus.Connected
                  ? !isOnline
                    ? isIdbSynced
                      ? 'Offline (saved locally)'
                      : 'Offline (saving locally...)'
                    : isSynced
                      ? unsyncedChanges > 0
                        ? `Syncing (${unsyncedChanges})`
                        : 'Live'
                      : 'Syncing...'
                  : collabStatus === WebSocketStatus.Connecting
                    ? 'Connecting...'
                    : !isOnline
                      ? isIdbSynced
                        ? 'Offline (saved locally)'
                        : 'Offline (saving locally...)'
                      : 'Offline'}
              </span>
            </div>
          )}

          {saveStatus === 'saving' && (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <>
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Unsaved changes</span>
            </>
          )}
        </div>
      </div>

      <Dialog open={draftDialogOpen} onOpenChange={setDraftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Draft</DialogTitle>
            <DialogDescription>
              Describe what you need. Scribe will draft a KB page for your review.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={draftPrompt}
            onChange={(event) => setDraftPrompt(event.target.value)}
            placeholder="Explain what this page should cover..."
            className="min-h-[140px]"
            disabled={draftMutation.isPending}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDraftDialogOpen(false)}
              disabled={draftMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateDraft} disabled={draftMutation.isPending}>
              {draftMutation.isPending ? 'Drafting...' : 'Generate Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={summaryDialogOpen}
        onOpenChange={(open) => {
          setSummaryDialogOpen(open)
          if (!open) setSummaryResult(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Summary</DialogTitle>
            <DialogDescription>
              Review the TL;DR and key points, then insert at the top of the page.
            </DialogDescription>
          </DialogHeader>

          {summaryResult ? (
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground">TL;DR</p>
                <p className="text-foreground">{summaryResult.summary}</p>
              </div>
              {summaryResult.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Key Points</p>
                  <ul className="list-disc pl-5 text-foreground">
                    {summaryResult.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No summary available.</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSummaryDialogOpen(false)}
            >
              Close
            </Button>
            <Button onClick={handleInsertSummary} disabled={!summaryResult}>
              Insert Summary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
