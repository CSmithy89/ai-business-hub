'use client'

import { useEffect, useMemo, useState } from 'react'
import { UploadCloud, CheckCircle2 } from 'lucide-react'
import { parseCsv } from '@hyvve/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useStartCsvImport } from '@/hooks/use-pm-imports'
import { CsvImportMapping, type CsvFieldConfig } from './CsvImportMapping'
import { CsvImportPreviewTable, type CsvPreviewRow } from './CsvImportPreviewTable'

const STEPS = ['Upload', 'Map', 'Preview', 'Import'] as const

const FIELD_CONFIGS: CsvFieldConfig[] = [
  { key: 'title', label: 'Title', required: true, description: 'Task title or summary' },
  { key: 'description', label: 'Description', description: 'Task description or notes' },
  { key: 'status', label: 'Status', description: 'Backlog, To Do, In Progress, Review, Done' },
  { key: 'priority', label: 'Priority', description: 'Urgent, High, Medium, Low, None' },
  { key: 'type', label: 'Type', description: 'Task type (Story, Bug, etc.)' },
  { key: 'dueDate', label: 'Due Date', description: 'Date string (e.g. 2025-01-15)' },
  { key: 'assigneeEmail', label: 'Assignee Email', description: 'Workspace member email' },
  { key: 'phaseName', label: 'Phase Name', description: 'Optional phase override' },
]

const STATUS_VALUES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'AWAITING_APPROVAL', 'DONE', 'CANCELLED']
const PRIORITY_VALUES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']
const TYPE_VALUES = ['EPIC', 'STORY', 'TASK', 'SUBTASK', 'BUG', 'RESEARCH', 'CONTENT', 'AGENT_REVIEW']

const PREVIEW_LIMIT = 12

type PhaseOption = {
  id: string
  name: string
  status: string
}

interface CsvImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  phases: PhaseOption[]
}

export function CsvImportWizard({ open, onOpenChange, projectId, phases }: CsvImportWizardProps) {
  const startImport = useStartCsvImport()

  const [stepIndex, setStepIndex] = useState(0)
  const [csvText, setCsvText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [defaultPhaseId, setDefaultPhaseId] = useState<string>('')
  const [skipInvalidRows, setSkipInvalidRows] = useState(true)
  const [importResult, setImportResult] = useState<{
    totalRows: number
    processedRows: number
    errorCount: number
  } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStepIndex(0)
      setCsvText('')
      setHeaders([])
      setRows([])
      setMapping({})
      setImportResult(null)
      setImportError(null)
      setSkipInvalidRows(true)
    }
  }, [open])

  useEffect(() => {
    if (!phases.length) return
    const current = phases.find((phase) => phase.status === 'CURRENT')
    setDefaultPhaseId(current?.id ?? phases[0]?.id ?? '')
  }, [phases])

  useEffect(() => {
    if (!headers.length) return
    setMapping(buildDefaultMapping(headers))
  }, [headers])

  const preview = useMemo(() => {
    if (!headers.length || !rows.length) {
      return { previewRows: [] as CsvPreviewRow[], errorCount: 0 }
    }

    const headerIndex = buildHeaderIndex(headers)
    let errorCount = 0

    const previewRows = rows.slice(0, PREVIEW_LIMIT).map((row, idx) => {
      const rowNumber = idx + 2
      const values = buildPreviewValues(row, headerIndex, mapping)
      const errors = validateRow(values)
      errorCount += errors.length
      return { rowNumber, values, errors }
    })

    return { previewRows, errorCount }
  }, [headers, rows, mapping])

  const totalErrors = useMemo(() => {
    if (!headers.length || !rows.length) return 0
    const headerIndex = buildHeaderIndex(headers)
    let count = 0
    rows.forEach((row) => {
      const values = buildPreviewValues(row, headerIndex, mapping)
      count += validateRow(values).length
    })
    return count
  }, [headers, rows, mapping])

  const canProceedFromUpload = headers.length > 0
  const canProceedFromMapping = Boolean(mapping.title)
  const canStartImport = skipInvalidRows || totalErrors === 0

  const currentStep = STEPS[stepIndex]

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    const text = await file.text()
    const parsed = parseCsv(text)

    if (parsed.length < 2) {
      toast.error('CSV must include a header row and at least one data row')
      return
    }

    const headerRow = [...parsed[0]]
    if (headerRow[0]) {
      headerRow[0] = stripBom(headerRow[0])
    }

    setCsvText(text)
    setHeaders(headerRow)
    setRows(parsed.slice(1))
  }

  const handleImport = async () => {
    setImportError(null)
    setImportResult(null)
    setStepIndex(3)

    try {
      const response = await startImport.mutateAsync({
        projectId,
        phaseId: defaultPhaseId || undefined,
        csvText,
        mapping,
        skipInvalidRows,
      })
      setImportResult(response.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import CSV'
      setImportError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Tasks from CSV</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs uppercase text-[rgb(var(--color-text-secondary))]">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <span className={index === stepIndex ? 'text-[rgb(var(--color-text-primary))]' : undefined}>
                {index + 1}. {step}
              </span>
              {index < STEPS.length - 1 ? <span className="text-[rgb(var(--color-border-default))]">/</span> : null}
            </div>
          ))}
        </div>

        {currentStep === 'Upload' ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-[rgb(var(--color-border-default))] p-6 text-center">
              <UploadCloud className="mx-auto h-8 w-8 text-[rgb(var(--color-text-secondary))]" />
              <p className="mt-2 text-sm font-medium">Upload a CSV file</p>
              <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                We will use the first row as column headers.
              </p>
              <Input
                type="file"
                accept=".csv"
                className="mt-4"
                onChange={handleFileChange}
              />
            </div>
            {headers.length ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{rows.length} rows detected</Badge>
                <Badge variant="outline">{headers.length} columns</Badge>
              </div>
            ) : null}
          </div>
        ) : null}

        {currentStep === 'Map' ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">Select how CSV columns map to task fields.</p>
              <div className="max-w-xs">
                <Select value={defaultPhaseId} onValueChange={setDefaultPhaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CsvImportMapping
              headers={headers}
              fields={FIELD_CONFIGS}
              mapping={mapping}
              onChange={setMapping}
            />
          </div>
        ) : null}

        {currentStep === 'Preview' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Preview & Validation</p>
                <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                  Showing first {Math.min(PREVIEW_LIMIT, rows.length)} rows
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={totalErrors > 0 ? 'destructive' : 'secondary'}>
                  {totalErrors} issues
                </Badge>
                <Badge variant="outline">{rows.length} rows</Badge>
              </div>
            </div>

            <CsvImportPreviewTable rows={preview.previewRows} />

            <div className="flex items-center gap-2">
              <Checkbox
                id="skip-invalid-rows"
                checked={skipInvalidRows}
                onCheckedChange={(checked) => setSkipInvalidRows(Boolean(checked))}
              />
              <label htmlFor="skip-invalid-rows" className="text-sm">
                Skip invalid rows and import the rest
              </label>
            </div>
            {!skipInvalidRows && totalErrors > 0 ? (
              <p className="text-xs text-rose-600">Fix or remap invalid rows before importing.</p>
            ) : null}
          </div>
        ) : null}

        {currentStep === 'Import' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {importResult ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : null}
              <p className="text-sm font-medium">Import Results</p>
            </div>
            {startImport.isPending ? (
              <div className="space-y-2">
                <Progress value={60} />
                <p className="text-xs text-[rgb(var(--color-text-secondary))]">Importing tasks...</p>
              </div>
            ) : null}
            {importError ? <p className="text-sm text-rose-600">{importError}</p> : null}
            {importResult ? (
              <div className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <Badge variant="secondary">Processed {importResult.processedRows}</Badge>
                  <Badge variant={importResult.errorCount > 0 ? 'destructive' : 'secondary'}>
                    {importResult.errorCount} errors
                  </Badge>
                </div>
                <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                  You can review errors in the import status panel.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
            disabled={stepIndex === 0 || startImport.isPending}
          >
            Back
          </Button>
          <div className="flex gap-2">
            {currentStep === 'Upload' ? (
              <Button onClick={() => setStepIndex(1)} disabled={!canProceedFromUpload}>
                Next
              </Button>
            ) : null}
            {currentStep === 'Map' ? (
              <Button onClick={() => setStepIndex(2)} disabled={!canProceedFromMapping}>
                Next
              </Button>
            ) : null}
            {currentStep === 'Preview' ? (
              <Button onClick={handleImport} disabled={!canStartImport || startImport.isPending}>
                Start Import
              </Button>
            ) : null}
            {currentStep === 'Import' ? (
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={startImport.isPending}
              >
                Close
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function buildDefaultMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const normalized = headers.map((header) => header.trim().toLowerCase())

  FIELD_CONFIGS.forEach((field) => {
    const index = normalized.findIndex((header) => header.includes(field.key.replace('Email', '').toLowerCase()))
    if (index >= 0) {
      mapping[field.key] = headers[index]
    }
  })

  const titleIndex = normalized.findIndex((header) => header.includes('title') || header.includes('name'))
  if (titleIndex >= 0) {
    mapping.title = headers[titleIndex]
  }

  return mapping
}

function buildHeaderIndex(headers: string[]): Map<string, number> {
  const map = new Map<string, number>()
  headers.forEach((header, index) => {
    map.set(header.trim().toLowerCase(), index)
  })
  return map
}

function buildPreviewValues(
  row: string[],
  headerIndex: Map<string, number>,
  mapping: Record<string, string>,
): CsvPreviewRow['values'] {
  const getValue = (field: string) => {
    const header = mapping[field]
    if (!header) return null
    const index = headerIndex.get(header.trim().toLowerCase())
    if (index === undefined) return null
    return row[index] ?? null
  }

  return {
    title: getValue('title'),
    status: getValue('status'),
    priority: getValue('priority'),
    type: getValue('type'),
    assigneeEmail: getValue('assigneeEmail'),
    dueDate: getValue('dueDate'),
  }
}

function validateRow(values: CsvPreviewRow['values']): string[] {
  const errors: string[] = []

  if (!values.title) {
    errors.push('Title required')
  }

  if (values.status && !STATUS_VALUES.includes(normalizeEnum(values.status))) {
    errors.push('Invalid status')
  }

  if (values.priority && !PRIORITY_VALUES.includes(normalizeEnum(values.priority))) {
    errors.push('Invalid priority')
  }

  if (values.type && !TYPE_VALUES.includes(normalizeEnum(values.type))) {
    errors.push('Invalid type')
  }

  if (values.dueDate) {
    const parsed = new Date(values.dueDate)
    if (Number.isNaN(parsed.getTime())) {
      errors.push('Invalid due date')
    }
  }

  return errors
}

function normalizeEnum(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_')
}

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, '')
}
