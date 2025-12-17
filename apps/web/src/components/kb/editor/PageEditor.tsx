'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createExtensions } from './extensions'
import { EditorToolbar } from './EditorToolbar'
import { HocuspocusProvider, WebSocketStatus } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { isChangeOrigin } from '@tiptap/extension-collaboration'
import { KB_COLLAB_WS_URL } from '@/lib/api-config'
import { useNetworkStatus } from '@/hooks/use-network-status'

interface PageEditorProps {
  pageId?: string
  initialContent?: any
  onSave: (content: any) => Promise<void>
  placeholder?: string
  collaboration?: {
    token: string
    user?: {
      name: string
      color: string
    }
  }
}

export function PageEditor({ pageId, initialContent, onSave, placeholder, collaboration }: PageEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [collabStatus, setCollabStatus] = useState<WebSocketStatus>(WebSocketStatus.Disconnected)
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [isSynced, setIsSynced] = useState(false)
  const [unsyncedChanges, setUnsyncedChanges] = useState(0)
  const [isIdbSynced, setIsIdbSynced] = useState(false)
  const isOnline = useNetworkStatus()

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
          }
        : undefined,
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
      <EditorToolbar editor={editor} />

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
    </div>
  )
}
