import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'

/**
 * Approval Metrics API Endpoint
 *
 * Returns aggregated metrics for the approval queue:
 * - Pending count
 * - Auto-approved today
 * - Average response time
 * - Approval rate
 */
export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: When Prisma is connected, replace with real database query
    // For now, return mock data to demonstrate the API structure

    // Mock data for development
    const mockMetrics = {
      pendingCount: 12,
      autoApprovedToday: 8,
      avgResponseTime: 2.4, // hours
      approvalRate: 87, // percentage
    }

    // In production, this would query the database:
    /*
    const workspaceId = session.user.activeWorkspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: 'No active workspace' }, { status: 400 })
    }

    const approvals = await prisma.approvalItem.findMany({
      where: { workspaceId },
      select: {
        status: true,
        confidenceScore: true,
        createdAt: true,
        reviewedAt: true,
      },
    })

    // Calculate metrics
    const total = approvals.length
    const processed = approvals.filter(a =>
      ['approved', 'rejected', 'auto_approved'].includes(a.status)
    )
    const approved = approvals.filter(a =>
      ['approved', 'auto_approved'].includes(a.status)
    )
    const autoApproved = approvals.filter(a => a.status === 'auto_approved')

    // Average response time (in hours)
    const responseTimes = processed
      .filter(a => a.reviewedAt)
      .map(a => {
        const created = new Date(a.createdAt).getTime()
        const reviewed = new Date(a.reviewedAt!).getTime()
        return (reviewed - created) / (1000 * 60 * 60) // hours
      })

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    // Approval rate
    const approvalRate = processed.length > 0
      ? (approved.length / processed.length) * 100
      : 0

    const metrics = {
      pendingCount: approvals.filter(a => a.status === 'pending').length,
      autoApprovedToday: autoApproved.length,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      approvalRate: Math.round(approvalRate),
    }
    */

    return NextResponse.json({
      data: mockMetrics,
    })
  } catch (error) {
    console.error('Error fetching approval metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
