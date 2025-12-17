'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useCallback, useEffect, useState } from 'react'
import { createExtensions } from './extensions'
import { EditorToolbar } from './EditorToolbar'

interface PageEditorProps {
  pageId?: string
  initialContent?: any
  onSave: (content: any) => Promise<void>
  placeholder?: string
}

export function PageEditor({ initialContent, onSave, placeholder }: PageEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const editor = useEditor({
    extensions: createExtensions(placeholder || 'Start writing...'),
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px]',
      },
    },
    onUpdate: () => {
      setHasUnsavedChanges(true)
      setSaveStatus('unsaved')
    },
  })

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
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId)
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      debouncedSave()
    }, 2000)

    setSaveTimeoutId(newTimeoutId)

    // Cleanup
    return () => {
      if (newTimeoutId) {
        clearTimeout(newTimeoutId)
      }
    }
  }, [hasUnsavedChanges, debouncedSave, saveTimeoutId])

  // Manual save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (editor && hasUnsavedChanges) {
          // Clear any pending auto-save to prevent race condition
          if (saveTimeoutId) {
            clearTimeout(saveTimeoutId)
            setSaveTimeoutId(null)
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
  }, [editor, hasUnsavedChanges, onSave, saveTimeoutId])

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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
