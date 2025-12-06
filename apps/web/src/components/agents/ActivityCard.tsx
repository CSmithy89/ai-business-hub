'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AgentAvatar } from './AgentAvatar'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronUp, MessageSquare, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Agent } from '@hyvve/shared'

interface AgentActivity {
  id: string
  agentId: string
  agentName: string
  workspaceId: string
  type: 'task_started' | 'task_completed' | 'approval_requested' | 'approval_processed' | 'error' | 'config_changed'
  action: string
  module: string
  entityId?: string
  entityType?: string
  status: 'pending' | 'completed' | 'failed'
  confidenceScore?: number
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  startedAt: string
  completedAt?: string
  duration?: number
  createdAt: string
}

interface ActivityCardProps {
  activity: AgentActivity
  agent?: Agent
  isNew?: boolean
  className?: string
}

/**
 * ActivityCard Component
 *
 * Displays an individual activity item with agent avatar, action details,
 * status badge, and expandable input/output data.
 */
export function ActivityCard({ activity, agent, isNew, className }: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Status badge configuration
  const statusConfig = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  }

  // Module badge colors
  const moduleColors: Record<string, string> = {
    validation: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    planning: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    branding: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    crm: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }

  // Mock agent data if not provided
  const mockAgent: Agent = agent || {
    id: activity.agentId,
    name: activity.agentName,
    role: 'Agent',
    team: 'validation',
    description: '',
    avatar: '🤖',
    themeColor: '#3b82f6',
    status: 'online',
    lastActive: new Date(),
    capabilities: [],
    metrics: {
      tasksCompleted: 0,
      successRate: 0,
      avgResponseTime: 0,
      confidenceAvg: 0,
    },
    config: {
      providerId: null,
      model: null,
      temperature: 1,
      maxTokens: 2000,
      contextWindow: 8000,
      automationLevel: 'smart',
      confidenceThreshold: 70,
      tone: 50,
      customInstructions: '',
    },
    permissions: {
      dataAccess: [],
      canExecuteActions: true,
      requiresApproval: false,
    },
    workspaceId: activity.workspaceId,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return (
    <Card
      className={cn(
        'transition-colors',
        isNew && 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950',
        className
      )}
      data-activity-id={activity.id}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Agent Avatar */}
          <AgentAvatar agent={mockAgent} size="md" showStatus={false} />

          {/* Activity Content */}
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{activity.agentName}</span>
              <Badge className={statusConfig[activity.status]}>{activity.status}</Badge>
              <Badge variant="outline" className={cn('capitalize', moduleColors[activity.module])}>
                {activity.module}
              </Badge>
              {activity.confidenceScore !== undefined && (
                <Badge variant="outline">Confidence: {activity.confidenceScore}%</Badge>
              )}
            </div>

            {/* Action Description */}
            <p className="text-sm text-foreground">{activity.action}</p>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(activity.startedAt), {
                  addSuffix: true,
                })}
              </span>
              {activity.duration && <span>Duration: {(activity.duration / 1000).toFixed(1)}s</span>}
            </div>

            {/* Error Message */}
            {activity.error && (
              <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                {activity.error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    View Details
                  </>
                )}
              </Button>
              {activity.entityId && (
                <Button variant="ghost" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  View {activity.entityType}
                </Button>
              )}
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat with Agent
              </Button>
            </div>

            {/* Expandable Details */}
            {isExpanded && (
              <div className="space-y-4 rounded-md border bg-muted/50 p-4">
                {activity.input && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Input Data</h4>
                    <pre className="overflow-x-auto rounded bg-background p-3 text-xs">
                      {JSON.stringify(activity.input, null, 2)}
                    </pre>
                  </div>
                )}
                {activity.output && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Output Data</h4>
                    <pre className="overflow-x-auto rounded bg-background p-3 text-xs">
                      {JSON.stringify(activity.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
