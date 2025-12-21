'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/lib/auth-client'
import { NESTJS_API_URL } from '@/lib/api-config'
import type { FilterState } from '@/lib/pm/url-state'

type ExportFieldKey =
  | 'taskNumber'
  | 'title'
  | 'description'
  | 'status'
  | 'priority'
  | 'type'
  | 'assigneeId'
  | 'dueDate'
  | 'phaseId'
  | 'projectId'
  | 'createdAt'
  | 'updatedAt'

interface ExportField {
  key: ExportFieldKey
  label: string
  required?: boolean
}

const EXPORT_FIELDS: ExportField[] = [
  { key: 'taskNumber', label: 'Task Number', required: true },
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'type', label: 'Type' },
  { key: 'assigneeId', label: 'Assignee ID' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'phaseId', label: 'Phase ID' },
  { key: 'projectId', label: 'Project ID' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'updatedAt', label: 'Updated At' },
]

interface CsvExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  filters: FilterState
  search: string
}

function getBaseUrl(): string {
  if (!NESTJS_API_URL) throw new Error('NESTJS_API_URL is not configured')
  return NESTJS_API_URL.replace(/\/$/, '')
}

function getSessionToken(session: unknown): string | undefined {
  const direct = (session as { token?: string } | null)?.token
  const nested = (session as { session?: { token?: string } } | null)?.session?.token
  return direct || nested || undefined
}

export function CsvExportModal({ open, onOpenChange, projectId, filters, search }: CsvExportModalProps) {
  const { data: session } = useSession()
  const token = getSessionToken(session)
  const defaultFields: ExportFieldKey[] = EXPORT_FIELDS.filter((field) => field.required).map(
    (field) => field.key
  )

  const [selectedFields, setSelectedFields] = useState<ExportFieldKey[]>(defaultFields)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedFields(defaultFields)
      setIsExporting(false)
    }
  }, [open, defaultFields])

  const filterSummary = useMemo(() => {
    const badges: string[] = []
    if (filters.status.length) badges.push(`${filters.status.length} status`)
    if (filters.priority) badges.push(`Priority ${filters.priority}`)
    if (filters.assigneeId) badges.push('Assignee')
    if (filters.type) badges.push(`Type ${filters.type}`)
    if (filters.labels.length) badges.push(`${filters.labels.length} labels`)
    if (filters.dueDateFrom || filters.dueDateTo) badges.push('Due date')
    if (filters.phaseId) badges.push('Phase')
    if (search.trim()) badges.push('Search')
    return badges
  }, [filters, search])

  const toggleField = (field: ExportFieldKey) => {
    if (defaultFields.includes(field)) return
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((value) => value !== field) : [...prev, field]
    )
  }

  const selectAll = () => {
    setSelectedFields(EXPORT_FIELDS.map((field) => field.key))
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const base = getBaseUrl()
      const params = new URLSearchParams()
      params.set('projectId', projectId)
      if (search.trim()) params.set('search', search.trim())
      if (filters.status.length) params.set('status', filters.status.join(','))
      if (filters.priority) params.set('priority', filters.priority)
      if (filters.type) params.set('type', filters.type)
      if (filters.assigneeId) params.set('assigneeId', filters.assigneeId)
      if (filters.labels.length) params.set('labels', filters.labels.join(','))
      if (filters.dueDateFrom) params.set('dueDateFrom', filters.dueDateFrom)
      if (filters.dueDateTo) params.set('dueDateTo', filters.dueDateTo)
      if (filters.phaseId) params.set('phaseId', filters.phaseId)
      params.set('fields', selectedFields.join(','))

      const response = await fetch(`${base}/pm/exports/tasks?${params.toString()}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        let errorMessage = 'Failed to export CSV'
        try {
          const errorData = await response.json()
          if (errorData && errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tasks-export-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success('Export completed')
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export CSV'
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export CSV</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {filterSummary.length ? (
            filterSummary.map((badge) => (
              <Badge key={badge} variant="outline">
                {badge}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary">No filters applied</Badge>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Select fields to export</p>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select all
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {EXPORT_FIELDS.map((field) => {
              const checked = selectedFields.includes(field.key)
              return (
                <label key={field.key} className="flex items-start gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleField(field.key)}
                    disabled={field.required}
                  />
                  <span className="text-sm">
                    {field.label}
                    {field.required ? ' (required)' : ''}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
