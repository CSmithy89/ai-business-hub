import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'

interface AgentActivity {
  id: string
  agentId: string
  agentName: string
  type: 'task_started' | 'task_completed' | 'approval_requested' | 'error'
  action: string
  module: string
  status: 'pending' | 'completed' | 'failed'
  confidenceScore?: number
  startedAt: string
  completedAt?: string
  duration?: number
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const type = searchParams.get('type')

    // TODO: Replace with real database query when Prisma is connected
    // This should fetch from the database with pagination and filtering
    const mockActivities: AgentActivity[] = Array.from({ length: 50 }, (_, i) => {
      const types: AgentActivity['type'][] = [
        'task_started',
        'task_completed',
        'approval_requested',
        'error',
      ]
      const statuses: AgentActivity['status'][] = ['pending', 'completed', 'failed']
      const modules = ['validation', 'planning', 'branding', 'crm']

      const startedAt = new Date(Date.now() - i * 3600000).toISOString() // Each activity 1 hour apart
      const activityType = types[i % types.length]
      const activityStatus =
        activityType === 'task_completed'
          ? 'completed'
          : activityType === 'error'
            ? 'failed'
            : statuses[i % statuses.length]

      return {
        id: `act_${params.id}_${i}`,
        agentId: params.id,
        agentName: params.id === 'vera' ? 'Vera' : params.id === 'sam' ? 'Sam' : 'Agent',
        type: activityType,
        action:
          activityType === 'task_completed'
            ? `Analyzed market size for ${modules[i % modules.length]} project`
            : activityType === 'task_started'
              ? `Started validation task for ${modules[i % modules.length]}`
              : activityType === 'approval_requested'
                ? `Requested approval for ${modules[i % modules.length]} action`
                : `Error processing ${modules[i % modules.length]} task`,
        module: modules[i % modules.length],
        status: activityStatus,
        confidenceScore: activityType === 'task_completed' ? 70 + (i % 30) : undefined,
        startedAt,
        completedAt:
          activityStatus === 'completed'
            ? new Date(Date.now() - i * 3600000 + 210000).toISOString()
            : undefined,
        duration: activityStatus === 'completed' ? 210000 + i * 1000 : undefined,
      }
    })

    // Filter by type if specified
    const filteredActivities = type
      ? mockActivities.filter(activity => activity.type === type)
      : mockActivities

    // Apply pagination
    const startIndex = (page - 1) * limit
    const paginatedActivities = filteredActivities.slice(startIndex, startIndex + limit)

    return NextResponse.json(
      {
        data: paginatedActivities,
        meta: {
          total: filteredActivities.length,
          page,
          limit,
          totalPages: Math.ceil(filteredActivities.length / limit),
        },
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (error) {
    console.error('Error fetching agent activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
