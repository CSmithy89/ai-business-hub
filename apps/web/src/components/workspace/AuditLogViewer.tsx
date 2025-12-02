'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditLog {
  id: string
  workspaceId: string
  action: string
  entity: string
  entityId: string | null
  userId: string | null
  ipAddress: string | null
  userAgent: string | null
  oldValues: any
  newValues: any
  metadata: any
  createdAt: string
}

interface AuditLogsResponse {
  logs: AuditLog[]
  total: number
  limit: number
  offset: number
}

interface AuditLogViewerProps {
  workspaceId: string
}

const ACTION_LABELS: Record<string, string> = {
  role_changed: 'Role Changed',
  member_added: 'Member Added',
  member_removed: 'Member Removed',
  module_permissions_updated: 'Module Permissions Updated',
  member_invited: 'Member Invited',
}

const ACTION_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  role_changed: 'default',
  member_added: 'secondary',
  member_removed: 'destructive',
  module_permissions_updated: 'outline',
  member_invited: 'secondary',
}

export function AuditLogViewer({ workspaceId }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [action, setAction] = useState<string>('all')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  // Pagination
  const [page, setPage] = useState(1)
  const limit = 20

  // Available action types
  const [actionTypes, setActionTypes] = useState<string[]>([])

  // Fetch action types
  useEffect(() => {
    async function fetchActionTypes() {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/audit-logs/action-types`
        )
        if (response.ok) {
          const data = await response.json()
          setActionTypes(data.actionTypes || [])
        }
      } catch (err) {
        console.error('Failed to fetch action types:', err)
      }
    }
    fetchActionTypes()
  }, [workspaceId])

  // Fetch audit logs
  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: ((page - 1) * limit).toString(),
        })

        if (action && action !== 'all') {
          params.append('action', action)
        }

        if (startDate) {
          params.append('startDate', startDate.toISOString())
        }

        if (endDate) {
          params.append('endDate', endDate.toISOString())
        }

        const response = await fetch(
          `/api/workspaces/${workspaceId}/audit-logs?${params.toString()}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch audit logs')
        }

        const data: AuditLogsResponse = await response.json()
        setLogs(data.logs)
        setTotal(data.total)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [workspaceId, page, action, startDate, endDate])

  const totalPages = Math.ceil(total / limit)

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return 'N/A'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  const renderChangeDetails = (log: AuditLog) => {
    if (log.action === 'role_changed') {
      return (
        <div className="text-sm">
          <span className="text-muted-foreground">{log.oldValues?.role}</span>
          {' → '}
          <span className="font-medium">{log.newValues?.role}</span>
        </div>
      )
    }

    if (log.action === 'member_added') {
      return (
        <div className="text-sm">
          Added with role: <span className="font-medium">{log.newValues?.role}</span>
        </div>
      )
    }

    if (log.action === 'member_removed') {
      return (
        <div className="text-sm">
          Removed: <span className="font-medium">{log.oldValues?.email}</span> (
          {log.oldValues?.role})
        </div>
      )
    }

    if (log.action === 'module_permissions_updated') {
      return (
        <div className="text-sm">
          <details className="cursor-pointer">
            <summary className="text-muted-foreground hover:text-foreground">
              View changes
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <div className="font-medium">Before:</div>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                  {formatValue(log.oldValues?.modulePermissions)}
                </pre>
              </div>
              <div>
                <div className="font-medium">After:</div>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                  {formatValue(log.newValues?.modulePermissions)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )
    }

    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Track all permission changes and member activities in your workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ACTION_LABELS[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(!startDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(!endDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'End date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>

            {(startDate || endDate) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStartDate(undefined)
                  setEndDate(undefined)
                }}
              >
                Clear dates
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8 text-destructive">
            Error: {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No audit logs found matching your filters
          </div>
        )}

        {/* Audit Logs Table */}
        {!loading && !error && logs.length > 0 && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={ACTION_COLORS[log.action] || 'default'}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderChangeDetails(log)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.metadata?.memberEmail || log.userId || 'System'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.createdAt), 'PPp')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
                logs
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
