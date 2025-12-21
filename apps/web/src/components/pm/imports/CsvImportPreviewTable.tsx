'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export type CsvPreviewRow = {
  rowNumber: number
  values: {
    title: string | null
    status: string | null
    priority: string | null
    type: string | null
    assigneeEmail: string | null
    dueDate: string | null
  }
  errors: string[]
}

interface CsvImportPreviewTableProps {
  rows: CsvPreviewRow[]
}

export function CsvImportPreviewTable({ rows }: CsvImportPreviewTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-[rgb(var(--color-text-secondary))]">No rows to preview.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[rgb(var(--color-border-default))]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[72px]">Row</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Issues</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.rowNumber}>
              <TableCell className="text-xs text-[rgb(var(--color-text-secondary))]">
                {row.rowNumber}
              </TableCell>
              <TableCell className="font-medium">{row.values.title || '—'}</TableCell>
              <TableCell>{row.values.status || '—'}</TableCell>
              <TableCell>{row.values.priority || '—'}</TableCell>
              <TableCell>{row.values.type || '—'}</TableCell>
              <TableCell>{row.values.assigneeEmail || '—'}</TableCell>
              <TableCell>{row.values.dueDate || '—'}</TableCell>
              <TableCell>
                {row.errors.length ? (
                  <div className="flex flex-wrap gap-1">
                    {row.errors.map((error, index) => (
                      <Badge key={`${row.rowNumber}-${index}`} variant="destructive">
                        {error}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge variant="secondary">OK</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
