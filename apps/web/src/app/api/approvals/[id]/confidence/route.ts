import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { ensureMockDataEnabled, getMockConfidenceBreakdown } from '@/lib/mock-data'
import { IS_MOCK_DATA_ENABLED } from '@/lib/api-config'

/**
 * Confidence Breakdown API Endpoint
 *
 * Returns detailed confidence factor breakdown for an approval item:
 * - Individual confidence factors (Content Quality, Brand Alignment, etc.)
 * - Suggested actions based on low factors
 * - Overall weighted confidence score
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!IS_MOCK_DATA_ENABLED) {
      return NextResponse.json(
        { error: 'Mock data is disabled' },
        { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    ensureMockDataEnabled('approval confidence breakdown')

    const { id: approvalId } = await context.params

    // Generate mock confidence data
    const breakdown = getMockConfidenceBreakdown(approvalId)

    return NextResponse.json(breakdown, {
      // Prevent caching of per-item confidence data
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('Error fetching confidence breakdown:', error)
    return NextResponse.json(
      { error: 'Failed to fetch confidence breakdown' },
      { status: 500 }
    )
  }
}
