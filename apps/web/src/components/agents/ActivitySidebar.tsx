'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LiveIndicator } from './LiveIndicator'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface AgentActivity {
  id: string
  agentId: string
  agentName: string
  type: 'task_started' | 'task_completed' | 'approval_requested' | 'approval_processed' | 'error' | 'config_changed'
  status: 'pending' | 'completed' | 'failed'
}

interface ActivitySidebarProps {
  activities: AgentActivity[]
  isConnected: boolean
}

/**
 * ActivitySidebar Component
 *
 * Right sidebar showing activity summary, most active agents,
 * and activity type distribution chart.
 */
export function ActivitySidebar({ activities, isConnected }: ActivitySidebarProps) {
  // Calculate most active agents
  const agentActivityCount = activities.reduce(
    (acc, activity) => {
      acc[activity.agentId] = (acc[activity.agentId] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const mostActiveAgents = Object.entries(agentActivityCount)
    .map(([agentId, count]) => ({
      id: agentId,
      name: activities.find(a => a.agentId === agentId)?.agentName || agentId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Calculate activity type distribution
  const typeDistribution = activities.reduce(
    (acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const chartData = Object.entries(typeDistribution).map(([type, count]) => ({
    name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
  }))

  // Colors for pie chart
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444']

  // Calculate stats
  const stats = {
    total: activities.length,
    completed: activities.filter(a => a.status === 'completed').length,
    pending: activities.filter(a => a.status === 'pending').length,
    failed: activities.filter(a => a.status === 'failed').length,
  }

  return (
    <div className="space-y-4">
      {/* Live Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <LiveIndicator isConnected={isConnected} />
        </CardContent>
      </Card>

      {/* Recent Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Activities</span>
            <Badge variant="outline">{stats.total}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Completed</span>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              {stats.completed}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending</span>
            <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              {stats.pending}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Failed</span>
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              {stats.failed}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Most Active Agents */}
      {mostActiveAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostActiveAgents.map((agent, index) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                    <span className="text-sm">{agent.name}</span>
                  </div>
                  <Badge variant="outline">{agent.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Type Distribution */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
