import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'

interface AnalyticsData {
  tasksOverTime: Array<{ date: string; tasks: number }>
  successByType: Array<{ type: string; successRate: number }>
  responseTimeTrend: Array<{ date: string; avgResponseTime: number }>
}

export async function GET(
  _request: Request,
  _props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Replace with real database query when Prisma is connected
    // This should aggregate analytics data from the database
    const mockAnalytics: AnalyticsData = {
      tasksOverTime: Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          tasks: Math.floor(Math.random() * 15) + 5, // 5-20 tasks per day
        }
      }),
      successByType: [
        { type: 'Market Sizing', successRate: 90 },
        { type: 'Competitor Analysis', successRate: 85 },
        { type: 'Customer Discovery', successRate: 88 },
        { type: 'Risk Assessment', successRate: 92 },
        { type: 'Data Validation', successRate: 87 },
      ],
      responseTimeTrend: Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          avgResponseTime: 2000 + Math.floor(Math.random() * 1000), // 2000-3000ms
        }
      }),
    }

    return NextResponse.json(
      { data: mockAnalytics },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (error) {
    console.error('Error fetching agent analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
