'use client'

import type { Agent } from '@hyvve/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  TrendingUp,
  Clock,
  Target,
  Calendar,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface OverviewTabProps {
  agent: Agent
}

/**
 * OverviewTab Component
 *
 * Displays agent information, 30-day metrics, and capabilities.
 */
export function OverviewTab({ agent }: OverviewTabProps) {
  // Format metrics
  const metrics = [
    {
      icon: CheckCircle2,
      label: 'Tasks Completed',
      value: agent.metrics.tasksCompleted.toLocaleString(),
      color: 'text-green-600 dark:text-green-400',
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: `${agent.metrics.successRate}%`,
      progress: agent.metrics.successRate,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Clock,
      label: 'Avg Response Time',
      value: `${(agent.metrics.avgResponseTime / 1000).toFixed(1)}s`,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: Target,
      label: 'Avg Confidence',
      value: `${agent.metrics.confidenceAvg}%`,
      progress: agent.metrics.confidenceAvg,
      color: 'text-orange-600 dark:text-orange-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Agent Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agent Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium">{agent.role}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="text-sm">{agent.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Team</p>
            <Badge variant="secondary" className="capitalize">
              {agent.team}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Last active{' '}
              {formatDistanceToNow(new Date(agent.lastActive), {
                addSuffix: true,
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 30-Day Metrics */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">30-Day Performance</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={metric.color}>
                      <metric.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {metric.label}
                      </p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                  </div>
                </div>
                {metric.progress !== undefined && (
                  <Progress value={metric.progress} className="mt-3" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {agent.capabilities.map((capability, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm">{capability}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
