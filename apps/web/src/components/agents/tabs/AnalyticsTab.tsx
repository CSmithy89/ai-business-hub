'use client'

import { useAgentAnalytics } from '@/hooks/use-agent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalyticsTabProps {
  agentId: string
}

/**
 * AnalyticsTab Component
 *
 * Displays performance charts and analytics for the agent.
 */
export function AnalyticsTab({ agentId }: AnalyticsTabProps) {
  const { data, isLoading, error } = useAgentAnalytics(agentId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="h-5 w-5 animate-pulse" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load analytics. Please try again.
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-1 text-lg font-semibold">No analytics data</h3>
        <p className="text-sm text-muted-foreground">
          This agent has not performed any tasks yet.
        </p>
      </div>
    )
  }

  // Calculate summary stats with deltas (mock deltas for now)
  const totalTasks = data.tasksOverTime.reduce((sum, day) => sum + day.tasks, 0)
  const avgSuccessRate =
    data.successByType.reduce((sum, item) => sum + item.successRate, 0) /
    data.successByType.length
  const avgResponseTime =
    data.responseTimeTrend.reduce((sum, day) => sum + day.avgResponseTime, 0) /
    data.responseTimeTrend.length

  // Mock week-over-week deltas (TODO: Calculate from real data)
  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks.toLocaleString(),
      delta: 12,
      positive: true,
    },
    {
      label: 'Success Rate',
      value: `${avgSuccessRate.toFixed(1)}%`,
      delta: 3,
      positive: true,
    },
    {
      label: 'Avg Response Time',
      value: `${(avgResponseTime / 1000).toFixed(1)}s`,
      delta: -5,
      positive: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {stat.positive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(stat.delta)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tasks Over Time (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.tasksOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={value => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                labelFormatter={value => {
                  const date = new Date(value)
                  return date.toLocaleDateString()
                }}
              />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Success Rate by Task Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Success Rate by Task Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.successByType}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="type" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => [`${value}%`, 'Success Rate']}
              />
              <Bar
                dataKey="successRate"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Response Time Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Response Time Trend (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.responseTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={value => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={value => `${(value / 1000).toFixed(1)}s`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                labelFormatter={value => {
                  const date = new Date(value)
                  return date.toLocaleDateString()
                }}
                formatter={(value: number) => [
                  `${(value / 1000).toFixed(1)}s`,
                  'Avg Response Time',
                ]}
              />
              <Area
                type="monotone"
                dataKey="avgResponseTime"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
