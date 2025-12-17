'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { usePmProject } from '@/hooks/use-pm-projects'
import { useCreatePmTask } from '@/hooks/use-pm-tasks'

export function ProjectShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const { data } = usePmProject(slug)
  const project = data?.data

  const phases = project?.phases ?? []
  const defaultPhaseId = useMemo(() => {
    const current = phases.find((p) => p.status === 'CURRENT')
    if (current) return current.id
    return phases.slice().sort((a, b) => a.phaseNumber - b.phaseNumber)[0]?.id
  }, [phases])

  const createTask = useCreatePmTask()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [phaseId, setPhaseId] = useState<string | undefined>(undefined)

  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setPhaseId(defaultPhaseId)
  }, [defaultPhaseId, open])

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open])

  useKeyboardShortcut('c', { meta: false, shift: false, alt: false, preventDefault: true, skipInInputs: true }, () => {
    setOpen(true)
  })

  async function handleCreate(options: { openAfter: boolean }) {
    if (!project?.id || !phaseId) return
    if (createTask.isPending) return
    const trimmed = title.trim()
    if (!trimmed) return

    const result = await createTask.mutateAsync({ input: { projectId: project.id, phaseId, title: trimmed } })
    setOpen(false)

    if (options.openAfter) {
      router.push(`/dashboard/pm/${slug}/tasks?taskId=${result.data.id}` as any)
    }
  }

  return (
    <>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick capture</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Title</span>
              <Input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs doing?"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setOpen(false)
                    return
                  }

                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleCreate({ openAfter: false })
                  }

                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault()
                    void handleCreate({ openAfter: true })
                  }
                }}
              />
              <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                Press Enter to create • Shift+Enter to create &amp; open • Escape to cancel
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Phase</span>
              <Select value={phaseId} onValueChange={(value) => setPhaseId(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      Phase {phase.phaseNumber}: {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={createTask.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleCreate({ openAfter: false })}
                disabled={!title.trim() || !project?.id || !phaseId || createTask.isPending}
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create
                </span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => void handleCreate({ openAfter: true })}
                disabled={!title.trim() || !project?.id || !phaseId || createTask.isPending}
              >
                Create &amp; Open
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
