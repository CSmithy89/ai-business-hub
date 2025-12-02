'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  FileText,
  Zap,
  CheckCheck,
  XOctagon,
  Loader2,
} from 'lucide-react'

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

interface ApprovalAuditLogProps {
  approvalId: string
  workspaceId: string
}

// Action display configuration
const ACTION_CONFIG: Record<
  string,
  {
    label: string
    icon: any
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
  }
> = {
  'approval.created': {
    label: 'Created',
    icon: FileText,
    variant: 'secondary',
  },
  'approval.approved': {
    label: 'Approved',
    icon: CheckCircle2,
    variant: 'success',
  },
  'approval.rejected': {
    label: 'Rejected',
    icon: XCircle,
    variant: 'destructive',
  },
  'approval.auto_approved': {
    label: 'Auto-Approved',
    icon: Zap,
    variant: 'success',
  },
  'approval.escalated': {
    label: 'Escalated',
    icon: ArrowUpCircle,
    variant: 'outline',
  },
  'approval.bulk_approved': {
    label: 'Bulk Approved',
    icon: CheckCheck,
    variant: 'success',
  },
  'approval.bulk_rejected': {
    label: 'Bulk Rejected',
    icon: XOctagon,
    variant: 'destructive',
  },
}

export function ApprovalAuditLog({ approvalId, workspaceId }: ApprovalAuditLogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      setError(null)

      try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch(
        //   `/api/workspaces/${workspaceId}/approvals/${approvalId}/audit-logs`
        // )

        // For now, simulate API call
        // STUB: In production, this will call ApprovalAuditService.getApprovalAuditLogs()
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Mock data for development
        const mockLogs: AuditLog[] = [
          {
            id: '1',
            workspaceId,
            action: 'approval.created',
            entity: 'approval_item',
            entityId: approvalId,
            userId: 'user-123',
            ipAddress: null,
            userAgent: null,
            oldValues: null,
            newValues: {
              status: 'pending',
              confidenceScore: 72,
              type: 'content',
              priority: 'medium',
            },
            metadata: {
              reviewType: 'quick',
              description: 'Approval created with 72% confidence',
            },
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ]

        setLogs(mockLogs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [approvalId, workspaceId])

  const getActionIcon = (action: string) => {
    const config = ACTION_CONFIG[action]
    if (!config) return FileText
    return config.icon
  }

  const getActionVariant = (action: string) => {
    const config = ACTION_CONFIG[action]
    if (!config) return 'default'
    return config.variant
  }

  const getActionLabel = (action: string) => {
    const config = ACTION_CONFIG[action]
    if (!config) return action
    return config.label
  }

  const getActorDisplay = (log: AuditLog) => {
    if (log.userId === 'system') {
      return <span className="text-sm text-muted-foreground italic">System</span>
    }
    // TODO: Fetch user details and display name/email
    return <span className="text-sm font-medium">{log.userId || 'Unknown'}</span>
  }

  const renderChangeDetails = (log: AuditLog) => {
    const action = log.action

    // Created
    if (action === 'approval.created') {
      return (
        <div className="text-sm text-muted-foreground">
          <div>
            Confidence: <span className="font-medium">{log.newValues?.confidenceScore}%</span>
          </div>
          <div>
            Priority: <span className="font-medium capitalize">{log.newValues?.priority}</span>
          </div>
          {log.metadata?.reviewType && (
            <div>
              Review Type:{' '}
              <span className="font-medium capitalize">{log.metadata.reviewType}</span>
            </div>
          )}
        </div>
      )
    }

    // Approved/Rejected
    if (action === 'approval.approved' || action === 'approval.rejected') {
      return (
        <div className="text-sm">
          <div className="text-muted-foreground">
            Status: <span className="text-foreground line-through">{log.oldValues?.status}</span>
            {' → '}
            <span className="font-medium text-foreground">{log.newValues?.status}</span>
          </div>
          {log.metadata?.notes && (
            <div className="mt-2 text-muted-foreground">
              Notes: <span className="text-foreground">{log.metadata.notes}</span>
            </div>
          )}
          {log.metadata?.reason && (
            <div className="mt-2 text-muted-foreground">
              Reason: <span className="text-foreground">{log.metadata.reason}</span>
            </div>
          )}
        </div>
      )
    }

    // Auto-approved
    if (action === 'approval.auto_approved') {
      return (
        <div className="text-sm">
          <div className="text-muted-foreground">
            Confidence: <span className="font-medium text-foreground">{log.newValues?.confidenceScore}%</span>
          </div>
          {log.metadata?.aiReasoning && (
            <details className="mt-2">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View AI Reasoning
              </summary>
              <div className="mt-2 rounded-md bg-muted p-3 text-xs">
                {log.metadata.aiReasoning}
              </div>
            </details>
          )}
        </div>
      )
    }

    // Escalated
    if (action === 'approval.escalated') {
      return (
        <div className="text-sm text-muted-foreground">
          <div>
            Escalated to: <span className="font-medium text-foreground">{log.newValues?.escalatedToId}</span>
          </div>
          {log.metadata?.overdueBy && (
            <div>
              Overdue by: <span className="font-medium text-foreground">{log.metadata.overdueBy}</span>
            </div>
          )}
        </div>
      )
    }

    // Bulk actions
    if (action === 'approval.bulk_approved' || action === 'approval.bulk_rejected') {
      return (
        <div className="text-sm text-muted-foreground">
          <div>
            Part of bulk action ({log.metadata?.totalItems} items)
          </div>
          {log.metadata?.bulkActionId && (
            <div className="text-xs mt-1">
              Batch ID: {log.metadata.bulkActionId}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Loading activity history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Complete history of all actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Complete history of all actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No activity history available for this approval
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
        <CardDescription>
          Complete history of all actions on this approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />

          {/* Timeline items */}
          <div className="space-y-6">
            {logs.map((log, index) => {
              const Icon = getActionIcon(log.action)
              const isLast = index === logs.length - 1

              return (
                <div key={log.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background ${
                      isLast ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isLast ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2 pb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={getActionVariant(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                        {getActorDisplay(log)}
                      </div>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                      </time>
                    </div>

                    {/* Change details */}
                    {renderChangeDetails(log)}

                    {/* Description from metadata */}
                    {log.metadata?.description && (
                      <div className="text-sm text-muted-foreground italic">
                        {log.metadata.description}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
